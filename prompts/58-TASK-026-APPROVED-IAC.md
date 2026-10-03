# 58. TASK-026 승인 IaC 실행

- 목적: 승인된 CloudFormation Foundation과 읽기 전용 정적 검증을 구현한다.
- Context: AGENTS.md, TASK-026 / COMMON, DEC-027 ~ DEC-030, AWS Architecture / Access Policy와 infra/iam 정책 초안.
- Human Approval: TASK-026 사전 결정과 명시 실행 지시. 실제 Stack / IAM / 비용 Resource 적용 승인은 포함하지 않는다.
- 실행 지시: 허용 경로만 수정하고 Network / ECR / Data / Frontend / 인증서 / IAM Template와 Placeholder 예시, iac-validate.sh, Foundation 문서를 작성한다. AWS Profile은 moodfit-readonly로 고정한다. Secret과 실제 계정 식별값을 기록하지 않는다. Commit / Push / Branch / PR을 직접 수행하지 않는다.
- 기대 결과: Executor JSON, TASK-026 구현 완료 반영 / TASK-027 READY. Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge로 최종 확정한다.
- Related Commit: 미생성. Git 후속 작업은 승인된 Orchestrator 경로다.
