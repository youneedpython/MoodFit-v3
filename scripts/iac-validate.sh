#!/usr/bin/env bash
set -euo pipefail

fail() { printf 'FAIL: %s\n' "$1" >&2; exit 1; }
trap 'printf "FAIL: IaC validation stopped at line %s\n" "$LINENO" >&2' ERR
cd "$(dirname "${BASH_SOURCE[0]}")/.."
export AWS_PAGER=""
export AWS_CLI_AUTO_PROMPT=off
command -v aws >/dev/null 2>&1 || fail 'AWS CLI is unavailable'
shopt -s nullglob
templates=(infra/cloudformation/*.yaml)
((${#templates[@]} == 7)) || fail 'Expected seven foundation and application templates'

printf 'STEP: cfn-lint\n'
if command -v cfn-lint >/dev/null 2>&1; then
  lint=(cfn-lint)
else
  python_bin=''
  for candidate in python python3; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'from cfnlint.runner import main' >/dev/null 2>&1; then
      python_bin="$candidate"
      break
    fi
  done
  [[ -n "$python_bin" ]] || fail 'cfn-lint is not installed for an available Python interpreter'
  lint=("$python_bin" -c 'from cfnlint.runner import main; main()')
fi
for template in "${templates[@]}"; do
  size=$(wc -c < "$template")
  ((size <= 51200)) || fail 'Template exceeds 51,200 bytes; split the stack'
  region=ap-northeast-2
  [[ "$template" != */certificate.yaml ]] || region=us-east-1
  # Suppress source excerpts from diagnostics: later Human inputs may contain identifiers.
  if ! "${lint[@]}" -r "$region" -t "$template" >/dev/null 2>&1; then
    fail "cfn-lint rejected $(basename "$template")"
  fi
  printf 'PASS: lint %s\n' "$(basename "$template")"
done

# Print only generic failure reasons; raw AWS stderr can include identity data.
read_aws() {
  local region="$1"
  shift
  local result
  if ! result=$(aws --profile moodfit-readonly --region "$region" --no-cli-pager "$@" 2>/dev/null); then
    fail 'Read-only AWS query failed; check approved permissions, SSO session and connectivity'
  fi
  printf '%s' "$result"
}
positive_count() {
  [[ "$2" =~ ^[0-9]+$ ]] && (( $2 >= $3 )) || fail "$1 unavailable"
  printf 'PASS: %s\n' "$1"
}
printf 'STEP: CloudFormation validate-template\n'
for template in "${templates[@]}"; do
  region=ap-northeast-2
  [[ "$template" != */certificate.yaml ]] || region=us-east-1
  read_aws "$region" cloudformation validate-template --template-body "file://$template" --query 'length(Parameters)' --output text >/dev/null
  printf 'PASS: template %s\n' "$(basename "$template")"
done
printf 'STEP: Seoul resource availability\n'
count=$(read_aws ap-northeast-2 rds describe-db-engine-versions --engine mysql --engine-version 8.4.11 --query 'length(DBEngineVersions[?Status==`available`])' --output text)
positive_count 'MySQL 8.4.11' "$count" 1
count=$(read_aws ap-northeast-2 rds describe-orderable-db-instance-options --engine mysql --engine-version 8.4.11 --db-instance-class db.t4g.small --vpc --query 'length(OrderableDBInstanceOptions[?StorageType==`gp3` && MultiAZCapable==`true` && SupportsStorageEncryption==`true` && MinStorageSize<=`20` && MaxStorageSize>=`20`])' --output text)
positive_count 'db.t4g.small Multi-AZ encrypted gp3 20 GiB' "$count" 1
count=$(read_aws ap-northeast-2 ec2 describe-availability-zones --filters Name=state,Values=available Name=zone-type,Values=availability-zone --query 'length(AvailabilityZones)' --output text)
positive_count 'At least two available Seoul AZs' "$count" 2
count=$(read_aws ap-northeast-2 ec2 describe-managed-prefix-lists --filters Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing --query 'length(PrefixLists)' --output text)
positive_count 'CloudFront origin-facing managed prefix list' "$count" 1
count=$(read_aws ap-northeast-2 route53 list-hosted-zones-by-name --dns-name 8949db.kr --query 'length(HostedZones[?Name==`8949db.kr.` && Config.PrivateZone==`false`])' --output text)
positive_count 'Existing domain public hosted zone' "$count" 1
printf 'PASS: IaC foundation and application validation complete; no resources changed\n'
