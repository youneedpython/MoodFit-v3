# 66. TASK-042 전체 구현 Rework

- 목적: F-001 ~ F-007의 미구현 Finding을 승인된 TASK-042 범위에서 해결한다.
- Context: AGENTS.md, 공통 규칙, TASK-042 Contract, 승인된 Human 결정(2026-10-04).
- 실제 지시 요약: Google / Kakao / 체험 로그인, 사용자별 기록, JDBC Session / CSRF, 아바타 메뉴, Smoke와 계약 / 문서를 구현한다. 승인 Dependency 5개만 추가하며 Gradle 실행 없이 Sandbox 밖 Orchestrator가 Compile / Test를 판정한다.
- 금지: Task Contract 수정, Infra / Workflow / npm Dependency 변경, 실제 OAuth 값, 이메일 / 사진 저장, Git handoff 실행.
- 기대 산출물: 실제 Source Diff와 Test, V3 Migration, 인증 Contract, 운영 문서, Executor JSON.
- Human Approval: Task의 제공된 Gate 결정 승인과 명시 Rework 실행 지시.
- 상태: 구현 완료 후 Orchestrator 검증 / Claude Review 대기. DONE은 Executor 구현 완료를 뜻한다.
- Related Commit: Executor는 Commit하지 않음.
