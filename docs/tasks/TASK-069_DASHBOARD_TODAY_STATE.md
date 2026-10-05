# TASK-069 — Dashboard Today State (오늘 기록 여부에 따른 Dashboard / AI 코멘트 강조)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Dashboard는 가장 최근 기록을 "지금 컨디션은 …"이라고 보여 준다. 며칠 동안 기록하지 않으면 며칠 전 상태가 "지금"으로 보인다. 오늘 기록이 있는지에 따라 화면을 나눠, 오늘 기록이 없을 때는 그 사실을 먼저 알리고 지난 기록은 지난 기록으로 보여 준다. AI 코멘트 Card를 살짝 강조한다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-056(평소 값), TASK-061, TASK-063(Score / 날씨 Tile)
- 실행: `node scripts/orchestrator/run.mjs TASK-069`

## Human 결정 (2026-10-05, Gate B — 화면에 보이는 제품 문구 / 동작)

Human 지적: "Dashboard 상단의 '컨디션' 정보는 사실 이전 정보잖아? 일주일 동안 기록을 남기지 않으면 일주일 전의 정보가 표시될 텐데 '지금 컨디션은 ~' 문구는 맞지 않아." "'AI 코멘트'는 카드 색을 조금 더 밝게 한다든지, 음영을 줘서 살짝 강조되었으면 해."

Claude 세션의 제안을 Human이 승인했다("1단계 → 2단계 모두 진행하는데, 1단계 진행 후 2단계 진행"). 이 Task는 **1단계**다.

- 기존 통계로 오늘 상태를 **추정해서 보여 주지 않는다.** 측정하지 않은 값을 오늘 컨디션처럼 보여 주면 사용자가 측정값으로 받아들인다. 대신 오늘은 아직 모른다는 것을 알리고, 아는 것(지난 기록, 평소 값)을 그 이름대로 보여 준다.
- 2단계("오늘 날씨에 맞는 추천", Backend API 추가)는 다음 Task에서 한다. 이 Task에서는 만들지 않는다.

## 현재 구조 (Claude 세션 확인)

- `frontend/src/features/dashboard/DashboardPage.tsx`: 최신 기록(`GET /api/check-ins/latest`)으로 `WellnessHero` → `InsightCard`(AI 코멘트, 자동 생성) → `BodyMetrics`(지표 + 평소 대비 + 비교 안내) → `RecommendationCards` 순서로 그린다. 기록이 없으면 Empty State.
- `frontend/src/features/dashboard/WellnessHero.tsx`: Mood / 긴장도 Badge, "{날짜 시각} 기록", 제목 **"지금 컨디션은 {기분}"**, 요약 문장, "오늘 상태 입력" 버튼, 오른쪽에 `WellnessTiles`(Score, 날씨).
- 응답의 `recordedAt`은 ISO-8601 UTC다. 화면의 날짜는 `frontend/src/utils/dateTime.ts`의 `MOODFIT_TIME_ZONE`(Asia/Seoul) 기준이다.
- 응답의 `baseline`: `available`(이전 기록 5건 이상), `sampleCount`, `averages`(심박수, 호흡수, 수면, 스트레스, 에너지의 최근 14일 평균. 이 기록을 저장할 때 계산해 저장한 값), `deltas`, `tension`.
- `frontend/src/features/insight/InsightCard.tsx` / `.css`: 다른 Card와 같은 배경과 테두리를 쓴다. Dashboard, Check-in 결과(AI 코멘트), History(주간 리포트)에서 쓰인다.

## 설계 (실행 기준)

### 1. 오늘 기록 여부 판단

- **오늘** = 지금 시각과 `recordedAt`을 각각 Asia/Seoul 날짜로 바꿨을 때 같은 날. UTC 날짜로 비교하지 않는다.
- 판단 함수는 `frontend/src/utils/dateTime.ts`에 둔다: 두 시각의 Seoul 날짜 차이(일 수, 0 이상)를 돌려주는 순수 함수. 현재 시각은 인자로 받을 수 있게 해 Test에서 고정한다.
- Dashboard가 열려 있는 동안 자정이 지나면 화면이 바뀌어야 한다. 화면이 다시 보일 때(`visibilitychange`)와 1분 간격으로 현재 날짜를 다시 계산한다(Interval은 화면을 벗어나면 정리한다).

### 2. 오늘 기록이 있을 때 (지금과 거의 같음)

- 제목을 **"오늘 컨디션은 {기분}"**으로 바꾼다("지금" → "오늘"). 그 밖의 구성과 순서는 그대로다.
- 시각 표시는 그대로("10월 5일 오후 05:50 기록").
- 버튼 문구를 **"다시 입력하기"**로 바꾸고 덜 강조되는 기존 Variant로 한다(이미 오늘 입력했으므로 주된 동작이 아니다).

### 3. 오늘 기록이 없을 때

위에서 아래로:

1. **안내 영역**(Hero 자리, 가장 눈에 띄게)
   - 제목: **"오늘 상태를 아직 입력하지 않았어요"**
   - 설명: "마지막 기록은 {N}일 전({M월 D일})입니다. 오늘 상태를 입력하면 오늘에 맞는 분석과 추천을 볼 수 있습니다." N이 1이면 "어제({M월 D일})"로 쓴다.
   - 버튼: **"오늘 상태 입력"**(강조 Variant, `/check-in`으로 이동). 이 화면의 주된 동작이다.
   - 이 영역에는 Score, 기분, 날씨를 넣지 않는다.
2. **평소 값 요약**(`baseline.available`이 참이고 `baseline.averages`가 있을 때만)
   - 제목 "최근 14일 평균", 값: 수면 / 스트레스 / 에너지 / 심박수 / 호흡수의 평균(단위 포함), 보조 글자 "기록 {sampleCount}건의 평균입니다. 오늘 상태를 추정한 값이 아닙니다."
   - 평균은 마지막 기록을 저장할 때 계산된 값이다. 새로 계산하지 않는다.
3. **마지막 기록**(지난 정보라는 것이 분명하게)
   - 구역 제목: **"마지막 기록 · {N}일 전 ({M월 D일 오전/오후 hh:mm})"**
   - 그 안에 지금 Dashboard의 내용을 그대로 둔다: Mood / 긴장도 Badge, 요약 문장, Score Tile, 날씨 Tile, AI 코멘트, Body Metrics, 추천 음식 / 음악.
   - 이 구역 안의 Hero 제목은 "**그날 컨디션은 {기분}**"으로 한다. "오늘 상태 입력" 버튼은 여기에 두지 않는다(위 안내 영역에 있다).
   - 구역 전체를 한 단계 덜 강조한다(예: 구역 제목 아래 얇은 구분, 본문 색은 그대로 두되 Score 숫자 등 강조 요소의 채도를 낮추지는 않는다). **글자 대비를 낮추지 않는다**(읽기 어려워지면 안 된다). 덜 강조는 "구역 제목과 위치"로 전달한다.
   - AI 코멘트는 저장된 것이 있으면 보여 주고, 없으면 **자동 생성을 하지 않는다**(지난 기록에 대해 새로 생성 횟수를 쓰지 않는다). 수동 "AI 코멘트 받기" 버튼은 지금처럼 둔다.
   - 추천의 평가(좋아요 / 별로예요)와 음악 재생은 그대로 동작한다.

### 4. 구조와 접근성

- 화면의 제목 구조: 안내 영역 제목은 `h2`, "최근 14일 평균"과 "마지막 기록 …"도 `h2`. 마지막 기록 구역은 `section`에 `aria-labelledby`로 구역 제목을 연결한다.
- 오늘 기록이 없을 때 초점 순서의 첫 동작은 "오늘 상태 입력"이다.
- 390 / 768 / 1280px에서 가로 넘침이 없다. 새 색 / 크기 값을 만들지 않는다(기존 Token).

### 5. AI 코멘트 Card 강조

- `InsightCard`를 다른 Card보다 **살짝** 강조한다.
  - 배경: 한 단계 밝은 기존 표면 색(`--color-surface-raised`)
  - 왼쪽 가장자리에 로고와 같은 방향의 강조 선(기존 `--color-accent-blue` → `--color-accent-purple` Gradient, 굵기는 기존 간격 Token)
  - 제목("AI 코멘트", "주간 리포트") 옆에 작은 **"AI"** Badge(공통 `Badge`의 기존 Tone). Badge는 장식이 아니라 글자로 읽힌다.
  - 그림자는 기존 `--shadow-card`만 쓴다.
- 세 곳(Dashboard, Check-in 결과, History의 주간 리포트)에 같은 Style이 적용된다.
- 체험 계정의 안내("소셜 로그인 후 이용할 수 있습니다") 상태에서도 Card 모양은 같다.
- 글자 색 대비는 지금보다 나빠지지 않아야 한다.

### Test

- 날짜 차이 함수: 같은 Seoul 날짜(UTC로는 날이 다른 경우 포함), 하루 전, 여러 날 전, 자정 직전 / 직후.
- Dashboard(현재 시각을 고정):
  - 오늘 기록: 제목 "오늘 컨디션은 …", "다시 입력하기" Link, 안내 영역 없음, AI 코멘트 자동 생성 요청이 나간다(기존 동작).
  - 3일 전 기록: 안내 제목과 설명("3일 전"), "오늘 상태 입력" Link, "마지막 기록 · 3일 전" 구역 안에 Score / 기분 / 추천이 있다. "지금 컨디션은" / "오늘 컨디션은" 문구가 없다. **AI 코멘트 자동 생성 요청(POST)이 나가지 않는다.**
  - 어제 기록: "어제"로 표시.
  - 평소 값이 있으면 "최근 14일 평균"과 다섯 값, 없으면 그 구역이 없다.
  - 기록이 전혀 없으면 기존 Empty State(변경 없음).
- `InsightCard`: "AI" Badge가 있다. 기존 Test는 그대로 통과한다.
- 현재 시각 고정은 `vi.useFakeTimers` 또는 함수 인자 주입을 쓴다. Timer를 쓰면 Test 끝에 되돌린다.
- jest-dom Matcher를 쓰지 않는다. `getByRole` Option에 `exact`를 쓰지 않는다. 이름으로 요소를 찾을 때 다른 요소와 겹치지 않게 Role과 정확한 이름을 쓴다. Test의 타입 오류에 주의한다(`tsc --noEmit`). CSS 파일 내용을 `?raw` import로 읽어 검사하지 않는다.
- 기존 Test는 그대로 통과해야 한다. "지금 컨디션은"을 찾던 곳만 새 문구로 고친다.

### 문서

- `docs/03-UX_UI_SPEC.md`: Dashboard의 두 상태와 AI 코멘트 Card 강조. `docs/23-LLM-INSIGHT.md`: 지난 기록에서는 자동 생성하지 않는다는 점.
- `docs/09-DECISIONS.md`: 새 Decision(다음 번호) — 오늘 기록이 없을 때 추정하지 않고 지난 기록 / 평소 값을 이름대로 보여 준다.
- `README.md`의 Dashboard 설명 한두 문장.
- `docs/07-TASKS.md`: TASK-069 행과 절을 `docs/tasks/COMMON.md` "9. `docs/07-TASKS.md` 작성 형식"대로 추가한다(DONE, Milestone 69).
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### 금지

- Backend / API / 계약 / Dependency 변경(2단계에서 한다)
- 오늘 상태를 추정하거나 평균을 "오늘 컨디션"으로 표시하는 것
- 위치 권한 요청, 날씨 조회를 Dashboard에 추가하는 것(2단계)
- Check-in / History의 구성 변경(`InsightCard`의 공통 Style 변경은 예외)
- 추천 규칙, 평가 동작, Score / 기분 판정 변경

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Run 2 범위

Run 1에서 구현은 끝났고(WIP Commit으로 이 Branch에 있음), Orchestrator Verify가 Frontend Test 1건에서 멈췄다(267건 중 266건 통과).

- 실패: `DashboardPage.test.tsx`의 기존 Test "shows an API error and reloads on retry"가 `fetch` 호출 횟수를 전체로 2회라고 단언했는데, 오늘 기록 화면에서 AI 코멘트 / 추천 평가 요청이 뒤따라 나가 3회가 됐다.
- 조치(Claude 세션, Sandbox 밖): 최신 기록 요청(`/api/check-ins/latest`)만 세도록 단언을 고쳤다. 구현은 바꾸지 않았다. Frontend Test 267건, `tsc --noEmit`, Build 통과.

Claude 세션이 화면을 확인했다(오늘 / 어제 / 3일 전 / 평소 값 없음, 390 / 768 / 1280px, 가로 넘침 없음). 동작은 설계대로다: 오늘 기록이면 "오늘 컨디션은 …"과 "다시 입력하기", 지난 기록이면 안내 → 최근 14일 평균 → "마지막 기록 · N일 전" 순서이고 AI 코멘트 자동 생성 요청이 나가지 않는다. AI 코멘트 Card에 밝은 배경, 왼쪽 선, "AI" Badge가 보인다.

**이번 Run에서 고칠 것**(화면에서 설계와 다른 점):

1. **안내 영역이 충분히 눈에 띄지 않는다.** 제목 "오늘 상태를 아직 입력하지 않았어요"가 일반 Card 제목 크기라 아래의 "그날 컨디션은 …"(Hero 제목)보다 작다. 설계는 "Hero 자리, 가장 눈에 띄게"다. 안내 영역의 제목을 **Hero 제목과 같은 크기 Token**으로 키우고, 영역의 배경 / 테두리를 Hero(`wellness-hero`)와 같은 강조 표면으로 맞춘다. 반대로 "마지막 기록" 구역 안의 Hero 제목("그날 컨디션은 …")은 한 단계 작은 기존 제목 크기 Token으로 줄여 안내 영역보다 덜 눈에 띄게 한다. 새 크기 / 색 값을 만들지 않는다.
2. **안내 설명의 날짜 형식.** 지금 "3일 전(10. 2.)"으로 나온다. 설계대로 **"3일 전(10월 2일)"**로 한다. 하루 전이면 **"어제(10월 4일)"**로 쓴다("1일 전"이 아니다). "마지막 기록 · …" 구역 제목도 하루 전이면 "마지막 기록 · 어제 (10월 4일 오후 06:53)"로 맞춘다.
3. 위 문구에 맞게 Test를 고치고, 하루 전 경우의 문구 단언을 넣는다.

그 밖에:

4. 구현이 설계와 맞는지 다시 확인하고 어긋난 곳만 고친다. 통과한 Test를 다시 쓰지 않는다. `fetch` 호출 횟수를 전체로 단언하지 않는다(요청 주소별로 센다).
5. `docs/07-TASKS.md`의 TASK-069 절이 `docs/tasks/COMMON.md` 9절 형식인지 확인한다. `docs/08-WORK_LOG.md`에 Run 2 경과를 한 단락 더한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 오늘 여부를 Seoul 날짜로 판단하는가, 자정 이후와 화면 복귀 때 다시 계산하는가
- 오늘 기록이 없을 때: 추정값이 없고, 지난 기록이 "마지막 기록"으로 분명히 구분되며, 주된 동작이 "오늘 상태 입력"인가
- 지난 기록에서 AI 코멘트를 자동 생성하지 않는가(횟수 낭비 방지), 오늘 기록에서는 기존대로 자동 생성하는가
- 글자 대비를 낮추지 않았는가, 제목 구조와 초점 순서가 맞는가
- AI 코멘트 Card 강조가 기존 Token만 쓰고 세 곳에서 일관되는가
- `docs/07-TASKS.md`의 TASK-069 절이 공통 형식을 따르는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 오늘 기록 / 어제 기록 / 여러 날 전 기록 / 평소 값 없음 네 경우를 390 / 768 / 1280px로 캡처해 확인한다.
