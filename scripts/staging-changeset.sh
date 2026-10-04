#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
export AWS_PAGER='' AWS_CLI_AUTO_PROMPT=off MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'
fail() { printf 'FAIL: changeset %s\n' "$1" >&2; exit 1; }
trap 'fail "command failed; check session, permissions and stack events locally (no automatic retry)"' ERR
[[ $# == 4 || $# == 5 ]] || fail 'usage: STACK ACTION PROFILE CHANGESET [CREATE|UPDATE]'
kind=$1 action=$2 profile=$3 change=$4 mode=${5:-}
case "$kind" in network|ecr|data|certificate|frontend|iam|app|budget) ;; *) fail 'unsupported staging stack' ;; esac
case "$action" in create|describe|execute) ;; *) fail 'unsupported action' ;; esac
[[ -n "$profile" && "$profile" != moodfit-readonly && "$profile" != *production* ]] || fail 'Human staging administrator profile required'
[[ "$change" =~ ^[A-Za-z][A-Za-z0-9-]{0,127}$ ]] || fail 'invalid change set name'
region=ap-northeast-2
[[ "$kind" != certificate ]] || region=us-east-1
stack="moodfit-staging-$kind"
call() { aws --profile "$profile" --region "$region" --no-cli-pager "$@" 2>/dev/null; }
summary() {
  call cloudformation describe-change-set --stack-name "$stack" --change-set-name "$change" \
    --query '{Status:Status,Execution:ExecutionStatus,Add:length(Changes[?ResourceChange.Action==`Add`]),Modify:length(Changes[?ResourceChange.Action==`Modify`]),Remove:length(Changes[?ResourceChange.Action==`Remove`]),Replacement:length(Changes[?ResourceChange.Replacement==`True`]),Conditional:length(Changes[?ResourceChange.Replacement==`Conditional`])}' --output json
}
printf 'STEP: changeset %s %s\n' "$kind" "$action"
case "$action" in
  create)
    [[ "$mode" == CREATE || "$mode" == UPDATE ]] || fail 'explicit CREATE or UPDATE required'
    file="infra/cloudformation/local/$kind.parameters.json"
    [[ -f "$file" && ! -L "$file" ]] || fail 'missing local parameter file or symlink'
    [[ -z "$(git ls-files -- "$file")" ]] || fail 'parameter file must be untracked'
    command -v python >/dev/null || fail 'Python required to validate local parameters'
    python - "$file" "$kind" <<'PY'
import json, sys
try:
    items = json.load(open(sys.argv[1], encoding='utf-8'))
    assert isinstance(items, list)
    values = {x['ParameterKey']: x['ParameterValue'] for x in items}
    assert len(values) == len(items)
    assert all(isinstance(v, str) and '<' not in v and '>' not in v for v in values.values())
    assert values['Environment'] == 'staging'
    if sys.argv[2] in ('app', 'frontend'):
        assert len(values['OriginVerificationValue']) >= 32
    if 'OriginHostname' in values:
        assert values['OriginHostname'] == 'origin.staging.moodfit.8949db.kr'
    if 'ViewerHostname' in values:
        assert values['ViewerHostname'] == 'staging.moodfit.8949db.kr'
except Exception:
    sys.exit('FAIL: local parameter format, staging scope or placeholders')
PY
    input_path="$file"
    command -v cygpath >/dev/null && input_path=$(cygpath -m "$file")
    template="infra/cloudformation/$kind.yaml"
    command -v cygpath >/dev/null && template=$(cygpath -m "$template")
    capabilities=()
    [[ "$kind" != iam ]] || capabilities=(--capabilities CAPABILITY_IAM)
    call cloudformation create-change-set --stack-name "$stack" --change-set-name "$change" \
      --change-set-type "$mode" --template-body "file://$template" --parameters "file://$input_path" \
      "${capabilities[@]}" --query 'length(Id)' --output text >/dev/null
    printf 'PASS: change set submitted; describe after creation, not executed\n'
    ;;
  describe) summary ;;
  execute)
    summary
    environment=$(call cloudformation describe-change-set --stack-name "$stack" --change-set-name "$change" --query 'Parameters[?ParameterKey==`Environment`].ParameterValue | [0]' --output text)
    [[ "$environment" == staging ]] || fail 'change set environment is not staging'
    state=$(call cloudformation describe-change-set --stack-name "$stack" --change-set-name "$change" --query '[Status,ExecutionStatus]' --output text)
    [[ "$state" == $'CREATE_COMPLETE\tAVAILABLE' ]] || fail 'change set is not executable'
    printf 'Type EXECUTE %s %s after reviewing resource details locally: ' "$stack" "$change"
    read -r confirmation
    [[ "$confirmation" == "EXECUTE $stack $change" ]] || fail 'confirmation mismatch'
    call cloudformation execute-change-set --stack-name "$stack" --change-set-name "$change" >/dev/null
    printf 'PASS: execution submitted; inspect status before next step\n'
    ;;
esac
