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

TASK-043에서 제공자 Console 등록과 Secrets Manager → ECS 주입을 진행한다. Production 실행은 기존 Human Gate를 유지한다.

## 데이터 / Rolling 배포

V3는 체험 사용자 id 1을 삽입하고 Check-in의 `user_id`를 기본값 1 / NOT NULL / 외래 키로 추가한다. 기존 행도 이 계정으로 연결된다. 기본값을 유지하여 이전 Version이 사용자 Column 없이 INSERT해도 성공한다. 새 Version은 저장 / 최신 / 이력 모두 인증된 사용자 id를 적용하고 사용자별 시각 Index를 사용한다. 이전 Version의 조회는 사용자 구분을 모르므로 소셜 기능 공개 전에 전체 인스턴스 전환을 확인해야 한다. DB Schema 롤백은 제공하지 않는다.

## 체험 계정 / 한계

체험 계정은 하나를 공유한다. 누구나 기록을 보고 추가할 수 있으며 남용 방지는 구현하지 않는다. 개인 기록은 소셜 계정으로 로그인해야 분리된다. Smoke는 체험 로그인 후 합성 기록을 남기며 삭제하지 않는다. Cookie / CSRF 임시 파일은 종료 시 삭제하며 값을 출력하지 않는다.

Google / Kakao 실서비스 로그인과 환경별 Secure Cookie / CloudFront 전달 실측은 TASK-043 이후 확인한다. 제공자 미설정 환경의 체험 로그인은 이 Task 검증 대상이다.
