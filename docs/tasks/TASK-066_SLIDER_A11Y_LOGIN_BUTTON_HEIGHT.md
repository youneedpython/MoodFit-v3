# TASK-066 — Slider A11y / Login Button Height (Slider 안내 중복 읽기 / 로그인 버튼 높이)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

이전 Task의 Review에서 남겨 둔 작은 후속 두 가지를 고친다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-062, TASK-063
- 실행: `node scripts/orchestrator/run.mjs TASK-066`

## Human 지시 (2026-10-05)

"'작은 후속 후보' 모두 진행해." 이 Task가 맡는 후보:

1. Slider의 안내 문구를 Screen Reader가 두 번 읽을 수 있음(TASK-063 Review 참고 사항)
2. 로그인 화면의 제공자 버튼과 체험 버튼 높이가 4px 다름(TASK-062 화면 확인)

## 현재 구조 (Claude 세션 확인)

- `frontend/src/features/checkin/CheckinPage.tsx`: 컨디션 세 칸(수면 점수, 스트레스 수준, 에너지 수준)에 숫자 입력칸과 Slider(`input type="range"`, `className="checkin-field__slider"`, `aria-label="{항목} Slider"`)가 있다. Slider에도 숫자 입력칸과 같은 `aria-describedby`(범위 안내 / 오류)와 `aria-invalid`가 붙어 있어, Screen Reader가 같은 안내와 오류를 두 번 읽는다. 값이 비어 있을 때 Slider는 `value="50"`으로 그려져 Screen Reader에는 "50"으로 읽히지만 실제 값은 비어 있다.
- `frontend/src/features/auth/auth.css`: `.login-actions > * { min-height: 48px }`. Google / Kakao 버튼(`.login-provider`)은 안쪽 여백 때문에 실제 높이가 52px이고, "로그인 없이 둘러보기"(공통 `Button`)는 48px이다.

## 설계 (실행 기준)

### 1. Slider 접근성

- Slider에서 `aria-describedby`와 `aria-invalid`를 **뺀다.** 범위 안내와 오류는 숫자 입력칸에만 연결한다(숫자 입력칸의 속성은 그대로 둔다).
- Slider의 접근성 이름(`aria-label="{항목} Slider"`)은 그대로 둔다.
- 값이 비어 있을 때 Slider에 `aria-valuetext="입력 안 함"`을 준다. 값이 있으면 `aria-valuetext`를 주지 않는다(Browser가 숫자를 읽는다).
- 오류가 났을 때 초점이 가는 대상은 지금처럼 숫자 입력칸이다(`[aria-invalid="true"]` 조회가 Slider를 잡지 않게 되는 것이 맞다).
- 보이는 모양과 동작(Slider ↔ 숫자 동기화, 빈 값 유지, 검증, 제출 값)은 바꾸지 않는다.

### 2. 로그인 버튼 높이

- 로그인 화면의 세 버튼(Google, Kakao, 로그인 없이 둘러보기)의 높이를 **모두 52px**로 맞춘다. `.login-actions > *`의 최소 높이를 52px로 올리고, 제공자 버튼의 안쪽 여백이 높이를 더 키우지 않게 한다(`box-sizing`과 세로 여백 확인).
- 너비, 색, Logo, 문구, 간격, Hover / Focus 표시는 바꾸지 않는다.
- 진행 중("로그인 중…") 상태에서도 높이가 같다.

### Test

- Slider: `aria-describedby`와 `aria-invalid` 속성이 없다. 값이 비어 있으면 `aria-valuetext`가 "입력 안 함"이고, 값을 넣으면 속성이 없다. 접근성 이름으로 계속 찾을 수 있다.
- 숫자 입력칸: `aria-describedby`와 `aria-invalid`가 그대로다. 빈 값으로 제출하면 필수 오류가 나오고 초점이 숫자 입력칸으로 간다.
- 기존 Slider 동기화 / 제출 Test는 그대로 통과해야 한다.
- 로그인 버튼 높이는 jsdom에서 잴 수 없으므로 Test를 추가하지 않는다(Claude 세션이 화면에서 잰다).
- jest-dom Matcher(`toBeVisible`, `toHaveTextContent`, `toBeDisabled` 등)를 쓰지 않는다. `toBeTruthy()`, `textContent`, `getAttribute`를 쓴다.
- 입력칸을 Label로 찾을 때 Slider와 겹치지 않게 `{ selector: 'input[type="number"]' }`를 쓰거나 Role과 정확한 이름을 쓴다.
- Test의 타입 오류에 주의한다(`tsc --noEmit`). `getByRole` Option에 `exact`를 쓰지 않는다. CSS 파일 내용을 `?raw` import로 읽어 검사하지 않는다.

### 문서

- `docs/03-UX_UI_SPEC.md`: Slider의 접근성 처리 한 줄. `docs/22-AUTH.md`: 로그인 버튼 높이.
- `docs/07-TASKS.md`: TASK-066 행과 절을 `docs/tasks/COMMON.md` "9. `docs/07-TASKS.md` 작성 형식"대로 추가한다(DONE, Milestone 66).
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### 금지

- Backend / API / 계약 / Dependency 변경, 새 색 / 새 Variant 추가
- 검증 규칙, 제출 형식, 로그인 주소 / 흐름 변경
- `frontend/src/features/dashboard/`, `frontend/src/features/history/`, `frontend/src/features/install/`, `frontend/public/` 변경

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- Slider에서 안내 / 오류 연결이 빠지고 숫자 입력칸에는 남아 있는가, 빈 값의 `aria-valuetext`가 맞는가
- 오류 시 초점 대상, 동기화, 검증, 제출이 그대로인가
- 로그인 세 버튼의 높이 규칙이 같고 다른 모양을 바꾸지 않았는가
- `docs/07-TASKS.md`의 TASK-066 절이 공통 형식을 따르는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 로그인 화면에서 세 버튼의 높이를 재고 390 / 1280px 캡처로 확인한다.
