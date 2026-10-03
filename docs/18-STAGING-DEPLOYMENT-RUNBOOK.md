# 18. 최초 Staging 배포 절차

2026-10-03 TASK-028 A단계. 승인된 비용 기준은 DEC-027, Artifact는 DEC-028, IAM은 DEC-029, DB는 DEC-030 / DEC-031이다. A단계는 준비만 수행하며 TASK-028은 IN_PROGRESS다. 아래 쓰기 명령은 Human만 실행한다. Agent는 moodfit-readonly 조회와 공개 URL Smoke만 수행한다. Production은 생성하지 않는다. PR은 B단계 검증이 끝날 때까지 Merge하지 않는다.

## 준비와 입력 보호

Human 실행: Git Bash 또는 Linux bash, AWS CLI v2, Python, Git / tar, Docker Linux daemon, Java 21, Node.js 24와 승인된 cfn-lint가 필요하다. 새 도구 설치 / 업데이트는 이 Script가 하지 않는다. 검토된 A단계 Commit의 깨끗한 Task checkout을 사용한다. Backend / Frontend 빌드는 git archive로 만든 임시 복사본에서 실행해 Working Tree를 변경하지 않는다. 빌드 실패 로그는 외부 공유하지 말고 로컬에서 확인한다.

Human은 승인된 Staging 계정의 자기 관리자 Profile로 로그인한다. 기본 관리자 Profile에 의존하지 않는다. `HUMAN_PROFILE`에는 그 Profile alias만 넣는다. 해당 Profile의 계정 / Role / 서울 Region을 콘솔에서 대조하며 Production 세션을 사용하지 않는다. Agent는 관리자 Profile을 실행하지 않는다.

```bash
export HUMAN_PROFILE='<HumanStagingAdminProfile>'
aws sso login --profile "$HUMAN_PROFILE"
```

Agent 확인: 기존 승인 Profile preflight가 일치하는지 확인한다. 로그인 만료 / 미확인 / 권한 오류는 HUMAN_REQUIRED로 정지한다. 자동 로그인 / 재시도 / 다른 계정 전환을 하지 않는다.

Human 실행: `infra/cloudformation/local/`을 만들고 각 `*.parameters.example.json`을 `local/<stack>.parameters.json`으로 복사해 채운다. 이 디렉터리는 Git 비추적이다. 파일은 UTF-8 JSON 배열이며 각 항목은 ParameterKey / ParameterValue 문자열 쌍이다. 모든 Placeholder를 교체한다. 실제 Account ID / ARN / Zone ID / 이메일 / digest / origin 검증 입력은 이 파일과 Human 메모리에만 둔다. 채팅, Shell history, 출력 캡처, Git, Agent 입력에 값이나 파일 내용을 붙이지 않는다. 파일 접근은 Human 계정만 허용하고 동기화 폴더를 피한다. NoEcho는 AWS 설정 조회 자체를 숨기지 못하므로 Listener / Distribution 원문 출력도 공유하지 않는다.

```json
[
  {"ParameterKey": "Environment", "ParameterValue": "staging"},
  {"ParameterKey": "Owner", "ParameterValue": "<Owner>"}
]
```

Network AZ 2개 / prefix list / 기존 Hosted Zone / 실제 DNS 위임을 대조한다. Data 식별자는 moodfit-staging 전용으로 지정한다. app / frontend에는 예시에 없는 OriginVerificationValue 항목을 Human이 추가한다. 같은 무작위 32~128자 영숫자·밑줄·하이픈 값을 두 파일에 넣고 서로 같음을 로컬에서 확인한다. App의 BackendImage는 승인 Repository URI에 `@sha256` digest를 붙인 형식이다. Budget 파일은 별도 예시로 만들고 이메일은 로컬에서만 입력한다.

IAM 예시의 Production 접두 항목은 staging에서 해당 조건 Resource가 생성되지 않도록 Environment를 고정하며 기존 기본값 / 비활성 placeholder를 사용한다. 예정 ECS ARN은 Cluster moodfit-staging, Service와 family moodfit-staging-backend로 구성한다. StagingAppStackArn의 Trust는 ArnEquals이므로 wildcard pattern을 넣지 않는다. 최초 IAM 시점에는 아직 존재하지 않는 해당 Staging Stack의 비활성 예정 ARN을 로컬 입력으로 두어 fail closed를 유지하며 이 Role을 사용하지 않는다. App을 Human 권한으로 생성한 뒤 실제 Stack ARN으로 IAM UPDATE한다. IAM 자동 이름 Role의 자기 참조도 최초 생성 후 실제 출력으로 UPDATE한다. Origin 보호를 위해 설정 조회 권한을 추가하지 않는다.

## 공통 Change Set 절차

Human 실행: 이름은 moodfit-staging-<stack>으로 고정한다. 서울이 기본이며 certificate만 us-east-1이다. create는 실행하지 않는다. 최초 CREATE / 이후 UPDATE를 명시한다. describe가 CREATE_COMPLETE / AVAILABLE이 된 후 Resource별 추가·수정·삭제와 Replacement / Conditional Replacement, IAM 권한, DNS, 보존 정책과 비용을 콘솔에서 직접 확인한다. 요약 개수만으로 승인하지 않는다. 변경 없음 Change Set은 실행하지 않는다.

```bash
bash scripts/staging-changeset.sh network create "$HUMAN_PROFILE" staging-network-01 CREATE
bash scripts/staging-changeset.sh network describe "$HUMAN_PROFILE" staging-network-01
bash scripts/staging-changeset.sh network execute "$HUMAN_PROFILE" staging-network-01
```

execute는 요약을 다시 보여주고 `EXECUTE moodfit-staging-network staging-network-01`을 직접 입력해야 제출한다. 다른 Stack은 아래 표의 이름과 새 Change Set 이름으로 같은 세 명령을 실행한다. 모든 AWS 명령은 Profile / Region을 명시한다. 실행 후 해당 Stack CREATE_COMPLETE 또는 UPDATE_COMPLETE를 확인하기 전 다음 의존 단계로 넘어가지 않는다.

Agent 확인:

```bash
bash scripts/staging-status.sh network staging-network-01
```

조회 Script는 Stack 상태와 최근 Event의 종류·상태, Change Set 개수만 보여준다. app이면 ECS 배포와 Target Health도 확인한다. 실패 원문과 식별값은 출력하지 않는다. 조회 성공은 배포 수락 / 승인 의미가 아니다.

## 적용 순서와 Checkpoint

| 단계 | Human 실행 / 확인 | Agent 확인 | 예상 대기 / 비용 발생 |
|---|---|---|---|
| budget | 공통 절차로 Budget 최초 생성, 이메일 수신과 forecast 설정 확인 | 상태 조회 | 수분 예상. USD 300 실제 50 / 80 / 100%, forecast 100% |
| network | AZ / CIDR / NAT 2개 / Public·Private 경계 확인 후 실행 | 상태·Event | 약 5~15분. NAT / Public IPv4 비용 시작 |
| ecr | 기존 공용 immutable Repository 유무 확인. 있으면 중복 생성 금지, 승인된 기존 ecr Stack 출력 사용. 없으면 공통 절차로 최초 생성 | 상태·Event | 수분. 이미지 저장량부터 비용 |
| data | Network Data subnet·SG 출력을 로컬 입력에 연결, MySQL 8.4.11 / Multi-AZ / TLS / backup 14일 / 삭제 보호 확인 | 상태·Event | 약 20~45분 이상. RDS와 저장소 비용 시작 |
| certificate | 기존 Zone / Staging viewer DNS 인증서 검증 | us-east-1 상태 | 수분~수십 분, DNS 검증 대기는 길어질 수 있음 |
| frontend | 인증서 출력·동일 origin 검증 입력 연결. API origin hostname은 아직 미생성이어도 설정 참조 가능 | 상태 | 약 10~30분. S3 / CloudFront / DNS 사용량 비용 |
| iam | ECR / Data / Frontend 실제 출력과 예정 ECS ARN 입력. 기존 OIDC Provider 재사용 여부 확인, staging 조건과 Role 범위 확인 | 상태 | 수분. 로그 저장 / 수집 시 비용 |
| image | 아래 이미지 준비 실행, digest를 App 로컬 파일에 넣음 | digest 형식 및 승인 SHA 일치 여부만 기록 | 빌드 / 업로드 시간. ECR 저장·전송 비용 |
| app | Network / Data / IAM 실제 출력 연결. 최초는 Human 권한으로 생성하며 제한된 앱 Change Set Role을 provisioning 권한으로 사용하지 않음 | ECS desired=2 / running=2 / pending=0, rollout COMPLETED, Target 2개 healthy | 약 10~30분 이상. ALB / Task / access log 비용 시작 |
| iam UPDATE | 실제 실행·Task Role 출력과 App Stack ARN으로 최초 예정 자기 참조·Trust 입력을 교정. 승인 Action / Condition을 유지하고 Change Set 검토 | 상태 | 수분. 자동 권한 확대 없음 |
| frontend upload | 아래 업로드 후 invalidation 완료 확인 | 공개 URL Smoke | 수분~수십 분, 전송·요청 비용 |

시간은 계획용 추정치이며 Timeout 성공 기준이 아니다. 승인된 Network → Data → 인증서 → Frontend → IAM → App 흐름에 독립 선행 ECR과 Budget을 추가했다. Frontend가 app Resource를 직접 Ref하지 않고 origin hostname 문자열을 사용하므로 App 생성 후 API 연결 UPDATE는 필요 없다. App 전 API는 실패할 수 있으므로 완료 전 공개 수락을 주장하지 않는다.

Budget은 태그 활성화 지연·공유 ECR 누락을 피하기 위해 필터 없이 해당 계정 전체 비용을 감시하는 보수적 알림이다. Staging 원가는 Human이 Cost Explorer / Resource Inventory로 따로 대조한다. 계정의 다른 비용도 알림에 포함되며 Budget은 강제 지출 차단 장치가 아니다. 7일 후 운영 연장 또는 TASK-031 정리를 검토한다. 견적이 환경 월 USD 300을 넘으면 실행 전에 다시 Gate로 정지한다. [AWS Budget 속성](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-budgets-budget.html)을 2026-10-03 확인했다.

## Artifact 배포와 Smoke

Human 실행: 깨끗한 검토 Commit의 HEAD를 full SHA로 전달한다. 변경 / 비추적 파일이 있으면 이미지·Frontend Script가 거부한다. 빌드 출력과 Docker 로그인 설정은 임시 경로에서 만들고 종료 시 지운다. 이미 Push한 sha Tag가 있으면 immutable 충돌을 우회하거나 덮어쓰지 않고 기존 승인 digest를 확인한다.

```bash
VCS_REF=$(git rev-parse HEAD) bash scripts/staging-image.sh "$HUMAN_PROFILE"
bash scripts/staging-frontend.sh "$HUMAN_PROFILE"
```

이미지 Script는 linux/amd64 / VCS_REF OCI label / sha-<full SHA>를 사용한다. 출력 digest를 Human이 App 파일의 BackendImage에 반영한다. URI / 계정은 출력하지 않는다. Frontend는 assets를 먼저 올리고 HTML은 no-cache로 올린다. 삭제 동기화는 하지 않는다. CloudFront 기본 managed cache 정책의 최소 TTL로 HTML이 짧게 남을 수 있으므로 invalidation 완료 후 확인한다. SPA rewrite는 /check-in과 /history에만 적용하며 /api의 상태·본문을 HTML로 바꾸지 않는다.

Agent 확인 (AWS 자격 증명 불필요):

```bash
bash scripts/staging-status.sh app
bash scripts/staging-smoke.sh
```

Smoke는 정적 HTML / SPA, HTTP redirect, origin 직접 접근 403 또는 연결 불가, 합성 Check-in POST 201 / latest / History 200와 DEC-024 계약, invalid 입력 400 본문 보존을 검사한다. 생성 기록은 남기며 삭제하지 않는다. 실행 중 다른 Check-in 입력을 중단해 latest 비교를 보호한다. readiness / DB 연결은 Target 2개 healthy로 확인한다. Health endpoint는 공개 CloudFront API에 추가하지 않는다.

Human은 로컬 콘솔에서 CloudWatch 앱 Log / ALB Log / ECS Event를 확인해 Flyway migration 완료·동시 Task 잠금 대기와 120초 health grace, DB 연결, AZ 분산·rolling 100/200을 실측한다. 로그 원문은 Agent에게 전달하지 않고 통과 여부 / 비민감 시간·개수만 기록한다. ALB log Bucket 쓰기 검사, viewer Host 제외 header 전달도 Smoke와 실제 요청 결과로 대조한다. 일반 CloudFormation에서 앱 service role의 Source 조건 동작은 최초 관리자 provisioning으로 검증되지 않는다. B단계 보조 세션에서 승인 범위의 후속 앱 변경을 해당 Role로 검토·검증하고 미지원이면 조건을 제거하지 않고 HUMAN_REQUIRED로 정지한다. Production용 DB 계정 분리는 TASK-030 범위다.

## 조회 권한 정책안 적용

Human 실행: `infra/iam/readonly-permission-set.json`의 AccountId / StagingServiceArn / RepositoryArn을 로컬에서 렌더링하고 기존 TASK-026 ValidateTemplate·서울 가용성 조회 정책과 병합 검토하여 MoodFitReadOnly에 적용·프로비저닝한다. 이 파일은 초안이며 AWS 관리 ReadOnlyAccess를 추가하지 않는다. Agent는 Permission Set / IAM 변경을 하지 않는다. 문서나 PR에는 실제 렌더링 결과를 넣지 않는다.

정책 초안의 Statement는 다음 범위를 가진다: IdentifySession은 STS identity 조회, InspectStagingChangeSet은 서울 moodfit-staging-* Stack와 us-east-1 certificate Stack만, InspectStagingService는 승인 Service ARN만, InspectImage는 공용 Repository ARN만, InspectTargetHealth는 서울 조회만 허용한다. JSON 전문은 해당 추적 파일이 기준이다. Target Health는 Resource 단위 제한을 지원하지 않아 Resource *와 RequestedRegion 조건을 쓴다. [ELBv2 권한 표](https://docs.aws.amazon.com/service-authorization/latest/reference/list_elbv2.html), [CloudFormation 권한 표](https://docs.aws.amazon.com/service-authorization/latest/reference/list_cloudformation.html)를 2026-10-03 확인했다. Listener / CloudFront 전체 설정 조회와 DB 값 조회는 추가하지 않는다.

## 실패·중단·재개

- Change Set 생성 실패: Human이 콘솔 Event를 로컬 확인하고 입력·Template 오류를 구분한다. 실행하지 말고 수정 Diff를 재검토한다. 새 Change Set 이름으로 다시 준비하는 결정은 Human이 한다. 로그 / 입력 원문을 공유하지 않는다.
- CREATE 실패 / ROLLBACK_COMPLETE: 첫 ECS 배포에는 이전 완료 deployment가 없다. 자동 rollback만 믿지 않는다. Stack 삭제·재생성은 Script가 제공하지 않으며 파괴적 범위가 필요하면 Gate로 정지한다. 남은 Resource / Retain / Snapshot / 비용을 Human inventory로 확인한다.
- UPDATE_ROLLBACK_FAILED: 다음 단계 실행을 중단한다. 기존 정상 digest 복귀도 DB migration을 취소하지 않는다. Continue rollback / DB restore / Flyway repair / 권한 변경은 별도 검토·승인 없이 하지 않는다.
- 부분 배포 / S3 upload 실패: 배포 수락을 보류한다. 기존 asset은 삭제하지 않으므로 현재 HTML·asset version을 확인하고 같은 검토 Commit으로 재개한다. invalidation은 제출과 완료를 구분한다.
- 세션 만료 / 조회 실패: 자동 재시도 / 기본 Profile fallback 금지. Human 로그인 후 승인된 Profile preflight를 다시 확인한다.
- 재개: Human 로컬 기록의 Stack 종류 / Change Set alias / CREATE 또는 UPDATE / Commit SHA / 마지막 완료 단계와 현재 상태를 대조한다. 완료 Stack을 CREATE하지 않는다. IN_PROGRESS면 종료까지 조회만 한다. 입력 변경은 새 Change Set으로 재검토한다.

비민감 배포 기록에는 Stack 종류 / Region / 상태 / Resource 종류·개수 / 비용 시작 시점 / 예상 일 USD 8와 실제 비용 확인일 / image Commit SHA / Smoke 통과 여부 / migration 소요 시간·Target 수를 남긴다. 실제 Resource inventory의 ID / ARN / 이메일 / header는 Human 로컬 비추적 파일에만 보관한다. B단계 검증 후 WORK_LOG 결과를 보완하고 TASK-028 DONE / TASK-029 READY를 같은 PR에 반영한다. 최종 완료 승인은 Remote CI와 Human Squash Merge다.

## TASK-031 정리 개요

별도 파괴적 작업 승인을 받은 뒤 트래픽·앱 중단 → Frontend / App 의존 Resource → IAM → Data → Network 순서를 검토한다. Data 삭제 보호 / final snapshot / 수동 snapshot 30일 보존, Retain된 자격 증명·로그·S3 version / ECR 공유 여부와 잔존 비용을 개별 확인한다. 인증서·Budget은 잔존 비용 확인을 끝낸 뒤 정리 여부를 결정한다. 현재 Task에는 Stack 삭제 / Bucket 비우기 / RDS 삭제 명령이 없다.
