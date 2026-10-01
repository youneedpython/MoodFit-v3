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
