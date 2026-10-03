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
- 선행 조건 잔여: 최소 권한 Staging Profile / Agent 허용 Profile(TASK-025), MySQL 8.4 Local / Testcontainers / CI 전환 Decision(DEC-023 변경), Region / Engine / Class 가용성 확인

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
