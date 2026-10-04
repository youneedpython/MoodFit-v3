# TASK-042 — Social Login (Google / Kakao) + Guest + User Scoped Data

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

사용자를 구분한다. Google / Kakao 소셜 로그인과 "로그인 없이 둘러보기"(체험 계정)를 추가하고, Check-in 기록을 사용자별로 분리한다. 상단 메뉴에 사용자 아바타와 메뉴를 둔다.

## 초기 상태 / Dependency

- 초기: `READY` (Human Gate 승인, 2026-10-04)
- 선행: TASK-029(Staging CD), TASK-036, TASK-039
- 후속: TASK-043(Infra: OAuth 값 주입 — App / IAM Stack). 이 Task는 **OAuth 값이 없어도 App이 시작되고 체험 로그인이 동작**하게 만들어, Infra 작업 전에 배포할 수 있게 한다.
- 실행: `node scripts/orchestrator/run.mjs TASK-042`

## Human 결정 (2026-10-04, Gate 10개 항목 승인)

1. 로그인 수단: Google, Kakao만. 자체 회원가입 / 비밀번호 로그인 없음.
2. 방식: Backend가 OAuth 2.0 Authorization Code 흐름을 처리한다(Spring Security). 로그인 상태는 HttpOnly Cookie Session.
3. Session 저장: DB(Spring Session JDBC). ECS Task가 2개라 메모리 Session을 쓰지 않는다.
4. 받는 정보: 제공자의 사용자 번호와 닉네임(표시 이름)만. 이메일과 프로필 사진은 요청 / 저장하지 않는다.
5. 데이터 구분: Check-in 기록에 사용자를 연결한다. Dashboard / History는 본인 기록만 본다.
6. 기존 기록: 지금까지의 기록은 체험 계정 소유로 옮긴다.
7. 체험(게스트) 로그인: "로그인 없이 둘러보기". 체험 계정은 하나를 공유한다. 자동 배포의 Smoke Test와 시연 영상이 이 경로를 쓴다.
8. 보안: CSRF 방어, Cookie `HttpOnly` / `Secure` / `SameSite=Lax`, 인증 경로는 `/api/auth/` 아래(CloudFront가 `/api/*`를 Cookie / Query와 함께 전달함을 확인).
9. OAuth Client 값은 Secrets Manager에 두고 ECS가 환경 변수로 주입한다(TASK-043). 이 Task는 값을 다루지 않는다.
10. 변경 범위: Dependency 추가, DB Migration, API 계약 변경, Smoke Script 변경.
11. 추가 요청: 로그인하면 **아바타**를 보여 준다("github 처럼"). 프로필 사진을 받지 않으므로(4번) 표시 이름의 첫 글자와 사용자별 색으로 만든 아바타를 쓴다. 아바타를 누르면 메뉴(표시 이름, 로그인 수단, 로그아웃)가 열린다.
12. Production 주소는 `https://moodfit.8949db.kr`, Staging은 `https://staging.moodfit.8949db.kr`다.

## 확인된 사실 (Claude 세션)

- CloudFront는 `/api`, `/api/*`를 ALB로 보내며 Cookie 전체, Query 전체, `Host`를 뺀 모든 Header를 전달하고 Cache하지 않는다. **`Host`가 전달되지 않으므로 Backend가 보는 Host는 Origin 주소다.** 요청에서 만든 절대 주소로 Redirect하면 사용자가 접근할 수 없는 Origin 주소로 가게 된다.
- Backend는 Spring Boot(`spring-boot-starter-webmvc`), Flyway(`V1`, `V2`), MySQL 8.4, Test는 H2와 Testcontainers MySQL을 쓴다.
- `scripts/staging-smoke.sh`는 배포 뒤 인증 없이 Check-in을 만들고 계약 예시와 비교한다. `scripts/container-smoke.sh`도 Container로 API를 호출한다. 둘 다 로그인 도입 뒤에는 체험 로그인을 거쳐야 한다.
- Secret 검사는 자격 증명 단어(끝이 secret / token / password / key 같은 이름) 뒤에 콜론이나 등호와 값이 오는 표기를 차단한다.

## 설계 (실행 기준)

### API (모두 `/api/auth/` 아래)

| Method / 경로 | 동작 |
|---|---|
| `GET /api/auth/me` | 항상 200. 로그인 상태면 `authenticated` true와 사용자(`id`, `displayName`, `provider`), 아니면 `authenticated` false. 두 경우 모두 사용할 수 있는 로그인 수단 목록(`providers`, 설정된 것만)과 `guestEnabled`를 준다. CSRF Token Cookie를 내려 준다 |
| `GET /api/auth/login/{provider}` | 제공자 로그인 화면으로 Redirect(`google`, `kakao`). 설정되지 않은 제공자는 404 |
| `GET /api/auth/callback/{provider}` | 제공자가 돌아오는 주소. 성공하면 사용자 생성 / 갱신 뒤 `/`로, 실패하면 `/login?error=<고정된 짧은 코드>`로 Redirect |
| `POST /api/auth/guest` | 체험 계정으로 Session 시작(204). `guestEnabled`가 false면 404 |
| `POST /api/auth/logout` | Session 종료(204) |

- `/api/check-ins/**`는 로그인 필요. 아니면 **401**과 기존 `ErrorResponse` 형식(HTML Redirect가 아니다). 권한 오류도 JSON이다.
- Actuator Health 경로는 지금처럼 인증 없이 동작한다(ALB / Container Health Check).
- 상태를 바꾸는 요청(POST 등)은 CSRF Token을 요구한다. Cookie로 내려 준 Token을 Frontend가 Header로 되돌려 보낸다(Spring Security의 Cookie 기반 Token 저장 방식, SPA용 설정). CSRF 실패는 403 JSON.

### Redirect와 공개 주소

- 공개 주소는 환경 변수 `APP_PUBLIC_URL`로 받는다(기본값은 로컬 개발 주소). OAuth Redirect 주소는 `<APP_PUBLIC_URL>/api/auth/callback/{provider}`로 **고정 문자열 조합**으로 만든다. 요청의 Host / Scheme에서 추론하지 않는다.
- 로그인 성공 / 실패 뒤 Redirect도 `APP_PUBLIC_URL` 기준 절대 주소(또는 상대 경로 Location)로 보내 Origin 주소가 나오지 않게 한다. Test로 Location 값을 검증한다.
- Session Cookie의 `Secure`는 `APP_PUBLIC_URL`이 https일 때 켠다. Cookie에 Domain을 지정하지 않는다.

### 제공자 설정 (값이 없어도 시작)

- 환경 변수 이름(값은 TASK-043에서 주입): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `APP_PUBLIC_URL`, `AUTH_GUEST_ENABLED`(기본 true).
- 한 제공자의 두 값이 모두 있으면 그 제공자를 켠다. 없으면 끈다. **아무 제공자도 없어도 App이 정상 시작**하고 체험 로그인만 제공한다.
- 제공자 등록은 **Java Code에서 환경 값을 읽어 구성**한다(`ClientRegistration`을 직접 만든다). `application.properties`에 자격 증명 이름 뒤에 등호가 오는 줄을 쓰지 않는다(Secret 검사 대상). 기본값 / 예시 / Test용 가짜 값도 그런 표기로 쓰지 않는다. Test에서는 Code로 주입한다.
- Google: OpenID Connect, scope는 `openid`, `profile`만. 사용자 번호는 `sub`, 표시 이름은 `name`.
- Kakao: 인가 `https://kauth.kakao.com/oauth/authorize`, Token 발급 `https://kauth.kakao.com/oauth/token`, 사용자 정보 `https://kapi.kakao.com/v2/user/me`. scope는 `profile_nickname`만. 사용자 번호는 응답의 `id`, 표시 이름은 `kakao_account.profile.nickname`(없으면 `properties.nickname`). Token 요청의 Client 인증은 Form 본문 방식이다. 이 Endpoint와 필드는 Kakao 공식 문서 기준으로 Claude 세션이 적은 것이며, 구현 중 다르게 확인되면 문서에 "확인 필요"로 남기고 `human_decisions_needed`로 보고한다.
- 표시 이름은 문자열 검사 뒤 앞뒤 공백을 없애고 40자로 자른다. 없으면 "사용자"로 둔다. 이메일 / 사진 주소는 읽더라도 저장 / 응답 / 로그에 남기지 않는다.

### Data

- Migration `V3`(이름은 내용에 맞게): 사용자 Table(자동 증가 `id`, `provider`, `provider_user_id`, `display_name`, 생성 / 최근 로그인 시각, `(provider, provider_user_id)` unique), 체험 사용자 1행 삽입, Check-in Table에 사용자 Column 추가 → 기존 행을 체험 사용자로 채움 → NOT NULL과 Foreign Key, 조회용 Index. Spring Session JDBC Table(MySQL용 공식 Schema와 같은 구조)도 Migration으로 만든다(자동 Schema 초기화에 기대지 않는다). H2 Test와 MySQL Testcontainers 양쪽에서 Migration이 통과해야 한다.
- 기존 Version Task와 함께 실행되는 Rolling 배포 중에도 깨지지 않게 한다. 새 Column을 기본값 없이 NOT NULL로 만들면 이전 Version의 INSERT가 실패한다. **사용자 Column에 DB 기본값(체험 사용자 id)을 두거나** 같은 효과의 방법으로 이전 Version의 저장이 실패하지 않게 한다. 선택한 방법과 이유를 문서에 적는다.
- Check-in 저장 / 최신 / 이력 조회는 현재 로그인 사용자 기준으로만 동작한다. 다른 사용자의 기록은 보이지 않는다.
- Session 유효 시간은 7일(마지막 사용 기준)로 한다.

### Frontend

- `/login` 화면: 설정된 제공자 버튼(Google, Kakao), "로그인 없이 둘러보기" 버튼, 수집 정보 안내(제공자의 사용자 번호와 닉네임만 저장). 제공자가 하나도 없으면 체험 버튼만 보인다. `?error=`가 있으면 안내 문구를 보여 준다(값을 그대로 출력하지 않고 고정 문구로 바꾼다).
- 로그인하지 않은 상태로 다른 화면에 들어오면 `/login`으로 보낸다. API가 401을 주면 로그인 상태를 지우고 `/login`으로 보낸다.
- 제공자 로그인은 전체 화면 이동(`/api/auth/login/{provider}`)이다. 체험 로그인과 로그아웃은 API 호출 뒤 상태를 갱신한다.
- API 호출: Cookie를 함께 보내고(same-origin), 상태 변경 요청에 CSRF Header를 붙인다.
- **아바타와 사용자 메뉴**(상단 메뉴 오른쪽 끝): 표시 이름 첫 글자와 사용자 id에서 정한 색(기존 Token 색 중에서 선택)으로 만든 원형 아바타 버튼. 누르면 메뉴가 열린다: 표시 이름, 로그인 수단(Google / Kakao / 체험), "로그아웃". Keyboard로 열고 닫을 수 있고(Esc, 바깥 클릭으로 닫힘) `aria-expanded` / `aria-haspopup`를 쓴다. 체험 계정이면 "체험 계정" 표시를 한다.
- 상단 메뉴의 **로고 / 날짜 영역은 TASK-041이 병행 수정 중이므로 바꾸지 않는다.** 사용자 메뉴만 추가한다. 390px에서 메뉴가 깨지지 않게 한다. `/login` 화면에서는 주요 메뉴(Dashboard / Check-in / History)와 아바타를 숨기거나 비활성으로 둔다.
- 새 npm Dependency를 추가하지 않는다.

### Smoke Script

- `scripts/staging-smoke.sh`, `scripts/container-smoke.sh`: Cookie 저장 파일과 CSRF Token을 써서 체험 로그인 뒤 기존 검증을 수행한다. 로그인 전 `/api/check-ins/latest`가 401인지도 확인한다. 임시 파일은 끝나면 지운다. Token / Cookie 값을 출력하지 않는다.
- Staging Smoke는 체험 계정에 합성 기록을 남긴다(삭제하지 않음, 기존 정책 유지).

### Dependency

- Backend: Spring Security, OAuth2 Client, Spring Session JDBC의 **이 Spring Boot Version에 맞는 공식 Starter / Module 이름**을 쓴다. Version은 Boot BOM이 관리한다(직접 지정하지 않는다). Test용 Security 지원도 같은 방식으로 추가한다. 이름을 추측하지 말고 Gradle 해석으로 확인한다. 해석할 수 없으면(Sandbox Network 등) 문서에 적고 `human_decisions_needed`로 보고한다.

### Test

- 로그인 없이 Check-in API → 401 JSON, 체험 로그인 뒤 → 정상
- 사용자 A의 기록이 사용자 B에게 보이지 않음(저장 / 최신 / 이력)
- CSRF Token 없는 POST → 403, 있는 POST → 정상
- 제공자 미설정 시 App 시작, `/api/auth/me`의 `providers`가 비어 있음, 미설정 제공자 로그인 경로 404
- OAuth 로그인 성공 처리(가짜 사용자 정보로): Google / Kakao 사용자 생성, 재로그인 시 같은 사용자, 표시 이름 정리, 이메일 미저장
- Redirect Location이 `APP_PUBLIC_URL` 기준인지
- 기존 계약 Test는 로그인 상태를 갖춰 통과하게 고친다. Check-in 응답 본문 형식은 바꾸지 않는다.
- Frontend: 로그인 화면, 미로그인 이동, 401 처리, 아바타 메뉴(열기 / 닫기 / 로그아웃), 제공자 목록에 따른 버튼

### 문서

- `docs/05-API_SPEC.md`와 `contracts/`: 인증 API와 401 예시 추가. 기존 Check-in 예시는 그대로.
- `docs/22-AUTH.md`(새 문서): 흐름, 저장하는 정보, Session / CSRF, 환경 변수, 제공자별 설정(Redirect 주소: Staging / Production), 체험 계정, Rolling 배포 호환, 한계(체험 계정은 누구나 쓰고 볼 수 있음, 남용 방지 없음).
- `docs/09-DECISIONS.md`: 새 Decision(최신 번호 다음, Human Approved 2026-10-04). Core MVP의 "단일 사용자" 결정(DEC-019 등)에 변경 이력.
- `docs/07-TASKS.md`: TASK-042 행과 절 추가, DONE(Milestone 42). TASK-043(Infra: OAuth 값 주입, READY)도 행과 절로 등록한다. Task 표가 빈 줄로 끊기지 않게 한다. 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `docs/21-STAGING-CD.md`(Smoke 변경), README(로그인 소개 한 단락), `prompts/`.

### 금지

- Infra / Workflow 변경, 실제 OAuth 값 사용, 이메일 / 사진 저장
- Secret 검사에 걸리는 표기(자격 증명 이름 뒤 콜론이나 등호 + 값). 불가피하면 구현하지 말고 `human_decisions_needed`로 정확한 문구를 보고한다.
- 로그 / 오류 응답에 Token, Cookie, 제공자 응답 원문 출력

## Verification

- `bash scripts/verify.sh`
- `bash scripts/container-smoke.sh`
- `bash -n scripts/staging-smoke.sh`
- `git diff --check`

## Claude Review 기준

- 사용자 간 기록 분리가 모든 조회 / 저장 경로에 적용되는가
- OAuth 값 없이 시작하고 체험 로그인이 동작하는가
- Redirect가 Origin 주소로 새지 않는가, Open Redirect가 없는가(Redirect 대상이 고정 경로인가)
- CSRF / Cookie 속성 / 401·403 JSON 처리
- 이메일 / 사진 / Token이 저장 / 응답 / 로그에 없는가
- Migration이 기존 Data와 Rolling 배포에서 안전한가
- Smoke Script가 값을 출력하지 않는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 Staging 자동 배포에서 체험 로그인 Smoke가 통과하는지 확인한다. Google / Kakao 로그인은 TASK-043 뒤에 확인한다.
