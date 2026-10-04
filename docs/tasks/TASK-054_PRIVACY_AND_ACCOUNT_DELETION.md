# TASK-054 — Privacy Notice / Account Deletion / SPA Route Fix

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

실제 로그인을 받고 건강 관련 수치를 저장하는 서비스가 됐다. Production 공개 전에 (1) 개인정보 처리 안내 화면, (2) 사용자가 자기 계정과 기록을 지우는 기능, (3) 직접 주소로 들어오면 열리지 않는 화면 경로를 고친다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-04 — 개선 항목 "개인정보처리방침 명시"를 Production 전 첫 순위로 진행)
- 선행: TASK-042(로그인), TASK-044(지역), TASK-045(LLM)
- 실행: `node scripts/orchestrator/run.mjs TASK-054`

## Human 지시와 전제 (2026-10-04)

- Human이 제시한 개선 항목 6번: "개인정보처리방침 명시 — 생체(건강) 데이터를 다루는 서비스는 법적 명시 필수, 저장 / 전송 암호화 정책 포함".
- 이 문서는 **포트폴리오 / 교육용 서비스의 처리 안내**다. 법률 검토를 거친 문서가 아니며, 화면과 문서에 그 점을 적는다. 사실과 다른 내용, 확인하지 않은 인증 / 준수 주장을 쓰지 않는다.
- 문의 창구는 GitHub 저장소의 Issue로 안내한다(개인 이메일을 쓰지 않는다).

## 확인된 사실 (Claude 세션이 Code / Template / Staging에서 확인)

### 처리하는 정보

| 구분 | 항목 | 근거 |
|---|---|---|
| 로그인 | 제공자(Google / Kakao)의 사용자 번호, 표시 이름(닉네임). 이메일 / 프로필 사진은 요청하지 않고 저장하지 않는다 | TASK-042 |
| Check-in 기록 | 심박수, 호흡수, 수면 점수, 스트레스, 에너지, 기온, 날씨 종류, 지역 이름(자동 조회 때만), 기록 시각, 규칙이 계산한 Score / 상태 / 추천 | TASK-006, 044 |
| AI 문장 | 생성된 AI 코멘트와 주간 리포트, 생성 시도 기록(하루 한도 계산용) | TASK-045 |
| Session | 로그인 상태 유지용 Cookie(HttpOnly, Secure, SameSite=Lax)와 Server의 Session 기록. 마지막 사용 뒤 7일 | TASK-042 |
| 브라우저 저장 | 날씨 자동 조회 사용 여부 1개 값(localStorage). 좌표는 저장하지 않는다 | TASK-035, 040 |
| 접속 기록 | Load Balancer 접속 Log(IP 주소 등), Application Log. 30일 보관 | `app.yaml`, `data.yaml`, `iam.yaml` |

### 저장하지 않는 것

- 위치 좌표(위도 / 경도): 브라우저에서 날씨 / 지역 이름 조회에만 쓰고 Server로 보내지 않는다.

### 외부로 나가는 정보

| 받는 곳 | 보내는 것 | 어디서 |
|---|---|---|
| Google / Kakao | 로그인 요청(사용자가 그 서비스에서 직접 인증) | Server / 브라우저 |
| Open-Meteo | 소수 2자리로 줄인 좌표 | 브라우저 |
| BigDataCloud | 소수 2자리로 줄인 좌표 | 브라우저 |
| YouTube | 사용자가 "바로 듣기"를 누를 때 영상 요청(`youtube-nocookie.com`) | 브라우저 |
| Amazon Bedrock (Anthropic Claude) | Check-in 수치, 날씨, 규칙 결과. 사용자 번호 / 이름 / 지역 이름 / 좌표 / 기록 번호는 보내지 않는다. **global 추론 Profile을 써서 국외 Region에서 처리될 수 있다.** 소셜 로그인 사용자가 AI 코멘트 / 주간 리포트를 생성할 때만 | Server |

### 보관 위치와 보호

- AWS 서울 Region. Database는 Private Subnet의 RDS MySQL이며 저장 암호화(`StorageEncrypted: true`), 자동 백업 14일.
- 전송: 사용자 ↔ CloudFront ↔ Load Balancer 구간 HTTPS, Application ↔ Database 구간 TLS 필수(`sslMode=REQUIRED`).
- 접근: 운영자만 AWS 계정으로 접근한다(권한 분리, DEC-029).

### 체험 계정

- "로그인 없이 둘러보기"는 **하나의 공유 계정**이다. 그 계정의 기록은 모든 방문자가 보고 쓸 수 있다. 개인적인 수치를 넣지 말라고 안내한다.

### 지금 없는 것 (이 Task에서 만든다)

- **계정 / 기록 삭제 기능이 없다.** 사용자가 스스로 지울 방법이 없다.
- **직접 주소 접근 오류**: CloudFront Function이 `/check-in`, `/history`만 `index.html`로 바꾼다. Staging에서 `https://staging.moodfit.8949db.kr/login`을 직접 열면 **403**이다(Claude 세션 확인). 로그인 실패 뒤 Server가 `/login?error=...`로 보내는 경우와 새로 고침에서 화면이 열리지 않는다.

## 설계 (실행 기준)

### 1. 개인정보 처리 안내 화면

- 경로 `/privacy`. **로그인 없이** 볼 수 있다(로그인 화면에서 Link로 들어온다).
- 내용: 위 "확인된 사실"을 사용자가 읽기 쉬운 한국어 문장과 표로 옮긴다. 구성 — 이 문서의 성격(포트폴리오 서비스의 처리 안내, 법률 검토 문서 아님, 의료 서비스 아님) / 처리하는 정보와 목적 / 저장하지 않는 정보 / 외부 서비스로 나가는 정보(국외 처리 가능성 포함) / 보관 위치와 기간 / 보호 조치(전송 / 저장 암호화) / 체험 계정 주의 / 삭제 방법(아래 2번) / 문의(GitHub Issue Link) / 시행일(2026-10-04).
- 사실과 다른 문장을 쓰지 않는다. 확인하지 않은 것(법적 근거 조항 번호, 인증, 보관 의무 기간 등)을 지어내지 않는다.
- Link 위치: 로그인 화면의 수집 안내 문구 근처, 사용자 메뉴(아바타 메뉴), 화면 맨 아래 Footer(작은 글씨, 모든 화면).
- 접근성: 제목 계층, 표의 Header, 외부 Link 표시. 390px에서 표가 넘치지 않게 한다.

### 2. 계정과 기록 삭제

- API: `DELETE /api/auth/account` (로그인 필요, CSRF 필요).
  - 소셜 로그인 사용자: 그 사용자의 Check-in 기록(추천 포함), AI 코멘트, 주간 리포트, 생성 시도 기록, 사용자 행을 **한 Transaction으로** 삭제하고 Session을 끝낸다. 204.
  - 체험 계정: 삭제할 수 없다. 403(`ErrorResponse`, 고정 Code). 공유 계정이라 한 방문자가 전체를 지우면 안 된다.
  - 미로그인: 401.
- 삭제 순서는 Foreign Key를 고려한다(자식 → 부모). Migration은 필요하면 추가한다(예: 삭제에 필요한 Index). 기존 Table 구조를 바꾸는 Migration은 Rolling 배포에 안전해야 한다.
- 다시 로그인하면 새 사용자로 만들어진다(이전 기록은 없다).
- Frontend: 사용자 메뉴에 "내 데이터 삭제" 항목(체험 계정에는 보여 주지 않는다). 누르면 확인 Dialog — 무엇이 지워지는지와 되돌릴 수 없다는 점을 적고, "삭제" / "취소" 버튼. 기본 focus는 "취소". 삭제 뒤 로그인 화면으로 이동하고 완료 문구를 보여 준다. Dialog는 Keyboard로 닫을 수 있고(Esc) focus를 가둔다(`role="dialog"`, `aria-modal`).
- 백업(14일)에는 삭제 전 Data가 남을 수 있다는 점을 안내 화면에 적는다.

### 3. 직접 주소 접근 수정 (Infra)

- `infra/cloudformation/frontend.yaml`의 CloudFront Function이 `/login`, `/privacy`도 `index.html`로 바꾸게 한다. 기존 `/check-in`, `/history` 처리와 `/api` 경로, 정적 파일 경로는 바꾸지 않는다. Query 문자열(`?error=...`)은 유지되어야 한다.
- 경로 목록은 한 곳(배열 등)에서 관리해 다음에 화면을 추가할 때 한 줄만 고치게 한다.
- `scripts/staging-smoke.sh`의 SPA 경로 검사에 `/login`, `/privacy`를 더한다.
- **이 Template 변경은 Human이 Frontend Stack Change Set으로 적용해야 효과가 난다.** 적용 전까지 자동 배포의 Staging Smoke가 새 경로 검사에서 실패할 수 있다 — 그래서 Smoke의 새 경로 검사는 **실패해도 배포를 실패로 만들지 않는 경고**로 두지 말고, 문서에 "Merge 직후 Frontend Stack을 먼저 갱신한다"는 순서를 명확히 적는다. (Smoke는 정확히 검사한다.)

### 계약 / 문서

- `contracts/`와 `docs/05-API_SPEC.md`: 삭제 API(204, 체험 계정 403) 예시 추가.
- `docs/25-PRIVACY.md`(새 문서): 화면과 같은 내용 + 근거(어느 Task / Template에서 확인했는지), 한계(법률 검토 아님).
- `docs/22-AUTH.md`: 삭제 API와 체험 계정 예외.
- `docs/18-STAGING-DEPLOYMENT-RUNBOOK.md`: Frontend Stack 갱신 절차(이번 Function 변경).
- `docs/09-DECISIONS.md`: 새 Decision(최신 번호 다음, Human Approved 2026-10-04).
- `docs/07-TASKS.md`: TASK-054 행과 절 추가, DONE(Milestone 54, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, README(개인정보 처리 안내 Link 한 줄), `prompts/`.

### Test

- Backend: 삭제 뒤 그 사용자의 기록 / 코멘트 / 리포트 / 시도 기록 / 사용자 행이 없음, 다른 사용자 Data는 그대로, 체험 계정 403, 미로그인 401, CSRF 없으면 403, 삭제 뒤 같은 제공자 계정으로 다시 로그인하면 새 사용자. H2와 MySQL Testcontainers 양쪽.
- Frontend: `/privacy`가 로그인 없이 열림, 로그인 화면 / 사용자 메뉴 / Footer의 Link, 삭제 Dialog(열기, 취소, Esc, 확인 뒤 호출과 이동), 체험 계정에는 삭제 항목 없음.
- 계약 Test: 새 예시.

### Secret 검사 주의

- `token` / `secret` / `password` / `key`로 끝나는(뒤에 영숫자가 붙어도 포함) 이름 뒤에 콜론이나 등호와 값이 오면 차단된다. 안내 화면과 문서에서 "Cookie 이름 뒤 등호 값" 같은 표기를 쓰지 않는다.

### 금지

- Dependency 추가, 다른 Template 변경, Workflow 변경
- 사실과 다른 준수 / 인증 주장, 개인 이메일 / 전화번호 기재
- 체험 계정 Data 삭제 허용

### 참고 (Executor Sandbox)

- Sandbox에서 Gradle / npm / AWS CLI를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다. Test의 타입 오류(`tsc --noEmit`)와 Java Type 불일치에 주의한다.

## Verification

- `bash scripts/verify.sh`
- `bash scripts/container-smoke.sh`
- `bash scripts/iac-validate.sh`
- `bash -n scripts/staging-smoke.sh`
- `git diff --check`

## Claude Review 기준

- 안내 화면의 내용이 "확인된 사실"과 일치하는가, 지어낸 주장이 없는가
- 삭제가 본인 Data 전부를 지우고 다른 사용자 / 체험 계정을 건드리지 않는가, Transaction인가
- CloudFront Function이 새 경로만 추가하고 `/api`와 정적 파일을 건드리지 않는가
- Dialog 접근성과 되돌릴 수 없다는 안내가 있는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 직후 Human이 Frontend Stack Change Set을 적용하고, Staging에서 `/login` / `/privacy` 직접 접근과 삭제 흐름을 확인한다.
