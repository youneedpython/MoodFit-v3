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

## TASK-026 / TASK-027에서 넘어온 입력 (2026-10-03, Claude 세션 기록)

Template은 `infra/cloudformation/`(network / ecr / data / certificate / iam / app / frontend)에 있고 `docs/17-AWS-IAC-FOUNDATION.md`가 Stack 의존 순서와 Parameter 전달을 설명한다. 정적 검증(`scripts/iac-validate.sh`)은 통과했지만 Stack은 아직 한 번도 만들지 않았다. 이 Task가 최초 생성이며 **비용이 발생한다**(DEC-027 추정 월 USD 250 / 환경, 상한 USD 300).

실행 전에 Human이 결정할 것:

- 비용 승인과 Budget 알림(50 / 80 / 100%) 설정 방법
- Stack을 만들 권한: 지금 Agent용 Permission Set은 조회만 가능하다(`MoodFitReadOnly`). Change Set 생성 / 실행을 누가 어떤 권한으로 할지(Human이 관리자 권한으로 직접 실행, 또는 범위를 제한한 Permission Set 추가)를 정한다.
- Origin 검증 Header 값과 배포 Image digest를 누가 언제 입력하는지
- 적용 순서(TASK-027 Review N-002): `docs/17`의 두 단계 방식(Frontend를 먼저 만들고 App 생성 후 `/api` 연결 갱신) 또는 Network → Data → Frontend → IAM → App 한 번에 적용하는 방식

최초 Change Set과 Smoke에서 확인할 것 (TASK-027 Review N-003, 정적 검증으로는 확인되지 않음):

- ALB access log Bucket 정책이 ALB 생성 시 쓰기 검사를 통과하는지
- AvailabilityZoneRebalancing과 Rolling 100 / 200 조합의 동작
- 사용자 정의 origin request 정책(Host 제외 header 전달)의 실제 동작
- Task 2개 동시 시작 시 Flyway 잠금 대기가 Health Check 유예 시간 120초 안에 끝나는지
- CloudFormation 앱 Role Trust의 Source 조건이 일반 Stack에서 동작하는지(동작하지 않으면 조건을 빼지 않고 중단, DEC-029)
- 생성된 DB 자격 증명이 RDS와 ECS에 올바르게 전달되는지(DEC-031)

TASK-029 전에 고칠 것 (TASK-027 Review N-001): `iam.yaml`의 배포 Role은 Task Definition 등록 요청에 `MoodFitEnvironment` Tag를 요구하는데 `app.yaml` Task Definition의 Tags에는 그 항목이 없다. 최초 생성은 Human 권한으로 하므로 막히지 않지만, 이후 배포 Role로 digest를 바꾸면 새 revision 등록이 거부될 수 있다. Template Tag를 추가하거나 IAM 조건과 맞춘다.

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
