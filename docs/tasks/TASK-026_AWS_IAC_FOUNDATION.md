# TASK-026 — AWS Infrastructure as Code Foundation

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

승인된 AWS Architecture와 IAM 정책을 Code로 재현할 수 있도록 Infrastructure as Code 기반을 만든다.
프로젝트 교육 맥락상 **CloudFormation을 우선**하되, 승인 문서가 다른 IaC를 선택했다면 그 결정을 따른다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-023 / TASK-025 Human Approved
- Human이 IAM Identity Center와 로컬 Profile 구성을 마침

## AWS 접근

- 정적 검증 / Template 검증이 AWS API를 필요로 하면 Human이 `moodfit-readonly`(또는 승인된 Profile)로 SSO 로그인한 뒤 Agent가 사용한다.
- 이 Task에서는 Stack을 생성 / 변경하지 않는다. (최초 적용은 TASK-028)

## Codex 작업 범위

승인된 Architecture 범위에서 다음 Foundation Resource를 IaC로 정의한다.

- Network (VPC / Subnet / Route / Security Group 등)
- ECR
- Frontend S3 / CloudFront 및 Origin 보호
- RDS MySQL (TASK-023에서 승인된 Engine Version) + Subnet / Security / Parameter / Backup / Deletion Protection 정책
- Secret Reference 구조
- 필요한 Log / Resource Tag (Owner / Environment / Project 등)
- GitHub OIDC Provider / Deploy Role, IAM Identity Center 연계 리소스 중 IaC로 관리하기로 승인된 범위 (TASK-025)

큰 Stack이면 Network / Data / Frontend / IAM 등 의미 있는 단위로 나눈다. 실제 비용 Resource를 만들기 전 Human Approval Checkpoint를 둔다.

## 안전 규칙

- Password Hardcode 금지
- RDS Public Access 금지 (승인된 예외 없이는)
- S3 Public Bucket 정책 금지, CloudFront Origin 보호 사용
- Destructive Update / Replacement 가능 Resource 명시
- 데이터 Resource의 DeletionPolicy / UpdateReplacePolicy 검토
- Account ID / SSO Start URL 등 환경 고유값을 Template에 넣지 않음

## TASK-023에서 넘어온 설계 입력 (2026-10-03)

- DNS: `8949db.kr` 위임 복구 완료(2026-10-03 Claude 세션 확인). 가비아에서 네임서버를 새 Route 53 Public Hosted Zone 값 4개로 변경했다. .kr 레지스트리 반영과 Route 53 응답을 확인했다. Hosted Zone은 Human이 콘솔에서 만들었으므로 IaC에서는 새로 만들지 않고 **기존 Zone을 참조**(import 또는 data source)한다.
- TASK-023 Review N-001: ALB listener는 HTTPS 443만 사용한다(HTTP 80은 만들지 않거나 443 리다이렉트만 허용, 결정 필요). ALB SG ingress는 CloudFront origin-facing managed prefix list의 443만 허용한다. CloudFront origin protocol policy는 HTTPS only로 한다. 검증 header 조건은 유지한다.
- 선행 조건 처리 현황(2026-10-03): 최소 권한 Profile 구성과 실제 Preflight 확인 완료(TASK-025), MySQL 8.4.11 전환 완료(TASK-033, DEC-030), Secret Guard 허용 목록 도입 완료(TASK-034). Region / Engine / Class 가용성 확인은 이 Task에서 `moodfit-readonly`로 수행한다.

## Human 결정 (2026-10-03, Gate 사전 승인) / 실행 기준

Human이 아래를 승인했다. 이 Task는 Template 작성과 정적 검증만 한다. **Stack을 만들거나 바꾸지 않으며 비용 Resource를 생성하지 않는다.** 최초 적용은 TASK-028에서 별도 승인으로 한다.

1. **IaC 도구**: CloudFormation(YAML). 위치는 `infra/cloudformation/`.
2. **Stack 구성**: 의미 단위로 분리한다. Network / ECR / Data(RDS) / Frontend(S3 + CloudFront) / 인증서(us-east-1, CloudFront용) / IAM(GitHub OIDC Provider, 배포 Role, ECS execution · task Role). ALB / ECS Service / Task Definition은 TASK-027 범위다. Frontend Stack의 `/api` origin(ALB)처럼 TASK-027 Resource에 의존하는 부분은 Parameter / Stack 분리 / 조건으로 설계하고 근거를 문서에 적는다.
3. **RDS 관리자 자격 증명**: RDS가 Secrets Manager에 직접 생성 / 관리하는 방식(`ManageMasterUserPassword`)을 쓴다. Template / Parameter / 예시 파일에 값을 넣지 않는다. 앱용 DB 사용자와 값의 전달 구조(Secret Reference)는 DEC-029를 따른다.
4. **ALB Listener**: HTTPS 443만 사용한다. HTTP 80 Listener는 만들지 않는다(TASK-027에 전달). 이 Task의 Security Group 설계에서 ALB ingress는 CloudFront origin-facing managed prefix list의 443만 허용한다.
5. **Hostname**: Staging 사용자 hostname `staging.moodfit.8949db.kr`, ALB origin hostname `origin.staging.moodfit.8949db.kr`. Route 53 Public Hosted Zone(`8949db.kr`)은 Human이 콘솔에서 만든 기존 Zone을 Parameter(Hosted Zone ID)로 참조하며 Template에서 새로 만들지 않는다.
6. **검증 도구**: `aws cloudformation validate-template`(Profile `moodfit-readonly`)과 cfn-lint. cfn-lint는 Claude 세션이 이 PC에 `pip --user`로 Version 1.57.1을 설치했다(프로젝트 Dependency 파일은 바꾸지 않는다). PATH에 없으므로 `scripts/iac-validate.sh`는 `cfn-lint` 명령이 있으면 그것을, 없으면 Python Module 진입점(`from cfnlint.runner import main`)을 호출한다. 설치되어 있지 않으면 명확한 오류로 실패한다.
7. **환경 고유값**: Account ID, 인증서 ARN, Hosted Zone ID, OIDC Provider ARN 등은 Parameter로 받는다. 저장소에는 Placeholder 예시만 둔다.

승인된 Architecture / 정책: DEC-027(B안: 환경별 VPC, 2 AZ Public / Private App / Private Data, AZ별 NAT 2개, S3 Gateway Endpoint, RDS MySQL 8.4 db.t4g.small Multi-AZ gp3 20 GiB 암호화 / 삭제 보호 / Backup 14일, Log 30일, 서울), DEC-028(ECR immutable Tag, `sha-<commit>`), DEC-029(`infra/iam/` 정책 초안, 단일 ECR Repository 승격 모델, OIDC Trust, Role 분리), DEC-030(MySQL 8.4.11).

### Codex 작업 범위 (이 Run)

1. `infra/cloudformation/`에 Stack Template과 Parameter 예시(Placeholder만)를 작성한다. `infra/iam/`의 정책 초안과 일치시키고, 중복 정의가 생기면 어느 쪽이 기준인지 문서에 적는다. DEC-029 Review의 Parameter 이름 정리(N-003 / N-004)를 반영한다.
2. `scripts/iac-validate.sh`(bash, `set -euo pipefail`, Git Bash on Windows와 Linux에서 동작):
   - Orchestrator Verify가 Sandbox 밖에서 실행한다. Executor Sandbox에서는 AWS / 네트워크에 접근하지 못할 수 있으므로 직접 실행해 보지 못한 채 작성한다는 점을 감안해 단순하고 방어적으로 쓴다. 단계 이름과 실패 원인을 출력한다.
   - **모든 AWS 명령에 `--profile moodfit-readonly`와 `--region`을 명시한다.** Profile을 환경변수로 받거나 기본 Profile에 의존하지 않는다(이 PC의 기본 Profile은 관리자 세션이다). 다른 Profile 이름이 Script에 나오면 안 된다.
   - 단계: (a) 모든 Template에 cfn-lint, (b) 모든 Template에 `cloudformation validate-template`(us-east-1 인증서 Stack은 해당 Region으로), (c) 가용성 확인: 서울에서 RDS MySQL 8.4.11 제공 여부, db.t4g.small Multi-AZ gp3 주문 가능 여부, 사용 AZ 2개, CloudFront origin-facing managed prefix list 존재, `8949db.kr` Public Hosted Zone 존재. 결과는 통과 / 실패와 비민감 요약만 출력한다. **Account ID, ARN, Hosted Zone ID, 사용자 식별값을 출력하지 않는다.**
   - Template이 51,200 bytes를 넘어 `--template-body`로 검증할 수 없으면 실패로 처리하고 Stack 분리를 다시 검토한다(S3 업로드 방식은 쓰지 않는다).
   - Working Tree를 변경하지 않는다.
   - 읽기 전용 API만 쓴다. `create-` / `update-` / `delete-` / `deploy` / `execute-` 계열 명령을 넣지 않는다.
3. 문서: `docs/17-AWS-IAC-FOUNDATION.md`(Stack 구성과 의존 순서, Parameter, Change Set 기반 적용 절차, Replacement / 삭제 위험 Resource, DeletionPolicy / UpdateReplacePolicy, 비용이 발생하는 Resource 목록과 TASK-028 승인 Checkpoint), `docs/13` / `docs/15` 갱신.
4. 안전 규칙(이 문서의 "안전 규칙" 절)을 지킨다. RDS / S3 등 데이터 Resource에 DeletionPolicy / UpdateReplacePolicy를 명시한다.
5. Secret 검사: Contract의 `secret_scan_allow`에 RDS 관리형 자격 증명을 켜는 CloudFormation 속성 줄(속성 이름, 콜론, 공백, true)이 허용 문구로 승인되어 있다. Template에는 이 표기를 정확히 그대로 쓴다(뒤에 주석이나 다른 문자를 붙이지 않는다).
   - **Executor 입력에서 Contract의 허용 문구 값이 마스킹되어 보이는 것은 정상이다.** Orchestrator는 허용 목록과 무관하게 Agent 입력과 Run 기록을 엄격하게 마스킹한다(TASK-034 결정 3). 그래서 입력으로 받은 Contract JSON에서는 속성 이름 뒤의 값이 가려져 보이지만, 실제 Contract 파일과 Guard 판정에는 원래 문구(속성 이름, 콜론, 공백 한 칸, 소문자 true)가 적용된다. 이것을 문서 충돌로 보고 정지하지 않는다. Run 1(`2026-10-03T09-12-07-335Z-765f02b7`)은 이 마스킹을 충돌로 판단해 편집 전에 정지했고, Claude 세션이 원인을 확인했다. 그 밖에 자격 증명 단어 뒤에 콜론 / 등호와 값이 오는 표기가 필요하면 그대로 쓰되, Guard에서 정지하면 Human이 문구를 승인해 Resume한다. 실제 자격 증명 값은 어디에도 쓰지 않는다.
6. 완료 반영: TASK-026 DONE / **TASK-027 READY** / AGENTS.md 3절.
7. 새로 Human 결정이 필요한 사항만 `human_decisions_needed`로 보고한다(예: 승인된 Architecture와 다른 구성이 필요한 경우, 가용성 문제로 Class / Version을 바꿔야 하는 경우). 이후 Task의 항목은 보고하지 않는다.

### Human 선행 작업

`MoodFitReadOnly` Permission Set의 inline 정책에 다음 조회 Action을 추가해 다시 프로비저닝한다(관리 계정 콘솔): `cloudformation:ValidateTemplate`, `rds:DescribeDBEngineVersions`, `rds:DescribeOrderableDBInstanceOptions`, `ec2:DescribeAvailabilityZones`, `ec2:DescribeManagedPrefixLists`, `route53:ListHostedZonesByName`. 기존 `sts:GetCallerIdentity`는 유지한다. Claude 세션이 권한 적용을 확인한 뒤 Orchestrator를 실행한다.

## Verification

- CloudFormation Validate / Lint 가능한 범위
- Change Set 기반 변경 검토 절차 문서화
- Parameter / Example 파일에 실제 Secret 금지
- Template Dependency / Reference 검증

## Claude Review 기준

- Network Isolation
- Security Group 최소화
- RDS Deletion / Backup
- CloudFront / S3 Public Exposure
- Hardcoded Account / Region / Secret
- Replacement 위험
- 비용이 큰 Resource가 승인 범위를 넘지 않는가

## 완료 조건

IaC가 정적 검증되고 Human이 최초 Apply / Change Set을 승인할 준비가 되면 REVIEW. 실제 Staging 생성은 TASK-028에서 한다.
