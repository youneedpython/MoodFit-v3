# TASK-036 Run 2 수정 지시 기록

- 목적: Run 1 Backend 테스트의 COLD 추천 이유 기대값 실패 수정.
- 실행 단계: 승인된 TASK-036 Run 2 범위의 Executor 수정.
- Context: AGENTS.md, 필수 제품 / 설계 / API / Decision 문서, COMMON.md, TASK-036 Contract의 Run 1 결과와 Run 2 작업 범위.
- 실제 지시: COLD 기대 문구의 반복을 제거하고 COLD / SNOW 분기와 다른 Backend 테스트 기대값을 점검한다. Docker 없이 실행 가능한 Backend 테스트를 직접 실행하고 결과를 보고한다. 나머지 WIP는 유지하며 allowed_paths 밖 수정과 Commit / Push / Branch / PR / Gate 우회는 하지 않는다. 결과는 지정된 Executor JSON으로 반환한다.
- Human Approval: TASK-036의 사전 승인과 Run 2 명시 실행 지시.
- 기대 산출물: 자연스러운 한 문장의 테스트 기대값, Backend 테스트 실행 증거와 검증 한계 기록.
- 결과: COLD 기대값 한 곳을 수정했다. Backend 전체 테스트 명령은 Sandbox 밖 Gradle Wrapper lock 경로의 디렉터리 생성 제한으로 테스트 시작 전에 종료됐다. 테스트 통과를 주장하지 않으며 최종 검증은 Orchestrator 기준이다.
- Related Commit: Pending. Executor는 Commit하지 않음.
