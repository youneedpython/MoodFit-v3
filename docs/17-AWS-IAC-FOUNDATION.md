# 17. AWS IaC Foundation

2026-10-03 TASK-026 구현. 승인 기준은 DEC-027 / DEC-028 / DEC-029 / DEC-030과 TASK-026 Contract다. CloudFormation YAML 작성만 완료했으며 실제 Stack / IAM / DNS / 비용 Resource는 생성하거나 변경하지 않았다. 최초 적용은 TASK-027 Template 통합 검토 후 TASK-028의 별도 Human 승인으로 수행한다.

## Stack과 의존 순서

| Stack | Region | 책임 / 선행 입력 |
|---|---|---|
| network | ap-northeast-2 | 환경별 VPC, 서로 다른 AZ 2개, Public / Private App / Private Data 각 2개, AZ별 NAT, S3 Gateway Endpoint, ALB / App / Data SG |
| ecr | ap-northeast-2 | 두 환경이 참조할 단일 immutable Repository. 한 번만 생성하며 환경별 중복 생성 금지 |
| data | ap-northeast-2 | Network의 Data subnet / SG, MySQL 8.4.11, db.t4g.small, Multi-AZ, gp3 20 GiB, 관리형 관리자 자격 증명, TLS Parameter Group |
| certificate | us-east-1 | 기존 Public Hosted Zone과 Staging 사용자 hostname의 ACM DNS 검증 인증서 |
| frontend | ap-northeast-2 | 인증서 ARN을 수동 전달, Private S3 REST origin / OAC / CloudFront / 기존 Zone의 사용자 A alias |
| iam | ap-northeast-2 | 공용 ECR 및 환경별 앱 / 정적 Resource ARN, OIDC Provider 참조 또는 최초 생성, execution / task / 환경별 deploy Role, Staging 앱 Change Set Role, 앱 Log Group |

Network / ECR / 인증서는 독립적으로 검토한다. Network 뒤 Data, 인증서 뒤 Frontend, Foundation 출력과 TASK-027 앱 Resource의 예정 ARN을 연결해 IAM과 앱 Stack을 검토한다. cross-region Export / ImportValue는 사용하지 않으며 모든 Stack 사이 연결은 Parameter로 명시한다. 출력은 Human이 비추적 입력에서 전달하며 실제 ARN / ID를 저장소나 Agent 입력에 기록하지 않는다.

`iam`은 Environment에 해당하는 deploy Role만 생성한다. Staging 앱 Change Set Role은 staging에서만 생성한다. Production 실행 승인 없이 production Parameter로 적용하지 않는다. IAM Identity Center 인스턴스 / Permission Set / 할당 / 로그인은 Human 관리 영역으로 남긴다. 기존 OIDC Provider가 있으면 GitHubOidcProviderArn을 전달하고 CreateOidcProvider는 false다. 최초 생성만 true와 빈 기존 ARN을 사용한다. 계정당 같은 GitHub Provider를 중복 생성하지 않는다.

## Parameter와 예시

각 Template 옆의 `*.parameters.example.json`은 입력 형식만 보여준다. 꺾쇠 Placeholder는 비추적 Human 입력으로 바꾸며 그대로 적용할 수 없다. 예시의 기본 staging, VPC CIDR, hostname은 승인된 비민감 설정이다. AccountId / HostedZoneId / 인증서 / Provider / Resource ARN에는 실제 값이 없다.

Network는 AvailabilityZoneA / B를 서로 다르게 지정하고 CloudFrontOriginPrefixListId를 서울 조회 결과로 전달한다. 기본 VpcCidr는 10.40.0.0/16, 6개 /24 subnet으로 분할한다. Production / 다른 VPC와 중복되지 않는 CIDR을 최초 Change Set에서 확인한다. Public만 IGW 기본 경로, App은 같은 AZ NAT 기본 경로, Data는 기본 인터넷 경로가 없다. App은 HTTPS outbound와 DB 3306만, ALB는 CloudFront origin-facing prefix list 443 ingress와 App 8080 outbound만 허용한다. Data ingress는 App SG 3306만이다. loopback HTTPS egress 항목은 EC2의 자동 unrestricted egress 생성을 방지하는 비사용 항목이며 실제 외부 outbound 허용은 별도 SG Rule이다.

Data의 DatabaseIdentifier는 환경별 고유 이름이다. 로그 그룹을 먼저 생성한 뒤 DB를 생성해 자동 생성 로그 그룹과 충돌하지 않게 한다. AppDbCredentialArn은 Human이 별도 생성 / 관리하는 최소 DML 앱 사용자 credential의 전체 ARN이며 관리자 Secret을 전달하지 않는다. 앱 사용자 생성 / migration / 값 주입은 후속 배포 범위다. 관리형 관리자 Secret의 ARN만 출력하며 값은 출력하지 않는다. 자동 rotation / 고객 관리 KMS는 추가하지 않는다. error / slowquery와 앱 로그는 30일 보존한다. Backup은 14일, UTC backup 18:00–18:30 / maintenance 일요일 19:00–19:30으로 분리한다.

IAM은 RepositoryArn / AccountId로 이름을 통일했다. EnvironmentEcsSourceArnPattern은 같은 계정 서울 ECS 범위만, EnvironmentLogStreamArnPattern은 해당 앱 Log Group stream만 허용한다. Staging / Production 접두 Parameter는 각각 환경 전용 ARN이며 서로 대입하지 않는다. task revision Pattern은 승인된 family의 revision suffix만 허용한다. execution / task Role ARN은 생성할 Role의 예정 ARN으로 앱 입력과 대조한다. 앱 / 서비스 / 정적 Resource의 실제 출력과 예정 ARN이 일치하는지 적용 전에 확인한다.

`infra/iam/`은 DEC-029 정책 내용의 기준이다. `iam.yaml`은 그 정책을 구조화된 YAML PolicyDocument와 값 단위 Ref / Sub로 표현한 배포 표현이며 Action / Resource / Condition을 확대하지 않는다. 정책 변경 시 초안과 Template를 함께 비교해야 한다. 초기 Permission Set에 추가한 TASK-026 조회 Action은 Human이 별도로 프로비저닝한 정책이며 Template에서 Identity Center를 변경하지 않는다. CloudFormation 앱 service role의 SourceAccount / SourceArn 조건은 유지한다. 일반 Stack에서 context가 전달되는지 Human이 최초 적용 전에 확인하며 미지원이면 fail closed로 중단하고 별도 정책 검토한다.

## TASK-027 경계

Frontend Foundation은 정적 origin만 정의한다. ALB를 아직 생성하지 않으므로 `/api`와 `/api/*` origin / behavior를 이 단계에 연결하지 않는다. 실제 앱 배포 전 TASK-027에서 origin.staging.moodfit.8949db.kr, 서울 ACM 인증서, HTTPS 443 Listener, HTTPS-only origin과 Human 관리 header 검증을 추가한다. HTTP 80 Listener는 만들지 않는다. API cache 비활성화, query / header / method 전달, API 오류 보존도 그 Task에서 통합한다. SPA fallback과 HTML / hashed asset cache 구분은 배포 전에 추가 검토한다. 현재 Foundation만으로 완성된 앱을 공개하지 않는다. Distribution 전체 오류를 200 HTML로 변환하는 설정은 없다.

ALB access log S3 30일 정책은 ALB 구성과 함께 TASK-027에서 정의한다. origin header 값은 Template / 예시 / Agent 입력에 넣지 않고 DEC-029의 Human 경로에서 적용한다. 해당 Task의 최초 생성 권한 / 비용 / Secret 전달 검토를 유지한다.

## 정적 검증

Run 3에서는 IAM의 신뢰 정책과 inline 정책을 YAML 구조로 전환했다. Parameter 참조는 값 단위 Ref / Sub로 표현하며 승인된 권한과 조건은 유지한다. Secrets Manager 조회 Action은 단독 Statement의 한 줄 배열로 표현하여 Human이 승인한 정확한 허용 문구를 적용한다. 정책 전체를 escape된 JSON 문자열로 넣지 않는다.

`bash scripts/iac-validate.sh`는 Working Tree를 변경하지 않는다. 모든 Template cfn-lint → CloudFormation ValidateTemplate → 서울 가용성 순서이며 인증서 검증은 us-east-1을 사용한다. AWS 호출은 모두 고정 moodfit-readonly Profile과 명시 Region을 사용한다. Python module fallback을 지원하고 도구가 없으면 실패한다. Template 51,200 bytes 초과는 실패하며 S3 업로드로 우회하지 않는다.

가용성은 MySQL 8.4.11, db.t4g.small Multi-AZ / gp3 / 암호화 / 20 GiB 주문 가능성, 사용 가능한 일반 AZ 2개 이상, CloudFront origin-facing prefix list, 기존 8949db.kr Public Hosted Zone을 조회한다. 조회 결과는 개수로 판정하고 실제 계정 / ARN / Zone ID / 사용자 응답 및 AWS stderr는 출력하지 않는다. 이는 특정 입력 AZ / Zone ID나 DNS 위임의 실환경 검증을 대신하지 않는다. 실제 입력과 DNS 상태는 최초 적용 검토에서 재확인한다.

Executor Sandbox의 Python에서는 cfn-lint 모듈을 확인하지 못했다. AWS / 네트워크 검증은 직접 실행하지 않았으며 Sandbox 밖 Orchestrator Verify가 최종 검증 기준이다. Bash 구문, 6개 YAML 파싱 / Reference / Parameter / 크기 제한, IAM 정책 초안 내용 대조와 Diff / UTF-8 검사 결과는 Executor 참고 증거다. 이 중 YAML 파싱은 Run 2 시점의 증거이며 Run 3에서는 Sandbox Python에 YAML 모듈이 없어 다시 실행하지 못했다. 최종 판정 근거는 Orchestrator Verify(cfn-lint 6개, validate-template 6개, 서울 가용성 5개 항목 통과)다.

## Change Set 기반 적용과 비용 Checkpoint

1. TASK-027까지 정적 검증 / Review된 정확한 Diff와 Parameter를 Human이 확인한다. 적용 계정 / Region / IAM 유효 권한 / 기존 Zone / 인증서 / 예정 ARN / DNS / GitHub Environment 보호를 확인한다.
2. TASK-028에서 Human은 검토할 Stack 목록, 최초 생성 권한과 IAM capability, 월 USD 300 / 환경 상한 및 상세 견적을 승인한다. ValidateTemplate 성공은 실행 승인이 아니다. read-only Profile로 생성하지 않는다.
3. Human 승인 경로에서 CREATE 또는 UPDATE Change Set을 준비한다. Foundation provisioning 권한은 기존 앱 Change Set Role 권한으로 대체할 수 없다. 실제 Parameter / header를 Agent Prompt나 로그에 넣지 않는다.
4. Resource별 Add / Modify / Remove, Replacement / Conditional Replacement, IAM 변경, 데이터 보존 / DNS 영향과 최종 비용을 검토한다. 검토한 Change Set의 실행을 Human이 승인한 뒤에만 실행한다. diff / 입력이 바뀌면 재검토한다.
5. Stack 상태 / 출력 연결 / 암호화 / SG / Backup / Origin 보호를 확인하고 TASK-028 Smoke로 검증한다. 실패 시 자동 재시도나 권한 확대를 하지 않는다. Production 최초 적용 / rollback은 별도 승인이다.

비용 Resource는 NAT 2개, EIP 2개 / Public IPv4, RDS Multi-AZ / gp3 / Backup / Snapshot, Secrets Manager 관리자와 앱 credential, ECR storage / scan, S3 객체 / version, CloudFront 전송 / 요청, CloudWatch 수집 / 보관, 기존 Hosted Zone / DNS 질의다. ALB / Fargate / ALB log 저장소는 TASK-027 견적에서 합산한다. 유료 Interface Endpoint / 고객 관리 KMS / 자동 rotation은 추가하지 않는다. 월 약 USD 250은 기존 설계 추정이며 확정 견적이 아니다. 300 상한 초과는 생성 전 재승인한다.

## Replacement / 삭제 위험

| Resource | 보존 정책 / 위험 |
|---|---|
| RDS DBInstance | DeletionPolicy / UpdateReplacePolicy Snapshot, DeletionProtection true. 삭제 보호 해제도 별도 승인. Identifier / subnet / 암호화 / Engine 변경은 Replacement 또는 중단 가능. Snapshot은 새 DB에 자동 복원되지 않음 |
| S3 StaticBucket | 두 정책 Retain. 이름 / 설정 변경 및 Stack 삭제 후 version / 객체 비용 잔존. 삭제와 version 정리는 별도 승인 |
| ECR Repository | 두 정책 Retain. 이미지 자동 삭제 / lifecycle 미설정. Repository 교체 시 기존 digest 보존과 참조 이전 필요 |
| 앱 / RDS Log Group | 두 정책 Retain, 로그 retention 30일. Stack 제거 후 그룹 잔존 / 이름 충돌 / 저장 비용 점검 |
| OIDC Provider | 두 정책 Retain. 공용 Provider 삭제 / 교체 시 모든 deploy Trust 영향 |
| VPC / Subnet / NAT / Route / SG | 기본 Delete. CIDR / AZ 변경은 교체 가능, 후속 앱 / DB가 참조하면 제거가 실패하거나 연결 중단. Data / App 제거 전 dependency 확인 |
| 인증서 / CloudFront / DNS / IAM Role | 기본 Delete. 인증서 이름 / Role Trust / 배포 Role 교체, Distribution / DNS 제거는 접근 또는 배포 중단. 실제 연결 / cache 전파 / 사용 중 인증서를 검토 |

Retain은 백업이 아니며 Snapshot도 논리적 오류를 해결하지 않는다. 기본 7일 뒤 Human이 정리 / 연장을 검토하고 삭제 목록과 보존 데이터 / 잔존 비용을 별도 승인한다. DB final snapshot 및 수동 Snapshot 30일 보존 확인 후 삭제한다. 이 Task는 삭제 도구나 적용 자동화를 제공하지 않는다.
