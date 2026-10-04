# 09. MoodFit v3 Decisions

## 1. 문서 목적

이 문서는 MoodFit v3 개발 과정에서 Human Review를 통해 승인된
제품·기술·아키텍처 결정을 기록한다.

Codex는 이미 승인된 결정을 임의로 변경하지 않는다.

변경이 필요한 경우 변경 이유, 영향 범위, 대안을 먼저 제시하고
Human Approval을 받아야 한다.

---

## DEC-001 Dashboard Metric

### 결정

MoodFit v3 Dashboard에서는 다음 5개 Metric을 사용한다.

```text
Heart Rate
Respiratory Rate
Sleep Score
Stress Level
Energy Level
```

### 이유

v1은 4개의 Metric을 사용했지만
v3에서는 사용자 상태 표현을 개선하기 위해 Energy Level을 추가한다.

### 상태

```text
Human Approved
```

---

## DEC-002 Recommendation Refresh

### 결정

Recommendation Refresh 기능은 Core MVP에서 제외한다.

초기 MVP에서는 Check-in 생성 시
분석 결과와 Recommendation을 함께 생성하고 저장한다.

다음 API는 Core MVP에서 구현하지 않는다.

```http
POST /api/check-ins/{id}/recommendations/refresh
```

Recommendation Refresh는 Core MVP 완료 이후
Post-MVP Task에서 다시 검토한다.

### 상태

```text
Deferred
```

---

## DEC-003 Latest Check-in Empty Response

### 결정

다음 API에서 저장된 Check-in이 존재하지 않는 경우:

```http
GET /api/check-ins/latest
```

다음을 반환한다.

```http
404 Not Found
```

예상 Error Code:

```text
CHECKIN_NOT_FOUND
```

Frontend는 이를 일반 Error 화면이 아니라
Dashboard Empty State로 처리한다.

### 상태

```text
Human Approved
```

---

## DEC-004 History 조회 기간

### 결정

History 조회 기본값은 7일로 한다.

```text
default = 7
```

조회 기간은 최소 1일, 최대 30일로 제한한다.

```text
min = 1
max = 30
```

1 미만, 30 초과, 정수가 아닌 값은 Validation Error로 처리한다.

### 변경 이력

- 2026-09-29: TASK-004 Human Review에서 최소값 명세 누락이 확인되어 `min = 1`을 추가했다. (Human Approved)

### 상태

```text
Human Approved
```

---

## DEC-005 Recommendation Domain Scope

### 결정

초기 MVP에서는 Recommendation을 독립적인 핵심 Aggregate로 설계하지 않는다.

Recommendation은 Wellness Check-in 분석 결과에 종속된 데이터로 관리한다.

```text
WellnessCheckin
├── Analysis Result
├── Food Recommendations
└── Music Recommendations
```

정확한 JPA Mapping 방식은 Domain 구현 전에 검토한다.

### 상태

```text
Human Approved
```

---

## DEC-006 날짜와 시간

### 결정

Backend에서는 시점을 표현하는 기본 타입으로 `Instant`를 사용한다.

API의 날짜/시간은 ISO-8601 형식으로 전달한다.

예:

```text
2026-09-28T03:00:00Z
```

Frontend에서 사용자 환경에 맞는 Local Time으로 표시한다.

### 상태

```text
Human Approved
```

---

## DEC-007 사용자 모델

### 결정

Core MVP는 단일 사용자 환경으로 가정한다.

다음 기능 및 구조는 초기 구현에서 제외한다.

```text
User Entity
userId
회원가입
로그인
JWT
OAuth
```

사용자 계정 기능이 필요한 경우 후속 Milestone에서 별도로 설계한다.

### 상태

```text
Human Approved
```

---

## DEC-008 Local 개발 환경

### 결정

기본 Local 개발 Port는 다음과 같다.

```text
Frontend : 5173
Backend  : 8080
MySQL    : 3306
```

Frontend 개발 환경에서는 `/api` 요청을 Backend로 Proxy하는 방식을 우선한다.

```text
/api
  ↓
http://localhost:8080
```

Database 접속 정보와 Secret은 환경변수로 관리한다.

예:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
```

Repository에는 실제 Secret을 Commit하지 않는다.

`.env.example`에는 필요한 환경변수 이름과 예시만 작성한다.

### 상태

```text
Human Approved
```

---

## DEC-009 CI Database Strategy

### 결정

초기 GitHub Actions CI에서는 별도의 MySQL Service Container를 실행하지 않는다.

초기 자동 Test는 다음을 중심으로 구성한다.

```text
Backend Unit Test
Controller Validation Test
Frontend Component Test
Frontend Build
Backend Build
```

Repository / Database Integration Test가 필요해지는 경우
별도의 Test DB 전략을 다시 결정한다.

### 변경 이력

- 2026-10-01: TASK-016 Gate C에서 Testcontainers MySQL 도입이 승인되어 DEC-023으로 대체되었다. (Human Approved)

### 상태

```text
Human Approved
```

---

## DEC-010 Trend Visualization

### 결정

Core MVP에서는 외부 Chart Library를 추가하지 않는다.

최근 7일 Wellness Trend는
CSS 또는 SVG 기반의 단순한 Component로 구현한다.

외부 Chart Library가 필요한 경우 별도의 Human Approval을 받는다.

### 상태

```text
Human Approved
```

---

## DEC-011 Frontend Routing

### 결정

Dashboard, Daily Check-in, History 화면을 구분하기 위해
React Router 사용을 승인한다.

예상 Route:

```text
/
→ Dashboard

/check-in
→ Daily Check-in

/history
→ History
```

정확한 Package Version은 Project Bootstrap 전 확인한다.

### 상태

```text
Human Approved
```

---

## DEC-012 Frontend Test Tool

### 결정

Frontend Test에는 다음 도구 사용을 승인한다.

```text
Vitest
React Testing Library
```

초기 Test 대상 예:

```text
Dashboard Empty State
Check-in Validation
API Error State
Recommendation Rendering
```

정확한 Package Version은 Project Bootstrap 전 확인한다.

### 상태

```text
Human Approved
```

---

## DEC-013 GitHub Actions Bot

### 결정

GitHub Actions Bot은 Core 기능 구현 이전에 추가하지 않는다.

도입 순서는 다음과 같다.

```text
Project Skeleton
    ↓
Local Verification
    ↓
GitHub Actions CI
    ↓
Core Feature 구현 및 검증
    ↓
GitHub Actions Bot
```

Bot은 초기에는 Source Code를 자동 수정하지 않는다.

검증 결과나 Harness 관련 기록을 자동화하는 역할부터 시작한다.

### 상태

```text
Human Approved
```

---

## DEC-014 Wellness Analysis Rule

### 결정

TASK-005 Gate B Human Review를 통해 Wellness Analysis / Recommendation Rule을 다음과 같이 확정한다.

- 검토 근거: `docs/10-WELLNESS-RULE-PROPOSAL.md` (16절 확정 Rule)
- 승인 조합: Score Option A / Mood Option M2 / Weather Context only / Temperature Option T-A / Deterministic Recommendation / Template Summary
- 아래 threshold와 문구는 의학적 기준이 아니라 MoodFit 교육용 Product Heuristic이다.
- heartRate, respiratoryRate는 Score / Mood / Recommendation에 반영하지 않고 Dashboard 표시용으로만 사용한다.
- 구현 시 threshold와 weight는 Controller가 아닌 Rule Policy class 한 곳에서 관리한다.

### Wellness Score

```text
stressScore   = 100 - stressLevel
wellnessScore = (35 * sleepScore + 35 * stressScore + 30 * energyLevel + 50) / 100   // 정수 나눗셈
```

- Weight: Sleep 35% / Stress 35% / Energy 30% (Option A)
- 정수 연산만 사용하므로 부동소수점 오차가 없다.
- 결과는 가중합을 소수 첫째 자리에서 반올림(HALF_UP)한 값과 같다. 예: 3.50 → 4
- 입력 범위(0 ~ 100) 안에서 결과는 항상 0 ~ 100이다. (0 ~ 100 전체 조합 검증 완료)
- heartRate, respiratoryRate, temperature, weather는 Score에 반영하지 않는다.

### Mood

위에서부터 순서대로 판정하고, 처음 만족한 Mood를 사용한다. 모든 경계값은 포함(inclusive)이다.

| 순서 | code | label | 조건 |
|---:|---|---|---|
| 1 | TIRED | 피곤함 | `energyLevel <= 35` 또는 `sleepScore <= 35` |
| 2 | ENERGETIC | 활기 있음 | `energyLevel >= 70` 그리고 `stressLevel <= 45` 그리고 `sleepScore >= 60` |
| 3 | CALM | 차분함 | `stressLevel <= 35` 그리고 `wellnessScore >= 65` |
| 4 | BALANCED | 균형 있음 | 위 조건에 해당하지 않음 |

- `wellnessScore`는 위 Wellness Score의 정수 결과를 사용한다.

### Weather / Temperature → Context

Weather와 Temperature는 Score와 Mood에 반영하지 않는다.
Summary, Food, Music에서 공통으로 사용하는 Context 하나를 다음 순서로 결정한다.

| 순서 | 조건 | Context |
|---:|---|---|
| 1 | `temperature <= 5` | COLD |
| 2 | `temperature >= 30` | HOT |
| 3 | 그 외 | `weather` 값 그대로 (CLEAR / CLOUDY / RAIN / SNOW) |

- Temperature 경계값은 포함(inclusive)이다.
- 극단 기온이 Weather보다 우선한다. 예: `-30` + `SNOW` → COLD, `30` + `RAIN` → HOT

### Recommendation 공통

- 외부 API를 사용하지 않는 Deterministic Rule이다. 같은 입력에는 항상 같은 결과를 반환한다.
- `foods`, `music`은 각각 **항상 2개**를 반환한다.
  - 첫 번째 Item: Mood Item
  - 두 번째 Item: Context Item
- Mood Item과 Context Item의 이름은 서로 겹치지 않는다. (중복 Item 없음)
- 효능, 치료, 질환 관련 표현은 사용하지 않는다.

### Food

Mood Item:

| Mood | name | tag | reason |
|---|---|---|---|
| TIRED | 따뜻한 수프와 곡물빵 | 편안한 식사 | 부담이 적고 천천히 먹기 좋은 메뉴입니다. |
| ENERGETIC | 연어 샐러드 | 에너지 균형 | 가볍게 에너지를 유지하기 좋은 메뉴입니다. |
| CALM | 두부 채소 덮밥 | 균형 식사 | 차분한 컨디션에 어울리는 균형 잡힌 메뉴입니다. |
| BALANCED | 닭가슴살 라이스볼 | 균형 식사 | 한쪽으로 치우치지 않은 기본 메뉴입니다. |

Context Item:

| Context | name | tag | reason |
|---|---|---|---|
| COLD | 따뜻한 죽 | 따뜻한 메뉴 | 기온이 낮은 날에 어울리는 따뜻한 메뉴입니다. |
| HOT | 그릭 요거트 볼 | 가벼운 메뉴 | 기온이 높은 날에 부담이 적은 메뉴입니다. |
| RAIN | 따뜻한 채소 스튜 | 따뜻한 메뉴 | 비 오는 날씨에 어울리는 따뜻한 메뉴입니다. |
| SNOW | 따뜻한 채소 스튜 | 따뜻한 메뉴 | 눈 오는 날씨에 어울리는 따뜻한 메뉴입니다. |
| CLEAR | 과일 곁들인 그린 샐러드 | 가벼운 메뉴 | 맑은 날씨에 어울리는 산뜻한 메뉴입니다. |
| CLOUDY | 따뜻한 현미 주먹밥 | 부담 적은 메뉴 | 흐린 날씨에 부담 없이 먹기 좋은 메뉴입니다. |

### Music

실제 외부 곡이 아니라 가상 Playlist를 사용한다. `artist`는 모두 `MoodFit Curated`이다.

Mood Item:

| Mood | title | tag | reason |
|---|---|---|---|
| TIRED | Soft Reset Playlist | 편안한 휴식 | 느린 페이스에 어울리는 분위기입니다. |
| ENERGETIC | Light Motion Playlist | 가벼운 활력 | 높은 에너지에 어울리는 밝은 흐름입니다. |
| CALM | Calm Focus Playlist | 차분한 분위기 | 차분한 컨디션을 유지하기 좋은 분위기입니다. |
| BALANCED | Daily Balance Playlist | 균형 있는 분위기 | 과하지 않은 기본 분위기입니다. |

Context Item:

| Context | title | tag | reason |
|---|---|---|---|
| COLD | Warm Evening Playlist | 포근한 분위기 | 기온이 낮은 날에 어울리는 따뜻한 분위기입니다. |
| HOT | Cool Breeze Playlist | 가벼운 분위기 | 기온이 높은 날에 어울리는 산뜻한 분위기입니다. |
| RAIN | Rainy Indoor Playlist | 잔잔한 감성 | 비 오는 날의 실내 분위기에 어울립니다. |
| SNOW | Warm Evening Playlist | 포근한 분위기 | 눈 오는 날에 어울리는 따뜻한 분위기입니다. |
| CLEAR | Bright Morning Playlist | 밝은 분위기 | 맑은 날씨에 어울리는 밝은 분위기입니다. |
| CLOUDY | Cloudy Focus Playlist | 집중하기 좋은 분위기 | 흐린 날씨에 차분히 집중하기 좋은 분위기입니다. |

### Summary

```text
summary = Mood 문장 + " " + Context 문장
```

Metric 개별 선택은 하지 않는다. Mood 판정 자체가 주요 Metric 조합을 반영하기 때문이다.

Mood 문장:

| Mood | 문장 |
|---|---|
| TIRED | 현재 입력 기준으로 에너지나 수면 점수가 낮은 편이라 무리하지 않는 페이스가 어울립니다. |
| ENERGETIC | 현재 입력 기준으로 에너지 수준은 비교적 높고, 스트레스 부담은 크지 않은 편입니다. |
| CALM | 현재 입력 기준으로 스트레스 부담이 낮고 전반적인 컨디션이 안정적인 편입니다. |
| BALANCED | 현재 입력 기준으로 컨디션이 한쪽으로 크게 치우치지 않은 편입니다. |

Context 문장:

| Context | 문장 |
|---|---|
| COLD | 기온이 낮은 날에는 따뜻한 식사와 느린 페이스가 어울립니다. |
| HOT | 기온이 높은 날에는 가벼운 식사와 충분한 휴식이 어울립니다. |
| RAIN | 비가 오는 날씨에는 차분한 실내 활동과 부담이 적은 식사가 어울립니다. |
| SNOW | 눈이 오는 날씨에는 보온에 신경 쓰며 느린 페이스로 움직이는 것이 어울립니다. |
| CLEAR | 맑은 날씨에는 가벼운 산책 같은 활동이 어울립니다. |
| CLOUDY | 흐린 날씨에는 차분한 페이스로 하루를 이어 가는 것이 어울립니다. |

- 진단, 질환, 위험, 치료, 이상 판정 표현을 사용하지 않는다.

### Edge Case / Boundary 기대값

아래 값은 이 결정의 Rule로 계산한 기대값이다.
TASK-006 Unit Test의 기대값으로 사용한다. (heartRate / respiratoryRate는 결과에 영향이 없다.)

| Case | sleep / stress / energy | temp / weather | Score | Mood | Context | Food (Mood, Context) | Music (Mood, Context) |
|---|---|---|---:|---|---|---|---|
| E01 API 예시 입력 | 86 / 31 / 74 | 19.0 / RAIN | 76 | ENERGETIC | RAIN | 연어 샐러드, 따뜻한 채소 스튜 | Light Motion, Rainy Indoor |
| E02 모든 입력 최소 | 0 / 0 / 0 | 19.0 / RAIN | 35 | TIRED | RAIN | 따뜻한 수프와 곡물빵, 따뜻한 채소 스튜 | Soft Reset, Rainy Indoor |
| E03 모든 입력 최대 | 100 / 100 / 100 | 19.0 / RAIN | 65 | BALANCED | RAIN | 닭가슴살 라이스볼, 따뜻한 채소 스튜 | Daily Balance, Rainy Indoor |
| E04 높은 Energy + 높은 Stress | 80 / 80 / 90 | 19.0 / RAIN | 62 | BALANCED | RAIN | 닭가슴살 라이스볼, 따뜻한 채소 스튜 | Daily Balance, Rainy Indoor |
| E05 낮은 Energy + 낮은 Stress | 70 / 10 / 30 | 19.0 / RAIN | 65 | TIRED | RAIN | 따뜻한 수프와 곡물빵, 따뜻한 채소 스튜 | Soft Reset, Rainy Indoor |
| E06 energy = 35 (TIRED 경계 포함) | 80 / 20 / 35 | 19.0 / RAIN | 67 | TIRED | RAIN | 따뜻한 수프와 곡물빵, 따뜻한 채소 스튜 | Soft Reset, Rainy Indoor |
| E07 sleep = 35 (TIRED 경계 포함) | 35 / 20 / 80 | 19.0 / RAIN | 64 | TIRED | RAIN | 따뜻한 수프와 곡물빵, 따뜻한 채소 스튜 | Soft Reset, Rainy Indoor |
| E08 ENERGETIC 경계 포함 | 60 / 45 / 70 | 19.0 / RAIN | 61 | ENERGETIC | RAIN | 연어 샐러드, 따뜻한 채소 스튜 | Light Motion, Rainy Indoor |
| E09 energy = 69 (ENERGETIC 미달) | 60 / 45 / 69 | 19.0 / RAIN | 61 | BALANCED | RAIN | 닭가슴살 라이스볼, 따뜻한 채소 스튜 | Daily Balance, Rainy Indoor |
| E10 stress = 46 (ENERGETIC 미달) | 60 / 46 / 70 | 19.0 / RAIN | 61 | BALANCED | RAIN | 닭가슴살 라이스볼, 따뜻한 채소 스튜 | Daily Balance, Rainy Indoor |
| E11 CALM 경계 포함 (stress 35, Score 65) | 70 / 35 / 58 | 19.0 / RAIN | 65 | CALM | RAIN | 두부 채소 덮밥, 따뜻한 채소 스튜 | Calm Focus, Rainy Indoor |
| E12 Score 64 (CALM 미달) | 70 / 35 / 55 | 19.0 / RAIN | 64 | BALANCED | RAIN | 닭가슴살 라이스볼, 따뜻한 채소 스튜 | Daily Balance, Rainy Indoor |
| E13 반올림 경계 (3.50 → 4) | 10 / 100 / 0 | 19.0 / RAIN | 4 | TIRED | RAIN | 따뜻한 수프와 곡물빵, 따뜻한 채소 스튜 | Soft Reset, Rainy Indoor |
| E14 temperature = 5 (COLD 포함) | 70 / 30 / 60 | 5.0 / CLEAR | 67 | CALM | COLD | 두부 채소 덮밥, 따뜻한 죽 | Calm Focus, Warm Evening |
| E15 temperature = 5.1 (COLD 아님) | 70 / 30 / 60 | 5.1 / CLEAR | 67 | CALM | CLEAR | 두부 채소 덮밥, 과일 곁들인 그린 샐러드 | Calm Focus, Bright Morning |
| E16 temperature = 30 (HOT 포함) | 70 / 30 / 60 | 30.0 / RAIN | 67 | CALM | HOT | 두부 채소 덮밥, 그릭 요거트 볼 | Calm Focus, Cool Breeze |
| E17 temperature = 29.9 (HOT 아님) | 70 / 30 / 60 | 29.9 / RAIN | 67 | CALM | RAIN | 두부 채소 덮밥, 따뜻한 채소 스튜 | Calm Focus, Rainy Indoor |
| E18 temperature 최소 -30 + SNOW | 70 / 30 / 60 | -30.0 / SNOW | 67 | CALM | COLD | 두부 채소 덮밥, 따뜻한 죽 | Calm Focus, Warm Evening |
| E19 temperature 최대 50 + CLEAR | 70 / 30 / 60 | 50.0 / CLEAR | 67 | CALM | HOT | 두부 채소 덮밥, 그릭 요거트 볼 | Calm Focus, Cool Breeze |
| E20 CLOUDY 보통 기온 | 70 / 30 / 60 | 18.0 / CLOUDY | 67 | CALM | CLOUDY | 두부 채소 덮밥, 따뜻한 현미 주먹밥 | Calm Focus, Cloudy Focus |

Music 열의 이름은 `Playlist`를 생략해 표기했다.

### 변경 이력

- 2026-10-04 (TASK-036, Human 승인): 추천 음식 / 음악을 각각 5개로 늘렸다(기분 기준 3개 + 날씨 / 상황 기준 2개). 점수와 기분 판정 규칙은 바꾸지 않았다.

### 상태

```text
Human Approved
```

---

## DEC-015 기술 버전

### 결정

Gate A와 Spring Boot Version Re-review Human Review를 통해
현재 Project Bootstrap에 사용할 기술 Version을 다음과 같이 확정한다.

```text
Frontend Runtime
Node.js 24.21.0

Frontend Core
React 19.3.0
React DOM 19.3.0
Vite 8.3.1
TypeScript 6.0.2
React Router 8.4.0

Frontend Test
Vitest 5.0.2
React Testing Library 16.3.3
@testing-library/dom 10.4.2
jsdom 30.1.1

Backend
Java 21
Spring Boot 4.1.1
Gradle Wrapper 9.8.0
```

### Version 고정 정책

- React와 React DOM은 동일 Version으로 유지한다.
- React Router 8에서는 `react-router` `8.4.0`을 사용한다.
- `react-router-dom`은 설치하지 않는다.
- TypeScript는 Vite `8.3.1` 공식 React + TypeScript Template 기준의 `6.0.2`를 사용한다.
- `package.json`의 직접 Dependency는 Core MVP 재현성을 위해 정확한 Version으로 고정한다.
- `package-lock.json`은 Repository에 Commit한다.
- Gradle Wrapper Version은 `9.8.0`으로 고정한다. (Spring Boot 4.1.1 지원 범위: Gradle 8.x(8.14 이상) / 9.x)
- Spring Boot Plugin Version은 `4.1.1`로 고정한다.
- GitHub Actions에서도 Node.js `24.21.0`과 Java `21`을 사용한다.

### Backend Baseline

Spring Boot Version Re-review Human Approval에 따라 MoodFit v3는 Spring Boot `4.1.1`의 기본 기술 Stack을 수용한다.

```text
Spring Framework 7
Jakarta EE 11
Servlet 6.1
Tomcat 11
Hibernate Validator 9
Jackson 3 기본 Stack
JUnit 6 기본 Stack
```

Jackson 2 compatibility path는 TASK-001에서 사용하지 않는다.
향후 실제 호환성 문제가 발생하면 Gate C에서 별도로 검토한다.

### 변경 이력

- 2026-10-01: TASK-014 Gradle Wrapper Version Review에서 Gradle Wrapper를 `8.14.5` → `9.8.0`으로 변경했다. (Human Approved)
  - 배경: TASK-012 CI Summary의 "Gradle version is out of date" 안내 (FU-5)
  - 근거: Spring Boot 4.1.1 지원 범위 안, 변경 전 검증에서 Backend Test 57건 통과 / Deprecation 경고 0건
  - Wrapper jar SHA-256이 Gradle 공식 배포 값과 일치함을 확인했다.

### 상태

```text
Human Approved
```

---

## DEC-016 Bootstrap Dependency Set

### 결정

TASK-001 Project Bootstrap에서 사용할 현재 최소 Bootstrap Dependency / Plugin Set을
Gate C와 Spring Boot Version Re-review Human Review를 통해 승인한다.

### Frontend Bootstrap Support Dependency

다음 Dependency는 `devDependency`로 사용한다.

```text
@vitejs/plugin-react 6.1.1
@types/react 19.3.0
@types/react-dom 19.3.0
@types/node 24.13.6
```

### Backend Bootstrap Plugin / Dependency

다음 Gradle Plugin을 사용한다.

```text
org.springframework.boot Gradle Plugin 4.1.1
io.spring.dependency-management Plugin 1.1.7
```

다음 Spring Boot Starter를 사용한다.

```text
spring-boot-starter-webmvc
  - implementation
  - Version은 Spring Boot 4.1.1 dependency management 사용

spring-boot-starter-validation
  - implementation
  - Version은 Spring Boot 4.1.1 dependency management 사용

spring-boot-starter-webmvc-test
  - testImplementation
  - Version은 Spring Boot 4.1.1 dependency management 사용
```

TASK-001에서는 `spring-boot-starter-web`을 사용하지 않는다.
이 Starter는 Spring Boot 4에서 deprecated이므로 사용하지 않는다.

TASK-001에서는 `spring-boot-starter-test`를 직접 선언하지 않는다.
`spring-boot-starter-webmvc-test`가 `spring-boot-starter-test`를 포함하므로 중복 직접 Dependency를 만들지 않는다.

### Gradle Dependency Management 정책

- Spring Boot Gradle Plugin `4.1.1`을 사용한다.
- `io.spring.dependency-management` Plugin `1.1.7`을 사용한다.
- Spring Boot가 제공하는 dependency management를 사용한다.
- 위 Spring Boot Starter에는 개별 Version을 직접 작성하지 않는다.
- 별도의 Gradle native BOM 방식은 이번 Project Bootstrap에서 사용하지 않는다.

### Frontend Test Script 정책

Frontend `test` script는 watch mode가 아니라 CI와 Local Verification에서 종료 가능한 방식으로 설정한다.

```text
test → vitest run
```

### Vite Development Proxy 정책

Vite 개발 환경에서 `/api` 요청은 Backend local server로 Proxy한다.

```text
/api
  ↓
http://localhost:8080
```

### TASK-001 제외 Dependency

TASK-001에서는 다음 Frontend Tooling / Dependency를 추가하지 않는다.

```text
oxlint
ESLint
Prettier
추가 Testing Utility
추가 UI Library
```

TASK-001에서는 다음 Backend Dependency를 추가하지 않는다.

```text
Spring Data JPA
MySQL Connector
Database Migration Tool
Lombok
Security
OAuth
Actuator
```

필요성이 발생하면 후속 Task에서 Gate C를 통해 별도로 검토한다.

### 상태

```text
Human Approved
```

---

## DEC-017 Initial GitHub Actions CI

### 결정

TASK-003 Initial GitHub Actions CI 구현 전 Gate C Human Review를 통해
초기 CI Workflow 구성을 다음과 같이 승인한다.

검토 근거는 `prompts/11-TASK-003-CI-GATE-C-REVIEW.md`를 따른다.

### Workflow

```text
Workflow file: .github/workflows/ci.yml
Runner: ubuntu-latest
Trigger: push to main + pull_request to main
Job 구조: frontend / backend 분리
Permissions: contents: read
```

### GitHub Actions

```text
actions/checkout@v7
actions/setup-node@v7
actions/setup-java@v6
gradle/actions/setup-gradle@v6
```

공식 GitHub Action만 사용한다.
Action은 Major Version Tag로 지정한다.

### Frontend Job

```text
Node.js 24.21.0 (actions/setup-node, package-manager-cache: false)
npm ci
npm test
npm run build
```

- `working-directory`는 `frontend`를 사용한다.

### Backend Job

```text
Java 21 (actions/setup-java, distribution: temurin)
gradle/actions/setup-gradle@v6 (cache-disabled: true)
./gradlew test
./gradlew build
```

- `working-directory`는 `backend`를 사용한다.
- Repository의 Gradle Wrapper를 사용하며 System Gradle을 별도로 설치하지 않는다.
- `gradle/actions/setup-gradle`은 Gradle Wrapper jar 검증(`validate-wrappers` 기본값 `true`)을 위해 사용한다.
- `cache-disabled: true`로 Gradle cache를 사용하지 않는다.
- `backend/gradlew`는 Git에서 executable bit `100755`로 추적되므로 `chmod +x` step은 추가하지 않는다.

### Cache 정책

- 초기 CI에서는 npm cache와 Gradle cache를 모두 사용하지 않는다.
- CI 실행 시간이 문제로 확인되면 Gate C에서 Cache 도입을 별도로 검토한다.

### Verification 범위

- TASK-002 Local Verification과 동일한 Frontend Test / Build, Backend Test / Build만 수행한다.
- CI만의 별도 Feature Test, E2E Test, Lint, Deploy는 추가하지 않는다.
- `continue-on-error: true`를 사용하지 않으며 실패를 숨기지 않는다.

### Database 정책

- DEC-009에 따라 초기 CI에서 MySQL Service Container를 사용하지 않는다.
- Database Integration Test가 필요해지면 Gate C에서 Test DB 전략을 별도로 검토한다.

### 상태

```text
Human Approved
```

---

## DEC-018 GitHub Milestone 자동 Close

### 결정

`docs/07-TASKS.md`에서 DONE 상태가 된 Task의 GitHub Milestone을
GitHub Actions로 자동 Close한다.

TASK-012 GitHub Actions Bot 범위 중 Milestone 상태 동기화만 먼저 도입하는 것을 Gate C Human Review로 승인한다.

### Workflow

```text
Workflow file: .github/workflows/milestones.yml
Trigger:
  - push to main (docs/07-TASKS.md 또는 milestones.yml 변경 시)
  - workflow_dispatch (수동 실행)
Runner: ubuntu-latest
Permissions: contents: read, issues: write
Actions: actions/checkout@v7
Token: GitHub 제공 github.token (별도 Secret 없음)
Tool: Runner 기본 설치 gh CLI (새 Action 추가 없음)
```

### 동작 규칙

- Source of Truth는 `docs/07-TASKS.md`의 전체 Task 목록 표이다.
- `TASK-00N`과 `Milestone N`은 1:1로 대응한다.
- 상태가 `DONE`인 Task의 Milestone 중 열려 있는 Milestone만 Close한다.
- Milestone은 제목이 `Milestone N:`으로 시작하는 것으로 식별한다.
- DONE이 아닌 상태로 되돌아간 Task의 Milestone을 다시 Open하지 않는다.
- Milestone 생성은 이 Workflow의 범위가 아니며 `scripts/create-milestones.js`로 수행한다.

### 범위 제한

- Source Code, 문서, Git History를 수정하지 않는다.
- 기존 `.github/workflows/ci.yml`의 동작과 권한(`contents: read`)은 변경하지 않는다.
- Issue / PR Comment, Label, Release 등 다른 GitHub 자동화는 TASK-012에서 Gate C로 별도 검토한다.

### 상태

```text
Human Approved
```

---

## DEC-019 TASK-006 Persistence Dependency / DB Schema

변경 이력: 2026-10-04 TASK-042 Human 승인 / DEC-033에 따라 단일 사용자 기준을 소셜 사용자별 기록과 공유 체험 계정으로 확장한다. 기존 기록은 체험 사용자로 연결하고 V3로 사용자 / Session 구조를 추가한다.

### 결정

TASK-006 Backend Domain / API Core 구현을 위해 다음 Persistence 구성과 DB Schema를 Gate C Human Review로 승인한다.

### Persistence

- Spring Data JPA를 사용한다.
- Schema 관리는 Flyway를 사용한다.
- Hibernate는 `ddl-auto=validate`를 사용한다.
- 초기 Schema는 `V1__create_checkin_tables.sql`로 관리한다.

### Test DB

- Test DB는 H2 In-memory를 사용한다.
- H2는 Test 전용으로 사용한다.
- H2는 MySQL Compatibility Mode로 실행한다.
- CI에는 MySQL Service Container를 추가하지 않는다.
- 실제 MySQL 또는 Testcontainers 기반 검증은 TASK-011에서 재검토한다.

### Dependency

다음 Dependency를 추가한다.

```text
implementation      org.springframework.boot:spring-boot-starter-data-jpa
implementation      org.springframework.boot:spring-boot-starter-flyway
runtimeOnly         org.flywaydb:flyway-mysql
runtimeOnly         com.mysql:mysql-connector-j
testRuntimeOnly     com.h2database:h2
testImplementation  org.springframework.boot:spring-boot-starter-data-jpa-test
```

Version은 직접 지정하지 않고 Spring Boot `4.1.1` Dependency Management를 사용한다.

### Recommendation Persistence

- Food / Music Recommendation은 독립 Aggregate로 만들지 않는다.
- `@ElementCollection`을 사용한다.
- `@Embeddable` Value Type을 사용한다.
- `@OrderColumn(position)`으로 순서를 유지한다.
  - `0` = Mood Item
  - `1` = Context Item
- Recommendation 전용 Repository를 만들지 않는다.

### DB Schema

다음 3개 Table 구조를 승인한다.

```text
wellness_checkin
checkin_food_recommendation
checkin_music_recommendation
```

Core MVP는 단일 사용자 구조를 유지하므로 `user_id`는 추가하지 않는다.

### recorded_at

- DB Column은 MySQL `DATETIME(6)`를 사용한다.
- Java와 API의 기준 타입은 `Instant`를 유지한다.
- DB에는 UTC 기준 값으로 저장한다.
- `Instant`와 UTC `LocalDateTime` 변환을 명시적으로 수행한다.
- JVM / OS 기본 Timezone에 의존하지 않는다.
- Repository Test에서 `Instant` round-trip을 검증한다.
- 저장 precision은 `DATETIME(6)`에 맞춘다.

### History

- History 조회는 최근 `days × 24시간` Rolling Window를 사용한다.
- 기본값은 `days=7`이다.
- 허용 범위는 `1~30`을 유지한다.
- 응답 정렬은 `recorded_at ASC`이며 오래된 기록에서 최신 기록 순으로 반환한다.

### Temperature

- API에서는 소수 첫째 자리까지만 허용한다.
- Java 타입은 `BigDecimal`을 유지한다.
- Request Validation에 `@Digits(integer = 2, fraction = 1)`을 적용한다.
- 기존 `-30.0 ~ 50.0` 범위를 유지한다.
- DB Column은 `DECIMAL(3,1)`을 사용한다.

### Clock

- 저장 시각은 서버가 결정한다.
- `java.time.Clock`을 주입 가능하게 구성한다.
- Test에서는 Fixed Clock을 사용할 수 있게 한다.

### Local Verification / CI

- 기존 `scripts/verify.ps1`와 `scripts/verify.sh`는 변경하지 않는다.
- 기존 `.github/workflows/ci.yml`은 변경하지 않는다.
- H2를 이용한 Persistence Test는 기존 `gradlew test`에 포함한다.

### 변경 이력

- 2026-10-04 (TASK-036, Human 승인): Migration `V2`로 추천 음악에 영상 ID Column(nullable)을 추가했다. 이전 기록은 값이 없다.

### 상태

```text
Human Approved
```

---

## DEC-020 History 추천 이력 요약 필드

### 결정

TASK-010 History / Trend의 "추천 이력 요약"을 위해
`GET /api/check-ins/history` 응답 항목에 추천 이름 필드를 추가한다.

TASK-010 실행 시 확인된 문서 충돌을 Gate C Human Review로 결정했다.

- `docs/07-TASKS.md`, `docs/06-PLAN.md`, `docs/03-UX_UI_SPEC.md`: History 산출물에 "추천 이력 요약" 포함
- `docs/05-API_SPEC.md` 6절(변경 전): History는 최소 정보만 반환, 상세 Recommendation은 최신 또는 상세 조회에서 처리 (상세 조회 API는 명세에 없음)

검토한 선택지와 결과는 `prompts/21-TASK-010-HISTORY-TREND.md`를 따른다. (A안 채택)

### 추가 필드

```text
foodNames   : string[]  추천 음식 이름 (Mood Item, Context Item 순서)
musicTitles : string[]  추천 음악 제목 (Mood Item, Context Item 순서)
```

### 규칙

- 기존 History 응답 필드는 변경하지 않는다. (필드 추가만, 하위 호환)
- 추천 이름만 포함하며 Tag / 이유 / Artist는 포함하지 않는다. 상세 정보는 최신 조회에서 제공한다.
- 값은 Check-in 생성 시 저장된 추천(DEC-019 `checkin_food_recommendation`, `checkin_music_recommendation`)을 그대로 사용한다.
- DB Schema, Flyway Migration은 변경하지 않는다.
- History 조회 시 추천을 함께 조회해 기록마다 추가 Query가 발생하지 않도록 한다. (N+1 방지)
- Frontend에서 추천을 다시 계산하지 않는다.

### 상태

```text
Human Approved
```

---

## DEC-021 TASK-012 GitHub Actions Bot

### 결정

TASK-012 GitHub Actions Bot의 초기 범위를 Gate C Human Review를 통해 다음과 같이 확정한다.

검토 근거는 `prompts/23-TASK-012-GITHUB-ACTIONS-BOT-GATE-C-REVIEW.md`를 따른다. (Option A + B 채택)

### 범위

- DEC-018 Milestone 자동 Close(`.github/workflows/milestones.yml`)를 기존 Bot 자동화로 유지한다. (변경 없음)
- `.github/workflows/ci.yml`의 `frontend` / `backend` Job에 GitHub Actions Step Summary(`GITHUB_STEP_SUMMARY`) 작성 Step을 추가한다.
- Step Summary에는 다음을 기록한다.
  - Frontend Test / Build 결과
  - Backend Test / Build 결과
  - 실행 Commit SHA
  - Workflow Run URL
  - MySQL Service Container 미사용

### 실패 시 기록 규칙 (Human Review 보완)

- Summary Step은 `if: always()`로 실행해 Test / Build가 실패한 경우에도 결과를 기록한다.
- 각 Test / Build Step의 실제 결과(`steps.<id>.outcome`)를 그대로 기록한다. (success / failure / skipped 등)
- Summary Step은 Job의 성공 / 실패 판정을 바꾸지 않는다. 실패를 숨기지 않으며 `continue-on-error: true`를 사용하지 않는다.

### 유지 / 제외

- Trigger: 기존 CI의 `push` / `pull_request` to `main` 유지. `workflow_dispatch`, `issue_comment`, `pull_request_target`, `schedule`은 추가하지 않는다.
- Permissions: `contents: read` 유지. 권한을 확대하지 않는다.
- 기존 Test / Build Command, Cache, MySQL 정책(DEC-009, DEC-017)은 변경하지 않는다.
- 추가 GitHub Action(`actions/github-script` 등), 새로운 npm / Gradle Dependency, 외부 Secret / PAT를 사용하지 않는다.
- 제외: Source Code / 문서 자동 수정, 자동 Commit / Push / Pull Request, PR Review / 병합, Release, Label, Issue 생성, PR / Issue Comment, 외부 서비스 알림 (DEC-013)
- PR Comment Bot은 현재 Repository가 Pull Request 없이 `main` 직접 Push로 운영되므로 초기 범위에서 효과가 없어 제외한다.
- Local Verification(`scripts/verify.ps1`, `scripts/verify.sh`)은 변경하지 않는다.

### 검증

- Remote CI에서 성공 경로의 Summary 기록을 확인한다.
- 실패 경로의 Summary 기록 방식을 확인한다. (`if: always()`와 Step outcome 사용)
- Remote CI 결과 확인 후 TASK-012를 REVIEW로 전환한다.

### 변경 이력

- 2026-10-02 (TASK-022 Gate C, Human 승인): `ci.yml` 범위를 다음과 같이 확장했다. Trigger / `contents: read` / Test·Build Command / Cache / MySQL 정책은 그대로 유지한다.
  - Job `timeout-minutes: 20`, PR 번호 또는 ref 기준 `concurrency`(`cancel-in-progress: false`)
  - Step Summary에 Task ID / PR 링크 / Head SHA 추가. PR 입력(head ref 등)은 env로만 전달하고 `pull_request_target`는 사용하지 않는다. CI는 AI Review를 실행하거나 재판정하지 않는다.
- 2026-10-02 (TASK-022 Gate C, Human 승인): 제외 항목이던 **PR Comment 중 PR 상태 Comment를 허용**한다. 주체는 Workflow가 아니라 로컬 Orchestrator(`scripts/orchestrator/pr-gate.mjs`)이며, Human이 로그인한 기존 `gh`로 실패 / 취소 / Timeout 상태를 고정 형식으로 기존 PR에 기록한다(로컬 redacted Audit 보존). Workflow 권한 확대 / 새 Secret / PAT는 없다. Label / Comment / PR Approve는 Gate 또는 완료 승인으로 사용하지 않는다.
- 2026-10-02 (TASK-022 Gate C, Human 승인): Ruleset `main-protection`의 Required Status Checks(`frontend` / `backend`)에 strict 정책을 적용했다. PR Branch가 최신 main 기준으로 CI를 통과해야 Merge할 수 있다.
- 2026-10-04 (TASK-029 Gate C, Human 승인, DEC-032): "추가 Action 미사용" 정책은 Staging CD에 한해 AWS 공식 `configure-aws-credentials` / `amazon-ecr-login` 두 개를 Commit SHA로 고정해 쓰는 것을 허용한다. 기존 CI Workflow는 변경하지 않고 CD에도 Step Summary를 사용한다.

### 상태

```text
Human Approved
```

---

## DEC-022 Frontend 날짜 / 시각 표시 Timezone

### 결정

TASK-015 Human Review에서 Frontend 화면의 날짜 / 시각 표시 기준 Timezone을 `Asia/Seoul`로 고정한다. (A안)

```text
Display Timezone = Asia/Seoul
```

### 범위

- `frontend/src/utils/dateTime.ts`의 `MOODFIT_TIME_ZONE`을 표시 기준으로 사용한다.
- 대상: Header 오늘 날짜, Check-in 결과 기록 시각, Dashboard 최신 기록 시각, History 기록 목록 날짜 / 시각, History Trend 축 Label
- 사용자 브라우저 / OS Timezone과 관계없이 같은 시각을 같은 문자열로 표시한다.
- 표시 형식(`ko-KR` Locale, 기존 표시 Option)은 변경하지 않는다. 한국 Timezone 환경에서는 이전과 같은 문자열이 표시된다.

### 유지

- Backend 저장 / API 응답 시각은 DEC-019에 따라 UTC Instant를 유지한다.
- History 조회 기간은 DEC-004 / DEC-019의 Rolling Window(`days × 24h`)를 유지한다. 표시 Timezone 결정은 조회 범위를 바꾸지 않는다.

### 검증

- 날짜 경계값(`2026-09-30T15:30:00Z` → `10월 1일 오전 12:30`)을 Frontend Test로 검증한다.
- Vitest 실행 Timezone을 `UTC`로 고정(`vite.config.ts`의 `test.env.TZ`)해, 표시 Timezone과 실행 Timezone이 항상 달라지도록 한다. 이로써 Local(KST)과 CI(UTC) 모두에서 Timezone 의존 회귀를 발견한다.

### 대안 (채택하지 않음)

- B안: 사용자 브라우저 Timezone 표시를 유지하고 Test 실행 Timezone만 고정한다. 해외 사용자에게 현지 시각을 보여줄 수 있지만, 한국 사용자 대상 서비스에서 표시 일관성을 우선해 채택하지 않았다.

### 상태

```text
Human Approved
```

---

## DEC-023 TASK-016 DB 연동 테스트 / CI Database Strategy

### 결정

TASK-016 DB 연동 테스트(실제 MySQL)를 Gate C Human Review를 통해 다음과 같이 확정한다.
검토 근거는 `prompts/29-TASK-016-DB-INTEGRATION-TEST-GATE-C-REVIEW.md`를 따른다. (Option A 채택)

이 결정은 DEC-009(CI Database Strategy)를 대체한다.

### DB 연동 방식

- Testcontainers MySQL을 사용한다.
- MySQL Image는 `mysql:8.0.46`으로 고정한다. (Local 개발 MySQL과 동일 Version)
- 기존 H2 In-memory Test는 유지한다. MySQL 연동 Test Class를 별도로 추가하고 `@ServiceConnection`으로 연결한다.

### Test Dependency

`testImplementation`으로 추가하며, Version은 Spring Boot `4.1.1` BOM 관리 Version을 사용한다.

```text
org.springframework.boot:spring-boot-testcontainers   (4.1.1)
org.testcontainers:testcontainers-junit-jupiter       (2.0.5)
org.testcontainers:testcontainers-mysql               (2.0.5)
```

### 실행 정책

- MySQL 연동 Test는 `./gradlew test`에 포함한다. (`verify.ps1` / `verify.sh`, CI 실행 명령 변경 없음)
- Docker가 없는 Local 환경에서는 MySQL 연동 Test를 건너뛰고(Skipped) 결과에 표시한다.
- CI(`CI=true`)에서는 Docker가 없으면 건너뛰지 않고 실패한다.

### CI

- `ci.yml`의 Trigger / Permission / Cache 정책 / 실행 명령은 변경하지 않는다.
- GitHub Actions Ubuntu Runner의 기본 Docker를 사용한다. MySQL Service Container는 사용하지 않는다.
- DEC-021 Backend Step Summary의 "MySQL Service Container 미사용" 문구를 "MySQL: Testcontainers(`mysql:8.0.46`)"로 변경한다. (문구 변경만, Human 승인)

### 유지

- DB Schema / Flyway Migration 변경 없음 (DEC-019 재검토 결과 변경 없음)
- 운영 DB 설정(`application.properties`) 변경 없음
- Secret / PAT 사용 없음

### 상태

```text
Human Approved
```

---

### 변경 이력

- 2026-10-03: TASK-033 Gate C 사전 승인(DEC-030)으로 Testcontainers / CI Summary / Container Smoke의 현재 Image를 `mysql:8.4.11`로 고정한다. 위 `8.0.46` 서술은 TASK-016 승인 당시 기록이다. 개발 PC의 설치 MySQL 8.0 서비스는 Agent가 변경하지 않는다. Dependency / 운영 Code / Migration은 유지하며 실제 호환성은 Orchestrator Verify로 판정한다.

---

## DEC-024 TASK-017 API 계약 테스트

### 결정

TASK-017 API 계약 테스트(Frontend / Backend)를 Gate C Human Review를 통해 다음과 같이 확정한다.
검토 근거는 `prompts/31-TASK-017-API-CONTRACT-TEST-GATE-C-REVIEW.md`를 따른다. (Option A 채택)

### 계약 정의

- 공유 계약 예시 JSON(Contract Fixture)을 Repository Root `contracts/`에 둔다.
- 계약 대상: Check-in 생성(201), 최신 조회(200 / 404 `CHECKIN_NOT_FOUND`), History 조회(200), 입력 오류(400 `VALIDATION_ERROR`)
- 계약 파일은 현재 API 동작을 그대로 고정한다. API 형식은 변경하지 않는다.

### 검증 방식

- Backend: 고정 시계 / 고정 입력으로 실제 API를 호출해 응답 전체를 계약 파일과 비교한다. 필드 누락 / 추가 / 이름 / 값이 다르면 실패한다. DB가 정하는 `id`는 숫자인지만 확인한다.
- Frontend: 계약 파일과 `frontend/src/types/api.ts` Type의 필드 구성이 같은지 TypeScript로 검사한다. (`npm run build`의 `tsc --noEmit`)
- Frontend 화면 Test(`CheckinPage` / `DashboardPage` / `HistoryPage`)의 가짜 응답을 계약 파일로 교체한다.
- `docs/05-API_SPEC.md`의 Response 예시가 계약 파일과 같은지 확인하는 Test를 둔다.

### 유지

- 새로운 Dependency 없음 (`package.json` / `build.gradle` 변경 없음)
- `ci.yml`, `scripts/verify.ps1`, `scripts/verify.sh` 실행 명령 변경 없음
- JSON Schema / OpenAPI / Pact / E2E는 도입하지 않는다. (필요 시 별도 Gate C)

### 변경 이력

- 2026-10-04 (TASK-036, Human 승인): API 계약 예시를 추천 5개와 음악 항목의 `videoId`(없으면 null) 형식으로 갱신했다. 계약 Test와 Staging Smoke가 같은 예시를 기준으로 한다.

### 상태

```text
Human Approved
```

---

## DEC-025 Version / Tag / Release 규칙

### 결정

MoodFit v3의 Version, Git Tag, GitHub Release 규칙을 다음과 같이 정한다. (2026-10-02 Human Approved)

### Version

- 형식: Semantic Versioning `vMAJOR.MINOR.PATCH`
- MAJOR는 프로젝트 세대(MoodFit v3)와 맞춰 `3`으로 시작한다.
- MINOR: 기능 추가 또는 사용자에게 보이는 동작 변경 (예: 날씨 API 연동 → `v3.1.0`)
- PATCH: 버그 수정, 문서 / 검증 / CI 보완처럼 기능이 바뀌지 않는 변경 (예: FU-6 Runner 대응 → `v3.0.1`)
- 정식 Release 전 기준점은 Pre-release 접미사(`-mvp`, `-rc.1` 등)를 사용한다.

### 최초 Tag

| Tag | Commit | 의미 | Release |
|---|---|---|---|
| `v3.0.0-mvp` | `84b21b8` | Core MVP 완료 (TASK-001 ~ TASK-012 DONE) | 만들지 않음 (기준점 표시) |
| `v3.0.0` | DEC-025 반영 Commit | Core MVP + Post-MVP 보완 완료 (TASK-001 ~ TASK-017 DONE), README 소개 개편 포함 | GitHub Release 작성 |

### Tag / Release 규칙

- Tag는 Annotated Tag로 만든다. (작성자 / 날짜 / 메시지 포함)
- Tag는 `main`에서 Local Verification과 Remote CI가 성공한 Commit에만 붙인다.
- 이미 push한 Tag는 옮기거나 지우지 않는다. 잘못된 경우 다음 PATCH Version으로 바로잡는다.
- Release 노트는 `docs/releases/<tag>.md`에 작성하고, GitHub Release 본문에 같은 내용을 사용한다.
- Tag push와 GitHub Release 생성은 Human 확인 후 진행한다.

### 상태

```text
Human Approved
```

---

## DEC-026 Multi-Agent Automation Policy

### 결정

TASK-018 A단계의 Multi-Agent Automation Policy를 Human Approved 정책으로 기록한다 (2026-10-02).
상세 확정 정책과 Human Decision Matrix는 `docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md`를 따른다. Human은 모든 항목을 권장안대로 승인했다.

### 범위

- Codex / Claude / Orchestrator / Human 권한과 금지, API Key 없는 로컬 CLI, Sandbox / CLI Version을 다룬다.
- Human Gate / 승인 채널, 로그인 / Profile, Secret / Log, Git / PR / Auto Merge의 단계별 권한을 정의한다.
- Branch / PR / Squash Merge 전략: TASK-018부터 Task 하나 = Branch 하나 = PR 하나, main 직접 Push 금지 / Branch Ruleset 보호, Remote CI(frontend / backend) 통과 후 Squash Merge로 main에 Task당 Commit 1개를 남긴다.
- 승인 채널: Task 완료 승인은 Human의 PR Squash Merge이며 Agent / Orchestrator는 Merge하지 않는다. Required approvals 0 / Required status checks로 CI를 강제하고 Auto Merge는 비활성으로 유지한다.
- Review Loop(MAX_REVIEW_CYCLES=3), Deterministic Verification / AI Review의 역할, Staging / Production 및 DEC-025 Release / Tag 관계를 정의한다.
- Bootstrap은 Claude 세션의 임시 Orchestrator 예외이며 Script 구현은 승인 후 B단계에서 수행한다.

- Windows Codex Sandbox: `unelevated` 시작 (사전 검증 완료, 추가 설정 없음), `elevated` 전환은 TASK-020에서 검증 후 재결정한다.
- GitHub 설정 적용: Human 승인 후 Claude 세션이 2026-10-02 Squash Merge 전용 / PR 제목·본문 사용 / Head Branch 자동 삭제와 Active `main-protection`(기본 Branch, Bypass 없음, 삭제·Force Push 금지, Linear History, PR 필수 / Required approvals 0 / Squash만 허용, Required status checks `frontend` / `backend`)을 적용했다. Bypass 미설정 이유와 긴급 대응은 정책 7절을 따른다.

### 유지

- DEC-026 승인과 D단계 AGENTS.md 반영 전에는 기존 AGENTS.md / Gate A / B / C와 승인된 DEC-001 ~ DEC-025를 유지한다.
- DEC-021의 GitHub Actions Bot 범위 / CI 권한은 변경하지 않는다. Git 자동화는 TASK-021의 별도 승인 / 구현 대상이다.
- 이번 실행은 A단계 문서 작성만 수행한다. Source / Dependency / Workflow / Branch / Commit / Push 작업은 수행하지 않는다.
- TASK-018은 IN_PROGRESS이며 B / C / D단계와 최종 Human Review 전에는 DONE으로 처리하지 않는다.

### 변경 이력

- 2026-10-02: Reviewer(Claude) PASS(Review 2회차) 후 Human이 모든 Matrix 항목을 권장안대로 승인했다. Sandbox는 `unelevated`로 확정하고 `elevated` 전환은 TASK-020에서 검증 후 재결정한다. GitHub 설정 적용 기록을 반영했다. A단계 Commit / Push / Draft PR 생성은 승인되었으며 Claude 세션이 수행한다.
- 2026-10-02: TASK-020 Review 4회차 PASS 후 Human 결정 A로 Windows Sandbox를 `elevated`로 전환했다. Claude 세션의 임시 Git Repo / codex 0.160.0 재검증에서 파일 쓰기와 `node --version`은 두 모드 모두 성공했으나 Node 자식 Process(`spawnSync(process.execPath, ['--version'])`)는 unelevated에서 EPERM, elevated에서 `child: 0 v24.21.0`으로 성공했다. 이번 elevated 실행은 UAC 확인 창 없이 진행됐다. Sandbox 밖 경로 접근 시도는 UnauthorizedAccessException으로 격리됐으며 작업은 성공했다. 설정은 elevated / unelevated만 허용하고 기본값은 elevated다. Orchestrator Verify가 검증 기준이며 Executor 자체 Test는 참고다.
- 2026-10-02: TASK-021 첫 실행 Gate에서 Human이 Git 자동화 범위와 (b) 자동 실행을 승인했다. TASK-022 ~ TASK-031은 승인된 task Branch에서 Deterministic Verification 성공, Executor DONE, Claude PASS, 미해결 Gate 없음 이후 Orchestrator가 개별 Allowlist Stage / Commit / Push / Draft PR 생성까지 자동 수행한다. 기존 Commit / Push 개별 Human 승인 규칙을 이 범위에서 대체한다. main Push / Force Push / History Rewrite / Merge / Auto Merge는 금지한다. Human 로그인한 기존 git / gh만 사용하고 Credential 방식 / 권한 확대는 별도 Gate다. TASK-021 자체 Git 작업은 Claude 세션 또는 Human이 수행한다. 자기 Contract 변경 금지 Guard와 Resume 한도 문서화만 포함하고 scripts/verify.* 포함 / Redaction 정밀화는 후속 Task로 남긴다.
- 2026-10-02: TASK-021 두 번째 실행의 AGENTS Guard BLOCKED 후 Human 결정 2로 `agents_sections` 예외를 승인했다. Human 승인과 Contract 문자열 절 번호 배열 명시가 모두 있을 때 해당 절 본문만 변경 가능하며 제목 변경 / 삭제와 비승인 절 변경은 BLOCKED다. TASK-021은 `["12"]`를 Claude 세션이 Contract에 추가했고 Executor 자기 Contract 변경 금지는 유지한다. 안정 Version 재실행 대신 Task Branch Workspace Rework → 동일 규격 Verify / Claude Review → Claude 세션 Commit / Push / Draft PR로 마무리하며 Human Squash Merge가 Task 승인이다.

- 2026-10-02: TASK-022 Gate C에서 Human이 권장안 A를 승인했다. Orchestrator는 Draft PR 생성 후 로컬 `gh`로 PR 상태를 조회하며(Base main / Task Branch / head SHA / PR 번호 고정), 현재 head의 `frontend` / `backend`가 모두 success일 때만 Human Review 대기로 진행한다. 조회 실패 / Timeout은 정지하고 자동 재시도하지 않는다. Changes Requested는 Rework 필요 상태로 정지하고, Human Squash Merge 확인 시에만 다음 Task 선행 조건 근거(`dependency_evidence`, `merged_by` 포함)를 기록한다. Merge / Auto Merge / 다음 Task 자동 실행 / READY 자동 승격은 하지 않는다. PR 상태 Comment 자동화와 strict Required Status Checks 적용은 DEC-021 변경 이력을 따른다. 첫 구현 Run의 Git 단계 CRLF / LF 오판(BLOCKED)은 index blob 대조로 수정했다.

- 2026-10-03: TASK-032에서 Human이 자동 Commit / Push / Draft PR 범위를 TASK-022 ~ TASK-031에서 **TASK-022 이후 Human이 Contract를 승인한 모든 Task**로 넓히는 것을 승인했다(번호 상한 제거). Verify 성공 + Executor DONE + Claude PASS + 미해결 Human Gate 없음 조건, 승인된 task Branch 제한, main Push / Force Push / History Rewrite / Merge / Auto Merge 금지는 그대로다. 같은 Task에서 자동 PR 제목을 `<TASK ID> <Task 제목>`으로, 본문을 한글 작업 설명(개요 / 주요 변경 / 검증 / Review 결과 / 후속 작업)으로 바꿨다. Executor가 Human 결정 필요를 보고해도 Reviewer가 수정 요구이면 한도 안에서 자동 Rework한 뒤 정지한다. Secret 검사 기준은 바꾸지 않았으며 오탐 감소는 TASK-034(Human 승인 허용 문구 목록)에서 다룬다.

### 상태

```text
Human Approved
```

---

## DEC-027 TASK-023 AWS Architecture / Cost Gate

### 상태

```text
Human Approved
```

2026-10-03 Human Gate 승인. 근거는 TASK-023 Task 문서의 Human 결정 Section이며 상세 비교 / Diagram / 가격 출처와 조회일 / 후속 조건은 [13-AWS-ARCHITECTURE.md](13-AWS-ARCHITECTURE.md)를 따른다.

### 확정 결정

- B Production-like, ap-northeast-2. 같은 계정 Staging부터 시작하고 환경별 VPC / Resource / Role을 분리한다. Production 생성은 TASK-030 전 별도 승인하며 계정 분리를 다시 검토한다.
- 2 AZ Public(ALB / NAT) + Private App(ECS) + Private Data(RDS), AZ별 NAT 2개, S3 Gateway Endpoint. Interface Endpoint는 초기 제외한다.
- RDS MySQL 8.4, db.t4g.small, gp3 20 GiB, Multi-AZ DB instance, Public 접근 차단 / 암호화 / 삭제 보호. 8.0은 유료 Extended Support 비용 때문에 기각했다.
- Fargate Linux x86, 0.5 vCPU / 1 GiB, Desired Count 2 / AZ 분산. JVM memory / startup은 TASK-024에서 실측한다.
- IAM Identity Center ReadOnly / Staging 범위 운영자 / Production Human 전용. TASK-025 선행 조건은 최소 권한 Staging Profile 준비와 Agent 허용 Profile 지정이다. 관리자 Profile을 Agent가 사용하지 않는다. 상세 Permission Set / GitHub OIDC / 실행 Role / 비밀 저장 정책은 TASK-025 승인 대상이다.
- Private S3 / CloudFront OAC, 동일 origin /api 및 /api/* routing, API cache 비활성화. Human 결정 2(2026-10-03)로 Domain은 `8949db.kr` 확정. CloudFront 사용자 정의 hostname의 ACM 인증서는 us-east-1, ALB 전용 origin hostname의 ACM 인증서는 ap-northeast-2에 두고 HTTPS origin을 사용한다. CloudFront origin-facing prefix list / 검증 header 보호를 유지한다. 기본 CloudFront Domain / HTTP origin은 사용하지 않는다.
- 기본 hostname은 Production `moodfit.8949db.kr`, Staging `staging.moodfit.8949db.kr`, origin은 `origin.<환경 hostname>`이다. Apex는 사용하지 않으며 TASK-026 IaC 작성 전 최종 확정한다. MoodFit 계정 Route 53 Public Hosted Zone과 ACM DNS 검증을 사용한다. Hosted Zone / 질의 비용은 견적에 포함하고 ACM 공개 인증서 비용은 TASK-026 전에 공식 확인한다.
- 앱 Log 30일 / ALB access log S3 30일 / RDS Backup 14일 / 삭제 전 final snapshot / 수동 Snapshot 30일 후 별도 삭제 승인.
- 합성 데이터만 사용한다. 실제 개인 데이터 입력과 공개 Production 운영은 인증 / 접근 제한 Task 승인 전까지 금지한다.
- 월 USD 300 / 환경, 동시 두 환경 USD 600. Budget 50 / 80 / 100% + forecast. 기본 7일 후 Human이 정리 또는 연장을 검토하며 자동 파괴적 삭제는 하지 않는다. 서울 730시간 B안 약 USD 250은 추정이며 NAT 처리 / 기타 비용을 포함한 공식 견적이 상한을 넘으면 생성 전 재승인한다.

### 유지 / 후속 조건

DEC-023(Local / Testcontainers MySQL 8.0.46)은 변경하지 않는다. 8.4로의 Local / Image / CI 변경은 별도 Decision / Gate / Task로 TASK-026 전에 승인하고 검증한다. Engine / Class / Region orderable 가용성과 미조회 서비스 단가는 승인된 Profile로 TASK-026 전에 확인한다.

Claude 세션 2026-10-03 공개 DNS / RDAP 조회 기록상 위임된 Route 53 네임서버 4개가 REFUSED를 반환하는 lame delegation이며 Hosted Zone 부재로 판단했다. TASK-026 전 사용할 계정에 Hosted Zone을 준비하고 Human이 등록 기관 네임서버를 새 값으로 변경한 뒤 DNS 응답을 확인한다. 도메인 만료일 2027-02-26 전 갱신은 Human 책임이다. DNS 복구와 후속 Task 조건은 이번 Run의 새 Human Gate가 아니며 실제 Resource 생성 승인을 대신하지 않는다.

TASK-023 DONE / TASK-024 READY를 이번 PR에 포함하며 Human Squash Merge로 완료 승인한다. 후속 Task 실행은 별도 명시 지시가 필요하다. 실제 AWS Resource / IAM 생성, IaC, Workflow 변경과 Production 배포는 이번 설계 승인의 범위가 아니다. DEC-026을 유지한다.

---

## DEC-028 TASK-024 Deployment Artifact / Container / Health Gate C

### 상태

```text
Human Approved (2026-10-03)
```

근거: TASK-024 Task 문서 Human 결정(Run 1 HUMAN_REQUIRED 후 권장안 모두 승인). 상세 구현 / 검증 경계는 [14-DEPLOYMENT-ARTIFACT.md](14-DEPLOYMENT-ARTIFACT.md)를 따른다.

### 확정 결정

- Spring Boot BOM 관리 spring-boot-starter-actuator 추가(Version 미지정), Health만 노출하고 details / components를 숨긴다.
- ALB readiness는 /actuator/health/readiness의 readinessState + db를 사용한다. DB 장애 시 503이다. ECS liveness는 /actuator/health/liveness이며 DB를 제외한다.
- Health는 DEC-024 업무 API 계약과 별도의 운영 Endpoint다. contracts / docs/05-API_SPEC.md를 변경하지 않고 Backend 회귀 Test로 live 200 / ready 200 / DB 장애 ready 503·live 200 / 상세 비노출을 고정한다.
- base는 Eclipse Temurin Java 21 JRE Jammy linux/amd64 manifest sha256:8c2dddf1bb2a8455160f4e23080059de5003eddc5cb839130b177c6be0c2cfe0으로 고정한다. Dockerfile 기본 RUNTIME_IMAGE는 repository@sha256 형식이며 mutable tag를 사용하지 않는다. 포함된 curl을 probe에 사용하고 package를 추가 설치하지 않는다. numeric UID 10001로 실행한다.
- digest 교체는 별도 PR / Human 승인으로 수행하며 자동 갱신하지 않는다.
- bootJar 파일 이름은 Version과 무관하게 app.jar로 고정한다. Dockerfile / .dockerignore는 해당 JAR만 사용한다.
- scripts/container-smoke.sh를 Orchestrator Verify에 포함한다. linux/amd64 / 전용 network / mysql:8.0.46 / 0.5 CPU / 1 GiB / read-only root / tmpfs에서 정상 probe와 DB 정지 후 readiness 503·liveness 200, non-root / .env 제외 / OCI revision을 검증한다. 무작위 일회용 DB 값은 임시 env-file로 전달하고 종료 시 정리한다.

### 승인 경계

이 결정은 TASK-024 명시 Contract의 허용 경로 확대에 대응한다. DEC-023 MySQL / DEC-024 업무 계약 / CI·CD / IAM / AWS Resource 생성 권한은 확대하지 않는다. 완료는 검증과 Review 이후 이번 PR Human Squash Merge로 확정한다.

---

## DEC-029 TASK-025 AWS Access Policy Gate

### 상태

Human Approved (2026-10-03)

Run 2 Claude PASS 설계안 docs/15-AWS-ACCESS-POLICY.md / infra/iam/ (Commit 1d56112)을 Human이 권장안대로 모두 승인했다.

- Permission Set은 MoodFitReadOnly / MoodFitStagingDeploy(Agent 허용) / MoodFitProductionAdmin(Human 전용)으로 분리한다. AWS 관리 ReadOnlyAccess를 쓰지 않는다. 기존 관리자 Profile은 Human 전용이다.
- Profile은 moodfit-readonly / moodfit-staging만 Agent 허용, moodfit-production-human은 금지한다.
- OIDC Repository / Environment subject와 audience sts.amazonaws.com을 정확히 고정하고 환경별 Role을 분리한다. wildcard는 없다.
- 단일 immutable ECR Repository에서 Staging만 Push, Production은 조회만 한다. IAM만으로 검증된 digest 선택을 강제할 수 없는 잔여 위험(N-002)을 수용하며 TASK-029 / TASK-030의 digest 검증을 필수로 한다.
- staging / production main-only, 관리자 Bypass 비활성, production Human Required Reviewer 필수. 단일 승인자로 self-review 방지는 비활성이며 잔여 위험을 수용한다.
- Permission Set 1시간, CI Role 3600초(Build 이후 취득 / 자동 재시도 금지), SSO 로그인 8시간. 감사는 CloudTrail과 로컬 Run 기록 대조, Run 기록 30일 보존이다.
- 환경별 Secrets Manager에서 ECS execution role만 DB 값을 읽는다. AWS 관리형 암호화를 사용하고 고객 관리 KMS는 초기 제외한다.
- 일반 Stack CloudFormation service role의 SourceAccount / SourceArn 동작은 TASK-026 적용 시 검증한다. 미지원이면 조건을 제거하지 않고 중단한다.
- N-003 / N-004 Parameter 이름은 RepositoryArn / AccountId로 통일한다. 전체 inline 정책의 Resource 이름 렌더링과 적용은 TASK-026 / TASK-027 Gate에서 한다.

### 변경 이력

- 2026-10-04 Human 승인 TASK-038: 첫 Staging CD의 OIDC 실패 원인은 이름 형식 Trust와 GitHub immutable subject의 불일치였다. subject를 `repo:${RepositoryOwner}@${RepositoryOwnerId}/${RepositoryName}@${RepositoryId}:environment:staging`으로 변경하며 Production은 끝이 production이다. RepositoryOwnerId / RepositoryId는 숫자만 허용하는 필수 Parameter다. 각 Role의 StringEquals 단일 값 비교, audience, 환경 분리, wildcard 금지와 기존 권한을 유지하며 이름 형식을 함께 허용하지 않는다. 실제 ID는 로컬 비추적 Parameter 파일에만 둔다. Merge 후 Human의 IAM Change Set 적용과 배포 재실행 확인이 필요하며 Production 실행 승인은 포함하지 않는다.

B단계 Human은 Permission Set 2종 / 로컬 Profile을 먼저 구성하되 초기 inline 정책은 sts:GetCallerIdentity만 둔다. 전체 IAM 정책 / OIDC Provider / Role / Environment 생성과 Network / RDS / IAM 최초 구성 권한은 후속 Task Gate에서 정한다. Executor는 실제 AWS CLI / 설정을 사용하지 않고 Preflight / Fake CLI Test를 구현한다. TASK-026 실행 전 Human 구성과 실제 Profile Preflight 확인이 필요하다. 설계 승인은 Resource 생성 / Production 실행 승인이 아니다.

---

## DEC-030 TASK-033 MySQL 8.4 Alignment

### 상태

Human Approved (2026-10-03, Gate C 사전 승인)

### 결정

- Testcontainers / CI Summary / Container Smoke는 `mysql:8.4.11` 고정 Tag를 사용한다. Test의 서버 Version 확인은 `8.4.` 계열을 확인한다.
- Claude 세션은 2026-10-03 AWS 공식 문서의 RDS 최신 minor 8.4.11 / 표준 지원 종료 2029-07-31과 Docker Hub linux/amd64 manifest 존재를 사전 확인했다. Executor가 manifest를 재조회했다는 뜻은 아니다. 근거는 [RDS MySQL versions](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/MySQL.Concepts.VersionMgmt.html)와 [Docker Hub mysql Tags](https://hub.docker.com/_/mysql/tags)다.
- DEC-023의 현재 Image 기준을 변경하고 DEC-027의 별도 Decision / Gate / Task 조건을 충족한다. DEC-027 / DEC-028의 승인 당시 8.0 서술은 이력으로 보존하며 현재 Smoke 기준에는 이 결정을 적용한다.
- CI는 Summary 표시 한 줄만 변경한다. Job / Step / 명령 / Trigger / 권한 / concurrency를 유지한다.
- 개발 PC의 MySQL 8.0 서비스는 Agent가 변경하지 않는다. Human이 선택하는 전환 방법과 주의점은 [MySQL 8.4 안내](16-MYSQL-84-ALIGNMENT.md)에 기록한다.
- Dependency / 운영 Code / Migration 변경이 필요하면 Gate C로 정지한다. 실제 호환성 판정은 전체 Test와 Container Smoke의 Orchestrator Verify이며 승인 자체가 검증 성공을 뜻하지 않는다.

---

## DEC-031 TASK-027 Application Infrastructure Gate

### 상태

Human Approved (2026-10-03, TASK-027 Contract 사전 승인 및 명시 실행 지시)

### 확정 결정

- TASK-026 문서의 Gate 결정 3을 대체한다. RDS 관리형 관리자 자격 증명 대신 Data Stack이 무작위 값을 생성하고 RDS가 동적 참조한다. 자동 교체는 구성하지 않고 자격 증명 Resource는 DeletionPolicy / UpdateReplacePolicy 모두 Retain이다. 관리자 이름은 moodfit_admin이며 실제 값은 Template / Parameter / Repository에 기록하지 않는다.
- Staging 앱은 이 관리자 계정을 사용한다. Production 전 TASK-030 Gate에서 최소 권한 앱 계정과 migration 계정을 분리한다. ECS는 시작 시에만 값을 주입하므로 수동 교체도 DB와 실행 중 Task의 정합성 검토가 필요하다.
- App Stack은 ECS / ALB / HTTPS 443 Listener / Target Group / 서울 origin 인증서·DNS / ALB access log Bucket 30일 lifecycle을 구성한다. HTTP 80은 생성하지 않는다. Foundation의 CloudFront prefix list → ALB 443 → ECS 8080 → RDS 3306 경계를 유지한다.
- CloudFront `/api`와 `/api/*`는 HTTPS-only origin / cache 비활성 / query·header·method 전달 / 오류 상태·본문 보존이다. IPv6를 유지하고 사용자 AAAA alias를 추가한다.
- Origin 검증 값은 NoEcho Parameter로 두 Stack에 동일하게 전달한다. 값은 Template / 예시 / 문서에 넣지 않는다. Listener 기본 응답 403이며 header가 일치할 때만 Target Group으로 전달한다.
- Fargate Desired Count 2 / 0.5 vCPU / 1 GiB / AZ 분산, rolling 최소 100% / 최대 200%, circuit breaker와 자동 rollback을 구성한다. Health는 ALB readiness와 Container liveness, service grace 120초다. 검증된 ECR repository digest 형식만 받는다.
- Flyway 동시 시작은 DB 잠금 근거와 startup 대기 / MySQL DDL / Schema rollback 한계를 문서화한다. 파괴적 migration은 별도 승인 대상이다.
- Human이 승인한 설정 문구 4개는 활성 Contract의 literal 목록 그대로 Template에 사용한다. 기존 IAM 조회 Statement는 수정하지 않고 Data 출력 연결만 조정한다.

### 실행 경계

이번 승인은 Template 작성과 정적 검증만 허용한다. 실제 AWS 생성 / 변경 / 비용 Resource 확대 / Production 실행 권한은 부여하지 않는다. TASK-027 DONE은 PR 구현 완료 반영이며 Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge로 확정한다. TASK-028은 BLOCKED를 유지하고 Human의 비용 승인과 Stack 생성 권한 결정 후 READY로 전환한다. 상세 입력·위험은 [17-AWS-IAC-FOUNDATION.md](17-AWS-IAC-FOUNDATION.md)를 따른다.


---

## DEC-032 TASK-029 Staging CD Gate C

후속 결정: TASK-042 인증 Gate는 아래 DEC-033에 기록한다.

### 상태

Human Approved (2026-10-04, Task Contract 사전 승인 및 명시 실행 지시)

### 확정 결정

- 같은 Repository의 CI Workflow가 main push에서 성공한 경우 workflow_run으로 자동 배포한다. 수동 실행은 main Branch에서 main 이력에 포함된 full Commit SHA를 검사해 재배포 / 롤백한다. PR / fork 배포는 금지한다.
- 최상위 contents read, staging 배포 Job만 OIDC 권한을 갖는다. Backend Test / bootJar / linux/amd64 Image Build 이후 StagingDeployRole 세션 3600초를 취득하며 재시도 / 재취득은 하지 않는다.
- ECR immutable sha Tag가 있으면 기존 digest를 재사용하고 ImageNotFoundException일 때만 Push한다. ECS는 digest로 고정한다. 현재 Task Definition의 backend Image를 바꾸고 MoodFitEnvironment staging Tag를 붙여 새 revision을 등록한다. 안정화 이후 실제 target revision과 running 2 / pending 0을 확인한다.
- 동일 Commit Frontend를 Build해 asset 먼저, HTML no-cache로 업로드한다. 삭제 동기화 없이 invalidation 완료 후 기존 staging-smoke를 실행한다. 실패는 Workflow 실패와 실패 Step Summary로 남긴다.
- staging Environment는 main-only / 승인자 없음 / 관리자 Bypass 비활성이다. Environment 생성과 네 가지 승인 Secret 등록은 Human 승인된 Claude 세션이 수행한다. 실제 값이나 AWS 응답 원문을 공유하지 않는다.
- 기존 CI와 같은 checkout / setup-node / setup-java 표기 및 AWS 공식 Action 두 개만 허용한다. AWS Action은 확인된 Commit SHA로 고정하며 근거 링크는 docs/21에 기록한다. DEC-021의 추가 Action 미사용 원칙은 이 범위에서 변경한다.
- 단일 concurrency group / cancel-in-progress false를 사용한다. ECS 배포 실패는 기존 Circuit Breaker를 따르며 Smoke / 정적 배포 실패는 자동 전체 롤백하지 않는다. 수동 이전 SHA 롤백 시 Frontend 재빌드를 허용하며 DB Migration은 되돌리지 않는다.
- Infra 변경은 CD에서 제외한다. App Stack BackendImage drift는 다음 Human Change Set에서 최신 실행 digest를 넣고 검토한다. IAM / API 권한은 DEC-029 그대로 유지한다.

### 실행 경계

설정·운영·실환경 검증은 [21-STAGING-CD.md](21-STAGING-CD.md)를 따른다. 이 승인은 Production 생성 / 배포나 권한 확대 승인이 아니다. TASK-029 DONE은 Executor 구현 완료 반영이며 실제 배포 두 번 / 롤백 경로는 Merge 이후 확인한다. TASK-030은 Production 생성 승인과 선행 기능 Task 후 READY로 전환하며 현재 BLOCKED다.

---

## DEC-033 TASK-040 날씨 자동 기본 / 지역 표시

### 상태

Human Approved (2026-10-04, Task Contract Gate 사전 승인 및 명시 실행 지시)

### 확정 결정

- Check-in은 저장된 모드가 없으면 자동 조회한다. 기존 `moodfit.autoWeather=false`는 직접 입력으로 유지한다. 사용자가 고른 모드만 저장하며 일시적인 실패는 저장된 모드를 변경하지 않는다. 위치 권한 거부는 직접 입력을 저장한다.
- BigDataCloud Client용 Reverse Geocoding API를 브라우저에서 사용한다(API Key 없음). `principalSubdivision` / `locality`의 검증된 문자열만 Check-in에 표시한다. 실패하면 지역은 현재 위치로 표시하고 날씨는 사용할 수 있다.
- TASK-035의 소수 첫째 자리 결정을 소수 둘째 자리 반올림으로 대체한다. 같은 좌표를 Open-Meteo와 BigDataCloud 두 곳에만 전송한다. 좌표와 지역 이름은 브라우저 저장소 / Backend / 로그에 남기지 않는다.
- Backend / API 계약 / DB / Dependency는 변경하지 않는다. 제출 값은 기존 기온과 날씨 종류다. 이용 조건 확인 범위와 운영 한계는 [19-LOCATION-WEATHER.md](19-LOCATION-WEATHER.md)에 기록한다.

---

## DEC-034 TASK-042 Social Login / Guest / User Scoped Data

Human Approved (2026-10-04, 제공된 Task Contract의 Gate 결정과 명시 Rework 실행 지시)

- Google / Kakao만 지원하며 Backend Authorization Code / Spring Security / HttpOnly Cookie Session을 사용한다. Session은 JDBC에 저장하고 마지막 접근부터 7일간 유지한다.
- 제공자 사용자 번호와 표시 이름만 저장한다. 이메일 / 사진 scope와 저장은 금지한다. 표시 이름 첫 글자와 기존 색 Token으로 사용자 아바타 / 로그아웃 메뉴를 제공한다.
- Check-in 저장 / 최신 / 이력은 본인 기록만 다룬다. 기존 단일 사용자 기록은 하나의 공유 체험 계정으로 이관한다. 게스트와 Smoke는 이 계정을 사용한다. 남용 방지는 범위 밖이다.
- CSRF / JSON 401·403 / Session Cookie HttpOnly·SameSite Lax·HTTPS Secure를 적용한다. Redirect는 `APP_PUBLIC_URL`과 고정 경로로 구성하며 Origin 주소를 사용하지 않는다.
- 제공자 두 값이 모두 있을 때만 Java Code로 등록한다. 미설정 환경도 시작하고 체험 로그인한다. Dependency 5개 / V3 Migration / API 계약 / Smoke 변경을 승인한다. 사용자 Column 기본값 1로 이전 Version INSERT와 호환한다.
- 실제 자격 증명은 사용하지 않으며 Secrets Manager → ECS 주입은 TASK-043에서 한다. Infra / Workflow / Production 실행 권한을 확대하지 않는다.

설계와 한계는 [22-AUTH.md](22-AUTH.md)를 따른다. 이 결정은 DEC-019의 단일 사용자 가정을 변경하며 나머지 Wellness Rule과 Check-in 응답 형식을 유지한다.

## DEC-035 TASK-043 OAuth 값 주입

- Status: Human Approved (2026-10-04, TASK-042 Gate 9번 및 TASK-043 승인 Contract).
- 환경별 OAuth Secret 하나를 Human이 생성하고 네 JSON Key의 값을 콘솔에서 직접 입력한다. Template는 Secret을 생성하지 않고 ARN만 받는다. 값과 실제 ARN / 계정 ID는 추적 파일이나 Agent 입력·로그에 기록하지 않는다.
- App / IAM의 선택적 `OAuthCredentialArn`이 비어 있으면 네 환경 변수 주입과 읽기 Statement를 생략한다. ExecutionRole만 그 ARN 하나를 읽으며 TaskRole 권한은 추가하지 않는다. Secrets Manager 기본 Key를 전제로 하며 다른 KMS Key는 추가 권한 승인이 필요하다.
- App은 필수 HTTPS origin `PublicUrl`과 기본 true인 `GuestLoginEnabled`를 환경 변수로 전달한다. 기존 DB 주입과 Health 설정을 유지한다.
- Merge 후 Human이 Secret → IAM UPDATE → 현재 실행 digest를 유지한 App UPDATE → 안정화 순서로 적용한다. CD는 현재 revision의 설정을 이어받는다. Secret 교체 후에는 Service 새 배포가 필요하다.
- 승인된 Claude 세션이 providers / Cookie Secure를 확인하고 Human이 실제 Google / Kakao 로그인을 확인한다. Production 실행 승인은 별도다. 상세 절차는 [22-AUTH.md](22-AUTH.md)를 따른다.
