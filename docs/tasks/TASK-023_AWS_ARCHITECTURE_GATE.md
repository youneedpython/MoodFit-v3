# TASK-023 — AWS Deployment Architecture / Cost Gate

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

MoodFit v3를 AWS에 배포하기 위한 **실제 Resource 생성 전 Architecture / Cost / Security 결정**을 Human Gate로 확정한다. 이번 Task는 설계 / 결정 단계이며 AWS Resource를 만들지 않는다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-022 DONE (Multi-Agent Harness 안정화)

## 반드시 검토할 목표 구조

Agent는 아래를 시작점으로 검토하되 Human 승인 전 확정하지 않는다.

- Frontend: Vite Build Artifact → S3 → CloudFront
- Backend: Spring Boot Container → ECR → ECS Fargate → ALB
- Database: RDS MySQL
- Secret: AWS Managed Secret 방식
- 사람 / 로컬 Agent 인증: AWS IAM Identity Center(SSO) → Permission Set → `aws sso login` Profile
- CI / CD 인증: GitHub OIDC → AWS IAM Role
- `/api/*` Routing 또는 Frontend API Endpoint 전략

## 필수 비교안

최소 2개를 비교한다.

- A. 교육 / 비용 최적화형: 단순 Network, 최소 고정비
- B. Production-like형: Public ALB + Private App / Data Subnet 등 격리 강화

각 안에 대해 다음을 제시한다.

- Resource 목록
- Network Flow
- 예상 비용 요인 (NAT / ALB / RDS / CloudFront / ECR 등)
- Security 장단점
- 운영 복잡도
- 배포 / 롤백 난이도
- 학생 실습 적합성

## RDS MySQL Version 검토

- Local / Testcontainers 기준은 MySQL `8.0.46`(DEC-023)이다.
- RDS for MySQL 8.0의 표준 지원 종료와 유료 Extended Support 일정 / 요금을 **AWS 공식 문서로 확인**한다.
- 비교: RDS `8.0` 유지(Extended Support 비용) vs `8.4` LTS 전환
- `8.4`로 전환하면 Local MySQL, Testcontainers Image(DEC-023), CI 검증을 함께 바꾸는 별도 결정이 필요하다.

## Human Approval 항목

- Architecture Option
- AWS Region
- AWS 계정 구조: Staging / Production 같은 계정 vs 계정 분리 (IAM Identity Center 사용 전제)
- IAM Identity Center 사용 범위와 Permission Set 구성 (상세 설계는 TASK-025)
- VPC / Public / Private Subnet 전략
- NAT Gateway / VPC Endpoint 사용 여부
- RDS Engine Version / Class / Storage / HA 수준
- ECS Desired Count / CPU / Memory 기준
- 도메인 / HTTPS 범위
- Logging 수준
- Staging / Production 분리 방식
- 비용 상한 / 정리 정책

## 산출물

- AWS Architecture 문서
- Mermaid / ASCII Architecture Diagram
- Security Boundary (사람 SSO / Agent / CI-CD OIDC 경계 포함)
- Cost Decision Matrix
- 새 Decision 초안 (최신 Decision 다음 번호 사용, 예: DEC-027)

## 외부 근거 확인 방식 (Human 승인, 2026-10-02)

Codex(기본 설정)와 Reviewer Claude(Read / Grep / Glob)는 Web에 접근하지 않는다. Agent 권한 / 설정은 바꾸지 않고 다음과 같이 처리한다.

- Codex는 AWS 공식 문서 기반 사실(RDS MySQL 8.0 표준 지원 종료 / Extended Support 일정·요금, 서비스 가격, Region 가용성 등)마다 근거 URL을 적고, 실행 시점에 확인하지 못한 값은 `확인 필요`로 명확히 표시한다. 추정값을 확정값처럼 쓰지 않는다.
- Human Gate에서 Claude 세션이 공식 문서로 `확인 필요` 항목과 핵심 수치를 사실 확인해 결과를 함께 제시한다.
- 산출물 경로: `docs/13-AWS-ARCHITECTURE.md`, Decision 초안은 `docs/09-DECISIONS.md`(DEC-027, Pending Human Approval).

## 제외 범위

- CloudFormation / Terraform 작성
- AWS CLI로 Resource 생성
- IAM Identity Center / IAM Role 실제 생성
- GitHub Secret / Environment 변경

## Claude Review 기준

- SPOF / 보안 / 비용 누락
- Public Exposure 과다 여부
- Secret 저장 방식
- RDS Version 지원 기간 / 비용, 삭제 / Backup 정책
- CloudFront / S3 Origin 보호
- ECS → RDS Connectivity
- Staging / Production 경계, 사람 / Agent / CI 권한 경계

## 완료 조건

Human이 Architecture / Cost Option을 승인하고 Decision이 Human Approved가 된 뒤에만 TASK-024를 READY로 전환한다.
