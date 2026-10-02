# TASK-028 — Staging Deployment / Smoke Test

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

승인된 IaC와 Artifact로 **최초 Staging 환경**을 실제로 배포하고, 기능 / Network / DB / 정적 사이트를 End-to-End Smoke Test한다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-025 SSO / OIDC / IAM Approved
- TASK-026 / TASK-027 REVIEW 승인 또는 DONE
- 비용 Resource 생성에 대한 Human Approval

## AWS 접근

- 최초 Staging 배포는 로컬에서 진행한다.
  - Human: `aws sso login --profile moodfit-staging` (승인된 Profile 이름 사용)
  - Agent: 같은 Profile로 Change Set 생성, 승인 후 적용, ECR Push, ECS 배포, S3 Upload
- 작업 중 Session이 만료되면 Agent는 `HUMAN_REQUIRED`로 멈추고, Human 재로그인 후 이어서 진행한다.
- GitHub Actions(OIDC) 기반 자동 배포는 TASK-029에서 한다.

## Codex 작업 범위

1. Change Set을 먼저 만들고 검토 결과를 기록한다.
2. Human 승인 후 Staging Stack을 적용한다.
3. Backend Image Push(ECR), ECS Service 배포
4. Frontend Build Upload(S3), CloudFront 반영
5. RDS 연결 / Flyway Migration 확인
6. Smoke Test: Frontend 200, Backend Health, Check-in 생성 / 최신 / History 핵심 흐름 (DEC-024 계약 파일 기준 응답 형식 확인)
7. CloudWatch / ALB / ECS 실패 여부 확인
8. 실패 시 안전한 Rollback 절차를 실행하거나 Human Gate로 멈춘다.
9. 생성된 Resource Inventory와 예상 비용을 기록한다.

## 절대 금지

- Production Resource 생성 / Production Profile 사용
- 승인 없는 Destructive DB 작업
- Secret / 자격 증명 출력

## Claude Review 기준

- Change Set과 실제 변경 일치
- Staging만 변경했는가 (사용한 Profile / Account 확인 기록)
- Smoke Test가 핵심 API를 실제로 검증하는가
- Rollback이 데이터 손실을 일으키지 않는가
- 비용 Resource가 승인안과 일치하는가

## 완료 조건

Staging URL / API가 동작하고 핵심 Smoke Test PASS, Resource 상태 정상, 비용 / Resource Inventory 기록 완료 후 REVIEW.
