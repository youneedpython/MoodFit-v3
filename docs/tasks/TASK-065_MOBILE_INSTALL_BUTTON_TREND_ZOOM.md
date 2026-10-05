# TASK-065 — Mobile Install Button / Trend Zoom (모바일 "앱 설치" 버튼 크기 / History 그래프 확대와 밀어 보기)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Human이 휴대폰(갤럭시)으로 Staging을 보고 지적한 두 가지를 고친다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-064(앱 설치 버튼), TASK-060(History)
- 실행: `node scripts/orchestrator/run.mjs TASK-065`

## Human 지시 (2026-10-05)

1. "'앱 설치'가 모바일에서는 너무 작게 보여."
2. "폰에서 보니, History page의 '최근 7일 Wellness Score'가 많으면 너무 겹쳐서 보여. PC에서는 잘 보이는데 말야. 폰에서 그래프를 손으로 확장하거나 줄일 수 있지 않아?"

## 현재 구조 (Claude 세션 확인)

- `frontend/src/features/install/InstallAppButton.tsx`: Footer에서는 공통 `Button`의 `ghost` Variant(테두리 없는 글자 버튼)로 "앱 설치"를 그린다. `frontend/src/app/AppLayout.css`의 `.app-footer`는 고지 문구(`p`, `flex: 1 1 24rem`) / "앱 설치" / "개인정보 처리 안내" Link를 한 줄에 놓고 좁으면 줄바꿈한다. 390px에서는 "앱 설치"가 고지 문구 아래 왼쪽에 작은 글자로 놓여 버튼처럼 보이지 않는다.
- `frontend/src/features/history/WellnessTrend.tsx`: 최근 7일의 **기록 하나마다 점 하나**를 그린다(오래된 순). 가로 위치는 `X_INSET + (100 - 2 × X_INSET) × index / (count - 1)` 퍼센트로, **그래프 너비가 항상 Card 너비에 맞춰진다.** 점과 X축 Label은 HTML `span`을 퍼센트 위치로 놓고, 선은 `viewBox="0 0 100 100"` SVG의 `polyline`이다. Label은 최대 7개(`MAX_LABELS`)를 고르게 뽑는다. 그래프는 장식(`aria-hidden`)이고 같은 정보를 `figcaption`의 글자 요약으로 준다.
- 하루에 여러 번 기록하면(체험 계정은 30건이 넘는다) 390px에서 점 간격이 10px 아래로 내려가 점과 Label이 겹친다.

## 설계 (실행 기준)

### 1. Footer의 "앱 설치" 버튼

- Footer의 버튼을 **테두리가 있는 기존 Variant**(공통 `Button`의 `secondary`)로 바꾼다. 글자 크기는 본문 크기, 높이 44px 이상.
- **480px 이하**: Footer의 **첫 줄에 전체 너비 버튼**으로 놓는다(고지 문구와 "개인정보 처리 안내" Link는 그 아래). 화면 맨 아래에서 바로 눈에 띄고 누르기 쉬워야 한다.
- 481px 이상: 지금처럼 고지 문구 오른쪽에 놓되 테두리가 있는 버튼 모양이다.
- DOM 순서와 보이는 순서가 어긋나지 않게 한다. 버튼이 보이지 않는 상태(`installed` / `unavailable`)에서는 Footer에 빈 자리가 남지 않는다(지금과 같다).
- 아바타 메뉴의 "앱 설치" 항목, iOS 안내 창, 설치 동작은 바꾸지 않는다.
- 새 색 / 새 Variant를 만들지 않는다.

### 2. History 그래프: 확대 / 축소와 밀어 보기

점이 많아도 겹치지 않게 **그래프를 가로로 넓혀 손가락으로 밀어 볼 수 있게** 하고, **확대 / 축소**를 제공한다. 점 하나가 기록 하나인 것은 바꾸지 않는다.

**구조**

- 그래프 영역(`wellness-trend__area`와 X축 Label)을 **가로로 넘치면 스크롤되는 영역**(Viewport) 안에 넣는다. Y축 Label(100 / 50 / 0)은 스크롤 영역 밖 왼쪽에 고정한다.
- 안쪽 그래프의 너비 = Viewport 너비 × **확대 배율**. 배율이 1이면 지금과 같은 모양이다(가로 넘침 없음).
- 배율 범위: 1 ~ 최대 배율. 최대 배율은 "점 하나당 약 48px"이 되는 값(`기록 수 × 48 / Viewport 너비`, 1보다 작으면 1).
- **처음 배율**: 점 하나당 간격이 **24px 이상**이 되도록 한다(`max(1, 기록 수 × 24 / Viewport 너비)`). 넓은 화면이나 기록이 적으면 1이라 지금과 같고, 좁은 화면에서 기록이 많으면 자동으로 넓어져 겹치지 않는다.
- 처음에는 **가장 최근 기록(오른쪽 끝)이 보이도록** 스크롤 위치를 오른쪽 끝에 둔다.
- Viewport 너비는 `ResizeObserver`로 잰다. `ResizeObserver`가 없는 환경(Test)에서는 배율 1로 동작하고 오류가 나지 않아야 한다. 화면 크기가 바뀌면 처음 배율을 다시 계산하되, 사용자가 배율을 직접 바꾼 뒤에는 그 값을 유지한다(범위를 벗어나면 범위 안으로 맞춘다).

**조작**

- **밀어 보기**: 한 손가락으로 좌우로 밀면 스크롤된다(Browser 기본 가로 스크롤). 세로로 밀면 화면이 평소처럼 세로로 스크롤되어야 한다.
- **두 손가락 확대 / 축소**(Pinch): 그래프 위에서 두 손가락을 벌리면 확대, 오므리면 축소한다. Pointer Events로 두 Pointer 사이의 거리 변화를 배율에 곱한다. 두 손가락의 가운데 지점이 화면에서 같은 자리에 머물도록 스크롤 위치를 맞춘다. 이 영역에서 Browser의 화면 전체 확대가 끼어들지 않게 `touch-action: pan-x pan-y`를 준다.
- **버튼**: 그래프 Card 제목 줄 오른쪽에 "축소"(−), "확대"(+), "전체 보기" 버튼을 둔다. 한 번 누르면 배율이 1.5배 / 1.5분의 1이 된다(범위 안에서). "전체 보기"는 배율 1. 더 줄이거나 늘릴 수 없으면 해당 버튼을 비활성화한다.
  - 버튼은 **확대할 수 있을 때만**(최대 배율 > 1) 보인다. 기록이 적거나 화면이 넓어 겹칠 일이 없으면 버튼 줄 자체가 없다.
  - 아이콘은 Inline SVG, 접근성 이름은 "그래프 축소", "그래프 확대", "그래프 전체 보기". 터치 영역 44px 이상. 공통 `Button`의 기존 Variant를 쓴다.
- **Keyboard**: 스크롤 영역에 `tabIndex={0}`과 `role="group"`, `aria-label="Wellness Score 그래프 (좌우로 스크롤)"`을 주어 화살표 키로 스크롤할 수 있게 한다. 넘치지 않을 때(배율 1)는 `tabIndex`를 주지 않는다.
- 확대된 상태에서는 그래프 아래에 보조 글자로 "좌우로 밀어 전체 기록을 볼 수 있습니다."를 보여 준다. 배율 1에서는 보이지 않는다.

**X축 Label**

- Label 개수를 고정 7개가 아니라 **안쪽 그래프 너비에 맞춰** 정한다: Label 하나당 약 56px이 확보되도록 간격(`labelStep`)을 잡는다(`ceil(기록 수 × 56 / 안쪽 너비)`, 최소 1). 마지막 기록의 Label은 항상 보이되 바로 앞 Label과 겹치면 앞의 것을 뺀다.
- 같은 날짜가 연달아 나오면 날짜가 바뀌는 첫 기록에만 Label을 붙여도 된다(겹침을 줄이는 방향이면 된다).

**유지할 것**

- 점 하나 = 기록 하나, 오래된 순(왼쪽 → 오른쪽), 0 ~ 100 Y축, 선과 점의 Style, `figcaption`의 글자 요약, 그래프가 장식(`aria-hidden`)이라는 점(조작 버튼과 스크롤 영역은 `aria-hidden` 밖에 둔다).
- 외부 Chart Library를 쓰지 않는다(DEC-010).
- 기록이 1건일 때의 가운데 배치, 기록이 없을 때의 동작.
- 1280px에서 기록이 적을 때의 모양은 지금과 같아야 한다.

### Test

- Footer: "앱 설치" 버튼이 `button--secondary` Class를 가진다. `unavailable` 상태에서는 Footer에 버튼이 없다(기존 Test 유지).
- 그래프(`ResizeObserver` 없는 기본 Test 환경): 배율 1로 그려지고 기존 Test가 그대로 통과한다. 확대 버튼 줄이 없다.
- 그래프(Viewport 너비를 주입한 경우): 너비를 재는 부분을 Test에서 대체할 수 있게 한다(예: `ResizeObserver`를 `vi.stubGlobal`로 대체해 `contentRect.width`를 320으로 알린다).
  - 기록 30건, 너비 320 → 처음 배율이 `30 × 24 / 320`이고 안쪽 그래프의 `style.width`가 그 퍼센트다. 확대 / 축소 / 전체 보기 버튼이 보인다.
  - "확대"를 누르면 너비가 1.5배(최대 배율을 넘지 않음), "축소"를 누르면 줄고, "전체 보기"를 누르면 100%가 된다. 한계에서는 해당 버튼이 비활성화된다.
  - 기록 3건, 너비 320 → 배율 1, 버튼 줄 없음.
  - Label 개수가 안쪽 너비에 따라 달라지고 마지막 기록의 Label이 있다.
- Pinch: 배율 계산을 순수 함수로 분리해 단위 Test한다(시작 거리, 현재 거리, 시작 배율, 범위 → 새 배율). Pointer Event를 흉내 낸 통합 Test는 필수가 아니다.
- jest-dom Matcher(`toBeVisible`, `toHaveTextContent`, `toBeDisabled` 등)를 쓰지 않는다. 이 저장소에는 설치되어 있지 않다. `toBeTruthy()`, `textContent`, `(el as HTMLButtonElement).disabled`를 쓴다.
- 이름으로 요소를 찾을 때 다른 요소와 겹치지 않게 Role과 정확한 이름을 쓴다. 파일을 읽어야 하면 `resolve(process.cwd(), …)`를 쓰고 `import.meta.url`로 경로를 만들지 않는다.
- Test의 타입 오류에 주의한다(`tsc --noEmit`). CSS 파일 내용을 `?raw` import로 읽어 검사하지 않는다.
- 기존 Test는 그대로 통과해야 한다. 바뀐 구조를 가정하던 곳만 고친다.

### 문서

- `docs/03-UX_UI_SPEC.md`: History 그래프의 확대 / 축소 / 밀어 보기, Footer의 설치 버튼.
- `docs/27-PWA-INSTALL.md`: Footer 버튼의 모양과 좁은 화면 배치.
- `docs/07-TASKS.md`: TASK-065 행과 절 추가, DONE(Milestone 65, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### 금지

- Backend / API / 계약 / Dependency 변경, 새 색 / 새 Variant 추가
- 점을 날짜별로 합치거나 기록을 줄이는 것(점 하나 = 기록 하나를 유지한다)
- 설치 동작, 아바타 메뉴, iOS 안내 창, Manifest 변경
- `frontend/src/features/checkin/`, `frontend/src/features/dashboard/`, `frontend/public/` 변경

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Run 2 범위 — Human 추가 지시 반영 (2026-10-05)

Run 1의 구현(WIP Commit으로 이 Branch에 있음)을 바탕으로 **그래프의 기본 동작을 바꾼다.** 아래 내용이 위 "2. History 그래프"의 "처음 배율" 규칙과 "금지"의 "점을 날짜별로 합치지 않는다"보다 **우선한다.** Footer 버튼(1번)은 Run 1 그대로 둔다.

### Human 추가 지시

"모바일은 기본 '날짜별 평균'으로 보여주고, 손으로 확대/축소하면 원래 데이터 그대로 보이도록 가능해?"

### 바뀌는 규칙

그래프에 두 가지 표시 방식을 둔다.

| 방식 | 점 | 언제 |
|---|---|---|
| **날짜별 평균** | 날짜마다 점 하나(그날 기록의 Wellness Score 평균, 반올림한 정수) | 기록이 겹칠 만큼 많고(**겹침 조건**) 배율이 1일 때 |
| **기록 전체** | 기록마다 점 하나(Run 1과 같음) | 그 밖의 모든 경우 |

- **겹침 조건**: `기록 수 × 24 > Viewport 너비`. 넓은 화면이거나 기록이 적으면 거짓이라 지금처럼 기록 전체를 배율 1로 보여 준다(날짜별 평균을 쓰지 않는다).
- **처음 배율은 항상 1**이다(Run 1의 "점 하나당 24px이 되도록 자동으로 넓힌다"를 없앤다). 그래서 좁은 화면에서 기록이 많으면 처음에는 **날짜별 평균**이 화면 너비에 맞게 보인다. 처음 스크롤 위치를 오른쪽 끝에 두는 처리는 배율이 1보다 커질 때 적용한다.
- **확대하면 기록 전체로 바뀐다.**
  - "확대" 버튼: 배율 1에서 누르면 **겹치지 않는 배율**(`max(1.5, 기록 수 × 24 / Viewport 너비)`, 최대 배율 이하)로 한 번에 간다. 그 뒤로는 1.5배씩.
  - "축소" 버튼: 1.5분의 1씩 줄이되, 결과가 겹치지 않는 배율보다 작아지면 **배율 1**(날짜별 평균)로 간다.
  - "전체 보기" 버튼: 배율 1. 겹침 조건이 참이면 버튼 이름을 **"날짜별 평균"**(접근성 이름 "그래프 날짜별 평균으로 보기")으로 한다. 거짓이면 Run 1대로 "전체 보기".
  - Pinch: 두 손가락을 벌려 배율이 1.05를 넘으면 기록 전체로 바뀌고 배율은 손가락을 따라 연속으로 변한다(겹치지 않는 배율로 건너뛰지 않는다). 오므려 1.05 이하가 되면 배율 1로 맞추고 날짜별 평균으로 돌아간다. 한 번의 Pinch 도중에 점의 개수가 바뀌므로, 스크롤 위치를 맞출 때 오류가 나지 않게 한다.
- 버튼 줄은 **겹침 조건이 참이거나 최대 배율 > 1일 때** 보인다(Run 1과 같은 조건이면 그대로 둔다).

### 날짜별 평균 계산

- 날짜는 화면에 쓰는 시간대(`frontend/src/utils/dateTime.ts`의 `MOODFIT_TIME_ZONE`, Asia/Seoul) 기준이다. UTC 날짜로 나누면 안 된다(자정 전후 기록이 다른 날로 간다).
- 날짜마다 그날 기록들의 `wellnessScore` 산술 평균을 `Math.round`한다. 점의 순서는 날짜 오름차순.
- 계산은 순수 함수로 분리해 `frontend/src/features/history/`에 두고 단위 Test한다(입력: 기록 목록, 출력: `{ 날짜 Key, Label, 평균, 건수 }[]`).
- 날짜별 평균 방식에서 X축 Label은 날짜마다 하나(`formatTrendDate`와 같은 형식)이며, 날짜 수가 많아 겹치면 기존 Label 간격 규칙을 쓴다.
- 점의 `key`는 날짜 Key를 쓴다(기록 `id`와 섞이지 않게).

### 안내와 요약

- 날짜별 평균으로 보이는 동안 그래프 아래에 보조 글자로 **"날짜별 평균입니다. 확대하면 기록을 하나씩 볼 수 있습니다."**를 보여 준다.
- 기록 전체를 확대해 보는 동안에는 Run 1의 "좌우로 밀어 전체 기록을 볼 수 있습니다."를 보여 준다. 둘이 동시에 나오지 않는다.
- `figcaption`의 글자 요약(기록 건수, 최저, 최고, 최근)은 **항상 기록 전체 기준**이다. 표시 방식에 따라 바뀌지 않는다.
- 표시 방식이 바뀐 것을 Screen Reader에도 알린다: 위 보조 글자 영역에 `aria-live="polite"`를 준다.

### Run 1에서 고칠 것

- `WellnessTrend.test.tsx`의 타입 오류: `getByRole(..., { name, exact: true })`의 `exact`는 `ByRoleOptions`에 없다(`tsc --noEmit` 실패). `exact`를 빼고 `name`에 정확한 문자열을 준다(문자열 `name`은 전체 일치다).
- Run 1의 "기록 30건, 너비 320 → 처음 배율이 30 × 24 / 320" Test는 새 규칙에 맞게 고친다.

### Test (Run 2)

- 평균 계산: 하루 여러 건, 여러 날, 자정 전후(UTC로는 같은 날이지만 Seoul로는 다른 날인 두 기록)가 다른 점으로 나뉘는지, 반올림.
- 기록 30건(3일에 걸침), 너비 320: 처음에 점이 3개이고 평균 안내 문구가 보인다. "확대"를 누르면 점이 30개가 되고 안쪽 너비가 `max(1.5, 30 × 24 / 320) × 100%`이며 밀어 보기 안내로 바뀐다. "날짜별 평균" 버튼을 누르면 다시 점 3개다.
- 기록 3건, 너비 320: 점 3개(기록 전체), 평균 안내 없음.
- `ResizeObserver`가 없는 기본 Test 환경: 기록 전체, 배율 1, 기존 Test 통과.
- `figcaption` 요약이 두 방식에서 같다.
- Pinch 순수 함수: 1.05 이하로 내려가면 1을 돌려준다.

## Run 3 범위 (검토 중심)

Run 2는 Verify와 Claude Review를 통과했다(PR 단계는 다른 열린 PR 본문에 이 Task 번호가 있어 멈췄다). Run 2의 변경은 WIP Commit으로 이 Branch에 있다. 그 뒤 Claude 세션이 휴대폰 화면을 흉내 낸 Chrome에서 실제 두 손가락 입력으로 확인하고 두 가지를 고쳤다.

1. **Pinch를 Touch Events로 바꿨다.** Run 2의 Pointer Events 구현은 확대(평균 → 기록 전체)는 됐지만, 확대된 뒤에는 그래프가 가로로 스크롤되어 Browser가 두 손가락 이동을 스크롤로 가져가면서 `pointercancel`로 끊겨 **축소가 되지 않았다**(Run 2 Review의 N-3이 실제로 일어남). `touchstart` / `touchmove` / `touchend` / `touchcancel`을 Viewport에 직접 등록하고, `touchmove`는 `passive: false`로 받아 **손가락이 둘일 때만** `preventDefault()`한다. 한 손가락 스크롤(가로 / 세로)은 Browser에 맡긴다. 설계의 "Pointer Events로" 대신 이 방식을 쓴다.
2. **배율 1에서 그래프 안쪽이 6px 넘치던 것**을 Viewport에 좌우 안쪽 여백(`padding-inline`, 기존 간격 Token)을 주어 없앴다. 마지막 날짜 Label이 오른쪽으로 삐져나와 생긴 넘침이다.

Claude 세션의 확인 결과(390px, 기록 30건 / 4일): 처음에 점 4개와 평균 안내 → 두 손가락을 벌리면 점 30개와 밀어 보기 안내 → 오므리면 다시 점 4개. "확대" 버튼은 겹치지 않는 배율로 한 번에 간다. 그래프 위에서 한 손가락으로 세로로 밀면 화면이 세로로 스크롤된다. 기록 3건이면 버튼과 안내가 없다. Footer의 "앱 설치"는 358 × 44px 전체 너비 버튼이다. Frontend Test 265건, `tsc --noEmit`, Build 통과.

이번 Run에서 할 일:

1. 위 두 변경을 포함해 구현이 설계와 맞는지 확인하고, 어긋난 곳만 고친다. Touch Events 방식을 Pointer Events로 되돌리지 않는다. 통과한 Test를 다시 쓰지 않는다.
2. Run 2 Review의 참고 사항 N-1을 반영한다: 기록 30건 Test에서 **처음 화면**에 평균 안내 문구가 있는지도 검사한다.
3. `docs/07-TASKS.md`의 TASK-065 절을 `docs/tasks/COMMON.md` "9. `docs/07-TASKS.md` 작성 형식"에 맞춰 적는다(이 Branch의 `COMMON.md`에 9절이 없으면 "상태 / 목적 / Human Approval 또는 Gate / 완료 조건 / 상세 Task Contract" 제목과 순서로 적는다).
4. `docs/08-WORK_LOG.md`에 Run 3 경과를 한 단락 더한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- Footer 버튼이 테두리 있는 기존 Variant이고 480px 이하에서 첫 줄 전체 너비인가, 보이지 않을 때 빈 자리가 없는가
- 그래프: 배율 1에서 지금과 같은가, 처음 배율과 최대 배율 계산이 설계와 같은가, 처음에 최근 기록이 보이는가
- 한 손가락 세로 스크롤이 막히지 않는가(`touch-action`), Pinch 계산이 범위 안에 머무는가
- 버튼의 접근성 이름 / 비활성화 / 터치 영역, 스크롤 영역의 Keyboard 접근이 맞는가
- `ResizeObserver`가 없는 환경에서 오류가 없는가, 외부 Library를 쓰지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처(기록 많음 / 적음, 확대 전후, Footer)로 확인한다. 실제 휴대폰에서의 Pinch와 밀어 보기는 Merge 뒤 Human이 확인한다.
