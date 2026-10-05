# 28. Production Deployment Runbook

## 1. 사전 조건

TASK-030은 파일 구현만 수행한다. 실제 생성과 첫 배포는 Merge 뒤 Human과 범위가 정해진 위임을 받은 Claude 세션이 실행한다. Executor는 AWS를 호출하지 않는다. Human이 AWS SSO 로그인과 관리 권한을 확인하고, 진행 중인 Staging 배포 및 Production 배포가 없는지 확인한다. 로그인 만료나 권한 미확인은 HUMAN_REQUIRED이며 재시도하지 않는다.

승인 구성은 같은 계정, AZ 2개, Fargate Task 2개, RDS Multi-AZ, NAT Gateway 2개다. 운영 2일 이내 / 추가 USD 30 이내이며 오늘 생성 → 배포 → 확인 / 영상 뒤 TASK-031에서 정리를 별도 승인한다. 월 USD 300 Budget은 계정 전체 알림이며 USD 30 강제 차단 장치가 아니다. Human은 실제 비용을 따로 확인하고 상한 초과 예상 시 실행을 중단한다.

Release Tag는 DEC-025에 따라 검증된 main Commit의 `v3.x.y`다. Tag / Release 생성과 Production Environment 승인은 별개다. 선택한 Image Commit의 Staging 성공 배포 / Smoke와 Digest를 마지막 성공 Summary에서 확인한다. ECR Image 존재만으로 Staging 검증 성공을 판단하지 않는다. Schema 파괴적 변경이 있으면 HUMAN_REQUIRED로 중단한다.

## 2. Local Parameter 준비

`infra/cloudformation/production/*.parameters.example.json` 7개를 Git 비추적 `infra/cloudformation/local/production/{kind}.parameters.json`으로 복사해 Human이 로컬에서 채운다. 예시는 승인된 Environment / Hostname / CIDR만 실제 값이며 나머지는 자리 표시다. 파일을 추적하지 않고 Secret / 실제 계정 / ARN / Zone ID / Email을 문서나 로그에 옮기지 않는다.

- Owner와 AZ는 승인된 운영 설정, 기존 Hosted Zone과 CloudFront origin Prefix List는 AWS 콘솔에서 얻는다. Network는 `10.50.0.0/16`으로 고정한다.
- Data의 subnet / security group은 Production Network Output을 사용한다. DB 자격 증명은 Data가 생성한 Secret Reference를 사용하며 빈 DB로 시작한다.
- Certificate의 viewer는 `moodfit.8949db.kr`, origin은 `origin.moodfit.8949db.kr`이다. Viewer 인증서는 us-east-1에서 만든다.
- Frontend는 Certificate Output과 동일한 origin 검증 값(32자 이상)을 사용한다. App도 동일한 비공개 검증 값을 사용한다. 값은 Human이 로컬에서 준비한다.
- `OriginVerificationValue` Key는 예시에 없으므로 Human이 app / frontend 두 Local Parameter 파일에 직접 추가한다. 두 파일의 값이 같은지 로컬에서 확인하며, 검증 값은 추적 파일에 넣지 않는다.
- IAM의 RepositoryArn은 기존 **Staging ECR 저장소** Output이다. Production ECR Stack은 만들지 않는다. GitHub OIDC Provider도 기존 것을 재사용하며 `CreateOidcProvider=false`와 기존 Provider Reference를 입력한다.
- IAM의 `ProductionTaskDefinitionArnPattern`, `ProductionStaticObjectArn`, `ProductionStaticBucketArn`, `ProductionDistributionArn`, `ProductionClusterArn`, `ProductionExecutionRoleArn`, `ProductionTaskRoleArn`, `ProductionServiceArn`은 Production Resource만 가리킨다. 예정 ECS ARN / 자기 참조는 Staging에서처럼 승인된 이름 규칙으로 준비하고 실제 생성 Output으로 IAM UPDATE한다. 사용하지 않는 Staging Parameter는 Template 기본값과 조건을 확인해 빈 값으로 준비한다. 임의 권한 확대는 금지한다.
- App의 Network / Data / IAM 입력은 실제 Output을 연결한다. `BackendImage`는 Staging 성공 Summary와 대조한 공유 저장소 URI의 **동일 Digest**를 사용한다. `latest`나 Image 재Build를 사용하지 않는다.
- OAuth / LLM 사용 여부와 관련 Reference는 승인된 환경 설정에 맞춰 입력한다. Budget Email은 Human이 로컬에서 입력한다.

## 3. Stack 생성 순서

[Staging Runbook](18-STAGING-DEPLOYMENT-RUNBOOK.md)의 순서와 자기 참조 해소 방식을 따른다. Stack은 `moodfit-production-{kind}`이며 7개다.

| 순서 | 이유 / 확인 |
|---|---|
| budget | 비용 알림을 먼저 준비한다. 월 USD 300 / actual 50·80·100% / forecast 100%는 그대로다. |
| network | 겹치지 않는 CIDR과 AZ별 NAT, Data subnet / SG를 준비한다. |
| data | Network Output 연결, 빈 DB / MySQL 8.4.11 / Multi-AZ / 삭제 보호 / backup을 확인한다. |
| certificate | 기존 Zone을 참조하고 viewer 인증서 DNS 검증을 완료한다. |
| frontend | Certificate Output 연결. App이 아직 없어도 origin hostname 문자열로 설정할 수 있다. |
| iam | 공유 ECR / Production Data / Frontend 실제 Output과 예정 ECS ARN을 연결한다. 기존 Provider를 재사용한다. |
| app | Network / Data / IAM 실제 Output과 검증된 Staging Image Digest로 생성한다. |
| iam UPDATE | 실제 Execution / Task Role 및 App Output으로 예정 ARN / 자기 참조를 교정한다. Action과 Condition은 유지한다. |

Staging의 ECR 생성 / Image Build·Push 단계는 생략한다. Frontend가 App Resource를 직접 참조하지 않아 origin 연결을 위한 UPDATE는 필요 없다. App 생성 시 ECS desired / running 2, pending 0, 단일 COMPLETED Deployment와 Target health를 확인한다.

Human이 위임한 범위에서만 다음 절차를 실행한다. Certificate Profile의 Region은 Script가 us-east-1로 정한다. 각 Stack 성공을 확인한 뒤 다음 Stack으로 넘어간다.

```bash
bash scripts/production-changeset.sh budget create "$APPROVED_PROFILE" production-budget CREATE
bash scripts/production-changeset.sh budget describe "$APPROVED_PROFILE" production-budget
bash scripts/production-changeset.sh budget execute "$APPROVED_PROFILE" production-budget
```

나머지 종류도 동일한 절차로 진행한다. Change Set 세부 Resource / Replacement / Remove를 Human이 로컬에서 검토한 뒤 `EXECUTE moodfit-production-{kind} {changeset}`을 입력한다. Remove나 DB 교체 / 파괴적 변경은 기존 승인 범위로 실행하지 않는다. 오류 원문은 공유하지 않는다. 다른 Template 수정이 필요하면 고치지 않고 HUMAN_REQUIRED로 중단한다. 삭제 동작은 없다.

## 4. Human 설정

Human이 Production용 Secrets Manager Secret에 OAuth 값을 입력하고 Production Callback URL을 제공자 콘솔에 등록한다. Bedrock 호출 Role을 가진 계정에서 Production Application Task Role을 Trust에 추가한다. 기존 Staging Trust와 환경 분리를 유지한다. IAM / App의 OAuthCredentialArn과 LlmRoleArn / LlmEnabled를 승인된 설정에 연결한다.

GitHub Environment `production`을 만들고 Human Required Reviewer를 지정한다. 관리자 승인 우회를 허용하지 않으며 main의 수동 Workflow만 허용한다. 승인자가 실행자와 같은 계정인 경우에도 실제 승인이 가능한 Reviewer 구성을 확인한다. 보호 설정 미확인 상태에서 배포하지 않는다.

Environment Secret은 `AWS_DEPLOY_ROLE_ARN`(ProductionDeployRole Output), `ECR_REPOSITORY_URI`(공유 Staging 저장소), `STATIC_BUCKET_NAME`(Production Frontend Output), `CLOUDFRONT_DISTRIBUTION_ID`(Production Frontend Output)다. Staging Environment Secret을 참조하지 않는다. 실제 값은 GitHub 설정에서만 입력한다.

## 5. 첫 배포와 확인

main의 `deploy-production` Workflow를 `release_tag` 하나로 수동 시작한다. plan은 AWS 없이 Tag 형식 / 존재 / main 조상 여부를 확인하고 첫 부모 기준 최대 30개 Commit에서 Staging과 같은 분류로 Image Commit을 찾는다. 빈 diff / 판정 불가는 배포 대상으로 판단한다. 승인 전 Summary의 Tag Commit / Image Commit / 문서 전용 Commit 수를 확인하고 해당 Staging 성공 / Digest를 대조한다.

Human이 Environment를 승인하면 ECR의 `sha-{image_sha}`를 조회해 Digest로 Task Definition Image만 교체한다. Backend 재Build / Push는 없다. 목표 Revision / Task 수를 최대 10분 동안 15초 간격으로 판정하며 복귀 / FAILED를 거부한다. 화면은 Tag Commit에서 설치 / Test / Build 후 Asset → HTML 순서로 삭제 없이 올리고 Invalidation을 기다린다.

Production Smoke는 HTTPS / SPA / origin 차단 / 인증 / 체험 계정 / API Contract를 검사한다. **체험 계정 Check-in 한 건이 Production DB에 시험 기록으로 남는다.** 실패를 경고로 낮추지 않는다. 실패 시 추가 변경을 멈추고 Human이 Rollback / 복구를 판단한다. 소셜 로그인과 AI 기능은 Human이 직접 확인한다.

Summary는 Tag / Commit / Image Commit / Digest / Task Revision / UTC / 실행자 / 실행 번호 / 결과를 남긴다. 승인자와 승인 시각은 GitHub Deployment 승인 이력에서 확인한다. 식별 ARN / 계정 / Bucket / Distribution은 Summary에 남기지 않는다. Release 노트 `docs/releases/<tag>.md`에 비민감 결과와 Run 연결을 기록한다.

## 6. Rollback

Human이 마지막 성공 Release와 DB Migration 호환성을 확인한 뒤 **같은 Workflow를 이전 Release Tag로 수동 실행하고 다시 Environment 승인**한다. 이전 Image는 공유 ECR에 남아 있어야 한다. 이전 화면도 해당 Tag에서 Build한다. 자동 Tag 선택 / 자동 DB 복원은 없다. ECS circuit breaker의 복귀는 Workflow 성공으로 처리하지 않는다.

Migration이 있는 Release 사이의 Rollback은 Human 판단이다. 이전 코드와 Schema가 충돌할 가능성이 있거나 파괴적 변경이 발견되면 HUMAN_REQUIRED로 중단하고 호환 복구안을 승인받는다. Backend만 성공하고 화면 / Smoke가 실패해도 자동 Rollback하지 않는다. 승인된 이전 Release 재실행 뒤 동일한 Revision / Health / Smoke와 Audit를 확인한다.

## 7. 정리

정리는 TASK-031에서 별도로 승인한다. 삭제 보호 / Retain / Snapshot / Resource 의존성 때문에 순서를 검토해야 한다. 공유 ECR은 Staging과 Production이 함께 읽으므로 사용 여부를 확인한다. 이 Runbook에는 삭제 명령이나 삭제 보호 해제가 없다.
