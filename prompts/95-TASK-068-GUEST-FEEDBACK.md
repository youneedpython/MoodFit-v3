# TASK-068 — 체험 계정 추천 평가

- 목적: 로그인 없이 둘러보는 방문자도 추천 평가를 체험할 수 있도록 승인된 Gate B 결정을 반영한다.
- 실행 단계: 승인 Contract 확인 → TASK-068 구현 / Test 보완 / 기록 → Sandbox 밖 Orchestrator 검증과 Claude Review.
- Context: AGENTS.md, docs/tasks/COMMON.md, TASK-068 Contract, DEC-042 / DEC-045, API / 개인정보 / 추천 규칙 문서.
- Human Approval: 2026-10-05 Gate B 및 명시 실행 지시.

## 실제 Prompt

MoodFit Executor로 TASK-068만 allowed_paths 안에서 구현한다. 체험 계정의 평가 조회 / 저장 / 변경 / 삭제와 다음 Check-in 반영을 허용하고 shared 응답과 공유 안내를 추가한다. 소셜 사용자와 같은 추천 규칙, 사용자 행 잠금, 후보 검증, 로그인 / CSRF와 다른 체험 계정 제한을 유지한다. Smoke에서는 평가를 조회하여 형식만 검사하고 쓰지 않는다. 계약 / Test / 개인정보 / Decision / TASKS / WORK_LOG를 갱신한다. Git 후속 작업은 수행하지 않고 supplied executor JSON schema로 결과를 반환한다.

## 기대 산출물과 결과

- 체험 계정 평가와 공유 안내, 사용자별 격리 회귀 Test, 계약 / 읽기 전용 Smoke / 문서 동기화.
- 구현 완료는 검증 성공이나 Human 최종 승인이 아니다. 화면 캡처와 Merge 후 Staging 확인은 Claude / Human 후속 작업이다.
- Related Commit: Executor는 Commit을 수행하지 않는다.
