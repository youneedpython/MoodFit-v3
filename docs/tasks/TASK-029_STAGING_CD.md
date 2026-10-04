# TASK-029 — Staging Continuous Deployment

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

`main`의 검증된 변경을 Staging에 자동 배포하는 CD Pipeline을 만든다. Staging은 정책상 자동 배포 가능한 환경으로 운영한다. (DEC-026 승인 범위)

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-028 Staging 수동 배포 PASS
- CD 동작 변경 Gate C Human Approved

## 인증

- GitHub Actions → GitHub OIDC → Staging Deploy Role (TASK-025)
- SSO / 장기 Access Key / Agent용 API Key를 사용하지 않는다.
- Agent는 이 Pipeline 안에서 실행되지 않는다.

## Codex 작업 범위

- CI PASS 이후 실행되는 `deploy-staging` Workflow
- Immutable Image Tag = Commit SHA
- ECR Push → ECS Task / Service 업데이트
- Frontend Build → S3 Sync / Upload → CloudFront Invalidation 또는 Version 전략
- IaC 변경은 Application 배포와 분리하거나 명시적 Change Set Gate 적용
- 배포 Concurrency 제어
- Smoke Test 자동 실행
- 실패 시 이전 안정 Revision으로 Rollback 가능한 절차
- Step Summary에 Commit / Image / Task Revision / Smoke 결과 기록 (DEC-021 Summary 방식과 일관)

## TASK-028에서 넘어온 입력 (2026-10-04, Claude 세션 기록)

- Staging이 동작한다: `https://staging.moodfit.8949db.kr`. Stack 이름은 `moodfit-staging-<network|ecr|data|certificate|frontend|iam|app|budget>`이다.
- IAM Stack이 GitHub OIDC Provider와 `StagingDeployRole`을 만들었다(Repository와 `staging` Environment subject 고정, DEC-029). Role ARN은 IAM Stack Output `StagingDeployRoleArn`이다. GitHub에는 아직 Environment / Variable이 없다.
- 배포 Role 권한(DEC-029): ECR Push, 정적 Bucket 업로드, CloudFront invalidation, Task Definition 등록(요청 Tag `MoodFitEnvironment` 필요, `app.yaml`에 Tag 추가됨), ECS Service 갱신, runtime Role PassRole.
- Image는 깨끗한 checkout의 full Commit SHA를 `VCS_REF`로 넣어 Build하고 `sha-<commit>` Tag(immutable)로 Push한다. ECS는 digest로 고정한다(DEC-028). 수동 절차는 `scripts/staging-image.sh` / `scripts/staging-frontend.sh`에 있다.
- 배포 후 확인은 `scripts/staging-smoke.sh`(자격 증명 불필요)를 쓴다.
- OIDC Session은 Build 이후에 얻고 3600초다. 만료 / 실패 시 자동 재시도하지 않는다(DEC-029).
- 앱 Change Set Role Trust의 Source 조건이 일반 Stack에서 동작하는지는 아직 확인되지 않았다.
- 기능 Task(TASK-035, TASK-036)가 Merge 대기 중이다. CD가 완성되면 이 Merge들이 첫 자동 재배포 검증이 된다. TASK-036은 Flyway `V2` Migration을 포함한다.

## Verification

최소 두 번의 Staging 배포로 반복 가능성을 확인한다. 실패 주입 또는 안전한 Mock으로 Rollback 경로를 검증한다.

## Claude Review 기준

- CI 실패가 배포를 Trigger하지 않는가
- `latest` Tag 단독 사용 금지
- 동시 배포 Race 방지
- Frontend / Backend Version 대응
- Rollback 대상 추적 가능
- Infra 변경과 App 배포의 경계
- OIDC Role 권한이 Staging에 한정되는가

## 완료 조건

`main`의 검증된 Commit이 Staging에 자동 배포되고 Smoke Test가 자동 PASS하는 것을 확인하면 REVIEW.
