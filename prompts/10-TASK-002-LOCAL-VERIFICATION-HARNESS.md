# Prompt 10 — TASK-002 Local Verification Harness

## 목적

TASK-001 Project Bootstrap 이후 반복 가능한 로컬 검증 절차를 구성한다.

## 실행 단계

TASK-001 DONE
→ Human Execution Approval
→ TASK-002 IN_PROGRESS
→ Local Verification Harness
→ Verification
→ Work Log
→ REVIEW
→ Human Review 보완
→ Human Review
→ DONE

## 사용 Context

AGENTS.md

docs/06-PLAN.md
docs/07-TASKS.md
docs/08-WORK_LOG.md
docs/09-DECISIONS.md

## 실제 Prompt

Human이 TASK-002 실행을 승인했다.

이번 작업에서는 `docs/07-TASKS.md`의 TASK-002 범위에 따라 다음만 수행한다.

- `scripts/verify.ps1` 생성
- `scripts/verify.sh` 생성
- Frontend Test/Build 검증 절차 포함
- Backend Test/Build 검증 절차 포함
- 실패 시 종료 코드 보장
- 외부 MySQL 연결 없이 실행되는지 확인
- TASK-002 이후 작업은 시작하지 않음

## 기대 산출물

- `scripts/verify.ps1`
- `scripts/verify.sh`
- TASK-002 Work Log 기록
- TASK-002 상태 갱신

## Human Approval

TASK-002 실행 승인 완료.

TASK-002 완료 후 Human Review 승인 완료.

## 상태

실행 완료 / Human Approved

## Human Review 보완

PowerShell native command 실패 전파 문제를 보완했다.

- `verify.ps1`에서 각 native command 실행 직후 `$LASTEXITCODE`를 명시적으로 확인한다.
- Frontend 검증은 `npm.cmd`를 명시적으로 사용한다.
- 성공 경로와 실패 경로를 모두 재검증했다.
- `verify.sh`는 기존 WSL / Windows Bash 보완 경로를 유지하고 재검증했다.

## Related Commit

Pending
