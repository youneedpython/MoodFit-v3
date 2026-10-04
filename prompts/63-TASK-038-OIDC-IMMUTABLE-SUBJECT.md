# TASK-038 실행 지시 (2026-10-04)

## 목적 / Context

TASK-029 첫 자동 배포의 OIDC 불일치를 승인된 TASK-038 Contract와 DEC-029 변경 기준으로 수정한다. Task source와 공통 규칙, AWS 접근 정책 / Staging CD / 배포 Runbook을 확인한다.

## 실제 Prompt / 승인

Human은 TASK-038만 allowed_paths 안에서 구현하도록 명시 지시했다. 두 배포 Role의 immutable subject, 숫자 전용 필수 Parameter 두 개, 예시 Placeholder와 관련 문서를 갱신한다. 실제 ID를 기록하지 않으며 StringEquals / audience / 환경 분리 / 기존 권한을 유지한다. Workflow와 배포 권한은 변경하지 않는다. Git 작업과 Stack 실행은 Executor가 수행하지 않는다.

## 기대 산출물 / 상태

IAM Template와 Trust 예시, 운영 문서와 TASK-038 Milestone 38 완료 반영. Executor 구현 완료 후 Orchestrator 검증 / Review를 거친다. 실환경 OIDC 확인은 Merge 후 Human Change Set 적용과 실패 배포 재실행으로 진행한다. TASK-030은 BLOCKED 유지다.

Related Commit은 Executor가 생성하지 않으며 승인된 후속 Git 단계에서 연결한다.
