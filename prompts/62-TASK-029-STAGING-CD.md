# 62. TASK-029 Staging CD 구현

- 목적: 검증된 main Commit을 Staging에 자동 배포한다.
- 실행 단계: TASK Execution, 2026-10-04 Gate C 사전 승인 및 명시 실행 지시.
- Context: AGENTS.md, TASK-029 / COMMON Contract, DEC-021 / DEC-026 / DEC-028 / DEC-029 / DEC-031, 기존 CI와 TASK-028 수동 배포 Script.
- 실제 Prompt의 실행 지시: MoodFit Executor로서 승인된 TASK-029만 allowed_paths 안에서 구현한다. Task source와 필수 Context를 읽고 Git 작업이나 Human Gate 우회 없이 구현·기록한다. OIDC Staging 배포, immutable SHA Tag / digest, ECS revision 갱신, Frontend 게시, invalidation 완료, Smoke와 실패 Summary를 구현한다. 새 승인 사항만 결정 요청으로 분리하며 Executor JSON으로 결과를 반환한다.
- Human Approval: Task 문서의 결정 1~9 및 활성 Contract 승인. 외부 Action SHA는 공식 Release 링크로 확인했다.
- 기대 산출물: deploy-staging Workflow, 21번 운영 문서, 관련 Decision / 상태 / 이력 동기화.
- 결과: Executor 구현 완료. 실제 자동 배포는 Merge 이후 확인하며 구현 결과가 Human 완료 승인을 대신하지 않는다.
- Related Commit: Pending. Executor가 Commit / Push / Branch / PR을 수행하지 않는다.
