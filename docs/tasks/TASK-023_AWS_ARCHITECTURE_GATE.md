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
- Secret 관리: AWS Managed Secret 방식
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
- 작성 규칙(Orchestrator Secret 검사 오탐 방지): 산출물에 `password` / `token` / `secret` / `api key` 바로 뒤에 `:` 또는 `=`를 붙인 Key-Value 표기를 쓰지 않는다. "DB 비밀번호는 Secrets Manager에 저장한다"처럼 문장으로 쓴다. 실제 Secret 값 / 예시 Key는 쓰지 않는다.
- 산출물 경로: `docs/13-AWS-ARCHITECTURE.md`, Decision 초안은 `docs/09-DECISIONS.md`(DEC-027, Pending Human Approval).

## Gate 검토 자료 — Human 결정 대기 (2026-10-02, Claude 세션 기록)

### 실행 결과

- 1차 Run(`2026-10-02T08-27-14-044Z-ef840bc4`): Preflight BLOCKED. Task 문서 문구가 Orchestrator Secret 검사에 오탐으로 걸렸다. Human 결정 A로 문구를 고치고 작성 규칙을 추가했다(`7c1d1d7`).
- 2차 Run(`2026-10-02T08-30-58-975Z-f32eb40a`): Codex가 `docs/13-AWS-ARCHITECTURE.md`, DEC-027 초안(Pending), 07 / 08 / AGENTS.md 3절, `prompts/45`를 작성했다. Verify(`git diff --check`, Orchestrator Test 74개) 성공. Claude Review 1회차 결과는 `HUMAN_REQUIRED`이며 기술적 Blocker는 없다.
  - H-003: RDS 8.4를 선택해도 DEC-023(Local / Testcontainers 8.0.46)을 대체하지 않는다. 별도 Decision / Gate가 필요하다.
  - F-001(경미): 07-TASKS의 `## TASK-023` 제목 앞에 빈 줄 / `---` 구분이 없다. WORK_LOG의 Test 시간은 Executor 자체 실행값이므로 Orchestrator Verify 결과를 함께 기록한다.
- Codex 산출물은 변경 없이 Commit했다(`053529f`).

### 공식 근거 사실 확인 (Claude 세션, 2026-10-02 조회)

출처: [RDS for MySQL versions](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/MySQL.Concepts.VersionMgmt.html), AWS Price List API `ap-northeast-2` (AmazonRDS 2026-10-01, AmazonECS 2026-09-11 게시본, AWSELB / AmazonVPC / AmazonEC2 현재본)

| 항목 | 확인 결과 |
|---|---|
| RDS MySQL 8.0 | 표준 지원 종료 2026-07-31(이미 종료). Extended Support 1년차 2026-08-01, 3년차 2028-08-01, 종료 2029-07-31. AWS 문서는 8.0이 "Extended Support로만 제공"된다고 명시한다. 새로 만들면 처음부터 유료다. |
| RDS MySQL 8.4 | 표준 지원 종료 2029-07-31. RDS 최신 minor 8.4.11. |
| Extended Support 단가 (서울, MySQL 8) | vCPU-hour당 1·2년차 USD 0.12, 3년차 USD 0.24 |
| db.t4g.micro / small | 둘 다 2 vCPU. micro Single-AZ USD 0.025/h, small Single-AZ USD 0.051/h, small Multi-AZ USD 0.102/h |
| RDS gp3 | Single-AZ USD 0.131/GB-월, Multi-AZ USD 0.262/GB-월 |
| Fargate (Linux x86) | vCPU USD 0.04656/h, GB USD 0.00511/h |
| ALB | USD 0.0225/h, LCU USD 0.008/h |
| NAT Gateway | USD 0.059/h, 처리 USD 0.059/GB |
| Public IPv4 | USD 0.005/h (사용 중 / 유휴 동일) |

### 월 비용 추정 (서울, 730시간, 할인 / Free Tier 미적용, USD)

| 항목 | A안 | B안 (환경 1개) |
|---|---|---|
| Fargate | 20.7 (0.5 vCPU / 1 GiB × 1) | 41.5 (× 2) |
| ALB (1 LCU 가정) | 22.3 | 22.3 |
| RDS 8.4 + gp3 20 GiB | 20.9 (micro Single-AZ) | 79.7 (small Multi-AZ) |
| NAT | 0 | 86.1 (2개) + 처리 GB |
| Public IPv4 | 11.0 (3개) | 14.6 (4개) |
| 기타 (관리형 비밀 저장소 / Logs / ECR / S3 / CloudFront / Route 53) | 약 3 ~ 5 (추정, 단가 미조회) | 약 5 (추정) |
| 합계 | 약 78 | 약 250 |
| RDS 8.0 선택 시 Extended Support 추가 | +175 (2 vCPU) | +350 (primary + standby 4 vCPU) |

- 월 80시간 단기 실습이면 A안은 약 15 수준이다. 미사용 기간에는 ALB / RDS 삭제가 필요하다. RDS를 중지해도 storage 비용은 남는다.
- 결론: RDS 8.0은 Extended Support 비용이 인스턴스 비용보다 크다. 8.4가 사실상 필수다.

### Human 결정 항목과 Claude 세션 권장값

| # | 항목 | 권장 |
|---|---|---|
| 1 | Architecture | A안. 교육 Staging부터 시작하고 B안은 필요 시 별도 승인 |
| 2 | Region | ap-northeast-2 (서울) |
| 3 | 계정 구조 | 같은 계정에서 교육 Staging만 먼저. Production 전 계정 분리 재검토 |
| 4 | SSO Permission Set | ReadOnly / Staging 범위 운영자 / Production은 Human 전용 (상세 TASK-025) |
| 5 | Network | A: ECS는 Public Subnet, RDS는 Private Subnet, NAT 없음 |
| 6 | RDS | 8.4, db.t4g.micro, gp3 20 GiB, Single-AZ, Public 접근 차단. DEC-023 변경은 별도 Decision / Task로 TASK-026 전에 진행 |
| 7 | ECS | 0.5 vCPU / 1 GiB, Desired Count 1 |
| 8 | Domain / HTTPS | 소유 Domain이 있으면 Route 53 + ACM, 없으면 CloudFront 기본 Domain으로 시작. Domain 소유 여부 확인 필요 |
| 9 | Logging / Backup | Log 7일, RDS Backup 7일, 삭제 보호, 삭제 전 final snapshot |
| 10 | 데이터 노출 | 인증이 없으므로 합성 데이터만 사용 (실제 개인 데이터 금지) |
| 11 | 비용 / 정리 | A안 월 상한 USD 100, Budget 알림 50 / 80 / 100%, 실습 7일 후 정리 |

### 승인 후 진행 절차

Resume은 Human 결정을 Executor에 전달하지 않으므로 TASK-022와 같은 방식으로 진행한다.

1. Claude 세션이 Human 결정을 이 문서에 `Human 결정` Section으로 기록하고 Commit / Push한다.
2. `node scripts/orchestrator/run.mjs TASK-023`로 새 Run을 실행한다. Codex는 확정값을 반영하고 `확인 필요`를 위 사실 확인 결과로 해소한다. DEC-027을 Human Approved로 바꾸고 F-001을 고친다.
3. Claude Review PASS 후 Orchestrator가 Draft PR을 자동 생성한다. CI 통과 후 Human이 Ready 전환 / Squash Merge한다. 완료 반영(TASK-023 DONE / TASK-024 READY)이 PR에 포함되었는지 확인한다.

### 다른 PC에서 이어가기

- `git switch task/TASK-023-aws-architecture-gate` 후 이 Section의 Human 결정부터 이어서 진행한다.
- Git에 없는 항목은 새 PC에서 준비한다: `harness/config.local.json`(Codex / Claude 실행 파일 경로), `.env.local`, `codex login`, VS Code Claude 로그인, `gh auth login`, `git config core.autocrlf true`, Node.js 24.21.0.
- 이전 PC의 `.harness/runs` / `.harness/workspaces`는 이어받지 않는다. 산출물은 `053529f`에 있다.

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
