# TASK-049 실행 지시 (2026-10-04)

- 목적: Staging AI 코멘트의 mantle 404를 해결할 runtime 기본 경로와 실패 진단을 구현한다.
- Context: AGENTS.md, COMMON, TASK-049 승인 Contract, DEC-037 / DEC-038, LLM 기능 / Infra 문서.
- Human Approval: 제공된 Task Contract와 명시 실행 지시로 구현 범위 승인.
- 실제 Prompt 요지: MoodFit Executor로 TASK-049의 허용 경로만 수정한다. LLM_ENDPOINT로 runtime / mantle을 선택하고 HTTP 오류 Message의 계정 번호 / ARN을 가린다. 중복 실패 로그를 제거하고 권한 예시, Test, 작업 문서를 갱신한다. Secret과 실제 Bedrock 호출을 포함하지 않으며 Git 후속 작업은 수행하지 않는다.
- 기대 산출물: 경로 선택과 오류 문장 정리 Test, InvokeModel 권한 예시, 환경 값 / 운영 대응 문서, Executor JSON.
- 결과: Executor 구현 완료. Sandbox 밖 Orchestrator Verify / Claude Review / Human Squash Merge와 실제 생성 확인 대기.
- Related Commit: Executor는 Commit하지 않는다.
