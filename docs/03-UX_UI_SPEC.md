# 03. MoodFit v3 UX/UI Specification

## 추천 평가 아이콘 (TASK-058)

Dashboard와 Check-in 결과의 음식 / 음악 평가 묶음은 항목 이름 줄 맨 오른쪽에 Tag Badge와 함께 표시한다. 하나의 둥근 알약 테두리 안에 세로 구분선과 엄지 올림 / 내림 Inline SVG만 보이며, 눌린 아이콘은 채움과 기존 강조 색으로 구분한다. 항목 이름을 포함한 접근성 이름과 평가 그룹, aria-pressed, title, 버튼별 최소 44 × 44px 터치 영역과 초점 표시를 유지한다. 좁은 화면에서는 이름이 줄바꿈되고 Badge와 평가 묶음은 함께 다음 줄로 내려갈 수 있다. 평가 불가 시 묶음과 빈 자리를 남기지 않으며 음악 재생 줄, 평가 저장 / 지우기 / 교체 / 실패 복구와 안내 문구는 유지한다.

## 공통 Footer (TASK-062)

모든 화면은 같은 Footer를 사용한다. 위쪽 구분선 아래 보조 글자 크기와 색으로 왼쪽에 “© MoodFit · 교육용 Product Heuristic이며 의학적 조언이 아닙니다.”, 오른쪽에 “개인정보 처리 안내” Link를 표시한다. Link의 터치 높이는 44px 이상이며 좁은 화면에서는 두 줄로 내려간다. Layout의 최소 화면 높이와 Flex 배치로 짧은 내용에서도 Footer를 화면 맨 아래에 둔다. 로그인 Card 안의 개인정보 Link도 유지한다.

## 1. UX 목표

MoodFit v3의 UI는 사용자가 다음 세 가지 질문에 빠르게 답을 얻을 수 있도록 설계한다.

1. 지금 내 상태는 어떤가?
2. 지금 무엇을 먹고 어떤 음악을 들으면 좋은가?
3. 최근 내 상태는 어떻게 변하고 있는가?

v2처럼 입력 Form과 결과만 배치하는 형태를 피하고, **Dashboard 중심의 제품 경험**을 제공한다.

---

## 2. 전체 Navigation

초기 MVP의 주요 화면은 3개로 제한한다.

```text
DASH-001  Dashboard
CHECK-001 Daily Check-in
HIST-001  History
```

예상 Navigation:

```text
MoodFit
├── Dashboard
├── Check-in
└── History
```

초기 구현은 SPA를 기준으로 하며, 화면 전환에는 Human Approved 결정에 따라 React Router를 사용한다.
정확한 Version과 Package 정책은 `docs/09-DECISIONS.md`의 DEC-015를 따른다.
Core MVP에서는 `react-router` `8.4.0`을 사용하고 `react-router-dom`은 사용하지 않는다.

---

## 3. DASH-001 Dashboard

### 목적

사용자가 최신 Check-in 결과와 추천 정보를 한 화면에서 확인한다.

### 주요 영역

#### A. Header

- MoodFit Brand
- 현재 날짜
- Dashboard / Check-in / History Navigation

#### B. Wellness Hero

TASK-069: Asia/Seoul 날짜로 오늘 여부를 판단하고 1분마다 및 화면 복귀 때 갱신한다. 오늘 기록은 “오늘 컨디션은 …”과 보조 “다시 입력하기” Link를 표시한다. 오늘 기록이 없으면 h2 “오늘 상태를 아직 입력하지 않았어요”, 경과 일수(하루 전은 “어제”)와 날짜, 강조 “오늘 상태 입력” Link를 먼저 표시한다. 안내에는 기분 / Score / 날씨를 넣지 않는다.

저장된 Baseline이 있으면 h2 “최근 14일 평균” 아래 다섯 평균과 단위, 기록 건수 및 오늘 추정값이 아니라는 안내를 표시한다. 평균을 새로 계산하지 않는다. 이어서 aria-labelledby로 h2 제목을 연결한 “마지막 기록 · N일 전 (기록 시각)” section에 기존 결과를 표시한다. Hero 제목은 “그날 컨디션은 …”이며 입력 Link는 없다. 구역 제목 아래 구분선과 위치로 지난 정보를 구분하고 글자 대비와 Score 색은 유지한다. 기록이 전혀 없으면 기존 Empty State다.

공통 AI 코멘트 / 주간 리포트 Card는 surface-raised 배경, 왼쪽 Blue → Purple 선, 제목 옆 AI Badge와 기존 Card 그림자를 사용한다. 세 화면 및 체험 계정 안내에 동일하게 적용한다.

- 현재 Mood Badge
- Wellness Score
- 상태 Headline
- 상태 요약
- 현재 날씨
- 기온
- Weather Visual
- `오늘 상태 입력` CTA

#### C. Body Metrics

최소 다음 Metric을 표시한다.

- Heart Rate
- Respiratory Rate
- Sleep Score
- Stress Level
- Energy Level

Desktop에서는 적절한 Grid로 표현하고 작은 화면에서는 재배치한다.

#### D. Recommendation

Food Recommendation과 Music Recommendation을 구분한다.

각 Recommendation Item은 다음 정보를 가진다.

- 이름
- Category / Mood Tag
- 추천 이유

#### E. Trend

최근 7일 Wellness Score 변화를 표시한다.

Core MVP에서는 외부 Chart Library를 추가하지 않는다.
Trend는 CSS 또는 SVG 기반의 단순한 Component로 시작한다.
외부 Chart Library가 필요한 경우 별도의 Human Approval을 받는다.

### 상태

- 최신 기록 없음 → Empty State + Check-in CTA
- API Loading → Skeleton 또는 Loading State
- API Error → Error Message + Retry

---

## 4. CHECK-001 Daily Check-in

### 목적

사용자가 오늘의 신체 리듬과 날씨 상태를 입력하고 분석을 요청한다.

### 입력 항목

- 심박수 (bpm)
- 호흡수 (/min)
- 수면 점수 (0~100)
- 스트레스 수준 (0~100)
- 에너지 수준 (0~100)
- 기온
- 날씨 상태

### UX 원칙

- 관련 입력값을 그룹화한다.
- 숫자 범위를 사용자에게 명확하게 안내한다.
- Validation Error는 해당 필드 가까이에 표시한다.
- 저장/분석 중 중복 제출을 방지한다.
- 완료 후 Dashboard로 이동하거나 결과 요약을 제공한다.
- 수면 점수 / 스트레스 수준 / 에너지 수준은 숫자 입력과 0 ~ 100, step 1 Slider를 함께 제공하고 값을 동기화한다. 빈 값은 Slider만 50으로 보이며 움직이기 전에는 필수 입력 상태를 유지한다. 범위 밖 숫자는 원래 검증을 유지하고 Slider만 범위 끝에 표시한다. 접근성 이름은 항목 이름 + Slider이며 기존 터치 영역 / 초점 / 강조 색 Token을 사용한다.
- 넓은 화면에서 신체 리듬은 2열, 컨디션은 3열로 너비를 채운다. Tablet은 2열, Mobile은 1열이며 날씨 입력 배치는 유지한다.
- Slider에는 안내 / 오류의 aria-describedby와 aria-invalid를 연결하지 않고 숫자 입력칸에만 유지한다. 빈 값은 aria-valuetext="입력 안 함"으로 읽고 값이 있으면 숫자를 읽으며 오류 초점은 숫자 입력칸으로 이동한다(TASK-066).
- 결과는 저장 완료 제목 / 기록 시각 → (Mood / 긴장도 Badge와 요약 | Score / 날씨 Tile) → AI 코멘트 → Body Metrics → 추천 → 버튼 순서다. Dashboard와 Tile Component 및 Style을 공유하며 지역이 없어도 날씨 / 기온을 표시한다. 날씨 Icon은 장식이고 의미는 글자로 전달한다. 결과 제목으로 초점 이동을 유지한다.

### 상태

- Initial
- Validation Error
- Submitting
- Success
- API Error

---

## 5. HIST-001 History

### 목적

사용자가 최근 웰니스 상태 변화를 확인한다.

### 주요 영역

- 최근 7일 Wellness Score Trend
- 날짜별 Mood
- 심박수 / 호흡수 / 수면 / 스트레스 / 에너지 중 주요 Metric 요약
- 추천 이력 요약
- 기록 Card의 추천 음식 / 음악 이력은 기본으로 접고, 실제 개수가 적힌 summary를 누르면 기존 이름 목록을 펼친다.

### Empty State

기록이 충분하지 않은 경우 다음 행동을 안내한다.

```text
아직 충분한 기록이 없습니다.
오늘의 상태를 입력해 보세요.
```

---

## 6. Visual Design Direction

### Theme

- Dark Wellness Dashboard
- Navy / Slate Background
- Blue / Purple Accent
- Green은 안정/긍정 상태에 제한적으로 사용

### Card

- 충분한 Padding
- 명확한 Border / Surface 구분
- 지나치게 강한 Shadow 금지
- Rounded Corner 유지

### Typography

- Headline / Metric / Body의 계층을 명확히 구분
- 지나치게 작은 Text 사용 금지
- 숫자 Metric은 빠르게 스캔 가능하도록 강조

### Color

정확한 Token은 구현 단계에서 `styles/tokens.css` 등에 정의한다.

Component별 임의 색상 추가를 피한다.

---

## 7. Interaction 원칙

- 모든 Button은 Hover / Focus / Disabled 상태를 가진다.
- Keyboard Focus를 제거하지 않는다.
- Loading 중 중복 Action을 방지한다.
- 오류 발생 시 사용자가 다음 행동을 알 수 있어야 한다.
- 장식용 Animation은 기능 이해를 방해하지 않는 범위에서만 사용한다.

---

## 8. Responsive 원칙

### Desktop

- Hero와 주요 Card를 넓은 Grid로 구성
- Recommendation을 좌우 Card로 배치 가능

### Tablet

- Hero와 주요 Grid를 1~2 Column으로 재배치

### Mobile

- 주요 정보를 한 Column으로 배치
- Navigation과 CTA가 작은 화면에서 잘리지 않아야 함
- Tap Target 크기를 충분히 확보

---

## 9. Accessibility 기본 기준

- 의미 있는 HTML Element 사용
- Form Label 제공
- Keyboard Navigation 가능
- Focus State 제공
- Color만으로 상태를 전달하지 않음
- Text와 Background 대비 확보
- Decorative Visual에는 불필요한 접근성 Noise를 만들지 않음

---

## 10. v3에서 피할 UI

- API 테스트 Form처럼 보이는 단일 화면
- 모든 기능을 `App.tsx` 한 파일에 구성
- 과도한 Gradient / Glow 사용
- 의미 없는 Dashboard Card 추가
- Hard-coded 결과를 실제 기능처럼 표시
- Loading / Error / Empty 상태가 없는 UI

## TASK-065 모바일 설치 버튼 / History 그래프

- Footer의 앱 설치는 기존 secondary 버튼, 본문 글자 크기와 최소 44px 높이를 사용한다. 480px 이하에서는 DOM과 시각 순서를 함께 바꾸어 첫 줄 전체 너비에 놓고 고지 문구 / 개인정보 안내를 아래에 둔다. 설치 불가 / 설치 완료 시 빈 공간을 남기지 않는다.
- History의 초기 배율은 항상 1이다. Viewport 너비보다 기록 수 × 24가 크면 서울 시간대의 날짜별 평균(반올림)을 표시하고, 그 밖에는 기록 하나당 점 하나를 표시한다. 최대 배율은 max(1, 기록 수 × 48 / 너비)다. 확대하면 개별 기록으로 전환하고 최신 기록을 오른쪽에서 보여 준다. 글자 요약은 항상 전체 기록 기준이다.
- 가로 밀기와 두 손가락의 거리 비율에 따른 Pinch, 제목 옆 축소 / 확대 / 전체 보기 버튼을 제공한다. Touch Events를 사용하며 passive: false인 touchmove에서 손가락이 둘일 때만 기본 동작을 막는다. 한 손가락의 가로 / 세로 스크롤은 Browser에 맡긴다. Viewport는 기존 간격 Token의 좌우 안쪽 여백으로 기본 배율의 Label 넘침을 방지한다. 겹침 조건에서는 전체 보기 대신 날짜별 평균을 표시한다. 첫 확대는 max(1.5, 기록 수 × 24 / 너비)로 이동하고 이후 1.5배씩 조절한다. 축소 결과가 이 배율 아래면 1로 돌아간다. Pinch는 연속 배율을 유지하되 1.05 이하에서 1로 맞춘다. 버튼은 확대 가능한 경우만 나타나며 최소 44px, 명확한 접근성 이름과 한계 비활성화를 사용한다. 확대 상태는 Keyboard로 스크롤할 수 있다. 평균 안내와 밀어 보기 안내는 서로 배타적으로 표시하고 aria-live로 전환을 알린다.
- touch-action: pan-x pan-y로 기본 가로 / 세로 스크롤을 유지한다. 확대는 손가락 가운데의 그래프 위치를 기준으로 한다. 사용자 조작 후 화면 폭 변경은 배율을 유지하되 범위 안으로 맞춘다. 측정 미지원 환경은 배율 1이다. X축 Label은 안쪽 너비에 맞춰 약 56px 간격을 확보하고 마지막 기록은 항상 표시한다.
