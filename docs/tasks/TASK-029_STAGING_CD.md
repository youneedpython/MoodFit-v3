# TASK-029 — Staging Continuous Deployment

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

`main`의 검증된 변경을 Staging에 자동 배포하는 CD Pipeline을 만든다. Staging은 정책상 자동 배포 가능한 환경으로 운영한다. (DEC-026 승인 범위)

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-028 Staging 수동 배포 PASS
- CD 동작 변경 Gate C Human Approved

## 인증

- GitHub Actions → GitHub OIDC → Staging Deploy Role (TASK-025)
- SSO / 장기 Access Key / Agent용 API Key를 사용하지 않는다.
- Agent는 이 Pipeline 안에서 실행되지 않는다.

## Codex 작업 범위

- CI PASS 이후 실행되는 `deploy-staging` Workflow
- Immutable Image Tag = Commit SHA
- ECR Push → ECS Task / Service 업데이트
- Frontend Build → S3 Sync / Upload → CloudFront Invalidation 또는 Version 전략
- IaC 변경은 Application 배포와 분리하거나 명시적 Change Set Gate 적용
- 배포 Concurrency 제어
- Smoke Test 자동 실행
- 실패 시 이전 안정 Revision으로 Rollback 가능한 절차
- Step Summary에 Commit / Image / Task Revision / Smoke 결과 기록 (DEC-021 Summary 방식과 일관)

## TASK-028에서 넘어온 입력 (2026-10-04, Claude 세션 기록)

- Staging이 동작한다: `https://staging.moodfit.8949db.kr`. Stack 이름은 `moodfit-staging-<network|ecr|data|certificate|frontend|iam|app|budget>`이다.
- IAM Stack이 GitHub OIDC Provider와 `StagingDeployRole`을 만들었다(Repository와 `staging` Environment subject 고정, DEC-029). Role ARN은 IAM Stack Output `StagingDeployRoleArn`이다. GitHub에는 아직 Environment / Variable이 없다.
- 배포 Role 권한(DEC-029): ECR Push, 정적 Bucket 업로드, CloudFront invalidation, Task Definition 등록(요청 Tag `MoodFitEnvironment` 필요, `app.yaml`에 Tag 추가됨), ECS Service 갱신, runtime Role PassRole.
- Image는 깨끗한 checkout의 full Commit SHA를 `VCS_REF`로 넣어 Build하고 `sha-<commit>` Tag(immutable)로 Push한다. ECS는 digest로 고정한다(DEC-028). 수동 절차는 `scripts/staging-image.sh` / `scripts/staging-frontend.sh`에 있다.
- 배포 후 확인은 `scripts/staging-smoke.sh`(자격 증명 불필요)를 쓴다.
- OIDC Session은 Build 이후에 얻고 3600초다. 만료 / 실패 시 자동 재시도하지 않는다(DEC-029).
- 앱 Change Set Role Trust의 Source 조건이 일반 Stack에서 동작하는지는 아직 확인되지 않았다.
- 기능 Task(TASK-035, TASK-036)가 Merge 대기 중이다. CD가 완성되면 이 Merge들이 첫 자동 재배포 검증이 된다. TASK-036은 Flyway `V2` Migration을 포함한다.

## Human 결정 (2026-10-04, Gate C 사전 승인) / 실행 기준

Human이 아래를 승인했다. 이 Run은 Gate 제안에서 멈추지 않고 구현까지 진행한다.

1. **실행 조건**: `main`의 CI Workflow(`ci.yml`)가 성공으로 끝나면 자동 실행한다(`workflow_run`, `main` push에서 온 실행만). 수동 실행(`workflow_dispatch`)도 지원하며 배포할 Commit SHA를 입력으로 받는다(재배포 / 롤백용). PR이나 fork에서 온 실행, `pull_request_target`에서는 배포하지 않는다.
2. **인증**: GitHub OIDC로 `StagingDeployRole`을 사용한다. 장기 AWS Access Key를 저장하지 않는다. Workflow 최상위 권한은 `contents: read`만 두고, 배포 Job에만 OIDC 발급 권한을 더한다. 자격 증명은 Build / Test가 끝난 뒤에 얻고 Session은 3600초다(DEC-029).
3. **배포 순서**: 배포 대상 Commit checkout → Backend bootJar → linux/amd64 Image Build(`VCS_REF` = full Commit SHA) → OIDC 자격 증명 → ECR 로그인 → `sha-<full SHA>` Tag로 Push(이미 같은 Tag가 있으면 덮어쓰지 않고 기존 digest를 사용) → 현재 Task Definition을 조회해 Image만 `repository@sha256:<digest>`로 바꾼 새 revision 등록(요청 Tag `MoodFitEnvironment=staging` 포함, 조회 응답의 읽기 전용 필드는 제거) → ECS Service를 새 revision으로 갱신 → 안정화 대기 → Frontend `npm ci` / Build → 정적 Bucket 업로드(asset 먼저, HTML은 no-cache, 삭제 동기화 없음) → CloudFront invalidation과 완료 대기 → `scripts/staging-smoke.sh` → Step Summary.
4. **GitHub Environment**: 배포 Job은 `environment: staging`을 쓴다. Environment는 `main` Branch만 허용하고 승인자 없이 자동 배포한다(DEC-026). Environment 생성과 값 등록은 Human 승인으로 Claude 세션이 수행한다.
5. **환경 값**: 다음 Environment Secret을 쓴다(이름 고정). Repository가 Public이라 Workflow 로그가 공개되므로 계정 식별값이 들어 있는 값은 Secret으로 가린다. AWS Access Key는 없다.
   - `AWS_DEPLOY_ROLE_ARN`: 배포 Role ARN
   - `ECR_REPOSITORY_URI`: ECR Repository 주소(Tag / digest 제외)
   - `STATIC_BUCKET_NAME`: 정적 Bucket 이름
   - `CLOUDFRONT_DISTRIBUTION_ID`: Distribution ID
   - 고정값은 Workflow에 직접 쓴다: Region `ap-northeast-2`, Cluster `moodfit-staging`, Service와 Task family `moodfit-staging-backend`, Container 이름은 `app.yaml`의 정의를 따른다, 사용자 URL `https://staging.moodfit.8949db.kr`.
   - Secret 값이 Step 출력 / Summary / Artifact에 나오지 않게 한다. Task Definition JSON, `aws` 응답 원문을 그대로 출력하지 않는다(계정 ID와 ARN이 들어 있다). Summary에는 Commit SHA, Image digest, Task revision 번호, 배포 / Smoke 결과만 쓴다.
6. **외부 Action**: `actions/checkout`, `actions/setup-node`, `actions/setup-java`(기존 CI와 같은 Version 표기)와 AWS 공식 Action 2개(`aws-actions/configure-aws-credentials`, `aws-actions/amazon-ecr-login`)를 쓴다. **AWS Action 2개는 Commit SHA로 고정**하고 주석으로 Version을 적는다. 정확한 SHA를 확인할 수 없으면 추측해서 쓰지 말고, 문서에 "확인 필요"로 남긴 뒤 `human_decisions_needed`로 보고한다(Claude 세션이 확인해 채운다). 그 밖의 외부 Action은 쓰지 않는다. DEC-021의 "추가 Action 미사용"은 이 범위에서 변경한다.
7. **동시 실행**: `concurrency` group을 두고 `cancel-in-progress: false`로 한다.
8. **실패 처리**: 자동 재시도하지 않는다. ECS는 Deployment Circuit Breaker가 이전 revision으로 되돌린다(TASK-027). 안정화 대기 실패 / Smoke 실패 시 Workflow를 실패로 끝내고 Summary에 실패 단계를 적는다. Session 만료 시 재취득하지 않는다. 롤백은 수동 실행에 이전 Commit SHA를 넣는 절차로 문서화한다(Image는 immutable Tag로 남아 있다). DB Migration은 롤백되지 않는다는 점을 적는다.
9. **Infra 변경 제외**: CloudFormation Stack 생성 / 갱신은 CD에 넣지 않는다. CD가 Task Definition을 Stack 밖에서 등록하므로 App Stack의 `BackendImage` Parameter와 실제 실행 Image가 달라진다(drift). App Stack을 갱신할 때 최신 digest를 넣는 절차를 문서에 적는다.

### 배포 Role 권한 (DEC-029, 변경 금지)

`RegisterTaskDefinition`(family ARN 범위, 요청 Tag 조건), `TagResource`(등록 시), `DescribeTaskDefinition`, ECR 인증 / Push / 조회, `DescribeServices` / `UpdateService`(해당 Service), runtime Role `PassRole`, 정적 Bucket `PutObject` / `GetObject` / `ListBucket`, CloudFront `CreateInvalidation` / `GetInvalidation`. **삭제 권한과 그 밖의 조회 권한은 없다.** Workflow는 이 권한 안의 API만 쓴다(예: `aws s3 sync --delete`, `ListTaskDefinitions`, `DescribeClusters`, CloudFormation 조회는 쓸 수 없다). 권한이 부족해 구현할 수 없는 단계가 있으면 IAM을 고치지 말고 `human_decisions_needed`로 보고한다.

### Codex 작업 범위

1. `.github/workflows/deploy-staging.yml` 작성(위 결정 1 ~ 9). Shell Step은 `set -euo pipefail`을 쓰고, 입력값(Commit SHA 등)은 env로 전달해 Script에 직접 끼워 넣지 않는다. 수동 실행의 SHA 입력은 40자리 16진수 형식을 검사하고 `main`에 포함된 Commit인지 확인한다.
2. `scripts/staging-smoke.sh`는 필요한 경우에만 최소로 고친다(CI에서 실행 가능한지 확인).
3. 문서: `docs/21-STAGING-CD.md`(동작, 필요한 GitHub 설정, Secret 목록, 수동 재배포 / 롤백 절차, drift 처리, 실패 대응, 한계), `docs/18` / `docs/17` / `docs/14` 관련 서술 갱신, 새 Decision(최신 번호 다음, Human Approved 2026-10-04)과 DEC-021 변경 이력.
4. 완료 반영: TASK-029 DONE / TASK-030 BLOCKED 유지("Production 생성 승인과 선행 기능 Task 후 READY") / AGENTS.md 3절 Current Task는 TASK-030 / BLOCKED. `docs/07`에 TASK-036(추천 5개 / 음악 재생, 개발 중)과 TASK-037(로고 / 파비콘, 예정)은 등록하지 않는다(Claude 세션이 Merge 때 정리).
5. Secret 검사: Contract에 OIDC 발급 권한 줄이 허용 문구로 승인되어 있다(Workflow의 `permissions` 아래에 쓰는 줄). 정확한 문구는 Workspace의 `harness/tasks/TASK-029.json`에서 읽어 그대로 쓴다. Executor 입력에서 가려져 보이는 것은 정상이다. 그 밖에 자격 증명 단어 뒤에 콜론 / 등호와 값이 오는 표기를 쓰지 않는다. ECR 로그인 Action의 출력(사용자 / 암호)을 직접 다루는 Step을 만들지 않는다(Action이 Docker 로그인을 처리한다).
6. Executor Sandbox에서는 Workflow를 실행할 수 없다. 실제 검증은 이 PR이 Merge된 뒤 첫 자동 배포다. 그래서 단순하고 방어적으로 쓰고, 각 Step에 이름을 붙여 실패 위치가 드러나게 한다.
7. 새로 Human 결정이 필요한 사항만 `human_decisions_needed`로 보고한다.

## Verification

최소 두 번의 Staging 배포로 반복 가능성을 확인한다. 실패 주입 또는 안전한 Mock으로 Rollback 경로를 검증한다.

## Claude Review 기준

- CI 실패가 배포를 Trigger하지 않는가
- `latest` Tag 단독 사용 금지
- 동시 배포 Race 방지
- Frontend / Backend Version 대응
- Rollback 대상 추적 가능
- Infra 변경과 App 배포의 경계
- OIDC Role 권한이 Staging에 한정되는가

## 완료 조건

`main`의 검증된 Commit이 Staging에 자동 배포되고 Smoke Test가 자동 PASS하는 것을 확인하면 REVIEW.
