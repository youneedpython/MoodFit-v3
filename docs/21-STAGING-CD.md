# 21. Staging Continuous Deployment

## 문서만 변경한 Commit의 자동 배포 생략 (TASK-050)

DEC-039에 따라 자동 workflow_run은 contents read만 가진 classify Job에서 대상 SHA의 첫 번째 부모와 비교한다. SHA는 환경 변수로 전달하고 40자리 16진수 형식을 검사한다. git diff의 NUL 구분 파일 목록으로 판정하며 Rename은 이전 / 새 경로 모두 검사한다. 삭제된 코드 파일이 문서 경로로 이동한 경우도 배포한다.

변경 파일이 하나 이상이고 모두 아래 경로에 해당할 때만 배포를 생략한다.

- `docs/` 아래 전체
- `prompts/` 아래 전체
- `harness/tasks/` 아래 전체
- 저장소 어디에 있든 확장자가 `.md`인 파일 (대소문자 구분)

그 밖의 파일이 하나라도 있거나 파일이 0개, 부모 조회 불가, Checkout / 판정 명령 실패이면 배포한다. 잘못된 SHA 형식은 기존 배포 검증처럼 실패로 종료한다. 문서 전용이면 staging Environment와 OIDC 권한을 가진 deploy Job은 시작되지 않으며 Build / AWS / 배포 / Smoke를 실행하지 않는다. Workflow는 성공으로 끝나고 Summary에 "문서만 변경되어 배포를 건너뜀", Commit SHA, 변경 파일 수와 최대 20개 파일 이름을 표시한다. 파일 이름은 Shell 입력으로 사용하지 않고 JSON 및 HTML 이스케이프로 출력한다.

수동 workflow_dispatch는 판정을 하지 않고 항상 배포한다. 기존 main Branch / Commit 이력 검증과 CI 필수 검사는 유지한다.

### 판정 예시

| 실행 / 변경 파일 | 기대 결과 |
|---|---|
| 자동: `docs/guide.txt`, `prompts/request.md`, `harness/tasks/TASK-050.json`, `README.md` | 문서 전용, 배포 생략 |
| 자동: `docs/guide.md`, `backend/src/App.java` | 코드 포함, 배포 |
| 자동: 파일 0개 | 배포 |
| 자동: `config/settings.json` | docs 밖의 비 .md 파일, 배포 |
| 자동: 첫 번째 부모 없음 또는 git diff 실패 | 배포 |
| 자동: 코드 파일을 `docs/old.txt`로 이동 | 이전 코드 경로도 검사하여 배포 |
| 수동: 문서 전용 Commit | 판정 생략, 배포 |

판정은 대상 Commit 하나만 본다. 직전 코드 Commit 배포가 실패한 뒤 문서 Commit이 들어오면 배포를 생략하므로 미배포 코드는 다음 코드 Commit 또는 수동 실행에서 배포된다. 이 경우 main의 해당 SHA를 수동 실행으로 배포한다. Merge 후 문서 전용 / 코드 포함 자동 실행과 문서 SHA 수동 실행의 실제 결과를 확인한다.

## 승인과 검증 경계

TASK-029의 2026-10-04 Gate C 사전 승인과 명시 실행 지시를 DEC-032에 기록했다. Executor DONE은 Workflow 구현 완료다. AWS 변경이나 GitHub 설정은 Executor가 수행하지 않았다. 실제 자동 배포 성공은 Merge 후 확인하며, 최종 완료 승인은 Remote CI와 Human Squash Merge다. Production 생성과 배포는 별도 승인 대상이다.

## 실행 조건과 순서

`deploy-staging.yml`은 같은 Repository의 `CI`가 main push에서 성공한 경우만 자동 실행한다. Workflow 경로도 `ci.yml`인지 검사한다. PR / fork 실행은 배포하지 않는다. 수동 실행은 Workflow Branch를 main으로 선택하고 `commit_sha`에 main 이력에 포함된 full 40자리 SHA를 넣는다. 형식과 main ancestry를 AWS 세션 취득 전에 검사한다. Checkout은 전체 main 이력을 읽은 뒤 해당 Commit으로 이동하며 Git 인증을 보존하지 않는다.

전체 실행은 하나의 `moodfit-staging-deployment` concurrency group을 사용하고 진행 중 실행을 취소하지 않는다. GitHub concurrency는 무제한 FIFO가 아니므로 여러 대기 실행이 있으면 중간 Commit 배포가 생략될 수 있다. 오래 걸린 CI가 나중에 끝나면 이전 main Commit이 배포될 수도 있으므로 Summary Commit을 확인한다.

1. Java 21 / Node.js 24.21.0 설정, Backend Test / bootJar, linux/amd64 Image Build. OCI VCS_REF는 대상 full SHA다.
2. OIDC Staging Role 세션 3600초 취득, ECR 로그인. 세션 취득 재시도와 AWS CLI 오류 재시도는 비활성이다. Waiter는 정상 상태 전환을 조회하며 실패한 배포를 다시 제출하지 않는다.
3. `sha-<full SHA>` Tag를 조회한다. ImageNotFoundException일 때만 Push한다. 그 밖의 조회 오류는 실패다. 기존 immutable Tag는 재사용하며 덮어쓰지 않는다. digest 형식을 확인하고 ECS에는 repository와 digest를 결합한다.
4. Service가 이전 안정 상태인지 확인하고 현재 Task Definition에서 backend Container의 Image만 교체한다. 조회 전용 필드를 제거하고 등록 요청에 MoodFitEnvironment staging Tag를 포함한다. 새 revision으로 Service를 갱신한다.
5. services-stable 후 DescribeServices를 15초 간격으로 최대 10분 추가 조회한다. Service와 단일 Deployment가 목표 Task Definition이며 COMPLETED / desired 2 / running 2 / pending 0일 때 성공한다. Service의 목표 불일치(롤백) 또는 목표 Deployment의 FAILED는 즉시 실패한다. IN_PROGRESS / 복수 Deployment / 미충족 Task 수는 계속 기다리며 시간 초과 시 마지막 미충족 조건을 출력한다. 조회 오류는 재시도 없이 짧은 이유로 실패하고 AWS 원문 / 식별값은 출력하지 않는다. 조회 한 번도 최대 30초와 남은 제한 시간으로 제한한다.
6. 동일 Commit의 Frontend npm ci / Test / Build 후 asset을 먼저 업로드하고 HTML은 no-cache로 업로드한다. 삭제 동기화는 없다. CloudFront 전체 invalidation 완료 후 Smoke를 실행한다.
7. 실패해도 Step Summary에 Commit / Image digest / Task revision 번호 / 배포·Smoke 결과 / 실패 Step을 기록한다. 계정 ID, Repository 주소, Bucket 이름, Distribution ID, ARN, AWS 응답 JSON은 Summary / Artifact / 로그로 출력하지 않는다. 민감 응답은 runner 임시 파일에 제한 권한으로 저장하고 종료 시 제거한다.

### ECS 안정화 뒤 rollout 판정 실패 (2026-10-04, TASK-039)

TASK-038 적용 후 재실행은 OIDC / ECR Push / Task Definition 등록 / Service 갱신을 통과했지만 대기 Step의 단일 COMPLETED 검사에서 실패했다. 실패 직후 Claude의 읽기 전용 확인에서는 새 revision 하나가 PRIMARY / COMPLETED이고 desired 2 / running 2, 실패 Task 0과 deployment completed 이벤트가 확인됐다. Backend는 갱신됐고 Frontend 이후 단계는 실행되지 않았다.

services-stable은 단일 Deployment와 running / desired 일치로 종료하므로 rolloutState가 잠시 IN_PROGRESS일 수 있다. TASK-039는 waiter 뒤 제한 시간 동안 COMPLETED를 추가로 기다린다. Circuit Breaker 롤백은 계속 실패로 처리한다. 다른 Step / 권한 / Trigger / Action 고정 SHA는 유지하며 실제 자동 배포 전체 통과는 Merge 후 확인한다.

## GitHub 설정 (승인된 Claude 세션)

Environment `staging`을 만들고 배포 Branch를 main만 허용한다. Required Reviewer 없이 자동 배포하며 관리자 Bypass는 비활성이다. 다음 Environment Secret 이름으로 값을 등록한다. 실제 값은 문서 / Prompt / 공유 로그에 넣지 않는다. AWS Access Key는 등록하지 않는다.

| 이름 | 값의 출처 |
|---|---|
| AWS_DEPLOY_ROLE_ARN | IAM Stack의 StagingDeployRoleArn Output |
| ECR_REPOSITORY_URI | ECR Repository URI, Tag / digest 제외 |
| STATIC_BUCKET_NAME | Frontend Stack 정적 Bucket |
| CLOUDFRONT_DISTRIBUTION_ID | Frontend Stack Distribution |

Region은 ap-northeast-2, Cluster는 moodfit-staging, Service / family는 moodfit-staging-backend, Container는 app.yaml의 backend다. 사용자 URL은 https://staging.moodfit.8949db.kr 이다. 배포 Job만 OIDC 권한을 갖고 최상위 권한은 contents read다. Role은 TASK-038의 immutable Repository / staging subject와 기존 최소 API 권한을 사용한다. CloudFormation / IAM / 삭제 API를 호출하지 않는다.

### 첫 자동 배포 OIDC 실패와 조치 (2026-10-04)

TASK-029 Merge(PR #18) 뒤 첫 실행은 OIDC 단계에서 `Not authorized to perform sts:AssumeRoleWithWebIdentity`로 실패했다. Claude 세션이 확인한 Repository 설정은 `use_default`와 `use_immutable_subject`가 모두 true였다. GitHub가 발급하는 subject에는 owner / repository 숫자 ID가 포함되지만 기존 IAM Trust는 이름 형식만 StringEquals로 비교해 불일치했다. Environment 값 4개와 Repository 이름, Workflow의 문제가 아니며 이름 형식으로 되돌리는 API 요청도 재조회 시 설정이 유지되었다.

Human 승인 TASK-038은 IAM Trust를 `repo:${RepositoryOwner}@${RepositoryOwnerId}/${RepositoryName}@${RepositoryId}:environment:staging`으로 맞춘다. Production Template는 끝이 production인 별도 값 하나만 비교한다. audience / StringEquals / wildcard 금지와 배포 권한은 유지한다. 실제 ID는 로컬 비추적 Parameter 파일에만 둔다. Merge 후 Human이 IAM Stack Change Set을 검토·실행하고 실패한 배포를 다시 실행해 OIDC 단계 통과를 확인한다. Template 수정만으로 실환경 해결을 주장하지 않는다.

Repository를 새로 만들거나 이전하면 RepositoryId 또는 RepositoryOwnerId가 바뀔 수 있으므로 이름과 두 ID를 다시 확인하고 IAM Stack을 갱신해야 한다. 이전 이름 형식을 함께 허용하는 우회는 하지 않는다.

AWS 공식 Action은 다음 Release의 실제 Commit SHA로 고정했다(2026-10-04 공식 Release → Commit 링크 확인). 최신 버전이라는 주장은 하지 않는다. 그 밖에는 기존 CI 표기의 checkout v7 / setup-node v7 / setup-java v6만 사용한다.

- [configure-aws-credentials v4.3.1](https://github.com/aws-actions/configure-aws-credentials/releases/tag/v4.3.1)의 [7474bc4690e29a8392af63c5b98e7449536d5c3a](https://github.com/aws-actions/configure-aws-credentials/commit/7474bc4690e29a8392af63c5b98e7449536d5c3a)
- [amazon-ecr-login v2.0.1](https://github.com/aws-actions/amazon-ecr-login/releases/tag/v2.0.1)의 [062b18b96a7aff071d4dc91bc00c4c1a7945b076](https://github.com/aws-actions/amazon-ecr-login/commit/062b18b96a7aff071d4dc91bc00c4c1a7945b076)

## 재배포 / 롤백

Actions에서 deploy-staging → Run workflow → Branch main을 선택한다. 재배포는 현재 승인 Commit SHA, 롤백은 이전 Smoke PASS Summary의 full Commit SHA를 입력한다. 기존 immutable Image digest를 재사용하며 Frontend는 그 Commit을 다시 Build한다. 이전 정적 dist를 저장·승격하는 방식이 아니므로 byte-for-byte 동일 산출물을 보장하지 않는다(TASK-029 승인 예외). 롤백 대상 Commit에 Smoke Script와 계약 파일이 있어야 한다.

DB Migration은 되돌아가지 않는다. Flyway V2 적용 후 이전 코드와 Schema의 호환성을 Human이 먼저 확인한다. 파괴적 DB 복구 / Flyway repair / IAM 변경은 이 절차에 포함되지 않는다. Backend 배포와 Frontend 업로드는 원자적이지 않으므로 전환 중 / 부분 실패 시 서로 다른 버전이 노출될 수 있다.

Circuit Breaker는 ECS 배포 실패를 이전 안정 revision으로 돌린다. Smoke / Frontend / invalidation 실패는 자동 전체 롤백 대상이 아니다. Summary 실패 Step을 확인하고 Human이 현재 Service와 사용자 화면을 대조한 뒤 같은 SHA 재배포 또는 이전 SHA 수동 롤백을 선택한다. Session 만료 시 실패로 끝내고 같은 실행에서 세션을 다시 취득하지 않는다. 권한 부족을 IAM 확대로 우회하지 않는다.

## App Stack drift와 Infra 경계

TASK-043의 OAuth Secret 참조와 공개 주소 / 체험 로그인 설정은 Human의 IAM → App Stack UPDATE로 먼저 적용한다. CD는 현재 Service Task Definition을 복사해 Image만 바꾸므로 Stack이 만든 새 revision의 Environment / Secrets를 이후 배포에도 이어받는다. 코드 Merge만으로 기존 Task에 새 설정이 생기지 않는다. Secret 값 교체도 실행 중인 Task에 자동 반영되지 않아 Service 새 배포가 필요하다. Stack 변경은 진행 중 CD와 겹치지 않게 Human이 조율하고 현재 실행 digest를 유지한다. 적용·확인은 [22-AUTH.md](22-AUTH.md)를 따른다.

CD는 Stack 생성 / 갱신 / 조회를 하지 않는다. Stack 밖에서 Task Definition revision을 등록하므로 App Stack BackendImage Parameter와 실제 실행 Image가 달라진다. 다음 App Stack 변경 전 Human은 마지막 성공 Summary의 Commit / digest와 현재 Service의 backend digest를 로컬 콘솔에서 대조한다. 승인된 Repository URI와 그 digest를 결합해 비추적 app Parameter 파일의 BackendImage를 갱신한다. 현재 실행 digest와 다른 값으로 오래된 Task Definition을 재배포하지 않도록 Change Set을 검토·승인한다. 실제 ARN / Parameter 원문은 공유하지 않는다. 앱 Change Set Role Trust의 Source 조건 검증은 CD에서 수행하지 않으며 미확인 사항으로 유지한다.

## 실제 배포 확인과 한계

TASK-042 이후 Smoke는 `/api/check-ins/latest`의 미인증 401을 먼저 확인하고 `/api/auth/me`에서 CSRF Cookie를 발급받아 체험 로그인 204 뒤 기존 400 / 201 / latest / History 계약을 검사한다. 로그인 후 `/me`로 갱신된 CSRF 값을 사용한다. Cookie와 Header 설정은 권한을 제한한 임시 디렉터리에 보관하고 종료 시 지운다. 값은 출력하지 않는다. 합성 기록은 공유 체험 계정에 남기며 삭제하지 않는다. OAuth 제공자 값 없이 동작하는 이 경로가 자동 배포와 시연의 기본 경로다. Google / Kakao 실측은 TASK-043 이후 수행한다.

Merge 이후 최소 두 번의 Staging 배포에서 Commit / digest / Task revision / Smoke PASS를 기록한다. 같은 SHA 수동 재배포로 immutable Tag 재사용도 확인한다. 실패 경로는 안전한 Mock에서 waiter가 이전 revision을 안정 상태로 반환해도 배포 실패가 되는지, Smoke 실패가 Workflow 실패와 실패 Step Summary로 남는지 확인한다. 실제 실패 주입은 사용자 영향과 DB 호환성을 검토한 뒤 수행한다. Executor Sandbox에서는 Workflow / AWS / GitHub 설정을 실행하지 않았다.

Smoke는 AWS 자격 증명 없이 정적 페이지 / SPA / HTTP redirect / origin 차단 / 합성 Check-in 201 / latest·History 200 / 400 본문 계약을 검사한다. 합성 기록은 남는다. 다른 Check-in 입력과 동시에 실행하면 latest 비교가 실패할 수 있으므로 실환경 확인 중 입력을 중단한다. Smoke Script는 대상 Commit의 contracts를 사용한다. TASK-048에서는 날짜별 추천에 맞춰 추천만 형식으로 검사하도록 변경했다. IAM 정책의 실환경 수락과 3600초 내 완료 여부는 첫 자동 배포에서 확인한다.


### TASK-048 추천 형식 검사

서울 날짜별 추천 순환에 따라 foods / music / History의 foodNames / musicTitles는 5개, 예시와 같은 키와 값 타입을 검사한다. videoId는 11자 문자열 또는 null이다. 추천 외 Score / 기분 / 요약 / 지표 / 날씨 등은 계약과 값까지 비교한다. 요약은 후보에 따라 바뀌지 않는다. 최신 응답은 생성 응답과 같아야 한다. 기존 Cookie / Token 비출력과 임시 파일 제거, 합성 기록 보존을 유지한다. Merge 후 Staging CD Smoke와 서울 날짜가 바뀐 뒤 추천 변화를 확인한다.

### TASK-048 Run 3 — Container 응답 추출과 Windows 경로

Container Smoke의 App `/tmp`는 tmpfs이므로 `docker cp` 대신 `docker exec`의 `cat` 출력을 호스트 임시 응답 파일로 저장한다. create / latest / history 본문만 저장하며 Cookie와 인증 Header 파일은 Container 안에 둔다. 추출 후 인증 임시 디렉터리를 제거하고, 오류 시에도 EXIT 정리가 Container와 호스트 임시 디렉터리를 제거한다. 응답 본문을 로그로 출력하지 않는다.

Container Script는 Linux Container 경로 보존을 위해 MSYS 경로 변환을 끈다. 호스트 Python에 전달하는 임시 디렉터리는 기존 `docker_path`로 변환한다(Windows Git Bash에서는 `cygpath -w`, Linux에서는 원래 경로). Staging Script는 호스트 curl / Python을 사용하며 MSYS 변환을 끄지 않으므로 같은 Container tmpfs 추출이나 명시 경로 변환 수정이 필요하지 않다. Linux CI에서도 두 Script의 임시 경로 처리와 종료 시 제거는 유지된다.

Run 2 전체 Verify 통과와 Run 3의 두 줄 수정 후 Container Smoke exit 0은 Task 문서에 기록된 Claude 세션의 Sandbox 밖 실행 근거다. 이번 Executor는 해당 두 줄을 유지하고 흐름과 구문을 확인했다. 최종 검증과 Review는 Orchestrator 결과를 따른다.
