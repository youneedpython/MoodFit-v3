# TASK-058 — Feedback Icons (추천 평가 버튼을 이름 옆 아이콘으로)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

추천 항목마다 "좋아요" / "별로예요" 글자 버튼이 한 줄씩 차지해 화면이 복잡해 보인다. 평가 버튼을 항목 이름 줄로 옮기고 아이콘만 보이게 해 추천 목록을 가볍게 만든다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-055
- 실행: `node scripts/orchestrator/run.mjs TASK-058`

## Human 지시 (2026-10-05)

- "'좋아요, 별로예요' 위치를 '음식 이름' 또는 '음악 이름' 옆으로 옮기고, 유튜브처럼 아이콘만 보였으면 해."
- "'좋아요, 별로예요'가 너무 많이 보여서 뭔가 복잡해 보이는 느낌이야."
- Human이 참고로 준 그림: YouTube의 평가 버튼. 하나의 둥근 알약 모양 안에 엄지 올림 아이콘과 엄지 내림 아이콘이 세로 구분선을 사이에 두고 나란히 있다. 글자 Label은 없다(그림의 숫자는 YouTube의 집계이며 MoodFit에는 넣지 않는다).
- UI / UX 수정은 성격에 따라 나눠서 진행한다. 이 Task는 "추천 영역"을 맡는다. 사용자 메뉴와 회원 탈퇴 창은 TASK-057이 맡으므로 건드리지 않는다.

## 현재 구조 (Claude 세션 확인)

- `frontend/src/features/dashboard/RecommendationCards.tsx`의 `FeedbackButtons`: 항목의 추천 이유 아래 별도 줄에 "👍 좋아요", "👎 별로예요" 두 버튼(Emoji + 글자)을 그린다. 음악은 그 아래에 "바로 듣기" / "YouTube에서 열기" 줄이 또 있다.
- 항목 머리 줄(`recommendation-item__header`)은 왼쪽에 이름, 오른쪽에 Tag Badge가 있다.
- Dashboard와 Check-in 결과 화면이 같은 Component를 쓴다.
- 버튼의 접근성 이름은 `aria-label="새우 볶음밥 좋아요"`처럼 항목 이름을 포함하고, 상태는 `aria-pressed`로 알린다.

## 설계 (실행 기준)

### 1. 위치

- 평가 버튼을 항목 머리 줄로 옮긴다. 줄의 구성: **왼쪽에 이름(음식은 Emoji + 이름), 오른쪽에 Tag Badge와 평가 버튼 묶음**. 평가 버튼 묶음이 줄의 맨 오른쪽이다.
- 추천 이유 아래에 있던 평가 버튼 줄은 없앤다. 음악의 "바로 듣기" / "YouTube에서 열기" 줄은 그대로 둔다.
- 390px에서 이름이 길어 한 줄에 다 들어가지 않으면 이름이 줄바꿈되고, Badge와 평가 버튼 묶음은 서로 떨어지지 않은 채 다음 줄로 내려가도 된다. 가로 넘침이 없어야 한다.
- 평가를 쓸 수 없는 경우(체험 계정, 기능 꺼짐, 음악의 `videoId`가 없는 이전 기록)에는 묶음을 그리지 않고 빈 자리도 남기지 않는다(지금과 같은 조건).

### 2. 모양

- 두 버튼을 **하나의 알약 모양 묶음**으로 그린다: 둥근 테두리 하나 안에 엄지 올림 / 세로 구분선 / 엄지 내림.
- **글자 Label을 보이지 않게 한다.** 아이콘만 보인다.
- 아이콘은 Emoji가 아니라 **Inline SVG**로 그린다(Platform마다 Emoji 모양이 달라지는 것을 피한다). 외부 Icon Library나 새 Dependency를 추가하지 않는다. 선 아이콘(외곽선)을 기본으로 하고 `currentColor`를 쓴다. SVG는 `aria-hidden="true"`, `focusable="false"`.
- 눌린 상태(`aria-pressed="true"`): 아이콘을 채운 모양으로 바꾸고 강조 색(기존 강조 색 Token)으로 표시한다. 색만으로 구분하지 않도록 채움 여부가 함께 달라져야 한다.
- 누르지 않은 상태는 보조 글자 색 정도로 덜 강조한다. Hover / Focus 표시는 기존 버튼과 같은 방식(초점 테두리 유지).
- 묶음의 보이는 높이는 Tag Badge와 어울리게 작게 해도 되지만, **버튼 하나의 터치 영역은 44 × 44px 이상**을 확보한다(안쪽 여백이나 투명 영역으로 확보).
- 새 색 / 크기 값을 만들지 않는다. 기존 Token을 쓴다.

### 3. 동작 (바꾸지 않는다)

- 누르면 저장, 다시 누르면 지움, 반대 버튼을 누르면 바뀜. 저장 중에는 그 항목의 두 버튼이 비활성화된다. 실패하면 되돌아가고 오류 문구가 보인다.
- 접근성 이름은 지금처럼 항목 이름을 포함한다(`aria-label="새우 볶음밥 좋아요"`, `"새우 볶음밥 별로예요"`). `aria-pressed` 유지. 마우스 사용자를 위해 `title`에 "좋아요" / "별로예요"를 넣는다.
- 묶음 전체에 `role="group"`과 항목 이름을 포함한 `aria-label`(예: "새우 볶음밥 평가")을 준다.
- 목록 아래 안내 문구("평가는 다음 Check-in의 추천부터 반영됩니다…", 체험 계정 안내)와 오류 문구는 그대로 둔다.
- API 요청 형식은 바꾸지 않는다.

### Test

- 평가 버튼이 항목 머리 줄 안에 있고(머리 줄 요소의 자손), 추천 이유 아래에는 없다.
- 버튼에 보이는 글자가 없다(`textContent`가 비어 있음). 접근성 이름으로는 계속 찾을 수 있다(`getByRole("button", { name: "새우 볶음밥 좋아요" })`).
- 버튼 안에 SVG가 있고 `aria-hidden`이다.
- 기존 평가 동작 Test(저장 요청, 지우기, 바꾸기, 저장 중 비활성화, 실패 시 되돌림, 체험 계정에는 버튼 없음)는 그대로 통과해야 한다. 글자로 버튼을 찾던 곳은 접근성 이름으로 찾게 고친다.
- jest-dom Matcher(`toBeVisible`, `toHaveTextContent`, `toBeDisabled` 등)를 쓰지 않는다. 이 저장소에는 설치되어 있지 않다. `toBeTruthy()`, `textContent`, `(el as HTMLButtonElement).disabled`를 쓴다.
- Test의 타입 오류에 주의한다(`tsc --noEmit`). CSS 파일 내용을 `?raw` import로 읽어 검사하지 않는다.

### 문서

- `docs/03-UX_UI_SPEC.md` 또는 추천 평가를 설명하는 기존 문서에 평가 버튼의 위치와 모양을 한 단락으로 적는다.
- `docs/07-TASKS.md`: TASK-058 행과 절 추가, DONE(Milestone 58, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다. TASK-057 행이 없어도 만들지 않는다(다른 Branch에서 진행 중).
- `docs/08-WORK_LOG.md`, `prompts/`(다음 번호 `85-`. `84-`는 TASK-057이 쓴다).

### 금지

- Backend / API / 계약 / Dependency 변경
- 계정 영역(`frontend/src/features/auth/`) 변경 — TASK-057 범위
- 추천 규칙, 추천 개수, 안내 문구 변경

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 평가 버튼이 이름 줄에 있고 글자 없이 아이콘만 보이는가, 알약 모양 묶음인가
- 접근성 이름 / `aria-pressed` / 터치 영역 44px / 초점 표시가 유지되는가, 눌린 상태가 색 이외의 방법으로도 구분되는가
- 평가 동작과 API 요청이 바뀌지 않았는가
- 새 Dependency / 새 색을 만들지 않았는가, 계정 영역을 건드리지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처로 확인한다.
