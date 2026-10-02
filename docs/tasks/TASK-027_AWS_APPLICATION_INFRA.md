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
