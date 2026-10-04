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

- Human이 Secrets Manager에 Secret 하나를 만든다(환경별 1개, 이름 예: `moodfit/staging/oauth`). JSON Key는 4개다: `google_client_id`, `google_client_code`, `kakao_client_id`, `kakao_client_code`(Run 2에서 이름 확정). Template은 이 Secret을 **만들지 않고 ARN을 Parameter로 받는다**(값이 Template / Change Set에 나타나지 않게 한다).
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

## Run 2 범위 (2026-10-04, Claude 세션 기록)

Run 1 구현은 Branch에 "검토 미완료 WIP"로 Commit되어 있다. Run 1은 Secret 검사(Guard)에서 멈췄다(Verify / Review 전). 실제 자격 증명은 없고 Template 표기가 규칙에 걸렸다.

- 걸린 곳: `app.yaml`의 Container 자격 증명 주입 목록(목록 Key 이름, DB 암호 참조, JSON Key 이름에 들어 있던 자격 증명 단어), `app.yaml` / `iam.yaml`의 `OAuthCredentialArn` `AllowedPattern`(ARN의 자격 증명 단어 뒤에 콜론과 문자열이 오는 형태).
- **Human 승인(2026-10-04)**: 자격 증명 주입 목록 줄의 앞부분(DB 주입 2개까지, 닫는 대괄호 제외)을 허용 문구로 추가했다. 정확한 문구는 `harness/tasks/TASK-043.json`의 `secret_scan_allow`에 있다. 이미 승인된 DB 주입 줄에서 끝의 `]`만 뺀 형태다.
- **OAuth Secret의 JSON Key 이름을 바꾼다**(추가 허용 문구가 필요 없게): `google_client_id`, `google_client_code`, `kakao_client_id`, `kakao_client_code`. 환경 변수 이름(Backend가 읽는 이름)은 그대로다.
- Claude 세션이 WIP에 아래 두 가지 표기를 이미 반영했고, Sandbox 밖에서 Secret 검사 / cfn-lint / `validate-template` 통과를 확인했다. **이 표기를 그대로 유지한다.**
  1. `app.yaml`: 자격 증명 주입 목록을 승인 문구로 시작하는 flow 형식으로 쓰고, OAuth 4개 항목은 줄마다 `!If [HasOAuthCredential, {...}, !Ref "AWS::NoValue"]`로 이어 붙인다.
  2. `app.yaml` / `iam.yaml`: `AllowedPattern`의 구분 콜론을 `[:]`로 쓴다(뜻은 같다).
- Run 2에서 할 일:
  1. 문서와 예시 파일에서 JSON Key 이름을 새 이름으로 맞춘다(`docs/22-AUTH.md`, `docs/18` Runbook, Decision, WORK_LOG, Prompt 기록 등). 예전 이름이 남아 있지 않게 한다. Secret 검사에 걸리는 표기(자격 증명 단어 뒤 콜론 / 등호 + 값)를 문서에 새로 쓰지 않는다. JSON 예시가 필요하면 Key 이름을 표로 나열한다.
  2. Template의 나머지 부분이 Task 설계와 맞는지 다시 확인한다(Condition, `ExecutionRole` Statement, `PublicUrl` / `GuestLoginEnabled`). 위 두 표기 외에 필요한 수정만 한다.
  3. `docs/08-WORK_LOG.md`와 `prompts/`에 Run 2 기록을 추가한다.

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
