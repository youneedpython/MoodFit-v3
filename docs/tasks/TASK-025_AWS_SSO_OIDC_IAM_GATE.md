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
