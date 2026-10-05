# TASK-030 — Production Continuous Deployment / Approval / Rollback

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Staging에서 검증된 Release를 Production에 배포하되, **Human Approval을 반드시 거치는 Gated CD**를 만든다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-029 Staging CD 안정화
- Production Architecture / IAM / Environment 승인 완료

## Human Gate

- Production 배포는 항상 Human Approval이 필요하다. (GitHub Environment `production` Required Reviewer)
- 최초 Production Stack / Resource 생성도 별도로 승인한다. 최초 생성은 Human이 `MoodFitProductionAdmin` 권한으로 직접 수행하거나 승인한다. Agent는 Production Profile을 사용하지 않는다.
- 파괴적 DB Migration은 자동으로 진행하지 않는다.

## Release 연계 (DEC-025)

- Production 배포 단위는 Release Tag `v3.x.y`로 한다.
- 흐름 예: Staging 검증 → Human이 Tag / Release 생성 승인 → Tag의 Commit SHA에 해당하는 검증된 Image / Artifact를 Production으로 승격 → Environment 승인 → 배포
- Release 노트(`docs/releases/<tag>.md`)에 배포 결과를 연결한다.

## Codex 작업 범위

- GitHub `production` Environment 기반 승인 Gate
- Staging에서 검증된 동일 Image / Artifact 승격 (재Build 금지)
- Production 전용 설정 / Secret Reference
- 배포 Concurrency / Locking
- 배포 전 점검
- 배포 후 Smoke Test
- Health / Smoke 실패 시 자동 또는 승인된 Rollback
- 배포 Audit Trail (Tag, Commit SHA, Image Digest, 승인자, 시각)

## Production Safety

- `latest` 재Build 대신 검증된 Artifact 승격
- Production DB 삭제 금지
- Schema Destructive Change 감지 시 `HUMAN_REQUIRED`
- Rollback이 DB Schema와 충돌할 수 있으면 자동 Rollback 금지 후 Human Escalation

## Human 결정 (2026-10-05, Production 생성 / 비용 / 배포 방식 Gate)

Claude 세션이 낸 Gate 제안을 Human이 승인했다("1. 승인 2. 가 3. 오늘 작업 후 모두 정리").

1. **구성**: Staging과 같은 Template과 크기(가용 영역 2개, Fargate Task 2개, RDS Multi-AZ, NAT Gateway 2개). 같은 AWS 계정에 `moodfit-production-…` Stack으로 따로 만든다. VPC 대역은 Staging(`10.40.0.0/16`)과 겹치지 않게 `10.50.0.0/16`을 쓴다.
2. **주소**: `https://moodfit.8949db.kr`, 원본은 `origin.moodfit.8949db.kr`.
3. **비용**: 운영 2일 이내, 추가 비용 USD 30 이내. Production에도 비용 알림(Budget)을 건다.
4. **배포 방식**: 자동 배포 없음. `workflow_dispatch`로 사람이 시작하고, GitHub Environment `production`의 승인자(Human)가 승인해야 진행한다. **Staging에서 검증한 Container Image를 다시 Build하지 않고 그대로** 올린다.
5. **Stack 생성**: Human이 Claude 세션에 범위를 정해 맡긴다(Staging 때와 같은 방식. Change Set을 만들고, 내용을 확인하고, 실행한다). **삭제는 별도 승인**이다.
6. **Data**: Production DB는 빈 상태로 시작한다.
7. **기간**: 오늘 작업(생성 → 배포 → 확인 / 영상) 뒤 Staging과 Production을 모두 정리한다(TASK-031, 별도 승인).

이 결정으로 위 "Human Gate"의 "최초 생성은 Human이 `MoodFitProductionAdmin` 권한으로 직접 수행하거나 승인한다. Agent는 Production Profile을 사용하지 않는다"는 다음과 같이 적용한다: 별도의 Production Profile은 없고(Staging과 같은 계정, 같은 관리 권한), Human의 명시적이고 범위가 정해진 위임 아래 Claude 세션이 Production Stack의 Change Set을 만들고 실행한다. Executor(Codex)는 AWS를 호출하지 않는다.

8. **검사 예외 문자열**: 배포 Workflow의 OIDC 권한 줄(`id-token` 쓰기 권한, TASK-029 / 039 / 050에서 승인한 것과 같은 문자열)을 이 Task의 비밀 값 검사 예외로 두는 것을 Human이 승인했다(2026-10-05 "승인!"). Contract의 `secret_scan_allow`에 그 한 줄만 둔다.

## 설계 (실행 기준, 2026-10-05)

이 Task의 Executor 작업은 **파일을 만드는 것**이다. AWS Resource를 만들거나 배포하지 않는다(그것은 Merge 뒤 Claude 세션과 Human이 Runbook대로 한다).

### 현재 구조 (Claude 세션 확인)

- `infra/cloudformation/*.yaml` 8개 가운데 `budget.yaml`만 `Environment`가 `staging`만 허용한다. 나머지 7개는 `production`을 받는다.
- `iam.yaml`은 `Environment=production`일 때 Production 배포 Role을 만든다. 신뢰 주체는 `repo:{owner}@{ownerId}/{repo}@{repoId}:environment:production`이다. 이 Role의 ECR 권한은 **읽기뿐**이다(`ecr:BatchGetImage`, `ecr:DescribeImages` — `RepositoryArn` Parameter의 저장소). 즉 설계상 **Production은 Staging과 같은 ECR 저장소의 같은 Image를 읽는다.** Production용 ECR Stack은 만들지 않는다(Stack은 network / data / certificate / frontend / iam / app / budget 7개).
- `scripts/staging-changeset.sh`: Stack 이름 `moodfit-staging-{kind}`, Parameter 파일 `infra/cloudformation/local/{kind}.parameters.json`(Git에 없는 Local 파일), `Environment == staging`과 Hostname을 검사하고, 실행 전에 `EXECUTE {stack} {changeset}`을 입력받는다. AWS 오류 원문은 출력하지 않는다(식별 값이 섞일 수 있다).
- `.github/workflows/deploy-staging.yml`: `environment: staging`, OIDC, Backend Test → Image Build → ECR Push(Tag는 Commit SHA, 덮어쓰기 불가) → Task Definition 등록 → Service 갱신 → 15초 간격 대기 판정 → Frontend Build / S3 Upload → CloudFront Invalidation → `scripts/staging-smoke.sh` → Summary. 문서만 바뀐 Commit은 `classify` Job이 배포를 건너뛴다. 그래서 **모든 `main` Commit에 Image가 있는 것은 아니다.**
- `scripts/staging-smoke.sh`: 주소가 `https://staging.moodfit.8949db.kr`로 고정되어 있다.

### 1. `scripts/production-changeset.sh` (새 파일)

`staging-changeset.sh`와 같은 구조와 안전장치를 쓴다. 다른 점만 적는다.

- 허용 Stack 종류: `network`, `data`, `certificate`, `frontend`, `iam`, `app`, `budget`(`ecr` 없음).
- Stack 이름: `moodfit-production-{kind}`.
- Parameter 파일: `infra/cloudformation/local/production/{kind}.parameters.json`(Git에 없는 Local 파일이어야 한다. 추적 중이면 거부).
- 검사: `Environment == production`, `OriginHostname == origin.moodfit.8949db.kr`, `ViewerHostname == moodfit.8949db.kr`, `network`의 `VpcCidr`가 `10.40.0.0/16`이 아님, 자리 표시(`<…>`)가 남아 있지 않음, `app` / `frontend`의 `OriginVerificationValue` 길이 32 이상.
- Profile: 비어 있거나 `moodfit-readonly`면 거부한다.
- 실행 확인 문구: `EXECUTE moodfit-production-{kind} {changeset}`.
- 실행 직전에 Change Set의 `Environment` Parameter가 `production`인지 다시 확인한다.
- **삭제 동작은 넣지 않는다.**
- `staging-changeset.sh`는 고치지 않는다.

### 2. `infra/cloudformation/budget.yaml`

- `Environment`의 `AllowedValues`에 `production`을 더한다. 설명 문구에서 "Staging"을 환경 중립으로 고친다. 그 밖의 동작(월 USD 300, 알림 기준)은 그대로 둔다.
- 다른 Template은 고치지 않는다. 고쳐야만 Production이 만들어지는 부분을 발견하면 **고치지 말고 `HUMAN_REQUIRED`로 멈춰** 무엇이 왜 필요한지 보고한다.

### 3. Parameter 예시

- `infra/cloudformation/production/` 아래에 Stack 7개의 `*.parameters.example.json`을 둔다. 기존 Staging 예시(`infra/cloudformation/*.parameters.example.json`)와 같은 Key를 쓰고, 값은 자리 표시(`<…>`)로 둔다. 확정된 값만 채운다: `Environment`는 `production`, Hostname 두 개, `VpcCidr`는 `10.50.0.0/16`.
- `iam` 예시에서 Production에 필요한 `Production…Arn` Parameter와, `RepositoryArn`이 **Staging ECR 저장소**를 가리킨다는 점을 Runbook에 설명한다.
- 실제 값이 든 파일은 만들지 않는다. 계정 번호 / ARN / Zone ID / Email을 추적 파일에 쓰지 않는다.
- `scripts/iac-validate.sh`가 Template 개수(8개)를 검사한다. 예시 파일을 하위 폴더에 두어 이 검사에 걸리지 않게 한다. `iac-validate.sh`는 고치지 않는다.

### 4. `.github/workflows/deploy-production.yml` (새 파일)

- **시작**: `workflow_dispatch`만. 입력은 `release_tag`(예: `v3.5.0`, 형식 `^v3\.[0-9]+\.[0-9]+$`) 하나. `workflow_run` / `push` / `schedule`로 시작하지 않는다.
- **동시 실행 방지**: `concurrency` Group `moodfit-production-deployment`, 진행 중인 것을 취소하지 않는다.
- **권한**: 기본은 `contents` 읽기뿐이다. OIDC에 필요한 `id-token` 쓰기 권한은 배포 Job에만 준다(`deploy-staging.yml`의 `deploy` Job과 같은 줄을 쓴다).
- **Job 1 `plan`**(Environment 없음, AWS 호출 없음)
  - Tag가 형식에 맞고, 실제로 있으며, 그 Commit이 `main`의 조상인지 확인한다.
  - **Image Commit**을 정한다: Tag의 Commit에서 `main`의 첫 번째 부모를 따라 거슬러 올라가며, `deploy-staging.yml`의 `classify`와 **같은 기준**으로 "배포 대상인 Commit"(문서 전용이 아닌 Commit) 가운데 가장 가까운 것을 고른다(최대 30개까지 본다. 못 찾으면 실패). 분류 규칙은 `deploy-staging.yml`의 것을 그대로 옮기되 그 파일은 고치지 않는다.
  - Step Summary에 Release Tag, Tag Commit, Image Commit, 그 사이에 있는 문서 전용 Commit 수를 적는다. 승인자가 승인 전에 이것을 본다.
  - Output으로 `image_sha`와 `tag_sha`를 낸다.
- **Job 2 `deploy`**(`needs: plan`, `environment: production` → 승인 Gate)
  - Tag Commit을 Checkout한다(화면 Build용).
  - OIDC로 Production 배포 Role의 임시 자격 증명을 받는다(Role ARN은 Environment Secret).
  - **Image 확인**: ECR에서 Tag가 `image_sha`인 Image의 Digest를 조회한다. 없으면 실패한다(**Build하지 않는다. Push하지 않는다**).
  - Task Definition: 현재 Production Service의 Task Definition을 읽어 Image만 `{저장소}@{digest}`로 바꿔 새 Revision을 등록한다. Staging Workflow의 등록 / Tag / 검사 방식을 따른다.
  - Service 갱신과 대기 판정: `deploy-staging.yml`의 "Wait for ECS and reject circuit breaker rollback"과 같은 판정(15초 간격, 최대 10분, 목표 Revision의 Task 수 충족, 이전 Revision 복귀나 FAILED면 즉시 실패)을 쓴다.
  - 화면: Tag Commit에서 Frontend를 설치 / Test / Build하고 Production S3에 올린 뒤 CloudFront Invalidation을 기다린다(Staging과 같은 순서: Asset 먼저, HTML 나중, 삭제 없음).
  - Smoke Test: `scripts/production-smoke.sh`.
  - Summary: Release Tag, Tag Commit, Image Commit, Image Digest, Task Definition Revision, 시각, 실행한 사람(`github.actor`)과 실행 번호. 계정 번호 / ARN / Bucket 이름 / Distribution ID는 적지 않는다.
  - 임시 파일을 지운다.
- **환경 값**: Cluster와 Service 이름은 Staging의 이름 규칙을 Production에 적용한 것(`moodfit-production`, `moodfit-production-backend`)으로 하되 Template의 실제 이름을 확인해 맞춘다. 저장소 URI / Bucket / Distribution / Role ARN은 Environment `production`의 Secret에서 읽는다. Staging의 Secret을 참조하지 않는다.
- **입력 처리**: `release_tag`와 SHA는 신뢰할 수 없는 입력으로 다룬다. 환경변수로 넘기고 Shell 문자열에 끼워 넣지 않는다. 형식을 먼저 검사한다.
- **Rollback**: 같은 Workflow를 이전 Release Tag로 다시 실행하는 것이 Rollback이다(이전 Image는 ECR에 남아 있다). 자동으로 이전 Tag를 고르지 않는다. DB Migration이 있는 Release 사이의 Rollback은 Runbook에 "Human 판단"으로 적는다.
- Action은 `deploy-staging.yml`이 쓰는 것과 같은 것, 같은 Version만 쓴다. 새 Action을 추가하지 않는다.

### 5. `scripts/production-smoke.sh` (새 파일)

- `staging-smoke.sh`와 같은 검사를 주소 `https://moodfit.8949db.kr`로 한다. **`staging-smoke.sh`는 고치지 않는다**(Staging 자동 배포가 쓰고 있다). 복사해 주소만 바꾸되, 주소가 한 곳(변수)에서만 정해지게 한다.
- Smoke는 체험 계정으로 Check-in을 한 건 만든다(Staging과 같다). Production DB에도 시험 기록이 한 건 남는다는 점을 Runbook에 적는다.

### 6. 문서

- `docs/28-PRODUCTION-DEPLOYMENT-RUNBOOK.md`(새 문서). 순서대로:
  1. 사전 조건(AWS SSO 로그인, 진행 중인 Staging 배포가 없는지, 비용 승인 범위)
  2. Local Parameter 파일 준비(어떤 값을 어디서 얻는지. 값 자체는 적지 않는다)
  3. Stack 생성 순서와 이유. Staging Runbook(`docs/18-STAGING-DEPLOYMENT-RUNBOOK.md`)의 순서를 따르고, `ecr`이 없는 점과 달라지는 점을 근거와 함께 적는다. `app`은 `BackendImage`가 필요하므로 Staging ECR의 Image Digest를 쓴다. Stack끼리 서로의 Output을 필요로 하는 부분은 Staging에서 푼 방식을 그대로 따른다.
  4. Human이 하는 일: OAuth 값을 Production용 Secret에 입력, Bedrock이 있는 계정의 Role 신뢰 정책에 Production Application Role 추가, GitHub Environment `production` 만들기와 승인자 지정, Environment Secret 입력
  5. 첫 배포(Workflow 실행, 승인, 확인할 것)
  6. Rollback
  7. 정리는 TASK-031에서 한다는 안내(삭제 보호와 Retain 설정 때문에 순서가 필요하다는 점만)
- `docs/21-STAGING-CD.md`에 Production 배포가 따로 있다는 한 단락. `docs/13-AWS-ARCHITECTURE.md`에 Production이 같은 ECR 저장소를 읽는다는 점.
- `docs/09-DECISIONS.md`: 새 Decision(다음 번호)을 **문서 맨 끝**에 — 위 "Human 결정" 7개 항목과 "Image는 같은 저장소의 같은 Digest를 쓴다", "Agent의 Production Stack 실행은 Human의 범위가 정해진 위임 아래".
- `README.md`: "AWS 배포" 절에 Production 배포 방식 한 단락(해당 절 안에. 문서 맨 위에 덧붙이지 않는다).
- `docs/07-TASKS.md`: TASK-030의 행과 절을 `docs/tasks/COMMON.md` 9절 형식에 맞춰 갱신한다. 상태 아래 문단에 "구현 파일이 준비됐고, 실제 Production 생성과 첫 배포는 Merge 뒤"임을 분명히 적는다. "3. Current Task"의 설명도 맞게 고친다(이 Task가 Current Task다).
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### Test / 검증

- `deploy-production.yml`: YAML로 읽혀야 하고, 시작 조건이 `workflow_dispatch`뿐이며, `deploy` Job에 `environment: production`과 `needs: plan`이 있고, `id-token` 쓰기 권한이 `deploy`에만 있다(Contract의 verify 명령이 확인한다).
- Workflow 안의 분류 Script(Python)는 실제 분류 전에 **자체 검사**를 돌린다(문서 전용 / 코드 변경 / 섞인 경우 / 빈 목록).
- `bash -n scripts/production-changeset.sh scripts/production-smoke.sh`.
- `scripts/production-changeset.sh`를 인자 없이, 잘못된 종류(`ecr`), `moodfit-readonly` Profile로 불렀을 때 AWS를 부르지 않고 실패하는지 Work Log에 실행 결과를 적는다(실행할 수 있는 범위에서).
- `git diff --check`.
- Sandbox에서는 AWS CLI / GitHub Actions / cfn-lint를 실행할 수 없다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. `scripts/iac-validate.sh`는 Claude 세션이 AWS 로그인 뒤 따로 돌린다.

### 금지

- AWS 호출, Resource 생성 / 삭제, 배포 실행
- `deploy-staging.yml`, `ci.yml`, `staging-changeset.sh`, `staging-smoke.sh`, `iac-validate.sh`, `budget.yaml` 이외의 Template 변경
- Application 코드(`backend/`, `frontend/`) 변경
- 추적 파일에 계정 번호 / ARN / Zone ID / Email / Bucket 이름 / Distribution ID / 실제 인증 값 기록
- 자동 시작(`push`, `workflow_run`, `schedule`) 추가, 승인 Gate 없는 배포 경로, Image 재Build / Push
- Stack 삭제 Script, 삭제 보호 해제

## Verification (2026-10-05 실행 기준)

- `deploy-production.yml` 구조 검사(Contract의 Python 한 줄)
- `bash -n scripts/production-changeset.sh`, `bash -n scripts/production-smoke.sh`
- `git diff --check`
- `bash scripts/iac-validate.sh`는 AWS 읽기 전용 로그인이 필요해 Orchestrator Verify에 넣지 않는다. Claude 세션이 Human의 AWS SSO 로그인 뒤 따로 실행하고 결과를 Work Log에 적는다.

## Claude Review 기준

- 승인 우회 가능성
- Staging과 Production Artifact 동일성
- IAM 최소 권한, Agent의 Production 접근 차단
- Rollback 안전성
- Migration / 호환성
- Production Secret / Log 노출

## 완료 조건

Human 승인 후 Production 배포가 성공하고 Smoke Test PASS, Rollback 절차가 검증 / 문서화되면 REVIEW.
