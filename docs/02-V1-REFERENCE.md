# 02. v1 UI/UX Reference

## 1. 문서 목적

이 문서는 기존 MoodFit v1 프로젝트에서 잘 구현된 UI/UX 요소와 개선이 필요한 부분을 추출하여 v3의 디자인 참고 기준으로 사용하기 위한 문서이다.

v1 소스 전체를 v3 Repository에 복사하지 않는다.

v3는 v1을 그대로 재현하는 것이 아니라, **v1의 시각적 장점을 유지하면서 실제 데이터·기능·상태 관리가 연결된 제품 형태로 발전시키는 것**을 목표로 한다.

---

## 2. v1 기술적 특징

첨부된 v1 프로젝트에서 확인한 주요 특징은 다음과 같다.

- React 기반 Vite 프로젝트
- 단일 Dashboard 중심 화면
- React Component 내부의 Hard-coded Data 사용
- 별도 Backend/API 연결 없음
- Dark Theme 기반 Wellness Dashboard
- Desktop / Tablet / Mobile 반응형 Layout 존재

v1의 `App.jsx`에는 다음 데이터가 정적 배열/객체로 정의되어 있다.

- Body Metrics
- Weather Profile
- Food Recommendations
- Music Recommendations

따라서 UI 표현은 좋지만 실제 사용자 입력 또는 Backend 분석 결과와 연결되지는 않는다.

---

## 3. v1 화면 구성

v1의 주요 화면 구조는 다음과 같다.

```text
Top Bar
├── Today rhythm
├── 감정 기반 웰니스 리듬
└── 추천 새로고침 버튼

Dashboard
├── Hero Panel
│   ├── Mood Badge
│   ├── 현재 날씨/감정 문구
│   ├── 상태 설명
│   ├── 위치 / 기온
│   └── Weather Visual
│
├── Body Metrics
│   ├── 호흡수
│   ├── 심장박동수
│   ├── 수면 점수
│   └── 스트레스
│
└── Recommendations
    ├── 추천 음식
    └── 추천 음악
```

---

## 4. v1에서 유지할 UI/UX 요소

### 4.1 Dark Wellness Dashboard

v1은 어두운 Navy 계열 배경에 Blue/Purple 계열 강조색을 사용한다.

확인된 대표 스타일은 다음과 같다.

- 배경: `#0c1120` → `#111827` 계열 Gradient
- Blue/Purple Radial Glow
- 반투명 Dark Card
- Blue/Purple CTA Gradient
- 둥근 Card Radius
- 낮은 채도의 Border

v3에서도 이 방향성을 유지한다.

### 4.2 Hero 중심 정보 계층

사용자가 첫 화면에서 단순 입력 Form보다 먼저 현재 상태를 이해할 수 있도록 한다.

v1의 다음 요소를 발전시킨다.

- Mood Badge
- 현재 상태 Headline
- Weather Summary
- 상태 설명
- Weather Visualization

### 4.3 Metric Card

v1은 4개의 Metric을 한눈에 비교할 수 있도록 Card 형태로 배치한다.

- 호흡수
- 심박수
- 수면 점수
- 스트레스

v3에서도 Metric Card를 유지하되 실제 API Data를 사용한다.

### 4.4 Recommendation Card

Food와 Music을 분리된 Card로 표현하는 구조를 유지한다.

각 추천은 이름만 보여주지 않고 이유와 Mood Tag를 함께 제공한다.

### 4.5 Responsive Layout

v1은 약 860px, 560px 구간에서 Layout이 재배치된다.

v3에서도 Desktop / Tablet / Mobile을 명확히 고려한다.

---

## 5. v1에서 개선할 부분

### 5.1 Hard-coded Data 제거

v1의 Body Metric, Weather, Food, Music Data는 모두 Component 내부 정적 데이터이다.

v3에서는 Backend API를 통해 실제 저장/조회되는 데이터와 연결한다.

### 5.2 추천 새로고침 기능 Post-MVP 검토

v1의 `추천 새로고침` 버튼은 시각적으로 존재하지만 실제 이벤트가 연결되어 있지 않다.

v3 Core MVP에서는 Recommendation Refresh를 구현하지 않는다.
초기 MVP에서는 Check-in 생성 시 분석 결과와 Recommendation을 함께 생성하고 저장한다.
추천 새로고침은 Core MVP 완료 이후 Post-MVP Task에서 다시 검토한다.

### 5.3 입력 경험 분리

v1은 Dashboard에 결과만 표시한다.

v3에서는 `Daily Check-in` 화면을 별도로 제공하여 입력과 결과 확인의 역할을 분리한다.

### 5.4 History / Trend 추가

v1은 현재 상태만 보여준다.

v3에서는 최근 7일 기록과 Trend를 제공한다.

### 5.5 상태 UI 추가

v3는 다음 상태를 명시적으로 표현한다.

- Loading
- Error
- Empty
- Saving
- Validation Error

### 5.6 Component 구조 개선

v1은 대부분의 UI가 `App.jsx` 하나에 구성되어 있다.

v3에서는 Feature와 공통 Component를 분리한다.

---

## 6. v3 디자인 방향

v3의 목표는 다음과 같다.

```text
v1의 시각적 분위기
      +
더 명확한 정보 계층
      +
실제 사용자 입력
      +
실제 Backend Data
      +
상태 변화 시각화
```

v3는 단순한 관리자 Dashboard처럼 보이기보다, 사용자가 자신의 현재 상태를 쉽게 이해할 수 있는 **Personal Wellness Dashboard**로 설계한다.

---

## 7. 그대로 복사하지 않을 것

다음 요소는 v1에서 그대로 복사하지 않는다.

- Hard-coded Recommendation 배열
- 단일 `App.jsx` 중심 구조
- 동작하지 않는 CTA
- 화면에만 존재하는 임시 데이터
- 의미 없이 장식적인 시각 요소

v1의 디자인은 참고 자료이며 v3의 구현 규칙보다 우선하지 않는다.
