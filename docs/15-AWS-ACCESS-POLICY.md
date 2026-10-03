# 15. AWS Access Policy — TASK-025 A단계

2026-10-03 작성. **Pending Human Approval (DEC-029)**. 이 문서와 `infra/iam/` JSON은 검토용 초안이다. 실제 Permission Set / IAM / Environment / Resource 생성과 배포를 승인하지 않는다. TASK-025는 IN_PROGRESS, TASK-026 이후는 BLOCKED를 유지한다.

## 1. 승인 근거와 실행 경계

DEC-026 역할 / Gate, DEC-027 같은 MoodFit 계정에서 Staging 시작 / 서울 / 환경별 Resource 분리, DEC-028 immutable ECR / full Commit SHA / digest 고정 Artifact를 따른다. Human이 확인한 대상 계정과 SSO 값은 로컬에서만 사용한다. 기존 관리자 Profile은 Human 전용이며 Agent에게 제공하지 않는다.

A단계는 문서 / JSON / 기록만 작성한다. AWS CLI, GitHub 설정, 인증 Cache, Orchestrator Code, Workflow를 사용하거나 수정하지 않는다. B단계 Contract 확대 후 Profile Preflight와 Fake CLI Test를 구현하고 Human이 Permission Set / Profile을 구성한다. 처음으로 IAM을 적용하는 행위도 별도 명시 승인 범위에 연결한다.

## 2. Human 검토 Matrix

| 결정 대상 | 권장안 | 대안 / 잔여 위험 |
|---|---|---|
| Permission Set | MoodFitReadOnly는 Staging 메타데이터만, MoodFitStagingDeploy는 환경 한정 Artifact / ECS 및 기존 앱 Stack Change Set, MoodFitProductionAdmin은 Human 전용 | AWS 관리 ReadOnlyAccess는 계정 전체 조회 범위가 넓어 기각. Network / DB / IAM 최초 구성은 별도 IaC Gate |
| OIDC Trust | 정확한 Repository + environment subject, audience sts.amazonaws.com, 환경별 별도 Role | branch subject만 사용하면 Environment 승인과의 연결을 잃음. environment subject는 Branch를 포함하지 않아 GitHub Deployment Branch 정책 필요 |
| Role 분리 | Staging / Production deploy, IaC service role, ECS execution / task role 분리. 로컬 Agent에 Production / Role 전환 권한 없음 | 단일 계정 관리자 정책 / 공용 Role은 제외 |
| Environment | staging / production 모두 Deployment Branch main만, Tag 제외. production Human Required Reviewer, 관리자 Bypass 비활성, self-review 방지는 단일 승인자 때문에 비활성 | 동일 Human의 실행과 승인 가능성을 수용. Agent 승인 / 설정 변경 금지, 고정 SHA / digest 및 승인 기록 대조 |
| Session | Permission Set 1시간, CI STS 요청 15분 / Role 최대 1시간, Identity Center 로그인 Session 8시간 제안 | 로그인 Session과 AWS Role Session은 별개. 유효한 로그인으로 Role 자격이 갱신될 수 있어 Run 최대 1시간을 별도로 제한 |
| 감사 | CloudTrail과 비민감 로컬 Run / GitHub Run 기록 대조, 30일 Run 기록 보존 제안 | SSO Human Identity만으로 Agent를 구분할 수 없음. Run ID / UTC / 명령 종류 / 승인 참조와 CloudTrail event 시각을 대조 |
| 앱 비밀 / 암호화 | 환경별 Secrets Manager, ECS execution role만 DB 값 주입. AWS 관리 암호화 / S3 SSE-S3 기본, 고객 관리 KMS는 초기 제외 | 사용자 정의 KMS 추가는 비용 / Key Policy 재승인. origin 검증 header는 Human이 환경별 관리하고 Agent / CI 조회 금지 |

정책 적용 전에 위 Matrix 전체와 실제 검토 Diff를 Human이 승인해야 한다. 더 넓은 권한이나 Session은 재승인한다.

## 3. SSO / Profile / Preflight 설계

| Permission Set | Profile | Agent 허용 | 정책 초안 |
|---|---|---|---|
| MoodFitReadOnly | moodfit-readonly | Task에 명시된 Staging 조회만 | readonly-permission-set.json |
| MoodFitStagingDeploy | moodfit-staging | 승인된 Staging Task만 | staging-permission-set.json |
| MoodFitProductionAdmin | moodfit-production-human | 금지 | Human 기존 관리 경로, Agent용 JSON 없음 |

Human이 로컬 AWS config에 SSO session, 대상 계정, Permission Set, ap-northeast-2를 구성한다. 실제 config / Account ID / Start URL / ARN은 Repository / Prompt / Log에 넣지 않는다. 관리자 Profile을 이름만 바꿔 연결하는 것을 금지한다. 추가 관리 정책을 붙이지 않으며 Human이 동일 허용 범위의 고객 관리 Permissions Boundary를 구성해 권한 합집합 확장을 제한하는 안을 제안한다. Boundary 자체는 권한을 부여하지 않는다.

B단계 실행 순서:

1. Human이 허용 Profile로 SSO 로그인한다.
2. Orchestrator가 Contract의 Profile allowlist와 비추적 로컬 기대 Account / Permission Set Role을 검사한다. 환경변수의 다른 자격 증명 공급원을 차단하고 모든 AWS 호출에 명시적 profile을 사용한다.
3. get-caller-identity 응답은 메모리에서 Account / assumed-role ARN의 정확한 Permission Set Role 및 Session을 검사한다. Role 이름의 부분 일치나 관리자 Role을 허용하지 않는다. SSO 생성 Role suffix는 Human이 실제 할당을 확인해 고정한다.
4. Run Log에는 Profile alias, identity-match 결과, UTC, Run ID, 승인 Task / Diff 참조만 기록한다. 실제 응답 / 계정 / ARN / UserId는 출력하거나 저장하지 않는다.
5. 쓰기 직전 다시 확인한다. 만료 / 미확인 / 다른 Account·Role이면 HUMAN_REQUIRED로 멈추고 로그인 / fallback / 자동 재시도를 하지 않는다. Run 1시간 제한 도달 시에도 새 실행 승인을 기다린다.

금지 행동은 Access Key 생성·저장, configure로 Key 입력, export-credentials, SSO Cache 접근, 환경변수 자격 증명 Export, AssumeRole을 통한 우회, IAM / Identity Center 변경, Production Profile 사용이다. SDK의 정상 SSO 인증 동작 외에 Agent가 Cache를 직접 읽지 않는다. 로컬 Run ID는 CloudTrail에 자동 전달되지 않으므로 시간 / Action / Human Identity 대응 근거로만 사용한다.

## 4. IAM 파일과 최소 권한

모든 `${...}` 값은 **외부 치환 Parameter**이며 그대로 AWS에 제출할 수 없다. IAM policy variable 자동 해석이나 CloudFormation Template로 간주하지 않는다. 실제 값은 Human이 비추적 로컬 입력에서 제공하고 적용 전 렌더링 정책을 검토한다. Repository의 파일에는 실제 값이 없다.

| 파일 | 적용 주체 / 범위 |
|---|---|
| readonly-permission-set.json | STS 자기 식별, 기존 Staging 앱 Stack / ECS Service / ECR 메타데이터 |
| staging-permission-set.json | Staging ECR Push / S3 정적 객체 업로드 / CloudFront invalidation / ECS Service 갱신, 제한된 앱 Change Set |
| staging-oidc-trust.json / production-oidc-trust.json | 각 CI deploy Role의 Trust, 정확한 environment와 audience |
| staging-deploy-policy.json / production-deploy-policy.json | 환경별 ECR / S3 / CloudFront / ECS / 정확한 runtime Role PassRole |
| staging-app-changeset-role-policy.json | 기존 앱 Stack 전용 CloudFormation service role. Staging Service 갱신 / 해당 family revision 등록 |
| staging-app-changeset-role-trust.json | CloudFormation 서비스만 AssumeRole, Agent 직접 AssumeRole 없음 |
| ecs-runtime-role-trust.json | 환경별 execution / task Role Trust, SourceAccount 정확히 지정 / SourceArn 해당 계정의 서울 ECS 범위 |
| ecs-execution-role-policy.json | 환경별 별도 인스턴스, ECR Pull / 사전 생성 Log Group stream 쓰기 / 해당 DB credential 읽기 |

Parameter 검토 규칙:

- RepositoryOwner / RepositoryName / GitHubOidcProviderArn은 승인 Repository와 해당 계정 Provider 하나다. owner / repo / subject wildcard는 금지한다.
- Staging / Production RepositoryArn, ServiceArn, ClusterArn, StaticBucketArn, DistributionArn, ExecutionRoleArn, TaskRoleArn은 각각 실제 전용 Resource의 정확한 ARN이다. Production 값을 Staging Parameter에 넣지 않는다.
- StaticObjectArn은 해당 정적 Bucket의 객체 범위만 나타낸다. Revision family Pattern은 해당 환경의 승인된 family에 revision suffix wildcard만 허용한다. StackArn은 기존 앱 전용 Stack의 정확한 ARN이며 공용 Infrastructure Stack을 지정하지 않는다.
- EnvironmentLogStreamArnPattern은 해당 Log Group의 stream suffix만 허용한다. AppDbCredentialArn은 전체 ARN을 단일 Parameter로 받는다. 값 / literal credential ARN 표기는 문서에 넣지 않는다.
- AWS Region / 계정 wildcard와 환경 공용 Resource wildcard는 금지한다. CloudFront는 global ARN이다. 런타임 정책은 환경별 렌더링하며 task role은 앱 AWS 호출이 없으므로 빈 권한을 유지한다.

Resource 전체 wildcard 예외는 STS 자기 식별, ECR 인증, ECS DescribeTaskDefinition이다. 앞의 두 API와 task definition 조회는 Resource별 권한을 지원하지 않는다. 조회에는 계정 내 다른 task definition 메타데이터도 노출될 수 있으므로 정의에 민감한 값을 직접 넣지 않는다. ECR 인증만으로 다른 Repository Push / Pull을 허용하지 않는다. Action wildcard는 쓰지 않는다. RegisterTaskDefinition은 현재 공식 권한 표에 따라 환경 family ARN으로 제한한다.

Agent Profile과 CI Role에는 RDS / VPC / ALB / DNS / ACM / KMS 관리, IAM 쓰기, Role chaining, DB 값 읽기, CloudFront 구성 수정, S3 / ECR 삭제, ECS Exec / RunTask, Stack 삭제 권한을 주지 않는다. CI의 iam:PassRole은 해당 환경의 두 ECS runtime Role과 ecs-tasks 서비스에만 허용한다. Staging SSO의 추가 PassRole은 정확한 앱 Change Set Role과 cloudformation 서비스에 한정한다. Production Resource 변경은 Staging 허용 ARN에 포함되지 않아 implicit deny다. 실제 추가 정책 / Resource Policy / Boundary를 포함한 유효 권한의 검증이 필요하며 초안만으로 적용된 차단을 주장하지 않는다.

CloudFormation은 기존 앱 Stack의 UPDATE Change Set만 제안한다. CreateChangeSet에는 정확한 RoleArn과 ResourceTypes 목록을 필수로 전달하고 ECS Service / TaskDefinition 두 종류만 허용한다. ExecuteChangeSet은 API에 Role 전달을 요구하지 않고 정확한 Stack을 제한한다. Human이 Stack에 전용 최소 권한 service role이 연결되어 있고 다른 관리자 service role / 기존 과권한 Change Set이 없음을 확인한 뒤 활성화한다. Agent가 Stack 접근으로 연결된 Role을 사용할 수 있으므로 PassRole 제한만으로 기존 과권한 Role 사용을 막는다고 주장하지 않는다.

초안 service role은 Service 생성·삭제, Task revision 해제·삭제를 허용하지 않는다. CloudFormation 교체 / cleanup / rollback에서 추가 API가 필요하면 실패를 숨기지 않고 별도 권한 검토를 한다. 최초 Infrastructure 생성 / Network / RDS Change Set 정책은 TASK-026 / TASK-027의 구체적 IaC Diff와 비용 Gate에서 확정한다. 이 초안은 전체 Infrastructure provisioning 정책이 아니다.

ECS UpdateService는 환경별 TaskDefinition family ARN 조건도 제한하며 호출 시 명시적 revision ARN을 전달해야 한다. 승인된 digest / runtime Role / Desired Count 2 / rolling 최대 4개를 배포 입력 검증으로 확인한다. IAM의 Service ARN만으로 CPU / desiredCount / Image digest 변경을 통제할 수는 없으므로 임의 변경은 승인 범위 밖이다. 승인 Template / 고정 Artifact 검증 없이 Change Set이나 배포를 수행하지 않는다.

## 5. OIDC / Environment / Artifact 흐름

OIDC Provider는 GitHub 발급자, audience는 sts.amazonaws.com이다. StringEquals subject는 환경별로 정확한 Repository와 staging 또는 production을 고정한다. 다른 Repository / environment / PR 기본 subject / branch 기본 subject는 불일치로 거부된다. Environment subject에는 branch가 없으므로 IAM Trust만으로 다른 Branch 거부를 보장하지 않는다. GitHub Environment main-only 정책과 Workflow의 main 검사를 함께 적용한다.

Production 배포 Workflow는 main에서 실행하되 Human이 승인한 DEC-025 Release Tag가 가리키는 검증된 main Commit의 기존 digest / 정적 artifact를 선택한다. Tag를 Deployment Branch 허용 목록에 넣지 않는다. main에서 임의 digest를 선택하는 것도 금지하며 Release / Commit / artifact hash / CI 근거를 Human 승인에 연결한다. Workflow 구현과 release artifact 승격은 TASK-029 / TASK-030의 승인 범위다.

| 설정 | staging | production |
|---|---|---|
| Deployment Branch | selected main만, Tag 없음 | selected main만, Tag 없음 |
| Required Reviewer | 초기 Human 지정 제안, 자동화 전환은 TASK-029 Gate | Human 1명 필수, 모든 배포 / rollback |
| prevent self-review | 단일 Human이므로 비활성 | 단일 Human이므로 비활성 |
| 관리자 Bypass | 비활성 | 비활성 |
| Role Session | 요청 900초, 최대 3600초 | 요청 900초, 최대 3600초 |
| 장기 AWS Key | 저장 금지 | 저장 금지 |

단일 Human이 Workflow를 실행하고 승인할 수 있으며 Repository owner는 설정을 변경할 수 있다. 이는 2인 분리 통제가 아닌 잔여 위험이다. Agent는 Environment 승인 / Bypass / Reviewer 제거 / Trust 변경을 하지 않는다. Human이 실제 배포 diff / SHA / digest를 확인하고 직접 승인하며 GitHub Environment 승인 기록을 보존한다. 보호 설정이 없거나 지원되지 않으면 Production Role을 사용하지 않고 HUMAN_REQUIRED다.

향후 Workflow 권한은 deploy job에만 id-token write, contents read를 제안한다. Environment 보호를 통과한 job만 AWS Role을 사용한다. PR / fork / pull_request_target에서 배포 Role을 사용하지 않는다. Action은 검토된 commit으로 고정하고 Role session name에 비민감 GitHub Run ID / attempt를 사용한다.

Image build는 깨끗한 checkout의 실제 full Commit SHA를 VCS_REF 필수 값으로 전달하고 sha-commit Tag / OCI revision / digest를 검증한다. ECR immutable은 Human / IaC가 구성하고 deploy Role에는 변경 권한을 주지 않는다. 배포는 digest 고정 Task revision을 등록하고 해당 Service만 갱신한다. CI는 DB credential을 읽지 않는다. 정적 artifact는 hash 대조 후 전용 S3에 업로드하고 invalidation한다. S3 삭제가 없으므로 기존 hashed asset은 남고 정리는 별도 승인 정책으로 처리한다.

## 6. 앱 비밀 / KMS / 감사

DB 값은 환경별 Secrets Manager에 Human이 관리하고 ECS execution role이 시작 시 환경변수로 주입한다. CI / 로컬 Agent / task role에는 조회 권한이 없다. 재배포로 새 값을 주입하고 기존 연결 종료 / readiness를 확인하는 절차는 실제 배포 Task에서 검증한다. 자동 rotation / 고객 관리 KMS 추가 / DB 관리자 및 Migration 권한은 별도 Gate다. 기본 AWS 관리 암호화에는 초안에서 kms:Decrypt를 추가하지 않는다. 고객 관리 Key가 필요해지면 정확한 Key ARN / service 경유 / encryption context 조건을 재검토한다.

CloudFront origin 검증 header는 환경별로 Human이 생성·보관·교체한다. 구성 API / Template / Change Set / State에 값이 노출될 수 있으므로 Agent / CI에게 해당 구성 조회나 raw Template 출력을 허용하지 않는다. DB 값과 origin header를 Source / Vite / artifact / Prompt / 인자 / Log에 넣지 않는다. origin 설정 적용은 TASK-026 / TASK-027의 승인된 Human 경로에서 수행한다.

CloudTrail 기존 관리 이벤트를 Human이 확인하고 새 유료 Trail / S3 보존 저장소는 비용 승인 없이 생성하지 않는다. 로컬 Log는 Run ID, UTC 시작·종료, Profile alias, Task / 승인 Diff 참조, 명령 종류 / 종료 코드만 저장한다. 실제 identity 응답과 credential은 저장하지 않는다. CI는 Run / attempt, environment, Commit / digest, 승인 근거, 비민감 결과를 남긴다. 조회 metadata에도 환경 식별값이 있을 수 있어 출력은 저장 전에 제거한다. CloudTrail 원본은 Human 통제 AWS에서 유지하고 Agent Prompt로 전달하지 않는다. Run Log 30일 보존과 정리는 Human / 승인된 운영 도구가 담당하며 이 Task는 삭제 도구를 만들지 않는다.

## 7. 검증과 후속 실행

A단계 참고 검증은 JSON 파싱, 환경별 Resource / Trust 구조 검토, UTF-8 / 손상 문자 / 민감 할당 표기 검사, git diff --check와 Contract Node Test다. 이는 AWS IAM 평가 / 실제 GitHub 보호 Test를 대신하지 않는다.

B단계 Fake CLI Test는 허용 Profile 성공, 관리자 / 미지정 Profile, 계정 / 정확한 Role 불일치, 만료 / 조회 실패, 다른 자격 증명 공급원, 쓰기 전 재확인 실패 및 민감 응답 비저장을 다룬다. Human이 실제 최소 권한 Profile 및 Hosted Zone 계정 확인을 마친다.

적용 전 Human은 렌더링 정책의 Access Analyzer / 유효 권한을 확인한다. 다른 Repository / audience / environment / PR subject 거부, main 외 Branch / Tag의 Environment 차단, Staging으로 Production Service / ECR / S3 / runtime Role 변경 거부, IAM 쓰기 / DB 값 조회 거부, Production 승인 대기 / Bypass 불가를 확인한다. 부정 검증에서 실제 Production 변경을 실행하지 않고 정책 평가 / 승인 대기를 사용한다. 실환경 성공을 A단계에서 주장하지 않는다.

DEC-029 승인 → B단계 Contract 확대 / 명시 실행 → Preflight 구현 및 Human 설정 → 검증 / Review → TASK-025 DONE 및 TASK-026 READY 완료 반영 → Human Squash Merge 순서를 유지한다. DNS 위임 복구 / hostname / MySQL 호환 / Region 가용성 / 상세 비용 조회는 이미 정해진 후속 Task 조건이며 이번 Gate의 새 결정 항목이 아니다.

## 8. 공식 근거 (2026-10-03 조회)

- [AWS GitHub OIDC Trust 조건](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html): audience / subject와 Repository 제한.
- [GitHub Environment 보호 규칙](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments): Branch 정책 / Required Reviewer / self-review / 관리자 Bypass.
- [GitHub 배포 승인](https://docs.github.com/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-deployments/reviewing-deployments): Human 승인과 Bypass 비활성.
- [CloudFormation service role](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-servicerole.html): Stack에 연결된 Role의 사용 위험.
- [AWS PassRole](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_passrole.html): 정확한 Role과 서비스 제한.
- [ECS 권한 표](https://docs.aws.amazon.com/service-authorization/latest/reference/list_ecs.html): RegisterTaskDefinition family 범위 및 DescribeTaskDefinition 전체 Resource 예외.

이 문서의 Permission Set 범위 / duration / 보존 기간은 위 공식 기능을 사용한 설계 제안이며 Human 승인 전 확정 정책이 아니다.
