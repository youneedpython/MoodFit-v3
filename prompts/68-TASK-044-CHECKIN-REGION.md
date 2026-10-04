# TASK-044 Check-in Region Record 실행 지시

- 목적: 저장 당시 지역 이름을 기록과 함께 저장하고 Dashboard / History / Check-in 결과에 표시한다.
- 실행 단계: 승인된 TASK-044 Executor 구현. Human Approved 2026-10-04.
- Context: AGENTS.md, TASK-044 / COMMON, API 명세, DEC-033 / DEC-034와 위치 날씨 문서.
- 실제 Prompt: "Dashboard, history에 저장할 당시의 지역이 날씨와 같이 표시 되었으면 해." 제공된 Contract의 allowed_paths 안에서만 구현하고 좌표는 계속 저장하거나 Backend로 보내지 않는다. Git 작업과 Human Gate 우회는 하지 않는다.
- 기대 산출물: 선택 region API / V4 nullable 컬럼 / 세 화면 표시 / H2·MySQL·Frontend 테스트 / API 예시와 승인 문서 갱신.
- 결과: Executor 구현 완료. Sandbox npm 캐시 / Gradle 잠금 / Docker 접근 제한은 WORK_LOG에 기록하며 최종 검증은 Orchestrator Verify가 수행한다.
- Related Commit: Executor는 Commit하지 않는다.
