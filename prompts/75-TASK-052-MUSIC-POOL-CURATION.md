# TASK-052 실행 지시 기록

- 목적: 승인된 선곡 이동으로 추천 Pool의 분위기를 정리한다.
- 단계 / Context: TASK-048 후속, TASK-052 Contract와 COMMON, AGENTS 및 승인 Decision.
- Human Approval: 2026-10-04 "선곡 조정: 옮겨"와 명시 Executor 실행 지시.
- 실제 Prompt: TASK-052의 허용 경로 안에서 승인 표대로 기존 곡만 이동한다. ENERGETIC 26곡 / 앞 5곡과 RAIN, 음식 / 판정 / 선택 규칙 / 계약 예시를 유지한다. Smoke 성공 문구 한 줄의 400 표기를 제거하고 회귀 Test와 문서를 기록한다. Git 작업과 Gate 우회를 금지하며 Executor JSON으로 보고한다.
- 기대 산출물: Pool 조정, 별도 회귀 Test, Smoke 문구와 Task / Work Log / 기능 문서 갱신.
- 결과: Executor 구현 완료. Sandbox 제한으로 전체 검증은 실행되지 않았고 Sandbox 밖 Orchestrator Verify가 기준이다. Review / Remote CI / Human Squash Merge 대기.
- Related Commit: Executor는 Commit하지 않음.
