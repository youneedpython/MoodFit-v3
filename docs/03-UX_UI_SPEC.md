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
