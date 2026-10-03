# TASK-025 — AWS SSO / GitHub OIDC / IAM / Environment Gate

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

장기 AWS Access Key 없이 AWS에 접근하도록 두 가지 인증 경로를 설계하고 승인받는다.

| 경로 | 사용 주체 | 방식 |
|---|---|---|
| 사람 / 로컬 Agent | Human이 로그인, 이후 Codex / Orchestrator가 작업 | AWS IAM Identity Center(SSO) → Permission Set → `aws sso login --profile` |
| CI / CD | GitHub Actions | GitHub OIDC → AWS IAM Role (SSO는 브라우저 로그인이 필요해 CI에서 사용할 수 없음) |

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-023 Architecture Approved (계정 구조 / SSO 사용 범위 포함)
- TASK-024 Artifact 전략 확정 권장

## Human Gate

IAM Identity Center, Permission Set, IAM, GitHub Permission, Production Environment, Secret 정책은 모두 Human Approval 대상이다. 실제 권한을 부여하기 전에 정책을 먼저 검토한다.

## Codex 작업 범위

### A. AWS SSO (사람 / 로컬 Agent)

1. Permission Set을 용도별로 나눈다. 예)

| Permission Set | 용도 | Agent 사용 |
|---|---|---|
| `MoodFitReadOnly` | 조회, IaC 정적 검증 / Change Set 검토 | 허용 |
| `MoodFitStagingDeploy` | Staging Change Set 생성 / 적용, ECR Push, ECS 배포 | 허용 (Human 승인된 Task 범위 안) |
| `MoodFitProductionAdmin` | Production 관리 / 긴급 대응 | **금지 (Human 전용)** |

2. 로컬 Profile 이름 규칙을 정한다. 예) `moodfit-readonly`, `moodfit-staging` (`~/.aws/config`, 실제 Account ID / Start URL은 Repository에 두지 않는다)
3. 작업 흐름을 정의한다.
   - Human: `aws sso login --profile <profile>`
   - Orchestrator Preflight: `aws sts get-caller-identity --profile <profile>`로 대상 Account / Role 이름 확인 (값 출력은 Account 확인에 필요한 최소 범위)
   - Agent: Task Contract에 허용된 Profile만 `--profile`로 사용
   - Session 만료 / 다른 Account·Role 감지 시 즉시 `HUMAN_REQUIRED`
4. Agent 금지 명령 / 행동을 정의한다: Access Key 생성 / 저장, `aws configure`로 Key 입력, SSO Token Cache 접근, `aws configure export-credentials`, IAM / Identity Center 권한 변경
5. Session 지속 시간과 감사(Audit) 방식을 정한다. Agent 작업은 Human의 SSO Identity로 CloudTrail에 남으므로, Orchestrator Run ID / 시각 / 실행 명령을 Run Log에 남겨 대조할 수 있게 한다.

### B. GitHub OIDC (CI / CD)

6. OIDC Trust 조건을 최소 범위로 설계한다. (Repository, Branch / Environment 조건 포함)
7. Staging / Production IAM Role을 분리한다.
8. Resource별 Least-privilege Deployment Policy를 제안한다.
9. GitHub Environment `staging`, `production` 정책을 설계한다. Production은 Required Reviewer(Human Approval)를 전제로 한다.
10. 장기 AWS Access Key를 GitHub Secret에 저장하지 않는다.

### 공통

11. 실제 ARN / Account ID / SSO Start URL 등 환경 고유값은 Placeholder / Parameter로 처리한다.

## 실행 기준 (Human 승인, 2026-10-03)

2단계로 진행한다.

- **A단계 (현재 Contract)**: 설계 문서 `docs/15-AWS-ACCESS-POLICY.md`와 정책 초안 `infra/iam/`(JSON, 환경 고유값은 Placeholder)을 작성하고 Gate에서 Human 승인을 받는다. AWS / GitHub 설정 변경, AWS CLI 사용, Orchestrator Code 변경은 하지 않는다. 새 Decision은 최신 번호 다음(DEC-029)의 Pending Human Approval 초안으로 기록한다. A단계에서 TASK-025를 DONE으로 바꾸지 않는다(IN_PROGRESS 유지).
- **B단계 (승인 후 Contract 확대)**: Orchestrator AWS Profile Preflight(`aws sts get-caller-identity`로 Account / Role 확인, Session 만료 / 불일치 시 `HUMAN_REQUIRED`)와 Fake CLI Test를 구현한다. Human이 IAM Identity Center Permission Set과 로컬 Profile을 구성한다. 완료 반영(TASK-025 DONE / TASK-026 READY)은 B단계 PR에 포함한다.

확정된 전제 (Human 답변 / Claude 세션 확인, 2026-10-03):

- AWS: IAM Identity Center 조직의 `student11` 계정을 MoodFit 계정으로 사용한다. DEC-027대로 같은 계정에서 Staging부터 시작한다. Human은 IAM Identity Center 관리 권한이 있어 Permission Set을 직접 만들 수 있다. Route 53 Public Hosted Zone(`8949db.kr`)도 이 계정에 있는 것으로 전제하며 B단계 Preflight 준비 때 확인한다. Account ID / SSO Start URL / ARN은 Repository에 기록하지 않는다.
- 현재 로컬 AWS CLI Profile(`student1` ~ `student11`)은 모두 `AdministratorAccess` Permission Set이다. Agent는 이 Profile을 사용하지 않는다. MoodFit 전용 최소 권한 Permission Set과 Profile(`moodfit-readonly`, `moodfit-staging`)을 새로 만들고, 기존 관리자 Profile은 Human 전용으로 둔다.
- GitHub: Repository는 Public, 개인 계정 소유, Collaborator는 Human 1명이다. Environment와 Actions Secret은 아직 없다. Environment Required Reviewer는 사용할 수 있으나 승인자가 1명이므로 "본인 승인 방지(prevent self-review)"는 켤 수 없다. 이 잔여 위험과 보완책(Production 배포는 Human이 직접 승인, Deployment Branch를 `main`으로 제한 등)을 설계에 명시한다.
- 승인된 Architecture / Artifact: DEC-027(B안, 서울, ECS Fargate, RDS MySQL 8.4 Multi-AZ, CloudFront + S3, ALB HTTPS origin, Domain `8949db.kr`), DEC-028(Actuator Health, digest 고정 Image, `sha-<commit>` Tag, ECR immutable).
- TASK-024 Review 입력: CI Image Build는 깨끗한 checkout의 실제 Commit에서 수행하고 `VCS_REF`를 필수로 전달한다(배포 Role 권한 범위 설계에 반영).

작성 규칙:

- Orchestrator Secret 검사 오탐 방지: `password` / `token` / `secret` / `api key` 바로 뒤에 `:` 또는 `=`와 값이 오는 표기를 쓰지 않는다. IAM 정책 JSON의 Action 이름(예: `secretsmanager:GetSecretValue`)처럼 불가피한 경우는 검사에 걸리지 않는 형태인지 주의하고, 걸릴 수 있는 Key-Value 표기는 문장으로 풀어 쓴다.
- 확인된 오탐 사례(Claude 세션, 2026-10-03): Secrets Manager ARN을 `arn:aws:secretsmanager:<region>:<account>:` 뒤에 Resource 종류 단어와 `:`와 이름을 그대로 이어 쓰면 Guard가 BLOCKED 된다. 정책 JSON / 문서에서 이 ARN은 전체를 Parameter Placeholder(예: `${AppDbCredentialArn}`)로 쓰고 literal 형태로 쓰지 않는다. 작성 후 추가한 모든 줄에서 위 단어 바로 뒤에 `:` / `=`가 오는 곳이 없는지 스스로 검색해 확인한다.
- 이후 Task에서 결정 / 수행하기로 기록된 항목은 `human_decisions_needed`로 보고하지 않는다. A단계 Gate에서 Human이 결정할 항목(Permission Set 범위, OIDC Trust 조건, Role 분리, Environment 정책, Session 지속 시간, 감사 방식)만 보고한다.

## Run 1 Review 반영 (2026-10-03, Claude 세션 기록)

Run 1(`2026-10-03T03-48-52-279Z-cdad7c20`)은 Executor HUMAN_REQUIRED(Gate)와 Claude Review CHANGES_REQUIRED로 정지했다. Human Gate에 올리기 전에 기술 지적을 먼저 고친다. Run 2의 Codex 작업 범위는 아래 수정뿐이다. Gate 항목 자체는 그대로 Human 결정 대기이며 DEC-029는 Pending을 유지한다.

- **F-001 Production 승격 모델**: Production deploy Role에서 ECR Push Action을 제거한다. Production은 Staging에서 검증된 동일 digest만 배포한다(DEC-028). 승격 모델(어느 Role이 어느 Repository에서 읽고 어디에 쓰는지, 환경별 Repository인지 단일 Repository인지)을 `docs/15` 5절에 명시하고 그에 맞는 최소 권한으로 정책 JSON을 고친다. 권장 방향은 단일 Repository + immutable Tag / digest 참조로 Production Role은 조회 Action만 갖는 것이다. 다른 모델을 택하면 근거를 적고 Gate 결정 항목으로 올린다.
- **F-002 미사용 PassRole**: `MoodFitStagingDeploy` Permission Set의 PassRuntimeRoles Statement를 삭제한다. `docs/15` 4절 서술을 실제 JSON과 맞춘다.
- **F-003 CloudFormation service role Trust**: `aws:SourceAccount`(가능하면 `aws:SourceArn`) 조건을 Parameter로 추가한다. 생략한다면 이유와 잔여 위험을 적는다.
- **F-004 OIDC Session 시간**: 900초가 Build / Push / 배포 안정화 대기에 부족할 수 있다. 자격 증명 취득 시점(Build 이후), 만료 시 처리(자동 재시도 금지, 부분 배포 확인 절차), 요청 시간과 근거를 `docs/15` 5절과 Human 검토 Matrix에 반영한다.
- WORK_LOG에 Run 1 결과와 이번 수정을 기록한다.

## Verification

- SSO: Agent 허용 Profile로 Production Resource 변경이 불가능한지 정책으로 확인
- SSO: Session 만료 시 Orchestrator가 멈추는지 확인 (Fake / 실제 만료)
- OIDC: Trust Policy가 다른 Repo / Branch에서 AssumeRole 불가하도록 검토
- Production Role / Permission Set이 Staging보다 넓게 Agent에 열리지 않았는지 확인
- Secret / 자격 증명 값이 Repo / Log에 없는지 확인

## Claude Review 기준

- Wildcard IAM 과다 여부
- Agent가 쓰는 Permission Set의 범위와 Production 차단
- OIDC Subject / Audience 조건
- Environment Bypass 가능성, Production Approval 실효성
- Credential Lifetime / Auditability (SSO Session, OIDC Session)

## 완료 조건

Human이 SSO / OIDC / IAM / Environment 정책을 승인하고, Human이 IAM Identity Center 설정과 로컬 Profile 구성을 마친 뒤에만 실제 Infra Task를 READY로 전환한다.
