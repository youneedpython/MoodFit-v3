#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
export AWS_PAGER='' AWS_CLI_AUTO_PROMPT=off MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'
fail() { printf 'FAIL: frontend %s\n' "$1" >&2; exit 1; }
trap 'fail "build or publication failed; inspect locally; no automatic retry"' ERR
[[ $# == 1 ]] || fail 'usage: PROFILE'
profile=$1
[[ -n "$profile" && "$profile" != moodfit-readonly && "$profile" != *production* ]] || fail 'Human staging profile required'
call() { aws --profile "$profile" --region ap-northeast-2 --no-cli-pager "$@" 2>/dev/null; }
output() { call cloudformation describe-stacks --stack-name moodfit-staging-frontend --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue | [0]" --output text; }
bucket_arn=$(output StaticBucketArn)
distribution_arn=$(output DistributionArn)
[[ "$bucket_arn" == arn:aws:s3:::* && "$distribution_arn" =~ ^arn:aws:cloudfront::[0-9]{12}:distribution/[A-Z0-9]+$ ]] || fail 'invalid staging frontend outputs'
bucket=${bucket_arn#arn:aws:s3:::}
distribution=${distribution_arn##*/}
[[ -z "$(git status --porcelain --untracked-files=all)" ]] || fail 'clean reviewed checkout required'
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
git archive HEAD | tar -x -C "$work"
printf 'STEP: frontend build\n'
(cd "$work/frontend" && npm ci && npm run build) >/dev/null 2>&1
dist="$work/frontend/dist"
command -v cygpath >/dev/null && dist=$(cygpath -m "$dist")
printf 'STEP: publish assets then HTML\n'
call s3 sync "$dist/" "s3://$bucket/" --exclude index.html --cache-control 'public,max-age=31536000,immutable' >/dev/null
call s3 cp "$dist/index.html" "s3://$bucket/index.html" --cache-control 'no-cache' --content-type text/html >/dev/null
call cloudfront create-invalidation --distribution-id "$distribution" --paths '/*' --query 'Invalidation.Status' --output text
printf 'PASS: frontend publication submitted; wait for invalidation before smoke\n'
