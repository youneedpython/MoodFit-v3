# TASK-046 실행 지시 기록

- 목적: TASK-045 기능을 위한 ECS 환경 값과 계정 간 호출 권한 구현.
- 실행 단계: 승인 Contract 구현, 문서화, Executor 검증 참고 증거 기록.
- Context: AGENTS.md, COMMON, TASK-046 Contract, DEC-026 / DEC-029 / DEC-035와 승인 A안.
- 실제 Prompt: MoodFit Executor로 TASK-046만 allowed_paths에서 구현한다. LLM 환경 값과 조건부 TaskRole AssumeRole, 다른 계정 Role Policy 예시와 Human 적용 절차를 제공한다. 실제 계정 값 기록, AWS 변경, Commit / Push / Branch 생성은 금지한다. 결과는 지정 JSON으로 보고한다.
- Human Approval: 2026-10-04 LLM Gate / A안 사전 승인 및 명시 실행 지시.
- 기대 산출물: App / IAM Template와 Parameter 예시, 호출 Role 정책 예시, 배포 / 접근 정책 / Decision / Task / 작업 기록.
- 결과: Executor 구현 완료. Orchestrator Verify / Claude Review / Human Squash Merge와 실제 적용 대기.
- Related Commit: Pending
