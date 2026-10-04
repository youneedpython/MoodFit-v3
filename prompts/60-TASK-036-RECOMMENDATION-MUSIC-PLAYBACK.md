# TASK-036 실행 지시 기록

- 목적: 추천 음식·음악 각각 5개와 실제 곡 바로 듣기 구현.
- 실행 단계: 2026-10-04 승인 Contract에 따른 Executor Working Tree 구현.
- Context: AGENTS.md, 필수 제품 / UI / Architecture / API 문서, DEC-014 / DEC-019 / DEC-024, COMMON.md와 TASK-036 Contract.
- 실제 지시: TASK-036만 allowed_paths 안에서 구현하고 승인 곡 ID만 사용한다. 점수 / Mood / Context 판정, V1, Dependency와 금지 경로는 변경하지 않는다. 기존 기록을 보존하며 재생 클릭 후 검증된 ID로 nocookie iframe을 만든다. Git 작업과 Gate 우회는 수행하지 않는다. Executor JSON으로 누적 변경 경로와 검증 한계를 보고한다.
- Human Approval: 2026-10-04 Gate B / C 사전 승인과 명시 Task 실행 지시.
- 기대 산출물: 추천 생성 / 저장 / 조회, V2, API 예시 / 문서 / 테스트, 공통 음악 카드 재생, 운영 문서와 Work Log.
- 결과: 구현 반영. 설치 / Gradle / Docker의 Sandbox 제약으로 실행 검증은 완료하지 못했으며 최종 검증은 Orchestrator 기준.
- Related Commit: Executor는 Commit하지 않음.
