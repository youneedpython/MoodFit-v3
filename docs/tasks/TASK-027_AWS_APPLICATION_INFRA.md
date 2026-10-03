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
