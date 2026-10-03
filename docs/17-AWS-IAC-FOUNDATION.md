# 17. AWS IaC Foundation

2026-10-03 TASK-026 Foundation과 TASK-027 Application 구현. 승인 기준은 DEC-027 / DEC-028 / DEC-029 / DEC-030 / DEC-031과 각 Contract다. Template 작성만 수행했으며 실제 AWS 조회 / Stack / IAM / DNS / 비용 Resource 변경은 수행하지 않았다. 최초 적용은 TASK-028의 별도 Human 비용 승인과 Stack 생성 권한 결정 후 진행한다.

## Stack과 의존 순서

| Stack | Region | 책임 / 선행 입력 |
|---|---|---|
| network | ap-northeast-2 | 환경별 VPC, 서로 다른 AZ 2개, Public / Private App / Private Data 각 2개, AZ별 NAT, S3 Gateway Endpoint, ALB / App / Data SG |
| ecr | ap-northeast-2 | 두 환경이 참조할 단일 immutable Repository. 한 번만 생성하며 환경별 중복 생성 금지 |
| data | ap-northeast-2 | Network의 Data subnet / SG, MySQL 8.4.11, db.t4g.small, Multi-AZ, gp3 20 GiB, 무작위 생성 자격 증명과 동적 참조, TLS Parameter Group |
| certificate | us-east-1 | 기존 Public Hosted Zone과 Staging 사용자 hostname의 ACM DNS 검증 인증서 |
| frontend | ap-northeast-2 | 인증서 ARN / app origin hostname 전달, Private S3 REST origin / OAC / CloudFront / API behavior / 사용자 A·AAAA alias |
| iam | ap-northeast-2 | 공용 ECR 및 환경별 앱 / 정적 Resource ARN, OIDC Provider 참조 또는 최초 생성, execution / task / 환경별 deploy Role, Staging 앱 Change Set Role, 앱 Log Group |
| app | ap-northeast-2 | Network / Data / IAM 출력, ECS Cluster / Task Definition / Service, ALB / Target Group / HTTPS Listener / origin 인증서·DNS / access log Bucket |
| budget | ap-northeast-2 | global 비용 알림의 CloudFormation Stack 관리·검증 Region. Environment 입력으로 Budget 이름 구성, 월 USD 300 알림 |

TASK-028 승인 순서는 Network → Data → certificate(us-east-1) → Frontend → IAM → App이다. 독립 Budget을 비용 Resource 전에, 공용 ECR을 이미지 Push 전에 확인·생성한다. Frontend는 App Resource 대신 origin hostname 문자열을 참조하므로 최초부터 API behavior를 생성하고 App 생성 후 연결 UPDATE는 하지 않는다. API가 동작하기 전 배포 수락을 주장하지 않는다. IAM의 앱 참조는 고정 Cluster moodfit-<환경>, Service / family moodfit-<환경>-backend의 예정 ARN을 전달한다. 자동 이름 Role은 실제 IAM 출력을 App에 전달하고 deploy 정책의 자기 Role 참조도 실제 출력으로 UPDATE한다. 상세 Human 실행과 Agent 조회는 [TASK-028 절차](18-STAGING-DEPLOYMENT-RUNBOOK.md)를 따른다. cross-region Export / ImportValue는 사용하지 않고 실제 ARN / ID는 비추적 Human 입력으로 전달한다.

`iam`은 Environment에 해당하는 deploy Role만 생성한다. Staging 앱 Change Set Role은 staging에서만 생성한다. Production 실행 승인 없이 production Parameter로 적용하지 않는다. IAM Identity Center 인스턴스 / Permission Set / 할당 / 로그인은 Human 관리 영역으로 남긴다. 기존 OIDC Provider가 있으면 GitHubOidcProviderArn을 전달하고 CreateOidcProvider는 false다. 최초 생성만 true와 빈 기존 ARN을 사용한다. 계정당 같은 GitHub Provider를 중복 생성하지 않는다.

## Parameter와 예시

TASK-028의 실제 입력은 Git 비추적 `infra/cloudformation/local/<stack>.parameters.json`에 둔다. Budget은 월 USD 300 계정 전체 비용 보수적 알림(실제 50 / 80 / 100%, forecast 100%)이며 강제 비용 차단이 아니다. 실제 Staging 원가는 별도 inventory로 확인한다. App Task Definition에 MoodFitEnvironment Tag를 추가해 승인 배포 Role 조건과 맞췄다. Frontend의 정적 behavior에만 /check-in·/history rewrite를 추가해 SPA 직접 접근을 지원하며 API 오류 변환은 없다. 검증 Script는 Budget 포함 8개 Template를 검사한다.

각 Template 옆의 `*.parameters.example.json`은 입력 형식만 보여준다. 꺾쇠 Placeholder는 비추적 Human 입력으로 바꾸며 그대로 적용할 수 없다. 예시의 기본 staging, VPC CIDR, hostname은 승인된 비민감 설정이다. AccountId / HostedZoneId / 인증서 / Provider / Resource ARN에는 실제 값이 없다.

Network는 AvailabilityZoneA / B를 서로 다르게 지정하고 CloudFrontOriginPrefixListId를 서울 조회 결과로 전달한다. 기본 VpcCidr는 10.40.0.0/16, 6개 /24 subnet으로 분할한다. Production / 다른 VPC와 중복되지 않는 CIDR을 최초 Change Set에서 확인한다. Public만 IGW 기본 경로, App은 같은 AZ NAT 기본 경로, Data는 기본 인터넷 경로가 없다. App은 HTTPS outbound와 DB 3306만, ALB는 CloudFront origin-facing prefix list 443 ingress와 App 8080 outbound만 허용한다. Data ingress는 App SG 3306만이다. loopback HTTPS egress 항목은 EC2의 자동 unrestricted egress 생성을 방지하는 비사용 항목이며 실제 외부 outbound 허용은 별도 SG Rule이다.

Data의 DatabaseIdentifier는 환경별 고유 이름이다. 로그 그룹을 먼저 생성한 뒤 DB를 생성한다. Data가 무작위 관리자 자격 증명을 생성하고 RDS는 동적 참조로 사용한다. 자동 교체는 설정하지 않으며 자격 증명 Resource는 두 보존 정책 모두 Retain이다. 관리자 이름은 moodfit_admin이다. MasterCredentialArn / AppDbCredentialArn 출력은 같은 Resource ARN이며 값은 출력하지 않는다. Staging 앱과 Flyway가 이 계정을 사용하는 예외를 Human이 승인했다. Production 전 TASK-030에서 최소 권한 앱 계정과 migration 계정을 분리해야 한다. Backup 14일 / TLS 강제 / MySQL 8.4.11 / Multi-AZ / 암호화 / 삭제 보호는 유지한다. UTC backup 18:00–18:30 / maintenance 일요일 19:00–19:30도 유지한다.

App의 DbCredentialArn과 IAM의 AppDbCredentialArn에는 Data의 AppDbCredentialArn 출력을 동일하게 전달한다. DatabaseEndpoint / DatabaseName도 Data 출력에서 전달한다. App은 IAM 소유 /moodfit/<환경>/application Log Group을 ApplicationLogGroupName으로 받아 사용한다(30일 보존). 같은 이름의 Log Group을 App에서 중복 생성하지 않으며 execution 정책의 stream 범위와 일치시킨다. Parameter 예시에서 origin 검증 입력 항목은 의도적으로 제외했다. app / frontend 두 Stack에 같은 값을 Human의 비추적 보호 경로로 추가하며 예시만으로 배포할 수 없다. NoEcho는 Parameter 표시를 가릴 뿐 Listener / Distribution 설정 조회 권한에서 값을 감추지 못한다. Agent / CI의 설정 조회에 값을 출력하지 않는다.

IAM은 RepositoryArn / AccountId로 이름을 통일했다. EnvironmentEcsSourceArnPattern은 같은 계정 서울 ECS 범위만, EnvironmentLogStreamArnPattern은 해당 앱 Log Group stream만 허용한다. Staging / Production 접두 Parameter는 각각 환경 전용 ARN이며 서로 대입하지 않는다. task revision Pattern은 승인된 family의 revision suffix만 허용한다. execution / task Role ARN은 생성할 Role의 예정 ARN으로 앱 입력과 대조한다. 앱 / 서비스 / 정적 Resource의 실제 출력과 예정 ARN이 일치하는지 적용 전에 확인한다.

`infra/iam/`은 DEC-029 정책 내용의 기준이다. `iam.yaml`은 그 정책을 구조화된 YAML PolicyDocument와 값 단위 Ref / Sub로 표현한 배포 표현이며 Action / Resource / Condition을 확대하지 않는다. 정책 변경 시 초안과 Template를 함께 비교해야 한다. 초기 Permission Set에 추가한 TASK-026 조회 Action은 Human이 별도로 프로비저닝한 정책이며 Template에서 Identity Center를 변경하지 않는다. CloudFormation 앱 service role의 SourceAccount / SourceArn 조건은 유지한다. 일반 Stack에서 context가 전달되는지 Human이 최초 적용 전에 확인하며 미지원이면 fail closed로 중단하고 별도 정책 검토한다.

## TASK-027 Application / Routing

CloudFront의 `/api`와 `/api/*`는 경로 그대로 HTTPS-only origin.staging.moodfit.8949db.kr로 전달한다. CachingDisabled와 사용자 정의 origin request 정책으로 query / cookie / viewer Host 외 모든 header를 전달한다. Host는 origin 이름으로 바뀌어 서울 인증서와 일치한다. GET / HEAD / OPTIONS / PUT / PATCH / POST / DELETE를 전달한다. API 오류의 상태·본문은 변환하지 않고 지원되는 error code의 최소 캐시 TTL을 0으로 둔다. 사용자 DNS는 A·AAAA이며 IPv6를 유지한다. [AWS origin request 정책](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html)과 [cache 정책](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)을 2026-10-03 확인했다. SPA rewrite / HTML·hashed asset cache 구분은 기존 후속 검토 대상으로 남긴다.

ALB는 Public subnet 2개와 Foundation ALB SG를 사용한다. ingress는 CloudFront origin-facing prefix list의 443만, Listener는 HTTPS 443만이다. 기본 응답 403, X-MoodFit-Origin 검증이 일치할 때만 Target Group HTTP 8080으로 전달한다. ECS는 Private App subnet 2개, Public IP 없음, App SG를 사용하며 RDS 3306 ingress / egress는 Foundation의 기존 App → Data SG 경로만 사용한다. SG를 중복 생성하거나 인터넷 ingress를 추가하지 않는다. Health 경로는 Container liveness / ALB readiness, 같은 8080 port다. Health 자체는 CloudFront behavior에 노출하지 않는다.

Fargate 1.4.0 / Linux X86_64, Desired Count 2 / 512 CPU / 1024 MiB를 Parameter화하되 승인 용량만 허용한다. 확장은 새 비용 Gate가 필요하다. AZ rebalancing을 켜고 rolling 최소 100% / 최대 200%, circuit breaker / rollback을 설정했다. 최대 4개 Task의 일시 비용·메모리·DB connection 수를 견적에 포함한다. Container curl liveness interval 30초 / timeout 5초 / retries 3 / startPeriod 120초, service grace 120초, ALB readiness interval 30초 / timeout 5초 / threshold 각각 2회 / matcher 200이다. startup / migration 지연 실측은 TASK-028에서 확인한다. 첫 배포에는 이전 COMPLETED deployment가 없어 자동 rollback 대상으로 쓸 것이 없다. ALB는 전체 target unhealthy 시 fail-open할 수 있다.

Task는 검증된 ECR digest 형식만 받고 non-root UID 10001로 실행한다. Dockerfile의 JVM 설정을 유지하며 /tmp 쓰기를 위해 ECS root filesystem은 기본 writable이다. Fargate empty bind volume의 기본 소유권으로 non-root가 쓰지 못하는 문제를 피하려고 read-only smoke의 tmpfs 구성을 그대로 옮기지 않았다. read-only ECS 강화는 writable 임시 경로와 실제 이미지 검증 후 별도 검토한다.

DB_URL에는 Connector/J sslMode REQUIRED를 넣어 암호화 연결이 불가능하면 실패하도록 한다. RDS의 require_secure_transport와 일치한다. [MySQL 공식 문서](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html)에 따르면 이 모드는 CA / hostname 검증까지 제공하지 않는다. RDS CA truststore와 VERIFY_IDENTITY의 실환경 검증은 후속 배포에서 확인할 잔여 위험이며 이번 Task에서 이미지나 Dependency를 바꾸지 않는다.

ALB access log Bucket은 SSE-S3 / public 차단 / 30일 expiration / Retain이며 별도 versioning은 켜지 않는다. 서비스의 로그 쓰기만 해당 계정 / Region과 alb/AWSLogs 경로로 제한하고 TLS 외 S3 요청을 거부한다. Bucket policy가 먼저 생성된 뒤 ALB를 생성한다. 정책은 ALB ARN을 직접 참조하지 않아 순환 의존이 없다. [AWS access logging 문서](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html)를 2026-10-03 확인했다.

## Flyway / Rollback

[Flyway 공식 FAQ](https://documentation.red-gate.com/fd/frequently-asked-questions-277579363.html)의 병렬 노드 설명에 따라 DB 잠금이 같은 schema history에 대한 migration을 조정한다. Task 2개 동시 startup 시 한쪽이 migration을 수행하고 다른 쪽은 잠금 대기 후 적용 이력을 확인한다. rolling 중 구·신 Task도 같은 DB를 공유한다. 잠금이 오래 걸리면 startup / health 유예와 충돌할 수 있으므로 TASK-028에서 두 Task 시작과 재배포를 실제 검증한다. 이 근거는 실제 RDS race Test 성공을 뜻하지 않는다.

잠금은 MySQL DDL의 원자성이나 구버전 앱과 새 Schema의 호환성을 보장하지 않는다. ECS가 이전 digest로 rollback해도 DB migration은 취소되지 않는다. 비파괴적 backward-compatible migration만 별도 검토하고 파괴적 migration / repair / DB 복원은 Human 승인 없이 수행하지 않는다.

## 정적 검증

Run 3에서는 IAM의 신뢰 정책과 inline 정책을 YAML 구조로 전환했다. Parameter 참조는 값 단위 Ref / Sub로 표현하며 승인된 권한과 조건은 유지한다. Secrets Manager 조회 Action은 단독 Statement의 한 줄 배열로 표현하여 Human이 승인한 정확한 허용 문구를 적용한다. 정책 전체를 escape된 JSON 문자열로 넣지 않는다.

`bash scripts/iac-validate.sh`는 Working Tree를 변경하지 않는다. 모든 Template cfn-lint → CloudFormation ValidateTemplate → 서울 가용성 순서이며 인증서 검증은 us-east-1을 사용한다. AWS 호출은 모두 고정 moodfit-readonly Profile과 명시 Region을 사용한다. Python module fallback을 지원하고 도구가 없으면 실패한다. Template 51,200 bytes 초과는 실패하며 S3 업로드로 우회하지 않는다.

가용성은 MySQL 8.4.11, db.t4g.small Multi-AZ / gp3 / 암호화 / 20 GiB 주문 가능성, 사용 가능한 일반 AZ 2개 이상, CloudFront origin-facing prefix list, 기존 8949db.kr Public Hosted Zone을 조회한다. 조회 결과는 개수로 판정하고 실제 계정 / ARN / Zone ID / 사용자 응답 및 AWS stderr는 출력하지 않는다. 이는 특정 입력 AZ / Zone ID나 DNS 위임의 실환경 검증을 대신하지 않는다. 실제 입력과 DNS 상태는 최초 적용 검토에서 재확인한다.

TASK-026의 최종 검증 이력은 Orchestrator Verify(cfn-lint 6개, validate-template 6개, 서울 가용성 5개 항목 통과)다. TASK-027의 Sandbox Python에서는 YAML / cfn-lint 모듈을 확인하지 못했고 Human 사용자 설치 경로는 접근이 거부됐다. 이번 변경의 YAML parsing / cfn-lint / AWS ValidateTemplate 성공을 주장하지 않는다. Bash 구문, 누적 변경 경로·승인 문구 검사, Diff / UTF-8 검사와 크기 검사는 Executor 참고 증거이며 Sandbox 밖 Orchestrator가 7개 Template의 최종 검증을 수행한다. AWS / 네트워크 조회와 실제 Stack 검증은 Executor가 수행하지 않았다.

## Change Set 기반 적용과 비용 Checkpoint

1. TASK-027까지 정적 검증 / Review된 정확한 Diff와 Parameter를 Human이 확인한다. 적용 계정 / Region / IAM 유효 권한 / 기존 Zone / 인증서 / 예정 ARN / DNS / GitHub Environment 보호를 확인한다.
2. TASK-028에서 Human은 검토할 Stack 목록, 최초 생성 권한과 IAM capability, 월 USD 300 / 환경 상한 및 상세 견적을 승인한다. ValidateTemplate 성공은 실행 승인이 아니다. read-only Profile로 생성하지 않는다.
3. Human 승인 경로에서 CREATE 또는 UPDATE Change Set을 준비한다. Foundation provisioning 권한은 기존 앱 Change Set Role 권한으로 대체할 수 없다. 실제 Parameter / header를 Agent Prompt나 로그에 넣지 않는다.
4. Resource별 Add / Modify / Remove, Replacement / Conditional Replacement, IAM 변경, 데이터 보존 / DNS 영향과 최종 비용을 검토한다. 검토한 Change Set의 실행을 Human이 승인한 뒤에만 실행한다. diff / 입력이 바뀌면 재검토한다.
5. Stack 상태 / 출력 연결 / 암호화 / SG / Backup / Origin 보호를 확인하고 TASK-028 Smoke로 검증한다. 실패 시 자동 재시도나 권한 확대를 하지 않는다. Production 최초 적용 / rollback은 별도 승인이다.

비용 Resource는 NAT 2개, EIP 2개 / Public IPv4, RDS Multi-AZ / gp3 / Backup / Snapshot, 생성 자격 증명 Resource 1개(Staging), ECR storage / scan, S3 객체 / version, CloudFront 전송 / 요청, CloudWatch 수집 / 보관, 기존 Hosted Zone / DNS 질의, ALB 시간·LCU·Public IPv4, Fargate 평시 2개·rolling 최대 4개, ALB 로그 S3 저장 / 요청이다. Production 계정 분리 시 추가 비용도 재산정한다. 유료 Interface Endpoint / 고객 관리 KMS / 자동 rotation은 추가하지 않는다. 월 약 USD 250은 기존 설계 추정이며 확정 견적이 아니다. TASK-028 전 상세 견적·Budget 확인과 월 USD 300 / 환경 비용 승인이 필요하며 상한 초과는 재승인한다.

## Replacement / 삭제 위험

| Resource | 보존 정책 / 위험 |
|---|---|
| RDS DBInstance | DeletionPolicy / UpdateReplacePolicy Snapshot, DeletionProtection true. 삭제 보호 해제도 별도 승인. Identifier / subnet / 암호화 / Engine 변경은 Replacement 또는 중단 가능. Snapshot은 새 DB에 자동 복원되지 않음 |
| 생성 자격 증명 | 두 정책 Retain. 이름 / 생성 설정 변경과 수동 값 교체는 RDS 동적 참조 및 실행 중 ECS 값과 자동 동기화되지 않음. 이전 관리형 RDS 설정에서 변경 시 관리자 이름 변경의 Replacement와 보존 데이터 / Snapshot / 잔존 비용을 Change Set에서 확인. 실제 Stack이 없는 현재는 최초 생성만 제안 |
| ECS / ALB / origin DNS·인증서 | 기본 Delete. Task Definition 변경은 새 revision, Service / Cluster 이름·subnet·certificate 교체는 중단 가능. Listener / Target Group 연결 선행 의존을 유지. Service rollback은 Schema rollback이 아님 |
| ALB access log Bucket | 두 정책 Retain / 객체 30일 expiration. Stack 삭제 후 Bucket과 비용 잔존, 객체 정리와 Bucket 삭제는 별도 승인 |
| S3 StaticBucket | 두 정책 Retain. 이름 / 설정 변경 및 Stack 삭제 후 version / 객체 비용 잔존. 삭제와 version 정리는 별도 승인 |
| ECR Repository | 두 정책 Retain. 이미지 자동 삭제 / lifecycle 미설정. Repository 교체 시 기존 digest 보존과 참조 이전 필요 |
| 앱 / RDS Log Group | 두 정책 Retain, 로그 retention 30일. Stack 제거 후 그룹 잔존 / 이름 충돌 / 저장 비용 점검 |
| OIDC Provider | 두 정책 Retain. 공용 Provider 삭제 / 교체 시 모든 deploy Trust 영향 |
| VPC / Subnet / NAT / Route / SG | 기본 Delete. CIDR / AZ 변경은 교체 가능, 후속 앱 / DB가 참조하면 제거가 실패하거나 연결 중단. Data / App 제거 전 dependency 확인 |
| 인증서 / CloudFront / DNS / IAM Role | 기본 Delete. 인증서 이름 / Role Trust / 배포 Role 교체, Distribution / DNS 제거는 접근 또는 배포 중단. 실제 연결 / cache 전파 / 사용 중 인증서를 검토 |

Retain은 백업이 아니며 Snapshot도 논리적 오류를 해결하지 않는다. 기본 7일 뒤 Human이 정리 / 연장을 검토하고 삭제 목록과 보존 데이터 / 잔존 비용을 별도 승인한다. DB final snapshot 및 수동 Snapshot 30일 보존 확인 후 삭제한다. 이 Task는 삭제 도구나 적용 자동화를 제공하지 않는다.
