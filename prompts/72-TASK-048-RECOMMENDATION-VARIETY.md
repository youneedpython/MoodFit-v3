# TASK-048 실행 지시

- 목적: 음식 / 음악 후보 확대와 서울 날짜별 순환 선택, History Card 간격 통일.
- 실행 단계: Human Approved 2026-10-04 Contract에 따른 Executor 구현.
- Context: AGENTS.md, COMMON, TASK-048 Contract, DEC-014와 기존 추천 / 계약 / Smoke / UI.
- 실제 Prompt: 승인된 TASK-048만 allowed_paths 안에서 구현한다. 40곡의 승인 ID를 그대로 사용하고 판정 / 응답 형식 / 추천 개수를 유지한다. 서울 날짜의 epochDay로 기분 3개와 상황 2개를 순환 선택하고 중복은 상황 후보에서 건너뛴다. 계약 / Smoke / 아이콘 / History 간격 / Test / 문서를 동기화한다. Git 작업과 Human Gate 우회는 금지한다.
- 기대 산출물: 결정적인 추천, 후보 전체 아이콘, 조건부 Card 간격, 계약과 검증 문서.
- 승인: Human Approved 2026-10-04. 새로운 Dependency / Migration / 외부 조회 없음.
- 결과: Executor 구현 완료. Orchestrator Verify / Claude Review / Human Merge 대기.
- Related Commit: Pending (Executor는 Git 후속 작업을 수행하지 않음).
