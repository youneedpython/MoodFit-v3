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

## Human 결정 (2026-10-03, 실행 전 Gate) / 진행 방식

Human이 다음을 승인했다.

1. **비용과 운영 기간**: Staging을 만들어 검증하고, **검증 기간만 운영한 뒤 정리**한다. 비용 기준은 DEC-027(추정 월 USD 250 / 환경, 상한 USD 300, 하루 약 USD 8)이다. Budget 알림(50 / 80 / 100%와 forecast)을 함께 만든다. 정리(삭제)는 TASK-031의 파괴적 작업이며 그때 별도 승인한다.
2. **Stack 생성 주체**: **Human이 자기 관리자 권한 Profile로 Change Set을 직접 실행한다.** Agent(Codex / Orchestrator)는 Template, Script, Parameter 형식, 절차 문서를 준비하고, 조회 권한(`moodfit-readonly`)으로 결과를 확인한다. Agent는 생성 / 변경 / 삭제 API를 호출하지 않는다. Agent용 Permission Set에 쓰기 권한을 추가하지 않는다.
3. **Origin 검증 Header 값**: Human이 생성해 로컬 비추적 Parameter 파일로 입력한다. 값은 저장소 / 문서 / Log / Agent 입력에 두지 않는다. **배포 Image**: Human이 로그인한 관리자 Profile로 준비된 Script를 실행해 Build / Push한다.
4. **적용 순서**: Network → Data → 인증서(us-east-1) → Frontend → IAM → App 순서로 진행하고 단계마다 Change Set을 Human이 확인한 뒤 실행한다. (TASK-027 Review N-002의 한 번에 적용하는 방식. Template 의존 관계상 순서 조정이 필요하면 근거와 함께 절차 문서에 적는다)

### 2단계 진행

- **A단계 (이 Contract의 Orchestrator Run)**: 배포 절차 문서와 Script, 로컬 Parameter 형식, Budget Template, 조회 권한 정책안을 만든다. AWS Resource를 만들지 않는다. **TASK-028을 DONE으로 바꾸지 않는다(IN_PROGRESS 유지).** Run이 PASS하면 Orchestrator가 Draft PR을 만든다. 이 PR은 배포 검증이 끝날 때까지 Merge하지 않는다.
- **B단계 (Human 실행 + Claude 세션 보조)**: Human이 절차 문서대로 Stack을 만들고 배포한다. Claude 세션이 단계마다 Change Set 내용과 결과를 `moodfit-readonly`로 확인하고 Smoke를 실행한다. 문제가 나오면 수정하고 기록한다. 검증이 끝나면 결과를 WORK_LOG에 남기고 TASK-028 DONE / TASK-029 READY를 같은 PR에 반영한 뒤 Human이 Squash Merge한다.

### A단계 Codex 작업 범위

1. **`docs/18-STAGING-DEPLOYMENT-RUNBOOK.md`**: Human이 그대로 따라 할 수 있는 절차서. 사전 준비(필요 도구, 로그인, 로컬 Parameter 파일 작성), 단계별 명령과 확인 항목, 예상 소요 시간(RDS Multi-AZ 등), 단계별 비용 발생 시점, 실패 시 대응(Change Set 실패 / Rollback / 부분 생성 상태), 중단 후 재개 방법, **정리 순서 개요**(실제 정리는 TASK-031). 각 단계에 "Human 실행"과 "Agent 확인"을 구분해 적는다.
2. **Script** (bash, `set -euo pipefail`, Git Bash on Windows와 Linux에서 동작, 단계 이름과 실패 원인 출력, Working Tree를 변경하지 않음):
   - `scripts/staging-changeset.sh`: Human 실행용. 인자로 Stack 이름(network / data / certificate / frontend / iam / app / budget)과 동작(create / describe / execute)을 받는다. **Profile은 필수 인자로 받고 기본값을 두지 않는다. `moodfit-readonly`가 전달되면 거부한다(Agent 조회용 Profile로는 쓰기 작업을 하지 않는다).** create는 Change Set만 만들고 실행하지 않는다. execute는 Change Set 이름을 명시적으로 받고, 실행 전에 변경 요약(추가 / 수정 / 삭제 / Replacement 개수)을 보여 준 뒤 사용자가 직접 입력한 확인 문구가 있어야 진행한다. Stack 삭제 기능은 넣지 않는다. Parameter는 로컬 비추적 파일에서 읽는다. NoEcho Parameter 값을 출력하지 않는다.
   - `scripts/staging-image.sh`: Human 실행용. 깨끗한 checkout(변경 없음)인지 확인하고, Backend bootJar를 만들고, linux/amd64 Image를 `VCS_REF`(full Commit SHA) 필수로 Build해 `sha-<commit>` Tag로 ECR에 Push한다. Push 후 digest를 출력한다(App Stack Parameter에 넣을 값). `latest` Tag를 쓰지 않는다. Profile 필수 인자, `moodfit-readonly` 거부.
   - `scripts/staging-frontend.sh`: Human 실행용. `npm ci` / `npm run build` 후 `dist`를 정적 Bucket에 올리고 CloudFront invalidation을 만든다. Profile 필수 인자, `moodfit-readonly` 거부. Bucket / Distribution 식별값은 Stack Output에서 읽거나 인자로 받는다.
   - `scripts/staging-status.sh`: Agent / Human 조회용. `--profile moodfit-readonly`를 고정으로 쓴다. Stack 상태, Change Set 요약, ECS Service 배포 상태, Target Health를 **식별값(Account ID, ARN, Zone ID 등)을 출력하지 않는 요약**으로 보여 준다. 읽기 전용 API만 쓴다.
   - `scripts/staging-smoke.sh`: AWS 자격 증명 없이 실행한다. `https://staging.moodfit.8949db.kr` 기준으로 정적 페이지, SPA 경로, `/api` 정상 응답과 오류 응답 보존, HTTP → HTTPS, ALB origin hostname 직접 접근이 차단(403 또는 연결 불가)되는지 확인한다. 합성 데이터만 쓴다(DEC-027 결정 10). 결과를 통과 / 실패로 출력한다.
3. **로컬 Parameter**: `infra/cloudformation/local/`(비추적)에 Stack별 Parameter 파일을 두는 형식을 정하고 `.gitignore`에 추가한다. 저장소에는 형식 설명과 Placeholder 예시만 둔다. 실제 값(Account ID, 인증서 ARN, Hosted Zone ID, 이메일, Header 값, digest)은 추적 파일에 쓰지 않는다.
4. **`infra/cloudformation/budget.yaml`**: 월 USD 300 Budget, 50 / 80 / 100% 실제 비용과 forecast 알림. 알림 이메일은 Parameter. `scripts/iac-validate.sh` 검증 대상에 추가한다.
5. **조회 권한 정책안**: B단계 확인에 필요한 읽기 전용 Action(Stack / Change Set / Event 조회, ECS Service 조회, Target Health 조회 등)을 `MoodFitReadOnly` inline 정책 JSON 초안으로 문서에 제시한다(`infra/iam/readonly-permission-set.json` 갱신 포함). Resource 범위를 Staging으로 좁힐 수 있으면 좁히고, Resource 단위 제한이 지원되지 않는 API는 근거를 적는다. 적용은 Human이 한다.
6. **TASK-027 Review N-001**: `app.yaml` Task Definition Tags에 `MoodFitEnvironment` 항목을 추가해 `iam.yaml`의 배포 Role 조건과 맞춘다(TASK-029에서 막히지 않도록 최초 생성 전에 고친다).
7. `docs/17` 갱신(적용 순서, Budget Stack, 로컬 Parameter), `docs/07` / AGENTS.md 3절은 TASK-028 **IN_PROGRESS**로 맞춘다. WORK_LOG에 기록한다.
8. 안전 규칙:
   - Agent가 실행하는 경로(Orchestrator Verify, `staging-status.sh`, `iac-validate.sh`)에는 쓰기 API가 없어야 한다.
   - Human 실행용 Script의 쓰기 명령은 이 Task 범위의 Staging Stack에만 쓴다. 삭제 계열 명령(`delete-stack`, Bucket 비우기, RDS 삭제 등)은 넣지 않는다.
   - 이 PC의 기본 AWS Profile은 관리자 세션이다. 모든 `aws` 명령에 `--profile`을 명시하고 기본 Profile에 의존하지 않는다.
   - Secret 검사: Contract에 승인된 문구 5개가 있다(TASK-026 / TASK-027에서 승인된 것과 같다). 정확한 문구는 Workspace의 `harness/tasks/TASK-028.json`에서 읽는다. Executor 입력에서 가려져 보이는 것은 정상이다. 이미 Commit된 Template의 해당 줄은 고치지 않는다. 새로 쓰는 줄에는 자격 증명 단어 뒤에 콜론 / 등호와 값이 오는 표기를 넣지 않는다(Script 변수 이름도 그 단어로 끝내지 않는다). ECR 로그인처럼 CLI 하위 명령 이름에 그 단어가 들어가는 경우는 뒤에 구분 기호와 값이 오지 않으므로 그대로 쓴다.
9. 새로 Human 결정이 필요한 사항만 `human_decisions_needed`로 보고한다. B단계의 Human 작업(Stack 실행, 권한 적용)은 `handoff_actions`가 아니라 절차 문서에 적는다.

### Run 1 결과와 Run 2 작업 범위 (2026-10-03, Claude 세션 기록)

Run 1(`2026-10-03T11-29-20-519Z-126f913b`): Codex가 절차 문서, Script 5개, Budget Template, 로컬 Parameter 형식, 조회 권한 정책안을 작성했다. Verify의 `scripts/iac-validate.sh`가 `budget.yaml`에서 실패해 **BLOCKED** 했다. 작업 폴더 상태는 검토 미완료 WIP로 Commit했다.

- 원인(Claude 세션 확인): cfn-lint 1.57.1이 `budget.yaml`에 경고 W2001(Parameter `Environment`가 사용되지 않음, 4행)을 낸다. 검증 Script는 경고도 실패로 처리한다. 다른 Template 7개는 경고 없이 통과하고, `budget.yaml`의 `validate-template`(us-east-1)도 통과한다. Script 5개와 `iac-validate.sh`의 `bash -n` 구문 검사는 모두 통과한다.

Run 2 Codex 작업 범위:

1. `budget.yaml`의 미사용 Parameter를 제거하거나 실제로 사용한다(예: Budget 이름이나 Tag에 반영). Parameter 예시 파일과 절차 문서도 맞춘다. cfn-lint가 경고 없이 통과해야 한다. 경고를 무시하도록 검증 Script를 완화하지 않는다.
2. `budget.yaml`을 어느 Region에서 검증 / 생성하는지(Budgets는 global 서비스) 절차 문서와 검증 Script가 일치하는지 확인한다.
3. 그 밖의 A단계 범위는 WIP 상태를 유지한다. 필요한 보완이 있으면 함께 한다.

## Codex 작업 범위 (원래 범위)

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
