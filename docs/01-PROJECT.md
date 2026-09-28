# 01. MoodFit v3 프로젝트 정의

## 1. 프로젝트명

**MoodFit v3**

---

## 2. 프로젝트 목적

사용자의 신체 리듬 정보와 날씨 정보를 함께 사용하여 현재 웰니스 상태를 추정하고, 현재 상태에 어울리는 음식과 음악을 추천한다.

MoodFit v3는 의료 진단 서비스가 아니라 **일상적인 웰니스 상태 확인과 추천 경험을 제공하는 교육용 서비스**이다.

또한 이 프로젝트는 VS Code의 Codex를 사용하여 Harness 기반 개발 흐름을 학습하는 것을 주요 목표로 한다.

---

## 3. 주요 사용자

- 자신의 현재 컨디션을 간단히 확인하고 싶은 사용자
- 심박수, 수면, 스트레스 등 일상적 신체 리듬 정보를 기록하고 싶은 사용자
- 현재 상태에 맞는 음식과 음악 추천을 받고 싶은 사용자
- 최근 상태 변화를 간단히 확인하고 싶은 사용자

---

## 4. 핵심 사용자 시나리오

```text
사용자
  ↓
오늘의 상태 입력
  ↓
신체 리듬 + 날씨 분석
  ↓
Mood / Wellness Score 산출
  ↓
음식 / 음악 추천
  ↓
Dashboard에서 결과 확인
  ↓
최근 History / Trend 확인
```

---

## 5. 핵심 기능

### 5.1 Daily Check-in

사용자가 다음 정보를 입력한다.

- 심박수
- 호흡수
- 수면 점수
- 스트레스 수준
- 에너지 수준
- 기온
- 날씨 상태

초기 MVP에서는 실제 날씨 API를 사용하지 않으며, 기온과 날씨 상태는 사용자가 직접 입력하거나 선택한다.

### 5.2 Wellness Analysis

입력값을 기반으로 다음 결과를 산출한다.

- 현재 Mood
- Wellness Score
- 상태 요약

초기 버전은 Rule-based 분석으로 구현한다.

### 5.3 Food Recommendation

현재 상태에 적합한 음식 추천을 제공한다.

각 추천은 최소한 다음 정보를 가진다.

- 음식명
- 카테고리 또는 태그
- 추천 이유

### 5.4 Music Recommendation

현재 상태에 적합한 음악 추천을 제공한다.

각 추천은 최소한 다음 정보를 가진다.

- 곡명 또는 Playlist명
- 아티스트 또는 유형
- Mood Tag
- 추천 이유

### 5.5 Dashboard

최신 Check-in 결과를 중심으로 다음 정보를 시각적으로 제공한다.

- Mood
- Wellness Score
- Weather Summary
- 주요 Body Metric
- Food Recommendation
- Music Recommendation
- 최근 Trend

### 5.6 History

최근 기록을 조회하고 상태 변화를 확인한다.

초기 범위는 최근 7일 조회를 기준으로 한다.

---

## 6. v3 개선 목표

v3는 v1과 v2의 장점을 결합하고 단점을 개선한다.

```text
v1의 장점
UI/UX와 Dashboard 시각 구조
        +
v2의 장점
Full-stack / API / DB / CI
        +
v3의 핵심
Harness Engineering
```

주요 개선 목표는 다음과 같다.

- 단순 입력 Form 중심 UI에서 Dashboard 중심 UX로 개선
- Hard-coded Data를 Backend API Data로 전환
- Daily Check-in 기능 추가
- Recommendation 결과에 이유 제공
- History / Trend 기능 추가
- Loading / Error / Empty 상태 구현
- 실제 Backend Test 작성
- 반복 가능한 검증 절차 구성
- Codex의 작업 규칙, 계획, Task, 검증, 기록 체계 구성

---

## 7. 예정 기술 스택

### Frontend

- React
- TypeScript
- Vite

### Backend

- Java 21
- Spring Boot 3.x
- Gradle Wrapper
- Spring Data JPA
- Bean Validation

### Database

- MySQL

### Automation

- Git
- GitHub
- GitHub Actions

> 정확한 세부 버전과 추가 Dependency는 Project Bootstrap 전에 확인하고 Human Approval을 거쳐 확정한다.

---

## 8. 초기 구현 범위

초기 구현에서는 다음을 포함한다.

- Dashboard
- Daily Check-in
- Rule-based Wellness Analysis
- Food Recommendation
- Music Recommendation
- History 조회
- 최근 7일 Trend
- MySQL 저장
- Frontend / Backend Test
- 반복 가능한 Local Verification Script
- GitHub Actions CI

---

## 9. 초기 구현 제외 범위

다음 기능은 초기 v3 범위에서 제외한다.

- 실제 스마트워치 연동
- Apple Health / Google Fit 연동
- 실제 날씨 Open API 연동
- Spotify / YouTube Music API 연동
- 실제 AI/ML 모델 기반 감정 진단
- 회원가입 / OAuth
- 결제
- Push Notification
- AWS 배포

필요한 경우 후속 Milestone에서 별도로 검토한다.

---

## 10. 비기능 요구사항

- Desktop / Tablet / Mobile 반응형 UI
- API Error 상태를 사용자에게 명확히 표시
- 입력값 Validation
- 비밀정보 Repository Commit 금지
- Frontend와 Backend의 책임 분리
- Test 가능한 Service 구조
- CI에서 Build와 Test 수행
- 문서와 실제 구현의 불일치를 최소화

---

## 11. 완료 기준

MoodFit v3의 MVP 완료 조건은 다음과 같다.

- 사용자가 Daily Check-in을 저장할 수 있다.
- Backend가 Wellness 상태와 추천 결과를 생성한다.
- Dashboard에서 최신 분석 결과를 확인할 수 있다.
- History에서 최근 7일 기록을 확인할 수 있다.
- Frontend가 Loading / Error / Empty 상태를 처리한다.
- Frontend의 핵심 사용자 흐름 또는 주요 Component에 자동 Test가 존재한다.
- Backend 주요 Service에 Test가 존재한다.
- Frontend Build와 Backend Test/Build가 성공한다.
- GitHub Actions CI가 정상 동작한다.
- `TASKS.md`와 `WORK_LOG.md`가 실제 작업 상태와 일치한다.
