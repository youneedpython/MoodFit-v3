# 67. TASK-042 Run 3 — CSRF Cookie Rework

- 목적: me 응답에 CSRF Cookie가 없는 Backend Test 실패 해결
- 실행 단계: 승인된 TASK-042 Run 3 Executor Rework
- Context: AGENTS.md, 승인 Decision, COMMON.md, TASK-042 Contract, 기존 인증 구현과 Test, Frontend와 두 Smoke
- Human Approval: 2026-10-04 Task 승인 및 Run 3 명시 실행 지시 범위

## 실제 실행 지시

TASK-042 Run 3 범위만 구현한다. me는 지연 Token에 기대지 않고 Cookie 저장소에서 읽거나 생성하여 응답에 명시 저장한다. 로그인 / 로그아웃 뒤 Frontend와 Smoke가 me로 Token을 다시 받는지 확인한다. 체험 로그인 → me → Cookie의 Token으로 Check-in 저장 201 흐름을 Test로 고정한다. 실패한 Test의 Cookie 기대값을 약하게 만들지 않는다. WORK_LOG와 prompts에 기록하고 Git 작업은 수행하지 않는다.

## 결과

- 매 me 응답의 Cookie 발급과 기존 값 유지 구현, 실제 Cookie 기반 회귀 Test 보강
- Frontend와 두 Smoke의 로그인 후 me 재호출 확인; 기존 흐름 유지
- Bash 구문 / Diff / 문서 UTF-8 정적 확인 완료; Backend Test는 Orchestrator Verify에서 확인 필요
- Related Commit: Executor는 Commit하지 않음
