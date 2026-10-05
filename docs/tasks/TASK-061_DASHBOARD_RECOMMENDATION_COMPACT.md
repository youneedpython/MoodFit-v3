# TASK-061 — Dashboard Recommendation Compact (음악 재생 줄 간결화 / 비교 안내 위치)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

추천 음악마다 "바로 듣기" 버튼과 "YouTube에서 열기" Link가 한 줄씩 반복되어 추천 영역이 복잡하고, 음식 Card보다 음악 Card가 훨씬 길어 음식 쪽에 빈 공간이 남는다. 재생 동작을 이름 줄로 올려 간결하게 하고, 평소 값 비교 안내 문구를 지표 Card로 옮긴다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-058(평가 버튼을 이름 줄 아이콘으로 옮긴 뒤에 진행한다. 같은 파일을 고친다)
- 실행: `node scripts/orchestrator/run.mjs TASK-061`

## Human 지시 (2026-10-05)

Claude 세션이 화면을 훑어 뽑은 개선 후보를 Human이 모두 승인했다("위 사항 모두 Task로 정리"). UI / UX 수정은 화면별로 나눠 진행한다. 이 Task가 맡는 후보: D1(음악의 "바로 듣기" / "YouTube에서 열기" 간결화), D2(음식 Card와 음악 Card 높이 차이), D3(비교 안내 문구 위치).

## 현재 구조 (Claude 세션 확인)

- `frontend/src/features/dashboard/RecommendationCards.tsx`의 `MusicTrack`: 머리 줄(곡 제목, Tag Badge, TASK-058 이후 평가 아이콘 묶음) → 가수 → 추천 이유 → `music-playback` 줄("바로 듣기" 버튼, "YouTube에서 열기" Link). "바로 듣기"를 누르면 그 자리에 YouTube Player(`iframe`)와 "재생 닫기" 버튼이 나온다. 누르기 전에는 Player를 불러오지 않는다(`docs/20-RECOMMENDATION-MUSIC-PLAYBACK.md`).
- `frontend/src/features/dashboard/WellnessHero.tsx`: 요약 문장과 "오늘 상태 입력" 버튼 사이에 `BaselineNotice`("최근 14일 기록 9건의 평균과 비교했습니다…")가 있다.
- `frontend/src/features/dashboard/BodyMetrics.tsx`: 다섯 지표와 "평소 대비" 차이를 보여 준다.
- Dashboard와 Check-in 결과 화면이 `RecommendationCards`와 `BodyMetrics`를 함께 쓴다. Check-in 결과 화면(`CheckinResultSummary.tsx`)에도 `BaselineNotice`가 요약 아래에 있다.

## 설계 (실행 기준)

### 1. 음악 재생 줄 간결화 (D1)

- "바로 듣기" 글자 버튼을 **재생 아이콘 버튼**으로 바꿔 곡 제목 **왼쪽**에 둔다. 머리 줄: 재생 아이콘 버튼 → 곡 제목 … Tag Badge → 평가 아이콘 묶음.
- 아이콘은 Inline SVG(재생 삼각형 모양, 재생 중에는 닫기 X 모양), `currentColor`, `aria-hidden="true"`, `focusable="false"`. 외부 Icon Library를 쓰지 않는다.
- 접근성 이름은 지금과 같게 둔다: `"{제목} - {가수} 재생"`, 재생 중에는 `"{제목} 재생 닫기"`. `title`도 같은 뜻으로 넣는다. `aria-expanded`로 Player가 열렸는지 알린다.
- 버튼의 터치 영역은 44 × 44px 이상, 초점 테두리 유지.
- 재생을 누르면 Player는 지금처럼 그 항목 안(추천 이유 아래)에 펼쳐진다. 같은 아이콘 버튼을 다시 누르면 닫힌다. 별도의 "재생 닫기" 글자 버튼은 없앤다.
- "YouTube에서 열기"는 **가수 이름과 같은 줄**로 옮겨 작은 보조 Link로 둔다("가수 · YouTube에서 열기"). Link의 접근성 이름(`"{제목} YouTube에서 열기 (새 탭)"`), 주소, `target` / `rel`은 그대로 둔다. Link의 터치 영역 높이는 44px 이상을 확보한다(줄 높이나 안쪽 여백으로).
- `videoId`가 없는 이전 기록은 지금처럼 재생 버튼과 Link를 그리지 않는다.
- 누르기 전에는 Player(`iframe`)를 불러오지 않는 동작과 `iframe` 속성은 바꾸지 않는다.

### 2. 높이 차이 (D2)

- 위 변경으로 음악 항목의 줄 수가 음식 항목과 비슷해진다(음식: 머리 줄 + 이유, 음악: 머리 줄 + 가수 줄 + 이유). 높이를 강제로 맞추지 않는다.
- 1280px에서 두 Card가 나란히 있을 때 음식 Card 아래쪽 빈 공간이 눈에 띄게 줄어야 한다. 음식 Card를 억지로 늘이는 장식은 넣지 않는다.

### 3. 비교 안내 문구 위치 (D3)

- Dashboard: `BaselineNotice`를 `WellnessHero`에서 빼고 **Body Metrics Card의 지표 아래**로 옮긴다. 지표의 "평소 대비" 숫자를 설명하는 문장이므로 그 Card 안이 맞다.
- Check-in 결과 화면: 같은 원칙으로 Body Metrics Card의 지표 아래에 둔다. 요약 문장 아래에서는 뺀다.
- 문구(기록 부족 안내, 체험 계정 안내 포함)는 바꾸지 않는다. 보조 글자 Style을 유지한다.
- 문구가 한 화면에 두 번 나오지 않게 한다.

### 4. 좁은 화면의 이름 줄 (TASK-058 후속)

- TASK-058 뒤 390px에서 이름이 짧은 항목은 이름 / Tag Badge / 평가 묶음이 한 줄에 들어가고, 이름이 긴 항목은 Badge와 평가 묶음이 다음 줄로 내려가 항목마다 줄 모양이 다르다.
- 390px에서는 모든 항목이 같은 모양이 되게 한다: **첫 줄에 (음악은 재생 아이콘 +) 이름과 맨 오른쪽 평가 묶음, 그 아래 줄에 Tag Badge**(음악은 Badge를 가수 줄과 함께 두어도 된다). 이름이 길면 이름만 줄바꿈되고 평가 묶음은 첫 줄 오른쪽에 남는다.
- 768px 이상에서는 지금처럼 한 줄(이름 … Badge → 평가 묶음)이다.
- DOM 순서는 한 가지로 두고 배치는 CSS(Grid 등)로 처리한다. 읽는 순서는 이름 → Badge → 평가 묶음이다.

### Test

- 음악 항목: 재생 버튼이 머리 줄 안에 있고 접근성 이름으로 찾을 수 있다. 누르기 전에는 `iframe`이 없고, 누르면 생기며, 다시 누르면 없어진다. `aria-expanded`가 따라 바뀐다. 보이는 글자 "재생 닫기" 버튼이 없다.
- "YouTube에서 열기" Link의 `href`, `target`, `rel`, 접근성 이름이 그대로다. `videoId`가 없으면 재생 버튼과 Link가 없다.
- `BaselineNotice` 문구가 Dashboard와 Check-in 결과에서 각각 한 번만 나오고, Body Metrics 영역 안에 있다.
- jest-dom Matcher(`toBeVisible`, `toHaveTextContent`, `toBeDisabled` 등)를 쓰지 않는다. 이 저장소에는 설치되어 있지 않다. `toBeTruthy()`, `textContent`를 쓴다.
- Test의 타입 오류에 주의한다(`tsc --noEmit`). CSS 파일 내용을 `?raw` import로 읽어 검사하지 않는다.
- 기존 Test는 그대로 통과해야 한다. 바뀐 구조를 가정하던 곳만 고친다.

### 문서

- `docs/07-TASKS.md`: 이미 READY로 등록된 TASK-061 행과 절을 DONE으로 고치고 구현 내용을 적는다(없으면 번호 순서에 맞게 추가, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/20-RECOMMENDATION-MUSIC-PLAYBACK.md`: 재생 버튼과 Link의 위치. `docs/26-PERSONAL-BASELINE.md`: 비교 안내 문구의 위치.
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### 금지

- Backend / API / 계약 / Dependency 변경, 새 색 / 크기 값 추가(기존 Token 사용)
- 평가 버튼(TASK-058의 결과) 모양과 동작 변경, 추천 규칙 / 개수 변경
- `frontend/src/features/auth/`, `frontend/src/features/history/` 변경. Check-in 화면은 `BaselineNotice` 위치 이동에 필요한 최소 변경만 한다.

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 재생 버튼이 이름 줄의 아이콘이고 접근성 이름 / `aria-expanded` / 터치 영역이 맞는가, 누르기 전에 Player를 불러오지 않는가
- Link 속성이 유지되는가, 비교 안내 문구가 한 번만 지표 Card 안에 나오는가
- 설계에 없는 문구 / 동작을 바꾸지 않았는가, 새 Dependency / 새 색을 만들지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처(재생 전 / 재생 중)로 확인한다.
