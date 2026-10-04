# 15. AWS Access Policy — TASK-025 A / B단계

2026-10-03 Human Approved (DEC-029). Run 2 Claude PASS 설계안(Commit `1d56112`)을 권장안대로 모두 승인했다. B단계는 Preflight 구현 / Fake CLI 검증이며 실제 AWS / GitHub 설정과 Resource 생성은 수행하지 않았다. TASK-025 DONE / TASK-026 READY는 PR 완료 반영이며 Human Squash Merge로 확정한다. TASK-026 실행 전 Human Permission Set / Profile 구성과 실제 Preflight 확인이 필요하다.

## TASK-026 IaC 표현

승인된 정책 초안은 infra/iam/을 기준으로 유지하고 infra/cloudformation/iam.yaml은 Fn::Sub 기반 배포 표현으로 추가했다. RepositoryArn / AccountId 이름을 통일하고 환경별 deploy Role, execution / task Role, Staging 앱 Change Set Role을 분리했다. task Role에 앱 AWS 권한을 추가하지 않는다. OIDC Provider는 기존 ARN 참조 또는 최초 생성 조건을 사용하며 중복 생성하지 않는다. Identity Center / Permission Set은 Human 관리 영역이다. 자세한 Parameter와 적용 전 검토는 [17-AWS-IAC-FOUNDATION.md](17-AWS-IAC-FOUNDATION.md)를 따른다. 실제 IAM 적용은 수행하지 않았다. TASK-026 read-only 검증에 필요한 조회 Action은 Human이 Contract대로 별도 프로비저닝하며 Template로 권한을 확대하지 않는다. 일반 Stack service role의 SourceAccount / SourceArn 조건 확인은 최초 적용 전 유지하며 조건 제거로 우회하지 않는다.

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
| Session | Permission Set 1시간, CI STS 요청 3600초 / Role 최대 3600초, Build 이후 취득, Identity Center 로그인 Session 8시간 제안 | Push / ECS 안정화 / smoke 시간을 확보하는 미실측 상한 제안. 만료 시 자동 재취득 / 재시도 금지, 부분 배포를 Human이 확인. 로그인 Session과 Role Session은 별개이며 로컬 Run 최대 1시간 제한 |
| 감사 | CloudTrail과 비민감 로컬 Run / GitHub Run 기록 대조, 30일 Run 기록 보존 제안 | SSO Human Identity만으로 Agent를 구분할 수 없음. Run ID / UTC / 명령 종류 / 승인 참조와 CloudTrail event 시각을 대조 |
| 앱 비밀 / 암호화 | 환경별 Secrets Manager, ECS execution role만 DB 값 주입. AWS 관리 암호화 / S3 SSE-S3 기본, 고객 관리 KMS는 초기 제외 | 사용자 정의 KMS 추가는 비용 / Key Policy 재승인. origin 검증 header는 Human이 환경별 관리하고 Agent / CI 조회 금지 |

위 Matrix는 2026-10-03 Human이 권장안대로 승인했다. 더 넓은 권한이나 Session은 재승인한다.

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

TASK-027 / DEC-031은 Data Stack이 무작위 생성한 자격 증명 ARN을 IAM execution Role과 App에 동일하게 전달하도록 연결한다. 기존 조회 Statement / Action / Resource 범위는 변경하지 않는다. Staging의 관리자 계정 사용만 승인된 예외이며 Production 전 TASK-030에서 최소 권한 앱 / migration 계정을 분리한다. Origin 검증 입력은 app / frontend의 NoEcho Parameter를 사용하며 예시에 포함하지 않는다. NoEcho가 Listener / Distribution 조회 응답까지 가리지는 않으므로 Human의 보호 입력 경로와 Agent / CI 값 출력 금지를 유지한다. Role / Log Group의 단일 소유권과 최초 생성 순서는 [17번 문서](17-AWS-IAC-FOUNDATION.md)를 따른다.

모든 `${...}` 값은 **외부 치환 Parameter**이며 그대로 AWS에 제출할 수 없다. IAM policy variable 자동 해석이나 CloudFormation Template로 간주하지 않는다. 실제 값은 Human이 비추적 로컬 입력에서 제공하고 적용 전 렌더링 정책을 검토한다. Repository의 파일에는 실제 값이 없다.

| 파일 | 적용 주체 / 범위 |
|---|---|
| readonly-permission-set.json | STS 자기 식별, 기존 Staging 앱 Stack / ECS Service / ECR 메타데이터 |
| staging-permission-set.json | Staging ECR Push / S3 정적 객체 업로드 / CloudFront invalidation / ECS Service 갱신, 제한된 앱 Change Set |
| staging-oidc-trust.json / production-oidc-trust.json | 각 CI deploy Role의 Trust, 정확한 environment와 audience |
| staging-deploy-policy.json / production-deploy-policy.json | Staging만 공용 ECR에 Push, Production은 동일 Repository 이미지 조회만. S3 / CloudFront / ECS / runtime Role PassRole은 환경별 |
| staging-app-changeset-role-policy.json | 기존 앱 Stack 전용 CloudFormation service role. Staging Service 갱신 / 해당 family revision 등록 |
| staging-app-changeset-role-trust.json | CloudFormation 서비스만 AssumeRole, SourceAccount / 정확한 Staging 앱 Stack SourceArn 조건, Agent 직접 AssumeRole 없음 |
| ecs-runtime-role-trust.json | 환경별 execution / task Role Trust, SourceAccount 정확히 지정 / SourceArn 해당 계정의 서울 ECS 범위 |
| ecs-execution-role-policy.json | 환경별 별도 인스턴스, ECR Pull / 사전 생성 Log Group stream 쓰기 / 해당 DB credential 읽기 |

Parameter 검토 규칙:

- RepositoryOwner / RepositoryName / GitHubOidcProviderArn은 승인 Repository와 해당 계정 Provider 하나다. owner / repo / subject wildcard는 금지한다.
- RepositoryOwnerId / RepositoryId는 필수 String Parameter이며 AllowedPattern `[0-9]+`로 숫자만 허용하고 빈 값은 거부한다. 기존 이름 Parameter와 Pattern은 유지한다. Human 또는 승인된 Claude 세션은 `gh api repos/<owner>/<repository>`의 `owner.id` / `id`를 각각 확인해 Git 비추적 로컬 Parameter 파일에만 넣는다. 실제 ID와 응답 원문은 출력·추적 문서·Agent 입력에 남기지 않는다. 예시 파일의 Placeholder는 적용 전에 교체한다.
- RepositoryArn은 Staging에서 검증하고 Production이 참조하는 단일 immutable ECR Repository의 정확한 ARN이다. ProductionRepositoryArn은 사용하지 않는다. ServiceArn, ClusterArn, StaticBucketArn, DistributionArn, ExecutionRoleArn, TaskRoleArn은 환경별 전용 Resource의 정확한 ARN이다. Production 값을 Staging Parameter에 넣지 않는다.
- ecs-execution-role-policy.json도 같은 RepositoryArn을 사용한다. execution role은 공용 이미지 Pull만, Log / DB credential은 환경별 범위를 유지한다.
- StaticObjectArn은 해당 정적 Bucket의 객체 범위만 나타낸다. Revision family Pattern은 해당 환경의 승인된 family에 revision suffix wildcard만 허용한다. StackArn은 기존 앱 전용 Stack의 정확한 ARN이며 공용 Infrastructure Stack을 지정하지 않는다.
- EnvironmentLogStreamArnPattern은 해당 Log Group의 stream suffix만 허용한다. AppDbCredentialArn은 전체 ARN을 단일 Parameter로 받는다. 값 / literal credential ARN 표기는 문서에 넣지 않는다.
- AWS Region / 계정 wildcard와 환경 공용 Resource wildcard는 금지한다. CloudFront는 global ARN이다. 런타임 정책은 환경별 렌더링하며 task role은 앱 AWS 호출이 없으므로 빈 권한을 유지한다.

Resource 전체 wildcard 예외는 STS 자기 식별, ECR 인증, ECS DescribeTaskDefinition이다. 앞의 두 API와 task definition 조회는 Resource별 권한을 지원하지 않는다. 조회에는 계정 내 다른 task definition 메타데이터도 노출될 수 있으므로 정의에 민감한 값을 직접 넣지 않는다. ECR 인증만으로 다른 Repository Push / Pull을 허용하지 않는다. Action wildcard는 쓰지 않는다. RegisterTaskDefinition은 현재 공식 권한 표에 따라 환경 family ARN으로 제한한다.

Agent Profile과 CI Role에는 RDS / VPC / ALB / DNS / ACM / KMS 관리, IAM 쓰기, Role chaining, DB 값 읽기, CloudFront 구성 수정, S3 / ECR 삭제, ECS Exec / RunTask, Stack 삭제 권한을 주지 않는다. CI의 iam:PassRole은 해당 환경의 두 ECS runtime Role과 ecs-tasks 서비스에만 허용한다. Staging SSO는 Task revision을 등록하지 않으므로 runtime PassRole이 없고, 정확한 앱 Change Set Role과 cloudformation 서비스에 대한 PassRole만 갖는다. Production ECS / S3 / runtime Role 변경은 Staging 허용 ARN에 포함되지 않아 implicit deny다. 공용 ECR의 기존 immutable 이미지 변경·삭제는 금지되지만 Staging은 새 이미지를 게시할 수 있어 Production digest 선택 검증이 필수다. 실제 추가 정책 / Resource Policy / Boundary를 포함한 유효 권한 검증이 필요하며 초안만으로 적용된 차단을 주장하지 않는다.

CloudFormation Trust는 AccountId와 StagingAppStackArn을 필수 조건으로 추가한다. 일반 Stack service role AssumeRole에서 이 context가 전달되는지는 적용 전 Human이 확인해야 한다. 공식 confused-deputy 예제는 Registry / StackSets 중심이므로 일반 Stack 지원을 확인한 것으로 주장하지 않는다. 조건이 전달되지 않으면 fail closed로 중단하고 조건 삭제 / IfExists 우회 없이 별도 정책 재검토를 받는다.

CloudFormation은 기존 앱 Stack의 UPDATE Change Set만 제안한다. CreateChangeSet에는 정확한 RoleArn과 ResourceTypes 목록을 필수로 전달하고 ECS Service / TaskDefinition 두 종류만 허용한다. ExecuteChangeSet은 API에 Role 전달을 요구하지 않고 정확한 Stack을 제한한다. Human이 Stack에 전용 최소 권한 service role이 연결되어 있고 다른 관리자 service role / 기존 과권한 Change Set이 없음을 확인한 뒤 활성화한다. Agent가 Stack 접근으로 연결된 Role을 사용할 수 있으므로 PassRole 제한만으로 기존 과권한 Role 사용을 막는다고 주장하지 않는다.

초안 service role은 Service 생성·삭제, Task revision 해제·삭제를 허용하지 않는다. CloudFormation 교체 / cleanup / rollback에서 추가 API가 필요하면 실패를 숨기지 않고 별도 권한 검토를 한다. 최초 Infrastructure 생성 / Network / RDS Change Set 정책은 TASK-026 / TASK-027의 구체적 IaC Diff와 비용 Gate에서 확정한다. 이 초안은 전체 Infrastructure provisioning 정책이 아니다.

ECS UpdateService는 환경별 TaskDefinition family ARN 조건도 제한하며 호출 시 명시적 revision ARN을 전달해야 한다. 승인된 digest / runtime Role / Desired Count 2 / rolling 최대 4개를 배포 입력 검증으로 확인한다. IAM의 Service ARN만으로 CPU / desiredCount / Image digest 변경을 통제할 수는 없으므로 임의 변경은 승인 범위 밖이다. 승인 Template / 고정 Artifact 검증 없이 Change Set이나 배포를 수행하지 않는다.

## 5. OIDC / Environment / Artifact 흐름

TASK-038 Human 승인(2026-10-04)에 따라 immutable subject를 사용한다. Staging은 `repo:${RepositoryOwner}@${RepositoryOwnerId}/${RepositoryName}@${RepositoryId}:environment:staging`, Production은 `repo:${RepositoryOwner}@${RepositoryOwnerId}/${RepositoryName}@${RepositoryId}:environment:production`이다. 각 Role은 StringEquals로 해당 값 하나만 비교한다. 이름 형식 subject를 함께 허용하거나 StringLike / wildcard로 완화하지 않는다.

OIDC Provider는 GitHub 발급자, audience는 sts.amazonaws.com이다. StringEquals subject는 환경별로 정확한 Repository와 staging 또는 production을 고정한다. 다른 Repository / environment / PR 기본 subject / branch 기본 subject는 불일치로 거부된다. Environment subject에는 branch가 없으므로 IAM Trust만으로 다른 Branch 거부를 보장하지 않는다. GitHub Environment main-only 정책과 Workflow의 main 검사를 함께 적용한다.

Production 배포 Workflow는 main에서 실행하되 Human이 승인한 DEC-025 Release Tag가 가리키는 검증된 main Commit의 기존 digest / 정적 artifact를 선택한다. Tag를 Deployment Branch 허용 목록에 넣지 않는다. main에서 임의 digest를 선택하는 것도 금지하며 Release / Commit / artifact hash / CI 근거를 Human 승인에 연결한다. Workflow 구현과 release artifact 승격은 TASK-029 / TASK-030의 승인 범위다.

| 설정 | staging | production |
|---|---|---|
| Deployment Branch | selected main만, Tag 없음 | selected main만, Tag 없음 |
| Required Reviewer | 초기 Human 지정 제안, 자동화 전환은 TASK-029 Gate | Human 1명 필수, 모든 배포 / rollback |
| prevent self-review | 단일 Human이므로 비활성 | 단일 Human이므로 비활성 |
| 관리자 Bypass | 비활성 | 비활성 |
| Role Session | Build 이후 요청 3600초, 최대 3600초 | 기존 Artifact 확인 / Human 승인 이후 요청 3600초, 최대 3600초 |
| 장기 AWS Key | 저장 금지 | 저장 금지 |

단일 Human이 Workflow를 실행하고 승인할 수 있으며 Repository owner는 설정을 변경할 수 있다. 이는 2인 분리 통제가 아닌 잔여 위험이다. Agent는 Environment 승인 / Bypass / Reviewer 제거 / Trust 변경을 하지 않는다. Human이 실제 배포 diff / SHA / digest를 확인하고 직접 승인하며 GitHub Environment 승인 기록을 보존한다. 보호 설정이 없거나 지원되지 않으면 Production Role을 사용하지 않고 HUMAN_REQUIRED다.

향후 Workflow 권한은 deploy job에만 id-token write, contents read를 제안한다. Environment 보호를 통과한 job만 AWS Role을 사용한다. PR / fork / pull_request_target에서 배포 Role을 사용하지 않는다. Action은 검토된 commit으로 고정하고 Role session name에 비민감 GitHub Run ID / attempt를 사용한다.

Image build는 깨끗한 checkout의 실제 full Commit SHA를 VCS_REF 필수 값으로 전달하고 sha-commit Tag / OCI revision / digest를 검증한다. ECR immutable은 Human / IaC가 구성하고 deploy Role에는 변경 권한을 주지 않는다. 배포는 digest 고정 Task revision을 등록하고 해당 Service만 갱신한다. CI는 DB credential을 읽지 않는다. 정적 artifact는 hash 대조 후 전용 S3에 업로드하고 invalidation한다. S3 삭제가 없으므로 기존 hashed asset은 남고 정리는 별도 승인 정책으로 처리한다.

승격 모델은 단일 ECR Repository다. Staging CI deploy Role(또는 승인된 Staging SSO 게시 Task)만 RepositoryArn에 새 immutable sha-commit 이미지를 Push한다. Production deploy Role은 같은 Repository의 BatchGetImage / DescribeImages로 검증된 기존 digest를 조회하며 ECR 인증 / Push / 복사 / 재빌드 권한이 없다. 두 환경 ECS execution role이 같은 Repository에서 Pull한다. Production은 Staging 검증 기록의 동일 digest만 Task Definition에 사용한다. 정적 Artifact는 Staging 검증 hash와 동일한 기존 산출물을 Production S3에 업로드한다. 환경별 ECS / DB / S3 / Role 분리는 유지하며 ECR만 Artifact 공유 대상으로 제안한다.

CI는 AWS 권한 없는 Build / 로컬 검증을 먼저 마친 후 Environment 승인과 배포 입력 확인을 통과하고 OIDC 자격을 취득한다. 요청 3600초는 Push / Task revision 등록 / rolling 안정화 / smoke와 확인 시간을 확보하기 위한 제안이며 실제 소요 시간은 미측정이다. 전체 배포 deadline은 Session 만료보다 짧게 설정하고 실제 여유는 Workflow Task에서 검증한다. 만료 / 시간 부족 / 인증 실패 시 자동 재취득·재시도 없이 중단한다. Human은 기존 GitHub Run과 CloudTrail / 승인된 조회 경로로 Push digest, 현재 Service revision, rollout 상태, S3 hash / invalidation 등 부분 반영을 확인하고 재실행 또는 rollback의 구체적 범위를 승인한다. Production rollback에도 새 Environment 승인이 필요하다.

## 6. 앱 비밀 / KMS / 감사

DB 값은 환경별 Secrets Manager에 Human이 관리하고 ECS execution role이 시작 시 환경변수로 주입한다. CI / 로컬 Agent / task role에는 조회 권한이 없다. 재배포로 새 값을 주입하고 기존 연결 종료 / readiness를 확인하는 절차는 실제 배포 Task에서 검증한다. 자동 rotation / 고객 관리 KMS 추가 / DB 관리자 및 Migration 권한은 별도 Gate다. 기본 AWS 관리 암호화에는 초안에서 kms:Decrypt를 추가하지 않는다. 고객 관리 Key가 필요해지면 정확한 Key ARN / service 경유 / encryption context 조건을 재검토한다.

CloudFront origin 검증 header는 환경별로 Human이 생성·보관·교체한다. 구성 API / Template / Change Set / State에 값이 노출될 수 있으므로 Agent / CI에게 해당 구성 조회나 raw Template 출력을 허용하지 않는다. DB 값과 origin header를 Source / Vite / artifact / Prompt / 인자 / Log에 넣지 않는다. origin 설정 적용은 TASK-026 / TASK-027의 승인된 Human 경로에서 수행한다.

CloudTrail 기존 관리 이벤트를 Human이 확인하고 새 유료 Trail / S3 보존 저장소는 비용 승인 없이 생성하지 않는다. 로컬 Log는 Run ID, UTC 시작·종료, Profile alias, Task / 승인 Diff 참조, 명령 종류 / 종료 코드만 저장한다. 실제 identity 응답과 credential은 저장하지 않는다. CI는 Run / attempt, environment, Commit / digest, 승인 근거, 비민감 결과를 남긴다. 조회 metadata에도 환경 식별값이 있을 수 있어 출력은 저장 전에 제거한다. CloudTrail 원본은 Human 통제 AWS에서 유지하고 Agent Prompt로 전달하지 않는다. Run Log 30일 보존과 정리는 Human / 승인된 운영 도구가 담당하며 이 Task는 삭제 도구를 만들지 않는다.

## 7. 검증과 후속 실행

B단계 구현 결과: Contract aws_profiles가 없거나 비어 있으면 기존 동작을 유지한다. Preflight와 각 Verify 명령 직전 명시적 Profile로 STS를 호출하고 정확한 Account / assumed-role Role 이름을 비교한다. 관리자 / 금지 Profile, 대체 자격 증명 공급원, 기대값 없음 / 만료 / 조회 실패 / Timeout / 불일치는 HUMAN_REQUIRED로 정지한다. 실제 AWS CLI를 실행하지 않고 Fake CLI로 검증했다.

로컬 aws 설정의 기대값과 응답 stdout / stderr는 기록하지 않는다. frozen.json에서도 aws 설정을 제외하며 Resume 시 로컬에서 다시 읽는다. Executor / Reviewer에는 Contract의 허용 Profile alias만 전달한다. Run 기록은 alias / 일치 여부 / UTC / 사유 종류만 남긴다. 초기 Human 구성 정책은 sts:GetCallerIdentity만 허용하고 전체 Resource Parameter 렌더링 / IAM 적용과 OIDC / Environment 생성은 TASK-026 이후 Gate에서 수행한다. RepositoryArn은 두 환경의 단일 공용 ECR, AccountId는 같은 MoodFit 계정으로 통일했다.

A단계 참고 검증은 JSON 파싱, 환경별 Resource / Trust 구조 검토, UTF-8 / 손상 문자 / 민감 할당 표기 검사, git diff --check와 Contract Node Test다. 이는 AWS IAM 평가 / 실제 GitHub 보호 Test를 대신하지 않는다.

B단계 Fake CLI Test는 허용 Profile 성공, 관리자 / 미지정 Profile, 계정 / 정확한 Role 불일치, 만료 / 조회 실패, 다른 자격 증명 공급원, 쓰기 전 재확인 실패 및 민감 응답 비저장을 다룬다. Human이 실제 최소 권한 Profile 및 Hosted Zone 계정 확인을 마친다.

적용 전 Human은 렌더링 정책의 Access Analyzer / 유효 권한을 확인한다. 다른 Repository / audience / environment / PR subject 거부, main 외 Branch / Tag의 Environment 차단, Staging으로 Production Service / ECR / S3 / runtime Role 변경 거부, IAM 쓰기 / DB 값 조회 거부, Production 승인 대기 / Bypass 불가를 확인한다. 부정 검증에서 실제 Production 변경을 실행하지 않고 정책 평가 / 승인 대기를 사용한다. 실환경 성공을 A단계에서 주장하지 않는다.

DEC-029 승인 → B단계 Contract 확대 / 명시 실행 → Preflight 구현 및 Human 설정 → 검증 / Review → TASK-025 DONE 및 TASK-026 READY 완료 반영 → Human Squash Merge 순서를 유지한다. DNS 위임 복구 / hostname / MySQL 호환 / Region 가용성 / 상세 비용 조회는 이미 정해진 후속 Task 조건이며 이번 Gate의 새 결정 항목이 아니다.

## 8. 공식 근거 (2026-10-03 조회)

- [AWS GitHub OIDC Trust 조건](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html): audience / subject와 Repository 제한.
- [GitHub Environment 보호 규칙](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments): Branch 정책 / Required Reviewer / self-review / 관리자 Bypass.
- [GitHub 배포 승인](https://docs.github.com/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-deployments/reviewing-deployments): Human 승인과 Bypass 비활성.
- [CloudFormation service role](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-servicerole.html): Stack에 연결된 Role의 사용 위험.
- [CloudFormation confused deputy 조건](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cross-service-confused-deputy-prevention.html): SourceAccount / SourceArn 예제는 Registry 중심이며 일반 Stack 적용은 별도 검증 필요.
- [AWS PassRole](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_passrole.html): 정확한 Role과 서비스 제한.
- [ECS 권한 표](https://docs.aws.amazon.com/service-authorization/latest/reference/list_ecs.html): RegisterTaskDefinition family 범위 및 DescribeTaskDefinition 전체 Resource 예외.

Permission Set 범위 / duration / 보존 기간은 2026-10-03 Human이 승인했다. 실제 적용 권한은 후속 Task Gate와 구체적 Diff에 연결한다.
# TASK-046 계정 간 LLM 호출 권한 추가

DEC-038 / Human Approved 2026-10-04 A안에 따라 환경별 ECS TaskRole에 LlmRoleArn 하나의 sts:AssumeRole 권한을 조건부 추가한다. 빈 값이면 권한을 추가하지 않으며 ExecutionRole은 유지한다. 다른 계정의 호출 Role은 해당 Task Role 하나만 신뢰하고 bedrock-mantle:CreateInference만 허용한다. Resource 모델 제한 형식은 확인 필요하여 승인 예시는 Resource *를 사용한다. API Key 없이 SigV4로 호출하며 비용은 호출 Role 계정에 청구된다.

Agent / Claude 세션은 다른 계정에 접근하거나 Role을 생성하지 않는다. 실제 ARN은 IAM Stack 출력에서 Human이 확인하고 비추적 입력에만 둔다. Production은 별도 실행 승인과 환경 분리를 유지한다. [LLM Infra 절차](24-LLM-INFRA.md)를 따른다.
