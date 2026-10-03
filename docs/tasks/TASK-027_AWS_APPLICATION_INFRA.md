# TASK-027 — AWS Application Infrastructure (ECS / ALB / RDS Integration)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

승인된 IaC Foundation 위에 MoodFit Backend를 실행할 ECS Fargate / ALB / Application 구성과 Frontend → API Routing을 IaC로 완성한다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-024 Artifact 준비 완료
- TASK-026 Foundation 준비 완료

## Codex 작업 범위

- ECS Cluster / Task Definition / Service
- ECR Image Parameter / Tag 연결 (TASK-024 Tag 전략)
- ALB / Target Group / Listener / Health Check
- ECS Security Group → RDS Security Group 최소 경로
- Runtime DB 환경변수 / Secret Reference (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`에 대응)
- Application Port Mapping
- Desired Count / CPU / Memory Parameter화
- CloudWatch Logs 등 승인된 최소 Logging
- Frontend `/api/*` Routing 또는 승인된 API Endpoint 전략 반영

## 안전 규칙

- Task Definition에 평문 DB Password 금지
- ECS Task Public Exposure는 승인된 Architecture를 따름
- ALB Target Health와 App Health 전략 일치
- RDS Migration(Flyway) 동시 실행 위험 검토 (여러 Task가 동시에 시작하는 경우)

## TASK-026에서 넘어온 입력 (2026-10-03, Claude 세션 기록)

- Foundation Template은 `infra/cloudformation/`(network / ecr / data / frontend / certificate / iam)에 있고 `docs/17-AWS-IAC-FOUNDATION.md`가 Stack 의존 순서와 TASK-027 경계를 설명한다. ALB / ECS Service / Task Definition과 Frontend의 `/api` origin 연결이 이 Task 범위다.
- ALB Listener는 HTTPS 443만 사용한다(HTTP 80 없음). ALB Security Group ingress는 CloudFront origin-facing managed prefix list의 443만 허용한다(DEC-027, TASK-026 Gate 결정 4).
- TASK-026 Review N-004: CloudFront Distribution은 IPv6가 켜져 있는데 사용자 hostname에는 A alias만 있고 AAAA alias가 없다. 최초 Change Set 검토(TASK-028) 전에 AAAA를 추가할지 IPv6를 끌지 정한다.
- ECS는 Dockerfile HEALTHCHECK를 무시하므로 Task Definition에 liveness 명령을 선언한다(DEC-028). Health 경로는 ALB `/actuator/health/readiness`, Container `/actuator/health/liveness`다.
- 검증은 `scripts/iac-validate.sh`를 확장해 쓴다. 모든 AWS 명령에 `--profile moodfit-readonly`를 명시한다.
- Secret 검사: IAM 정책은 구조화된 YAML로 쓰고, Secrets Manager 조회 Action은 단독 Statement의 flow sequence 한 줄로 쓴다(TASK-026 Contract의 승인 문구 참고). Task Definition의 Container 자격 증명 주입 설정(`Secrets` 항목의 `ValueFrom` 등)도 Guard에 걸릴 수 있으므로 Contract 준비 때 허용 문구를 미리 검토한다.

## Human 결정 (2026-10-03, Gate 사전 승인) / 실행 기준

Human이 아래를 승인했다. 이 Task는 Template 작성과 정적 검증만 한다. **Stack을 만들거나 바꾸지 않으며 비용 Resource를 생성하지 않는다.**

1. **DB 자격 증명 방식 변경** (TASK-026 Gate 결정 3 대체): RDS 관리형 관리자 자격 증명 기능은 쓰지 않는다. AWS 공식 문서(RDS User Guide, Secrets Manager 통합)에 따르면 이 기능은 값을 기본 7일마다 자동 교체한다. ECS는 Container 시작 때만 값을 주입하므로 교체 후 실행 중인 앱의 새 DB 연결이 실패한다. 대신 `data.yaml`이 Secrets Manager 자격 증명 Resource를 무작위 값으로 생성하고(자동 교체 설정 없음) RDS가 그 값을 동적 참조로 사용한다. 값은 Template / Parameter / 저장소 어디에도 두지 않는다. 이 Resource에는 DeletionPolicy / UpdateReplacePolicy를 Retain으로 둔다. 관리자 이름은 `moodfit_admin`이다.
2. **앱의 DB 계정**: Staging은 위 관리자 계정을 앱이 사용한다. Production 전에 권한이 제한된 앱 전용 계정으로 분리한다(TASK-030 Gate). 이 잔여 위험을 문서에 적는다.
3. **Stack 구성**: `infra/cloudformation/app.yaml`을 새로 만든다(ECS Cluster / Task Definition / Service, ALB, HTTPS 443 Listener, Target Group, 서울 Region origin 인증서, origin hostname DNS 레코드, ALB access log Bucket 30일 lifecycle). `frontend.yaml`에 `/api`와 `/api/*` origin / behavior(HTTPS only, cache 비활성, query / header / method 전달, API 오류 보존)를 추가한다. HTTP 80 Listener는 만들지 않는다.
4. **CloudFront IPv6**: IPv6를 유지하고 사용자 hostname에 AAAA alias 레코드를 추가한다.
5. **Origin 검증 Header**: CloudFront가 붙이고 ALB Listener가 확인한다. 값은 `NoEcho` Parameter로 받고 Template / 예시 파일 / 문서에 값을 쓰지 않는다. Listener 기본 동작은 403 고정 응답이고 Header가 일치할 때만 Target Group으로 전달한다.
6. **배포 설정**: Rolling(Minimum Healthy 100 / Maximum 200), Deployment Circuit Breaker와 자동 롤백. Desired Count 2, 0.5 vCPU / 1 GiB, AZ 분산(DEC-027). Health는 ALB `/actuator/health/readiness`, Container `/actuator/health/liveness`(DEC-028), Health Check Grace Period는 DEC-028 제안값을 따른다.
7. **Flyway 동시 실행**: Task 2개가 동시에 시작할 때의 동작(Flyway의 DB 잠금)을 문서에 근거와 함께 적는다. 파괴적 Migration은 별도 승인 대상이다.
8. Image는 ECR의 `repository@sha256:<digest>` 형식 Parameter로 받는다(DEC-028). `latest`를 쓰지 않는다.

### 승인된 허용 문구 (Contract `secret_scan_allow`, 4개)

CloudFormation에 꼭 필요하지만 Secret 검사에 걸리는 설정 줄 4개를 Human이 승인했다. 모두 실제 값이 없는 설정 줄이다.

1. Task Definition의 Container 자격 증명 주입 줄: 주입 목록 속성을 flow sequence 한 줄로 쓴 형태(DB 사용자 이름과 DB 비밀 값을 `${DbCredentialArn}`의 JSON Key로 참조)
2. RDS 관리자 비밀 값 속성 줄: `${DbCredential}`의 SecretString JSON Key를 가리키는 동적 참조
3. 자격 증명 Resource의 Type 줄(뒤에 정해진 주석 포함)
4. 무작위 값 생성 설정 줄: flow mapping 한 줄(관리자 이름 Template, 생성 Key, 길이 32, 구두점 제외)

**정확한 문구는 Workspace의 `harness/tasks/TASK-027.json` 파일을 직접 읽어 `secret_scan_allow` 배열의 문자열을 그대로 복사한다.** Executor 입력으로 받은 Contract와 이 문서는 Orchestrator가 엄격하게 마스킹하므로 값이 가려져 보일 수 있다. 그것은 정상이며 문서 충돌이 아니다. Contract 파일은 읽기만 하고 수정하지 않는다.

사용 규칙:

- 문구는 한 글자도 바꾸지 않고(공백, 따옴표, 대소문자, 변수 이름 포함) Template의 해당 속성 위치에 들여쓰기만 맞춰 넣는다. 줄 끝에 다른 문자를 붙이지 않는다.
- 그래서 Logical ID와 Parameter 이름이 정해진다: 자격 증명 Resource의 Logical ID는 `DbCredential`(`data.yaml`), `app.yaml`의 자격 증명 ARN Parameter 이름은 `DbCredentialArn`이다.
- 이 속성들을 여러 줄 block 형태로 풀어 쓰지 않는다. 자격 증명 단어가 들어간 속성 이름 뒤에 줄바꿈 후 하위 항목이 오는 형태는 Guard가 줄을 이어서 판정해 차단한다.
- IAM 정책을 고쳐야 하면 TASK-026 방식(구조화된 YAML)을 유지한다. 기존 `iam.yaml`의 자격 증명 조회 Statement 줄은 고치지 않는다(고치면 추가 줄로 다시 검사되며 이 Contract에는 그 문구가 없다). `iam.yaml`의 Parameter 값 연결만 필요하면 다른 줄에서 처리한다.
- 문서와 Prompt 기록에는 이 문구 원문이나 Secrets Manager Action 이름 원문을 쓰지 않고 풀어서 설명한다.
- 작업을 마치기 전에 `git diff`의 추가 줄 전체에서 자격 증명 단어 뒤에 콜론 / 등호와 값이 오는 표기가 승인된 4개 외에 없는지 스스로 검색한다.

### Codex 작업 범위 (이 Run)

1. `data.yaml`: 결정 1 반영. 기존 RDS 관리형 설정 줄을 제거하고 자격 증명 Resource(허용 문구 3, 4)와 RDS의 동적 참조(허용 문구 2)를 넣는다. 자격 증명 ARN을 Output으로 낸다. RDS의 다른 설정(8.4.11, Multi-AZ, 암호화, 삭제 보호, Backup 14일 등)은 바꾸지 않는다.
2. `app.yaml` 신규: 결정 3, 5, 6, 8. Container 자격 증명 주입은 허용 문구 1을 쓴다. `DB_URL`은 일반 환경변수로 RDS endpoint / DB 이름 Parameter에서 조합한다(TLS 설정 포함 여부와 근거를 문서에 적는다). CloudWatch Log Group 30일.
3. `frontend.yaml`: 결정 3, 4, 5.
4. `iam.yaml` / Parameter 예시: 필요한 Parameter 연결만 고친다. ECS execution Role이 읽는 자격 증명 ARN이 새 Resource를 가리키도록 Parameter 설명 / 예시를 맞춘다.
5. `scripts/iac-validate.sh`: 새 Template을 검증 대상에 넣는다. 모든 AWS 명령에 `--profile moodfit-readonly`를 유지한다. 읽기 전용 API만 쓴다.
6. 문서: `docs/17`(Stack 의존 순서와 Parameter 전달, 비용 Resource 목록, Replacement / 삭제 위험 갱신), `docs/13` / `docs/14` / `docs/15`의 관련 서술, 새 Decision(최신 번호 다음, Human Approved 2026-10-03)으로 DB 자격 증명 방식 변경과 이 Gate 결정을 기록한다. TASK-026 문서의 결정 3이 대체되었음을 Decision에 적는다.
7. 완료 반영: TASK-027 DONE / **TASK-028 READY는 하지 않는다.** TASK-028은 실제 비용 Resource 생성이므로 `BLOCKED`를 유지하고 "Human의 비용 승인과 Stack 생성 권한 결정 후 READY"로 적는다. AGENTS.md 3절 Current Task는 TASK-028 / BLOCKED로 맞춘다.
8. 새로 Human 결정이 필요한 사항만 `human_decisions_needed`로 보고한다.

## Verification

- CloudFormation Static Validation
- Resource Dependency Graph
- Health Check Path / Port 일관성
- Runtime 환경변수 / Secret Reference 검사
- Rollback / Replacement 영향 분석

## Claude Review 기준

- ALB → ECS → RDS Traffic 경계
- ECS Task 권한 / Secret 처리
- 배포 설정(Minimum / Maximum Healthy Percent 등) 위험
- Flyway Migration Race 가능성
- Frontend / API Routing 일관성

## 완료 조건

Application Infra Template이 검증되고 Staging Change Set / Apply 준비가 되면 REVIEW.
