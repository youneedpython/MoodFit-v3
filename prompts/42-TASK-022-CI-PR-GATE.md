# TASK-022 실행 지시

- 목적: GitHub CI / PR Gate 권장안 A 구현.
- Context: AGENTS.md, Task Contract / 필수 Context, DEC-021 / DEC-026.
- 실제 Prompt: MoodFit Executor로 TASK-022만 허용 경로에서 구현한다. Git 작업 / Gate 우회 / Secret 기록을 금지한다. 누적 changed_files와 Executor JSON을 반환한다.
- Human Approval: 2026-10-02 권장안 A / PR 상태 Comment / strict Required Checks 승인.
- 결과: 구현 완료, 실제 Harness → Draft PR → 최신 head CI → Human Squash Merge E2E 기록 대기.
- Related Commit: Executor는 Commit하지 않음.
- 추가 Rework 지시(F1): CI 실패 Comment의 Exit 1 / Timeout이 두 번째 Comment와 관찰 Audit 덮어쓰기를 유발하지 않도록 별도 실패 Audit를 기록하고 평가 결과를 반환한다. Comment 1회 / 관찰 보존 / 실패 Audit 회귀 Test를 추가하며 공급된 Finding 외 범위는 확대하지 않는다.
- Rework 지시: 공급된 F1 / F2 상태·승인 표기 정합성, F3 닫힌 PR의 허위 CI 실패 Comment 방지와 회귀 Test, F4 strict Checks의 head SHA 변경 복구 절차를 반영한다. F5는 위험 기록과 설치 gh의 --slurp 지원 확인으로 처리하며 매칭 구현을 확대하지 않는다.
