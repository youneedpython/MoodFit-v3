#!/usr/bin/env bash
set -euo pipefail
export AWS_PAGER='' AWS_CLI_AUTO_PROMPT=off MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'
fail() { printf 'FAIL: status %s\n' "$1" >&2; exit 1; }
trap 'fail "read-only query failed; verify approved session and permissions, no retry"' ERR
[[ $# == 1 || $# == 2 ]] || fail 'usage: STACK [CHANGESET]'
kind=$1
case "$kind" in network|ecr|data|certificate|frontend|iam|app|budget) ;; *) fail 'unsupported stack' ;; esac
region=ap-northeast-2
[[ "$kind" != certificate ]] || region=us-east-1
stack="moodfit-staging-$kind"
call() { aws --profile moodfit-readonly --region "$region" --no-cli-pager "$@" 2>/dev/null; }
printf 'STEP: staging %s status\n' "$kind"
call cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].StackStatus' --output text
call cloudformation describe-stack-events --stack-name "$stack" --query 'StackEvents[:10].[ResourceType,ResourceStatus]' --output text
if [[ $# == 2 ]]; then
  call cloudformation describe-change-set --stack-name "$stack" --change-set-name "$2" --query '{Status:Status,Execution:ExecutionStatus,Add:length(Changes[?ResourceChange.Action==`Add`]),Modify:length(Changes[?ResourceChange.Action==`Modify`]),Remove:length(Changes[?ResourceChange.Action==`Remove`]),Replacement:length(Changes[?ResourceChange.Replacement==`True`]),Conditional:length(Changes[?ResourceChange.Replacement==`Conditional`])}' --output json
fi
if [[ "$kind" == app ]]; then
  call ecs describe-services --cluster moodfit-staging --services moodfit-staging-backend --query '{Failures:length(failures),Services:services[].{Status:status,Desired:desiredCount,Running:runningCount,Pending:pendingCount,Deployments:deployments[].{State:rolloutState,Running:runningCount,Pending:pendingCount}}}' --output json
  target=$(call cloudformation describe-stack-resource --stack-name "$stack" --logical-resource-id TargetGroup --query 'StackResourceDetail.PhysicalResourceId' --output text)
  [[ "$target" == arn:aws:elasticloadbalancing:ap-northeast-2:*:targetgroup/* ]] || fail 'target group unavailable'
  call elbv2 describe-target-health --target-group-arn "$target" --query 'TargetHealthDescriptions[].TargetHealth.{State:State,Reason:Reason}' --output json
fi
printf 'PASS: read-only summary complete (not deployment acceptance)\n'
