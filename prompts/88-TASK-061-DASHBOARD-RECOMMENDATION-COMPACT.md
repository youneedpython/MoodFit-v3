# TASK-061 실행 지시

- 목적: 음악 재생 줄 간결화, 지표 아래 비교 안내, 좁은 화면 이름 줄 통일.
- Context: AGENTS.md, COMMON.md, TASK-061, 승인 Decision, TASK-058 결과와 관련 제품 문서.
- 실제 Prompt: 명시 승인된 TASK-061만 allowed_paths에서 구현한다. 제목 왼쪽 재생 / 닫기 아이콘, 가수 줄 YouTube Link, Body Metrics 아래 비교 안내를 적용한다. 기존 Token / 평가 / iframe 속성 / 안내 문구를 유지한다. Git 작업과 범위 확대는 금지한다.
- Human Approval: 2026-10-05 개선 후보 승인과 명시 실행 지시.
- 결과: Executor 구현 완료, Sandbox 검증 제약은 WORK_LOG에 기록한다. 검증 기준은 Orchestrator Verify다.
- Related Commit: Pending.
