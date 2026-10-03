#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
export AWS_PAGER='' AWS_CLI_AUTO_PROMPT=off MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'
fail() { printf 'FAIL: image %s\n' "$1" >&2; exit 1; }
trap 'fail "build or push failed; check session and tools locally; no retry"' ERR
[[ $# == 1 ]] || fail 'usage: PROFILE (VCS_REF full SHA required in environment)'
profile=$1
[[ -n "$profile" && "$profile" != moodfit-readonly && "$profile" != *production* ]] || fail 'Human staging profile required'
[[ -z "$(git status --porcelain --untracked-files=all)" ]] || fail 'clean checkout required'
[[ "${VCS_REF:-}" =~ ^[a-f0-9]{40}$ && "$VCS_REF" == "$(git rev-parse HEAD)" ]] || fail 'VCS_REF must match full HEAD SHA'
call() { aws --profile "$profile" --region ap-northeast-2 --no-cli-pager "$@" 2>/dev/null; }
repo=$(call cloudformation describe-stacks --stack-name moodfit-staging-ecr --query 'Stacks[0].Outputs[?OutputKey==`RepositoryUri`].OutputValue | [0]' --output text)
[[ "$repo" =~ ^[0-9]{12}\.dkr\.ecr\.ap-northeast-2\.amazonaws\.com/[a-z0-9._/-]+$ ]] || fail 'invalid ECR output'
registry=${repo%%/*}
tag="sha-$VCS_REF"
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
git archive HEAD | tar -x -C "$work"
mkdir "$work/docker-config"
export DOCKER_CONFIG="$work/docker-config"
command -v cygpath >/dev/null && export DOCKER_CONFIG="$(cygpath -m "$DOCKER_CONFIG")"
printf 'STEP: bootJar\n'
(cd "$work/backend" && bash ./gradlew bootJar) >/dev/null 2>&1
printf 'STEP: linux/amd64 build\n'
context="$work/backend"
command -v cygpath >/dev/null && context=$(cygpath -m "$context")
docker build --platform linux/amd64 --build-arg "VCS_REF=$VCS_REF" -t "$repo:$tag" "$context" >/dev/null 2>&1
printf 'STEP: ECR login and immutable push\n'
call ecr get-login-password | docker login --username AWS --password-stdin "$registry" >/dev/null 2>&1
docker push "$repo:$tag" >/dev/null 2>&1
digest=$(call ecr describe-images --repository-name "${repo#*/}" --image-ids "imageTag=$tag" --query 'imageDetails[0].imageDigest' --output text)
[[ "$digest" =~ ^sha256:[a-f0-9]{64}$ ]] || fail 'invalid pushed digest'
printf 'PASS: image digest %s\n' "$digest"
