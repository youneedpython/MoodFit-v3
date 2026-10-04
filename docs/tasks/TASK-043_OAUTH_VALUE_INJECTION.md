# TASK-043 — OAuth Value Injection (Infra)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

TASK-042가 만든 소셜 로그인에 Google / Kakao OAuth 값과 공개 주소를 주입한다. Secrets Manager의 값을 ECS Task가 환경 변수로 받게 한다.

## 초기 상태 / Dependency

- 초기: `READY` (Human Gate 승인 2026-10-04, TASK-042 Gate 9번)
- 선행: TASK-042 Merge(PR #24), Staging 배포 완료(체험 로그인 동작 확인됨)
- 실행: `node scripts/orchestrator/run.mjs TASK-043`

## Human 결정 / 확인된 사실 (2026-10-04)

1. OAuth Client 값은 Secrets Manager에 두고 ECS가 주입한다. 값은 Human이 콘솔에서 직접 입력하며 Agent와 Claude 세션은 값을 보지 않는다.
2. Human이 Google / Kakao OAuth 앱을 등록했다. Redirect 주소는 `https://staging.moodfit.8949db.kr/api/auth/callback/{google|kakao}`와 `https://moodfit.8949db.kr/api/auth/callback/{google|kakao}`다.
3. Backend가 읽는 환경 변수(TASK-042): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `APP_PUBLIC_URL`, `AUTH_GUEST_ENABLED`(기본 true). 한 제공자의 두 값이 모두 있어야 그 제공자가 켜진다. `APP_PUBLIC_URL`이 https면 Cookie에 `Secure`가 붙는다.
4. 현재 `app.yaml`의 Container는 `Environment`에 `DB_URL`, `Secrets`에 DB 사용자 / 암호 2개를 주입한다. 실행 Role(`iam.yaml`의 `ExecutionRole`)은 DB Secret 하나만 읽을 수 있다(`InjectDbCredential`).
5. 자동 배포(CD)는 **현재 Task Definition을 복사해 Image만 바꾼다.** 따라서 App Stack을 한 번 갱신해 새 환경 값이 들어간 revision을 만들면 이후 CD가 그 값을 이어받는다. App Stack을 갱신할 때는 `BackendImage`에 현재 실행 중인 Image digest를 넣어야 한다(`docs/21-STAGING-CD.md`의 drift 절차).

## 설계 (실행 기준)

### OAuth Secret

- Human이 Secrets Manager에 Secret 하나를 만든다(환경별 1개, 이름 예: `moodfit/staging/oauth`). JSON Key는 4개다: `google_client_id`, `google_client_secret`, `kakao_client_id`, `kakao_client_secret`. Template은 이 Secret을 **만들지 않고 ARN을 Parameter로 받는다**(값이 Template / Change Set에 나타나지 않게 한다).
- `app.yaml`: Parameter `OAuthCredentialArn`(기본값 빈 문자열)을 추가한다. 값이 있으면 Container `Secrets`에 위 4개 환경 변수를 `<ARN>:<json key>::` 형식으로 추가한다. 빈 문자열이면 추가하지 않는다(Condition 사용). 기존 DB 주입 2개는 그대로 둔다.
- `iam.yaml`: Parameter `OAuthCredentialArn`(기본값 빈 문자열)을 추가한다. 값이 있으면 `ExecutionRole`에 그 Secret 하나에 대한 읽기 권한 Statement를 추가한다(Resource는 그 ARN 하나, wildcard 금지). 빈 문자열이면 추가하지 않는다. TaskRole에는 권한을 주지 않는다(App이 직접 읽지 않는다).
- Secret은 Secrets Manager 기본 Key로 암호화한다고 가정한다(별도 KMS 권한 없음). 다른 Key를 쓰면 추가 권한이 필요하다는 점을 문서에 적는다.

### 공개 주소

- `app.yaml`: Parameter `PublicUrl`(예: `https://staging.moodfit.8949db.kr`, `https://`로 시작하고 끝에 `/`가 없는 형식만 허용하는 `AllowedPattern`)을 추가하고 Container `Environment`에 `APP_PUBLIC_URL`로 넣는다. 필수 Parameter로 한다.
- `AUTH_GUEST_ENABLED`는 Parameter `GuestLoginEnabled`(`true` / `false`, 기본 `true`)로 넣는다.

### Secret 검사

- Contract에 승인된 허용 문구가 있다(실행 Role의 Secret 읽기 Action을 한 줄 배열로 쓰는 기존 표기). 정확한 문구는 Workspace의 `harness/tasks/TASK-043.json`에서 읽어 그대로 쓴다. Executor 입력에서 가려져 보이는 것은 정상이다.
- 환경 변수 이름 뒤에 콜론이나 등호와 값이 바로 오는 표기를 쓰지 않는다. 기존 DB 주입 줄과 같은 형태(`{Name: "...", ValueFrom: ...}`)로 쓴다. 그래도 검사에 걸릴 표기가 필요하면 구현하지 말고 정확한 문구를 `human_decisions_needed`로 보고한다.

### 문서

- `docs/22-AUTH.md`: Secret 만들기(JSON Key 4개, 값은 Human만 입력), Parameter, 적용 순서, 확인 방법, 값 교체(Secret 값을 바꾼 뒤 Service를 새로 배포해야 반영됨), Production에서 같은 절차.
- `docs/18-STAGING-DEPLOYMENT-RUNBOOK.md`: 적용 순서 — ① Human이 Secret 생성 ② IAM Stack Change Set(UPDATE) ③ App Stack Change Set(UPDATE, `BackendImage`는 현재 실행 중인 digest) ④ Service 안정화 확인 ⑤ `/api/auth/me`의 `providers` 확인과 실제 로그인.
- `docs/21-STAGING-CD.md`: 새 환경 값은 Stack이 만든 revision에서 이어받는다는 점.
- `docs/09-DECISIONS.md`: 새 Decision(최신 번호 다음, Human Approved 2026-10-04).
- `docs/07-TASKS.md`: TASK-043을 DONE으로(Milestone 43). 행 / 절이 없으면 추가한다. 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `prompts/`, Parameter 예시 파일 2개(Placeholder).

### 금지

- 실제 ARN / 계정 ID / OAuth 값을 추적 파일에 쓰지 않는다.
- Workflow, Backend, Frontend, 다른 Stack 변경. Stack 갱신 실행(Human).
- Template이 Secret을 만들거나 값을 Parameter로 받는 방식.

## Verification

- `bash scripts/iac-validate.sh`
- `git diff --check`

## Claude Review 기준

- OAuth 값이 Template / Parameter / 로그에 나타나지 않는가(ARN만 받는가)
- 실행 Role 권한이 그 Secret 하나로 제한되는가, 빈 값일 때 Statement / 주입이 생기지 않는가
- 기존 DB 주입과 Health Check 등 다른 설정을 바꾸지 않았는가
- `PublicUrl` 형식 제한이 있는가
- 적용 순서 문서가 CD의 revision 복사 동작과 맞는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 Human이 Secret을 만들고 IAM / App Stack을 갱신한다. Claude 세션이 `providers`와 Cookie `Secure`를 확인하고, Human이 실제 Google / Kakao 로그인을 확인한다.
