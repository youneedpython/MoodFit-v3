# 58. TASK-026 승인 IaC 실행

- 목적: 승인된 CloudFormation Foundation과 읽기 전용 정적 검증을 구현한다.
- Context: AGENTS.md, TASK-026 / COMMON, DEC-027 ~ DEC-030, AWS Architecture / Access Policy와 infra/iam 정책 초안.
- Human Approval: TASK-026 사전 결정과 명시 실행 지시. 실제 Stack / IAM / 비용 Resource 적용 승인은 포함하지 않는다.
- 실행 지시: 허용 경로만 수정하고 Network / ECR / Data / Frontend / 인증서 / IAM Template와 Placeholder 예시, iac-validate.sh, Foundation 문서를 작성한다. AWS Profile은 moodfit-readonly로 고정한다. Secret과 실제 계정 식별값을 기록하지 않는다. Commit / Push / Branch / PR을 직접 수행하지 않는다.
- 기대 결과: Executor JSON, TASK-026 구현 완료 반영 / TASK-027 READY. Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge로 최종 확정한다.
- Related Commit: 미생성. Git 후속 작업은 승인된 Orchestrator 경로다.

## Run 3 승인 실행

- 목적: WIP의 escape된 JSON 정책을 CloudFormation YAML 구조로 전환하고 승인된 Secret Guard 허용 문구 형태를 적용한다.
- 실제 지시: TASK-026 Run 3 범위만 수행한다. Parameter는 값 단위 Ref / Sub를 사용하고 Secrets Manager 조회 Action은 단독 Statement의 정확한 한 줄 배열로 작성한다. 문서에는 Action 원문을 기록하지 않는다. 허용 경로와 기존 완료 반영을 유지하며 Commit / Push / PR은 수행하지 않는다.
- 승인: 2026-10-03 Human의 허용 문구 추가와 명시 실행 지시. 새 권한이나 Resource 적용은 포함하지 않는다.
- 결과: IAM 정책 구조 전환과 검증 한계를 WORK_LOG에 기록했다. Sandbox 밖 검증과 최종 완료 승인 절차를 유지한다.
