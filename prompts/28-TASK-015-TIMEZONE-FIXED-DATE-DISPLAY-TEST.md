# Prompt 28 — TASK-015 Timezone-fixed Date Display Test

## 목적

화면의 날짜 / 시각 표시가 실행 환경 Timezone에 따라 달라지지 않도록
고정 Timezone 기준 Frontend Test를 추가하고, 필요한 최소 구현을 반영한다. (FU-4, GAP-6)

## 실행 단계

TASK-014 DONE
→ TASK-015 Human Approval
→ IN_PROGRESS
→ Implementation / Verification

## 사용 Context

AGENTS.md
README.md

docs/07-TASKS.md (TASK-015)
docs/08-WORK_LOG.md (TASK-011 Verification Gap GAP-6)

frontend/src/features/history/
frontend/src/features/dashboard/
frontend/src/features/checkin/
frontend/src/app/

## 실제 Prompt

```text
TASK-015 승인! 실행!
```

Human Review 보완 (Claude 검토 후):

```text
1. A
2. 2~4 진행!
3. 화면 캡처하고, 표시 형식이 이전과 같으면 생략.
```

- 1: 표시 Timezone `Asia/Seoul` 유지 (A안) → DEC-022
- 2: Vitest 실행 Timezone `UTC` 고정, WORK_LOG 구분선 복구, `verify.sh` / `verify.ps1` Node.js 탐지 보완
- 3: 표시 문자열이 이전과 같아 화면 캡처 생략

## 작업 범위

- 날짜 / 시각 표시가 사용하는 Timezone을 명시한다.
- 고정 Timezone 기준 날짜 / 시각 표시 Frontend Test를 추가한다.
- 새로운 Dependency는 추가하지 않는다.
- TASK-016 이후 작업은 시작하지 않는다.

## 상태

진행 중

## Related Commit

Pending
