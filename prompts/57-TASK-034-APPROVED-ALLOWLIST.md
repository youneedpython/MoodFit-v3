# TASK-034 승인 허용 문구 구현 지시

- 목적: 기존 Secret 차단 규칙을 유지하면서 Human이 승인한 정확한 문구만 차단 판정에서 제외한다.
- 실행 단계: TASK-033 이후 명시 실행. 승인된 Task / COMMON / Decision / 정책 / 설계 문서를 읽고 허용 경로 안에서 구현한다.
- 실제 Prompt 요지: MoodFit Executor로 TASK-034의 사전 승인 1 ~ 5를 구현한다. literal 배열 형식과 자격 증명 형태를 검증하고 Preflight / Guard / PR / Commit 판정에 적용한다. 마스킹은 엄격히 유지한다. Secret 정지에는 위치만 기록하고 Resume은 허용 목록만 다시 읽되 기존 승인 파일을 요구한다. 기존 차단 규칙에 승인된 세 가지 형식 보강을 더한다. 자기 Contract와 금지 경로를 수정하지 않으며 Git handoff를 수행하지 않는다.
- 기대 산출물: Schema / Orchestrator 구현, Fake CLI / 단위 Test, 정책 / 설계 / 상태 / 이력, TASK-034 DONE 및 TASK-026 READY의 PR 완료 반영.
- Human Approval: 2026-10-03 Task Contract의 형식 / 거부 기준 / 적용 범위 / 정지 및 Resume / 강화 규칙 사전 승인. 기본 규칙을 좁히는 변경은 승인되지 않았다.
- 결과: Executor 구현 완료. 최종 기준은 Sandbox 밖 Orchestrator Verify와 Claude Review이며 Human Squash Merge로 완료 승인한다.
- Related Commit: Executor는 Commit하지 않는다.
