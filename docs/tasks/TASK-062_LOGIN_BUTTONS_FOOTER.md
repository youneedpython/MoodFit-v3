# TASK-062 — Login Buttons / Footer (로그인 버튼 모양 / 화면 아래 Link 정리)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

로그인 화면의 Google / Kakao 로그인이 밑줄 친 글자로 보여 버튼처럼 보이지 않는다. 제공자를 알아볼 수 있는 버튼으로 바꾸고, 모든 화면 맨 아래에 Link 하나만 떠 있는 Footer를 정리한다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-042, TASK-054, TASK-057(같은 `auth.css`를 고치므로 그 뒤에 진행한다)
- 실행: `node scripts/orchestrator/run.mjs TASK-062`

## Human 지시 (2026-10-05)

Claude 세션이 화면을 훑어 뽑은 개선 후보를 Human이 모두 승인했다("위 사항 모두 Task로 정리"). UI / UX 수정은 화면별로 나눠 진행한다. 이 Task가 맡는 후보: L1(Google / Kakao 버튼에 로고와 제공자 색), L2(화면 아래 "개인정보 처리 안내" Link).

## 현재 구조 (Claude 세션 확인)

- `frontend/src/features/auth/LoginPage.tsx`: `login-actions` 안에 `<a class="login-provider" href="/api/auth/login/{provider}">Google로 로그인</a>`, `Kakao로 로그인`, 그리고 `<button>로그인 없이 둘러보기</button>`. 세 항목이 같은 어두운 테두리 Box이고 제공자 두 개는 밑줄 친 Link 글자다. 그 아래에 저장 항목 안내, "개인정보 처리 안내" Link, 체험 계정 안내가 간격 없이 이어진다.
- `frontend/src/app/AppLayout.tsx`: `<footer className="container app-footer"><Link to="/privacy">개인정보 처리 안내</Link></footer>`. 로그인 화면에서는 Card 안의 Link와 Footer의 Link가 둘 다 보인다.

## 설계 (실행 기준)

### 1. 로그인 버튼 (L1)

- Google / Kakao는 계속 `<a>`(이동)이고 주소는 바꾸지 않는다. 모양만 버튼으로 한다: 밑줄 없음, 높이 48px 이상, 왼쪽에 제공자 Logo, 가운데에 문구.
- **Google 버튼**: 흰 배경(`#FFFFFF`), 글자 `#1F1F1F`, 테두리 `#747775`, 표준 4색 "G" Logo(Inline SVG). 문구 "Google로 로그인".
- **Kakao 버튼**: 배경 `#FEE500`, 글자 `rgba(0, 0, 0, 0.85)`, 말풍선 Symbol(Inline SVG, 검정). 문구 "카카오 로그인".
- 위 색은 각 제공자의 버튼 Design 지침에 정해진 값이라 Design Token을 새로 만들지 않고 이 두 버튼의 CSS에만 쓴다(주석으로 출처가 제공자 지침임을 적는다). 그 밖의 새 색은 만들지 않는다.
- Logo는 Inline SVG로 넣는다. 외부 이미지 요청이나 새 파일(`frontend/public/`)을 만들지 않는다. SVG는 `aria-hidden="true"`, `focusable="false"`이고 버튼의 이름은 보이는 문구다.
- **"로그인 없이 둘러보기"**: 공통 `Button`의 덜 강조되는 기존 Variant로 바꾼다. 제공자 버튼과 너비를 맞춘다. 진행 중 문구와 `disabled` 동작은 그대로 둔다.
- 버튼 사이 간격은 기존 간격 Token. 세 버튼의 너비는 Card 안에서 같다. Hover / Focus 표시가 보인다(초점 테두리는 어두운 배경과 밝은 버튼 모두에서 보여야 한다).
- 제공자가 없는 환경(체험 로그인만)에서도 배치가 어색하지 않아야 한다.

### 2. 로그인 Card의 안내 문구

- 버튼 아래 안내를 보조 글자 Style로 묶고 문단 사이 간격을 둔다. 순서: 저장 항목 안내 → 체험 계정 안내 → "개인정보 처리 안내" Link. 문구는 바꾸지 않는다.

### 3. Footer (L2)

- Footer를 한 줄짜리 작은 영역으로 정리한다: 위쪽 구분선, 보조 글자 크기와 색, 왼쪽에 "© MoodFit · 교육용 Product Heuristic이며 의학적 조언이 아닙니다.", 오른쪽에 "개인정보 처리 안내" Link. 좁은 화면에서는 두 줄로 내려간다.
- Footer Link의 터치 영역 높이는 44px 이상.
- Footer를 화면마다 다르게 그리지 않는다. 로그인 화면에서는 Card 안에 같은 Link가 있어도 그대로 둔다.
- 내용이 짧은 화면에서도 Footer가 화면 중간에 떠 보이지 않게 Layout의 맨 아래에 붙인다(`min-height`와 Flex 배치 등 CSS로 처리).

### Test

- 로그인 화면: Google / Kakao 항목이 `link` Role이고 `href`가 그대로다. 이름이 "Google로 로그인", "카카오 로그인"이다. 각 Link 안에 `aria-hidden` SVG가 있다.
- 체험 로그인 버튼의 동작 Test(요청, 진행 중 비활성화, 실패 안내)는 그대로 통과한다.
- 제공자 목록이 비어 있으면 제공자 Link가 없고 체험 버튼만 있다.
- Footer에 고지 문구와 "개인정보 처리 안내" Link가 있다.
- jest-dom Matcher(`toBeVisible`, `toHaveTextContent`, `toBeDisabled` 등)를 쓰지 않는다. 이 저장소에는 설치되어 있지 않다. `toBeTruthy()`, `textContent`를 쓴다.
- Test의 타입 오류에 주의한다(`tsc --noEmit`). CSS 파일 내용을 `?raw` import로 읽어 검사하지 않는다.
- 기존 Test는 그대로 통과해야 한다. "Kakao로 로그인"이라는 이름으로 찾던 곳만 새 문구로 고친다.

### 문서

- `docs/07-TASKS.md`: 이미 READY로 등록된 TASK-062 행과 절을 DONE으로 고치고 구현 내용을 적는다(없으면 번호 순서에 맞게 추가, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/22-AUTH.md`: 로그인 버튼 모양과 색의 출처(제공자 지침). `docs/03-UX_UI_SPEC.md`: Footer.
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### 금지

- Backend / API / 계약 / Dependency 변경
- 로그인 주소 / 흐름 / 문구(위에 적은 Kakao 버튼 문구 제외) 변경
- 사용자 메뉴와 회원 탈퇴 창(TASK-057의 결과) 변경
- `frontend/src/features/dashboard/`, `frontend/src/features/history/`, `frontend/src/features/checkin/` 변경, `frontend/public/`에 파일 추가

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 두 제공자 버튼의 색 / Logo / 문구가 설계와 같고 Link 주소가 그대로인가, Logo가 Inline SVG인가
- 체험 버튼이 기존 Variant인가, Footer가 모든 화면에서 맨 아래에 있고 넘침이 없는가
- 설계에 없는 문구 / 동작을 바꾸지 않았는가, 새 Dependency를 만들지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처(로그인, 체험만 있는 로그인, Footer)로 확인한다.
