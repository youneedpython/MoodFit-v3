# 22. 로그인과 사용자별 기록

TASK-042의 Human 승인(2026-10-04)에 따라 Google / Kakao와 공유 체험 계정을 제공한다. 실제 제공자 값 주입과 로그인 실측은 TASK-043에서 진행한다.

## 로그인 흐름과 수집 정보

Frontend는 `/api/auth/me`로 로그인 상태와 활성 제공자를 조회하고 미로그인 사용자를 `/login`으로 보낸다. 소셜 버튼은 Backend 인가 경로로 전체 화면을 이동시킨다. Backend가 Authorization Code와 제공자 사용자 정보를 확인하고 공개 주소의 `/`로 이동시킨다. 실패 경로는 `/login?error=oauth`로 고정하며 오류 Query 원문은 화면에 출력하지 않는다.

DB에는 제공자 이름 / 사용자 번호 / 최대 40자 표시 이름 / 생성 및 최근 로그인 시각만 저장한다. 제공자와 사용자 번호의 조합은 유일하다. 이메일 / 사진은 요청 scope에 넣지 않고 저장 / 응답 / 로그에 남기지 않는다. 로그인 완료 후 Session Principal은 앱 사용자 id / 표시 이름 / 제공자만 가진다. Authorized Client와 제공자 응답은 장기 저장하지 않는다.

Google은 `openid`, `profile` scope와 `sub`, `name` 필드를 사용한다. Kakao는 `profile_nickname` scope와 `id`, `kakao_account.profile.nickname`을 사용하고 닉네임이 없으면 `properties.nickname`을 읽는다. 승인 Endpoint와 필드는 [Kakao 공식 REST API](https://developers.kakao.com/docs/en/kakaologin/rest-api)를 따르며 Client 인증은 Form 본문 방식이다.

## Session / CSRF

Spring Session JDBC로 ECS 간 Session을 공유한다. 마지막 접근부터 7일간 유효하다. V3가 Session Table / Index / 외래 키를 생성하므로 자동 초기화에 의존하지 않는다. 구조는 [Spring Session 공식 MySQL Schema](https://github.com/spring-projects/spring-session/blob/main/spring-session-jdbc/src/main/resources/org/springframework/session/jdbc/schema-mysql.sql)를 따른다.

Session Cookie는 HttpOnly / SameSite Lax / Path `/`이며 Domain을 지정하지 않는다. 공개 주소가 HTTPS이면 Secure를 켠다. 로그인 시 Session id를 교체하고 로그아웃 시 Session을 무효화한다. `/me`가 발급하는 CSRF Cookie는 SPA가 읽어야 하므로 HttpOnly가 아니다. 상태 변경 요청은 Cookie 값을 `X-XSRF-TOKEN` Header로 전달한다. Cookie 이름은 `XSRF-TOKEN`이다. 로그인 / 로그아웃 후 `/me`를 다시 읽어 새 값을 확보한다.

미인증 Check-in 조회는 401 JSON, CSRF / 권한 오류는 403 JSON이다. 상태 변경 요청은 인증 검사보다 먼저 CSRF 검사를 받을 수 있다. Actuator Health는 공개 상태를 유지한다.

## 환경 변수 / 제공자 등록

환경 변수 이름은 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `APP_PUBLIC_URL`, `AUTH_GUEST_ENABLED`이다. 자격 증명 값 / 기본 예시는 문서나 설정 파일에 쓰지 않는다. 한 제공자의 두 값이 모두 있어야 Java ClientRegistration을 만든다. 제공자가 없어도 App이 시작하며 체험 로그인만 제공한다. 게스트 기본값은 true, 공개 주소 기본값은 `http://localhost:5173`이다.

Redirect URI는 공개 주소와 고정 Callback 경로를 결합한다. 요청 Host / Scheme은 사용하지 않는다. 공개 주소는 HTTP(S) origin만 허용하고 사용자 입력으로 Redirect 목적지를 바꿀 수 없다.

| 환경 | Google Callback | Kakao Callback |
|---|---|---|
| Staging | `https://staging.moodfit.8949db.kr/api/auth/callback/google` | `https://staging.moodfit.8949db.kr/api/auth/callback/kakao` |
| Production | `https://moodfit.8949db.kr/api/auth/callback/google` | `https://moodfit.8949db.kr/api/auth/callback/kakao` |

Human이 제공자 Console 앱과 위 Callback 주소를 등록했다. TASK-043은 Secrets Manager → ECS 주입 Template를 구현하며 실제 적용은 Merge 후 Human이 수행한다. Production 실행은 기존 Human Gate를 유지한다.

### OAuth Secret과 Stack 적용 (TASK-043)

Human이 환경마다 Secret 하나(이름 예: `moodfit/staging/oauth`)를 콘솔에서 만든다. Run 2 승인에 따른 JSON Key는 아래 네 개이며 값은 Human만 입력한다. 네 Key를 모두 생성해야 ECS가 주입할 수 있다. 한 제공자를 끄려면 그 제공자의 두 값을 빈 문자열로 둔다. Agent와 Claude 세션은 Secret 값을 조회하지 않는다. 실제 ARN / 계정 ID / 값은 추적 파일, Prompt, 로그에 남기지 않는다.

| JSON Key | ECS 환경 변수 이름 |
|---|---|
| `google_client_id` | `GOOGLE_CLIENT_ID` |
| `google_client_code` | `GOOGLE_CLIENT_SECRET` |
| `kakao_client_id` | `KAKAO_CLIENT_ID` |
| `kakao_client_code` | `KAKAO_CLIENT_SECRET` |

`client_code` Key에는 제공자의 Client Secret 값을 입력한다. OAuth Callback의 일회성 Authorization Code를 넣는 Key가 아니다. Backend 환경 변수 이름은 기존 계약을 유지한다.

Secrets Manager 기본 암호화 Key를 사용한다. 다른 KMS Key를 쓰면 실행 Role의 추가 권한과 Key 정책 검토가 필요하므로 현재 Template로 적용하지 않고 별도 Human 승인을 받는다. Template는 Secret을 생성하지 않으며 OAuth 값을 Parameter로 받지 않는다.

IAM과 App의 `OAuthCredentialArn`에는 동일 환경의 Secret 전체 ARN을 로컬 비추적 Parameter 파일로 전달한다. 빈 문자열이면 OAuth 주입과 읽기 Statement가 생략된다. ExecutionRole만 그 Secret 하나를 읽고 TaskRole에는 권한이 없다. App의 필수 `PublicUrl`은 HTTPS origin이고 끝에 `/`를 붙이지 않는다. Staging은 `https://staging.moodfit.8949db.kr`, Production은 `https://moodfit.8949db.kr`이다. `GuestLoginEnabled`는 true / false이며 기본 true다. Parameter 예시의 ARN Placeholder는 Human이 로컬에서 교체하며 OAuth 없이 적용할 때는 빈 문자열을 사용한다.

적용은 Secret 생성 → IAM Stack UPDATE Change Set 검토·실행 → App Stack UPDATE Change Set 검토·실행 → Service 안정화 확인 순서다. App의 `BackendImage`는 현재 Service가 실행 중인 digest로 맞춘다. 배포 중 CD와 Stack 변경이 겹치지 않도록 Human이 실행 상황을 확인한다. 이후 CD는 현재 Task Definition의 Image만 교체하므로 새 환경 변수와 Secret 참조를 이어받는다. 상세 순서는 [Staging Runbook](18-STAGING-DEPLOYMENT-RUNBOOK.md)을 따른다.

안정화 뒤 승인된 Claude 세션이 `/api/auth/me`의 `providers`에 google / kakao가 있는지와 HTTPS 응답의 Session / CSRF Cookie Secure 속성을 확인한다. Cookie 값, 제공자 응답, 인가 Code는 출력하거나 저장 기록으로 공유하지 않는다. Human이 두 제공자의 실제 로그인과 Callback 후 앱 복귀를 확인한다. Template 구현 완료는 실서비스 로그인 성공을 뜻하지 않는다.

Secret 값을 교체해도 실행 중인 Task에는 반영되지 않는다. Human이 Service를 새로 배포하고 안정화 / 제공자 / Cookie / 실제 로그인 확인을 반복한다. ARN이 바뀌면 IAM을 먼저 갱신하고 App의 ARN도 갱신한다. Production도 환경별 Secret과 공개 주소를 사용해 같은 순서로 진행하되 별도 Production 실행 승인과 Required Reviewer를 유지한다.

## 데이터 / Rolling 배포

V3는 체험 사용자 id 1을 삽입하고 Check-in의 `user_id`를 기본값 1 / NOT NULL / 외래 키로 추가한다. 기존 행도 이 계정으로 연결된다. 기본값을 유지하여 이전 Version이 사용자 Column 없이 INSERT해도 성공한다. 새 Version은 저장 / 최신 / 이력 모두 인증된 사용자 id를 적용하고 사용자별 시각 Index를 사용한다. 이전 Version의 조회는 사용자 구분을 모르므로 소셜 기능 공개 전에 전체 인스턴스 전환을 확인해야 한다. DB Schema 롤백은 제공하지 않는다.

## 체험 계정 / 한계

체험 계정은 하나를 공유한다. 누구나 기록을 보고 추가할 수 있으며 남용 방지는 구현하지 않는다. 개인 기록은 소셜 계정으로 로그인해야 분리된다. Smoke는 체험 로그인 후 합성 기록을 남기며 삭제하지 않는다. Cookie / CSRF 임시 파일은 종료 시 삭제하며 값을 출력하지 않는다.

Google / Kakao 실서비스 로그인과 환경별 Secure Cookie / CloudFront 전달 실측은 TASK-043 이후 확인한다. 제공자 미설정 환경의 체험 로그인은 이 Task 검증 대상이다.

## 계정과 기록 삭제 (TASK-054)

TASK-055 / DEC-042: 삭제 대상에 본인의 추천 평가(좋아요 / 별로예요)를 추가한다. V6 Table의 행을 사용자 행보다 먼저 같은 트랜잭션에서 지운다. 평가 저장과 계정 삭제는 동일 사용자 행을 잠가 동시 처리를 직렬화한다. Session / CSRF 설정과 체험 계정 제한은 유지한다.

소셜 사용자 메뉴에서 “내 데이터 삭제”를 선택하면 확인 Dialog를 연다. 기본 초점은 취소이며 취소 / Esc로 닫고 초점을 메뉴 버튼으로 돌려준다. Tab 초점은 Dialog 안에 머문다. 삭제 성공 후 로그인 화면에 완료 문구를 보여 준다. 체험 계정에는 삭제 메뉴가 없다.

`DELETE /api/auth/account`는 로그인과 CSRF가 필요하다. 본인 체크인과 추천, AI 코멘트, 주간 리포트, 생성 시도 기록과 사용자 행을 한 트랜잭션으로 삭제하며 계정의 기존 서버 세션을 종료하고 현재 Security Context와 CSRF Cookie를 정리한다. 실패 시 Transaction은 Rollback하며 세션 종료는 성공 후에만 수행한다. 체험 계정은 `GUEST_ACCOUNT_DELETION_FORBIDDEN` / 403, 미로그인(CSRF 유효)은 401, CSRF 누락은 403이다. 다시 로그인하면 이전 기록이 없는 새 사용자로 만든다.

자동 백업에는 삭제 전 데이터가 최대 14일 남을 수 있고 접속 로그는 별도의 30일 보관 기간을 따른다. 공개 `/privacy`는 로그인 조회 실패와 무관하게 열리며 로그인 화면 / 사용자 메뉴 / 전체 화면 Footer에서 연결한다. 안내 내용과 근거는 [25-PRIVACY.md](25-PRIVACY.md), API 계약은 [05-API_SPEC.md](05-API_SPEC.md)를 따른다.
