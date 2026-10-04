# 21. Staging Continuous Deployment

## 승인과 검증 경계

TASK-029의 2026-10-04 Gate C 사전 승인과 명시 실행 지시를 DEC-032에 기록했다. Executor DONE은 Workflow 구현 완료다. AWS 변경이나 GitHub 설정은 Executor가 수행하지 않았다. 실제 자동 배포 성공은 Merge 후 확인하며, 최종 완료 승인은 Remote CI와 Human Squash Merge다. Production 생성과 배포는 별도 승인 대상이다.

## 실행 조건과 순서

`deploy-staging.yml`은 같은 Repository의 `CI`가 main push에서 성공한 경우만 자동 실행한다. Workflow 경로도 `ci.yml`인지 검사한다. PR / fork 실행은 배포하지 않는다. 수동 실행은 Workflow Branch를 main으로 선택하고 `commit_sha`에 main 이력에 포함된 full 40자리 SHA를 넣는다. 형식과 main ancestry를 AWS 세션 취득 전에 검사한다. Checkout은 전체 main 이력을 읽은 뒤 해당 Commit으로 이동하며 Git 인증을 보존하지 않는다.

전체 실행은 하나의 `moodfit-staging-deployment` concurrency group을 사용하고 진행 중 실행을 취소하지 않는다. GitHub concurrency는 무제한 FIFO가 아니므로 여러 대기 실행이 있으면 중간 Commit 배포가 생략될 수 있다. 오래 걸린 CI가 나중에 끝나면 이전 main Commit이 배포될 수도 있으므로 Summary Commit을 확인한다.

1. Java 21 / Node.js 24.21.0 설정, Backend Test / bootJar, linux/amd64 Image Build. OCI VCS_REF는 대상 full SHA다.
2. OIDC Staging Role 세션 3600초 취득, ECR 로그인. 세션 취득 재시도와 AWS CLI 오류 재시도는 비활성이다. Waiter는 정상 상태 전환을 조회하며 실패한 배포를 다시 제출하지 않는다.
3. `sha-<full SHA>` Tag를 조회한다. ImageNotFoundException일 때만 Push한다. 그 밖의 조회 오류는 실패다. 기존 immutable Tag는 재사용하며 덮어쓰지 않는다. digest 형식을 확인하고 ECS에는 repository와 digest를 결합한다.
4. Service가 이전 안정 상태인지 확인하고 현재 Task Definition에서 backend Container의 Image만 교체한다. 조회 전용 필드를 제거하고 등록 요청에 MoodFitEnvironment staging Tag를 포함한다. 새 revision으로 Service를 갱신한다.
5. 안정화 후 Service가 새 Task Definition을 실행하며 COMPLETED / desired 2 / running 2 / pending 0인지 재확인한다. Circuit Breaker로 이전 revision에 복귀한 경우 waiter 성공만으로 배포 성공을 판단하지 않는다.
6. 동일 Commit의 Frontend npm ci / Test / Build 후 asset을 먼저 업로드하고 HTML은 no-cache로 업로드한다. 삭제 동기화는 없다. CloudFront 전체 invalidation 완료 후 Smoke를 실행한다.
7. 실패해도 Step Summary에 Commit / Image digest / Task revision 번호 / 배포·Smoke 결과 / 실패 Step을 기록한다. 계정 ID, Repository 주소, Bucket 이름, Distribution ID, ARN, AWS 응답 JSON은 Summary / Artifact / 로그로 출력하지 않는다. 민감 응답은 runner 임시 파일에 제한 권한으로 저장하고 종료 시 제거한다.

## GitHub 설정 (승인된 Claude 세션)

Environment `staging`을 만들고 배포 Branch를 main만 허용한다. Required Reviewer 없이 자동 배포하며 관리자 Bypass는 비활성이다. 다음 Environment Secret 이름으로 값을 등록한다. 실제 값은 문서 / Prompt / 공유 로그에 넣지 않는다. AWS Access Key는 등록하지 않는다.

| 이름 | 값의 출처 |
|---|---|
| AWS_DEPLOY_ROLE_ARN | IAM Stack의 StagingDeployRoleArn Output |
| ECR_REPOSITORY_URI | ECR Repository URI, Tag / digest 제외 |
| STATIC_BUCKET_NAME | Frontend Stack 정적 Bucket |
| CLOUDFRONT_DISTRIBUTION_ID | Frontend Stack Distribution |

Region은 ap-northeast-2, Cluster는 moodfit-staging, Service / family는 moodfit-staging-backend, Container는 app.yaml의 backend다. 사용자 URL은 https://staging.moodfit.8949db.kr 이다. 배포 Job만 OIDC 권한을 갖고 최상위 권한은 contents read다. Role의 기존 Repository / staging subject와 최소 API 권한을 유지한다. CloudFormation / IAM / 삭제 API를 호출하지 않는다.

AWS 공식 Action은 다음 Release의 실제 Commit SHA로 고정했다(2026-10-04 공식 Release → Commit 링크 확인). 최신 버전이라는 주장은 하지 않는다. 그 밖에는 기존 CI 표기의 checkout v7 / setup-node v7 / setup-java v6만 사용한다.

- [configure-aws-credentials v4.3.1](https://github.com/aws-actions/configure-aws-credentials/releases/tag/v4.3.1)의 [7474bc4690e29a8392af63c5b98e7449536d5c3a](https://github.com/aws-actions/configure-aws-credentials/commit/7474bc4690e29a8392af63c5b98e7449536d5c3a)
- [amazon-ecr-login v2.0.1](https://github.com/aws-actions/amazon-ecr-login/releases/tag/v2.0.1)의 [062b18b96a7aff071d4dc91bc00c4c1a7945b076](https://github.com/aws-actions/amazon-ecr-login/commit/062b18b96a7aff071d4dc91bc00c4c1a7945b076)

## 재배포 / 롤백

Actions에서 deploy-staging → Run workflow → Branch main을 선택한다. 재배포는 현재 승인 Commit SHA, 롤백은 이전 Smoke PASS Summary의 full Commit SHA를 입력한다. 기존 immutable Image digest를 재사용하며 Frontend는 그 Commit을 다시 Build한다. 이전 정적 dist를 저장·승격하는 방식이 아니므로 byte-for-byte 동일 산출물을 보장하지 않는다(TASK-029 승인 예외). 롤백 대상 Commit에 Smoke Script와 계약 파일이 있어야 한다.

DB Migration은 되돌아가지 않는다. Flyway V2 적용 후 이전 코드와 Schema의 호환성을 Human이 먼저 확인한다. 파괴적 DB 복구 / Flyway repair / IAM 변경은 이 절차에 포함되지 않는다. Backend 배포와 Frontend 업로드는 원자적이지 않으므로 전환 중 / 부분 실패 시 서로 다른 버전이 노출될 수 있다.

Circuit Breaker는 ECS 배포 실패를 이전 안정 revision으로 돌린다. Smoke / Frontend / invalidation 실패는 자동 전체 롤백 대상이 아니다. Summary 실패 Step을 확인하고 Human이 현재 Service와 사용자 화면을 대조한 뒤 같은 SHA 재배포 또는 이전 SHA 수동 롤백을 선택한다. Session 만료 시 실패로 끝내고 같은 실행에서 세션을 다시 취득하지 않는다. 권한 부족을 IAM 확대로 우회하지 않는다.

## App Stack drift와 Infra 경계

CD는 Stack 생성 / 갱신 / 조회를 하지 않는다. Stack 밖에서 Task Definition revision을 등록하므로 App Stack BackendImage Parameter와 실제 실행 Image가 달라진다. 다음 App Stack 변경 전 Human은 마지막 성공 Summary의 Commit / digest와 현재 Service의 backend digest를 로컬 콘솔에서 대조한다. 승인된 Repository URI와 그 digest를 결합해 비추적 app Parameter 파일의 BackendImage를 갱신한다. 현재 실행 digest와 다른 값으로 오래된 Task Definition을 재배포하지 않도록 Change Set을 검토·승인한다. 실제 ARN / Parameter 원문은 공유하지 않는다. 앱 Change Set Role Trust의 Source 조건 검증은 CD에서 수행하지 않으며 미확인 사항으로 유지한다.

## 실제 배포 확인과 한계

Merge 이후 최소 두 번의 Staging 배포에서 Commit / digest / Task revision / Smoke PASS를 기록한다. 같은 SHA 수동 재배포로 immutable Tag 재사용도 확인한다. 실패 경로는 안전한 Mock에서 waiter가 이전 revision을 안정 상태로 반환해도 배포 실패가 되는지, Smoke 실패가 Workflow 실패와 실패 Step Summary로 남는지 확인한다. 실제 실패 주입은 사용자 영향과 DB 호환성을 검토한 뒤 수행한다. Executor Sandbox에서는 Workflow / AWS / GitHub 설정을 실행하지 않았다.

Smoke는 AWS 자격 증명 없이 정적 페이지 / SPA / HTTP redirect / origin 차단 / 합성 Check-in 201 / latest·History 200 / 400 본문 계약을 검사한다. 합성 기록은 남는다. 다른 Check-in 입력과 동시에 실행하면 latest 비교가 실패할 수 있으므로 실환경 확인 중 입력을 중단한다. Smoke Script는 대상 Commit의 contracts를 사용하며 CI 실행에 필요한 변경이 없어 유지했다. IAM 정책의 실환경 수락과 3600초 내 완료 여부는 첫 자동 배포에서 확인한다.
