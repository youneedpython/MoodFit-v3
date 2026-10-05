# TASK-063 — Check-in Form / Result (컨디션 Slider / 결과 화면을 Dashboard와 같은 표현으로)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Check-in 결과 화면은 Dashboard와 같은 정보(Score, 날씨)를 다르게, 덜 눈에 띄게 보여 준다. 입력 화면은 0 ~ 100 값을 숫자로만 넣어야 해서 모바일에서 번거롭다. 결과 화면의 표현을 Dashboard와 맞추고, 컨디션 입력에 Slider를 더한다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-059(날씨 영역 배치), TASK-061(비교 안내 문구 위치). 같은 파일을 고치므로 그 뒤에 진행한다.
- 실행: `node scripts/orchestrator/run.mjs TASK-063`

## Human 지시 (2026-10-05)

Claude 세션이 화면을 훑어 뽑은 개선 후보를 Human이 모두 승인했다("위 사항 모두 Task로 정리"). UI / UX 수정은 화면별로 나눠 진행한다. 이 Task가 맡는 후보: C1(결과 화면의 Score와 날씨를 Dashboard처럼), C2(수면 / 스트레스 / 에너지 Slider 입력), C3(입력칸 묶음의 빈 자리).

## 현재 구조 (Claude 세션 확인)

- `frontend/src/features/checkin/CheckinResultSummary.tsx`: 제목 "Check-in이 저장되었습니다." → Mood Badge, 긴장도 Badge, 작은 글씨 "Wellness Score 76" → 요약 → Body Metrics → 날씨 한 줄("비 · 19.0°C", 지역) → AI 코멘트 → 추천 → 버튼 줄.
- `frontend/src/features/dashboard/WellnessHero.tsx`: Score를 큰 숫자 Tile("76 / 100")로, 날씨를 Icon + 날씨 / 기온 / 지역 Tile로 보여 준다.
- `frontend/src/features/checkin/CheckinPage.tsx` + `checkinForm.ts`: 신체 리듬(심박수, 호흡수) 2칸, 컨디션(수면 점수, 스트레스 수준, 에너지 수준) 3칸. 모두 숫자 입력칸이고 입력칸 아래에 범위 안내와 오류가 나온다. 넓은 화면에서 3열 Grid라 신체 리듬 묶음의 세 번째 칸이 비어 있다.

## 설계 (실행 기준)

### 1. 결과 화면의 Score와 날씨 (C1)

- 결과 화면 위쪽을 Dashboard의 `WellnessHero`와 같은 표현으로 바꾼다: 왼쪽에 Mood Badge / 긴장도 Badge / 요약 문장, 오른쪽에 **Score Tile(큰 숫자 + "/ 100")과 날씨 Tile(Icon + 날씨 / 기온 / 지역)**.
- Score Tile과 날씨 Tile의 Markup / Style은 `WellnessHero`의 것을 **공유**한다(작은 Component로 뽑아 두 곳에서 쓴다). 복사해서 따로 두지 않는다. Dashboard의 모양은 바뀌지 않아야 한다.
- 결과 화면의 제목("Check-in이 저장되었습니다.")과 기록 시각, 제목으로 초점이 이동하는 동작은 그대로 둔다. Dashboard의 "지금 컨디션은 …" 제목과 "오늘 상태 입력" 버튼은 결과 화면에 넣지 않는다.
- 결과 화면의 순서: 제목 / 시각 → (Badge + 요약 | Score Tile + 날씨 Tile) → AI 코멘트 → Body Metrics → 추천 → 버튼 줄. Dashboard와 같은 순서다. 아이콘 없는 날씨 한 줄은 없앤다(날씨 Tile이 대신한다).
- 날씨 Icon은 지금처럼 장식(`aria-hidden`)이고 뜻은 글자로 전한다.

### 2. 컨디션 Slider (C2)

- 수면 점수 / 스트레스 수준 / 에너지 수준 세 칸에 **숫자 입력칸과 Slider(`<input type="range">`)를 함께** 둔다. 둘은 같은 값을 가리키고 한쪽을 바꾸면 다른 쪽이 따라 바뀐다.
- Slider: `min=0`, `max=100`, `step=1`. 접근성 이름은 "{항목 이름} Slider"(`aria-label`). 숫자 입력칸의 `label` 연결은 그대로 둔다.
- 값이 비어 있을 때 Slider는 가운데(50)에 놓여 보이되 **값을 채우지 않는다**. 사용자가 Slider를 움직이면 그때 값이 들어간다. 비어 있는 채로 제출하면 지금처럼 "값을 입력해 주세요." 오류가 나온다.
- 검증 규칙, 오류 문구, 제출 값, 서버 오류 표시는 바꾸지 않는다. 숫자 입력칸에 범위 밖 값을 넣었을 때의 동작도 그대로다(Slider는 범위 안으로 붙여 보여 주기만 한다).
- Slider의 터치 영역 높이는 44px 이상, 초점 테두리가 보인다. 색은 기존 강조 색 Token을 쓴다(`accent-color` 등).
- 심박수 / 호흡수 / 기온에는 Slider를 넣지 않는다(범위가 넓거나 값을 정확히 아는 항목이다).

### 3. 입력칸 묶음의 빈 자리 (C3)

- 넓은 화면(1280px)에서 신체 리듬 묶음은 2열, 컨디션 묶음은 3열로, **묶음마다 칸 수에 맞춰** 너비를 채운다. 오른쪽에 빈 칸이 남지 않는다.
- 768px과 390px의 배치는 지금처럼 자연스럽게 줄어든다(390px은 1열). 가로 넘침이 없다.
- 날씨 영역(TASK-059의 결과)은 바꾸지 않는다.

### Test

- 결과 화면: Score Tile(숫자와 "/ 100"), 날씨 Tile(날씨 / 기온 / 지역)이 있고, 순서가 Tile → AI 코멘트 영역 → Body Metrics → 추천 → 버튼 줄이다. 옛 날씨 한 줄이 없다. 지역이 없는 기록에서도 깨지지 않는다.
- Dashboard의 기존 Test가 그대로 통과한다.
- Slider: 움직이면 숫자 입력칸 값이 바뀌고(`fireEvent.change`), 숫자를 바꾸면 Slider 값이 바뀐다. 비어 있을 때 제출하면 필수 오류가 나온다. Slider의 접근성 이름으로 찾을 수 있다. 제출 값이 지금과 같은 형식이다.
- 순서 비교는 `compareDocumentPosition`을 쓴다.
- jest-dom Matcher(`toBeVisible`, `toHaveTextContent`, `toBeDisabled` 등)를 쓰지 않는다. 이 저장소에는 설치되어 있지 않다. `toBeTruthy()`, `textContent`를 쓴다.
- Test의 타입 오류에 주의한다(`tsc --noEmit`). CSS 파일 내용을 `?raw` import로 읽어 검사하지 않는다.
- 기존 Test는 그대로 통과해야 한다. 바뀐 구조를 가정하던 곳만 고친다.

### 문서

- `docs/07-TASKS.md`: 이미 READY로 등록된 TASK-063 행과 절을 DONE으로 고치고 구현 내용을 적는다(없으면 번호 순서에 맞게 추가, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/03-UX_UI_SPEC.md`: 결과 화면의 구성과 Slider 입력.
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### 금지

- Backend / API / 계약 / Dependency 변경, 새 색 / 크기 값 추가(기존 Token 사용)
- 날씨 영역(TASK-059), 평가 / 재생 버튼(TASK-058, TASK-061), 사용자 메뉴(TASK-057) 변경
- 검증 규칙과 제출 형식 변경, Dashboard 모양 변경
- `frontend/src/features/auth/`, `frontend/src/features/history/` 변경

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 결과 화면이 Dashboard와 같은 Tile을 공유 Component로 쓰는가, Dashboard 모양이 그대로인가, 순서가 설계와 같은가
- Slider와 숫자 입력칸이 서로 맞게 움직이고 빈 값이 채워지지 않는가, 검증과 제출이 그대로인가
- 묶음별 열 수가 맞고 넘침이 없는가
- 설계에 없는 문구 / 동작을 바꾸지 않았는가, 새 Dependency / 새 색을 만들지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처(입력 / 결과)로 확인한다.
