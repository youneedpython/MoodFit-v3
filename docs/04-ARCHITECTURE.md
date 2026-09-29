# 04. MoodFit v3 Architecture

## 1. 목적

MoodFit v3의 Frontend, Backend, Database 책임과 목표 디렉터리 구조를 정의한다.

PLAN, Gate A, Bootstrap Dependency Gate C가 승인 완료되었다.
TASK-001 Project Bootstrap은 DONE 상태이다.
`frontend/`, `backend/` 디렉터리는 TASK-001에서 최소 Skeleton으로 생성되었다.

Spring Boot Version Re-review 결과에 따라 Backend는 Spring Boot `4.1.1` 기준으로 Bootstrap되었다.
Baseline은 Spring Framework 7, Jakarta EE 11, Tomcat 11을 따른다.

---

## 2. 전체 구조

```text
┌─────────────────────────────────┐
│ Frontend                        │
│ React + TypeScript + Vite       │
│                                 │
│ Dashboard                       │
│ Daily Check-in                  │
│ History                         │
└───────────────┬─────────────────┘
                │ REST API / JSON
                ↓
┌─────────────────────────────────┐
│ Backend                         │
│ Java 21 + Spring Boot 4.1.1     │
│                                 │
│ Controller                      │
│ Service                         │
│ Repository                      │
│ DTO / Entity                    │
└───────────────┬─────────────────┘
                │ JPA
                ↓
┌─────────────────────────────────┐
│ MySQL                           │
│                                 │
│ Wellness Check-in               │
│ Check-in scoped Recommendation  │
└─────────────────────────────────┘
```

---

## 3. Frontend 책임

Frontend는 다음 책임을 가진다.

- 사용자 입력
- Client-side Validation 보조
- API 호출
- Loading / Error / Empty 상태 관리
- Dashboard 표시
- History / Trend 표시
- Responsive UI

비즈니스 분석 규칙을 Frontend에 중복 구현하지 않는다.

---

## 4. Frontend 목표 구조

```text
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── app/
    │   ├── App.tsx
    │   └── router.tsx        # React Router 기반 화면 전환
    │
    ├── components/
    │   ├── Button/
    │   ├── Card/
    │   ├── Badge/
    │   └── MetricCard/
    │
    ├── features/
    │   ├── dashboard/
    │   ├── checkin/
    │   ├── recommendations/
    │   └── history/
    │
    ├── services/
    │   └── api.ts
    │
    ├── types/
    │
    └── styles/
        ├── tokens.css
        ├── global.css
        └── responsive.css
```

실제 세부 구조는 Bootstrap 단계에서 과도하게 세분화하지 않는다.
필요한 Feature부터 점진적으로 생성한다.

---

## 5. Backend 책임

Backend는 다음 책임을 가진다.

- Request Validation
- Wellness 상태 분석
- Wellness Score 계산
- Recommendation 생성
- Check-in 저장
- 최신 기록 조회
- History 조회
- API Error 처리

---

## 6. Backend 목표 구조

```text
backend/
├── build.gradle
├── settings.gradle
├── gradlew
├── gradlew.bat
├── gradle/
│   └── wrapper/
└── src/
    ├── main/
    │   ├── java/com/moodfit/
    │   │   ├── controller/
    │   │   ├── service/
    │   │   ├── repository/
    │   │   ├── entity/
    │   │   ├── dto/
    │   │   │   ├── request/
    │   │   │   └── response/
    │   │   ├── exception/
    │   │   └── config/
    │   └── resources/
    │
    └── test/
```

---

## 7. 핵심 Domain

초기 Domain은 과도하게 늘리지 않는다.

### WellnessCheckin

사용자가 입력한 상태와 분석 결과를 저장한다.

예상 정보:

- id
- heartRate
- respiratoryRate
- sleepScore
- stressLevel
- energyLevel
- temperature
- weather
- mood
- wellnessScore
- summary
- createdAt

### Recommendation

추천 정보는 Check-in 결과와 연결된다.

초기 MVP에서는 Recommendation을 독립적인 핵심 Aggregate로 설계하지 않는다.
음식/음악 추천은 Wellness Check-in 분석 결과에 종속된 데이터로 관리한다.
정확한 JPA Mapping 방식은 Domain 구현 전에 검토한다.

---

## 8. 분석 로직

초기 v3는 실제 ML Model을 사용하지 않는다.

```text
Input
  ↓
Rule-based Wellness Analysis
  ↓
Mood
Wellness Score
Summary
  ↓
Food / Music Recommendation
```

분석 규칙은 Test 가능한 Service에 위치해야 한다.
Controller에 직접 구현하지 않는다.

---

## 9. Data Flow

### Check-in 생성

```text
Daily Check-in UI
      ↓
POST /api/check-ins
      ↓
Controller
      ↓
Validation
      ↓
Service
      ↓
Analysis / Recommendation
      ↓
Repository
      ↓
MySQL
      ↓
Response
      ↓
Dashboard
```

### History 조회

```text
History UI
   ↓
GET /api/check-ins/history?days=7
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
MySQL
```

---

## 10. Test 전략

초기 v3부터 실제 Test를 포함한다.

### Frontend 최소 검증 대상

- Daily Check-in의 핵심 입력/제출 흐름 또는 이에 준하는 핵심 Component
- Loading / Error / Empty 중 핵심 상태 표현

Frontend Test 기술 및 Version은 `docs/09-DECISIONS.md`의 DEC-015를 따른다.
Bootstrap Support Dependency는 `docs/09-DECISIONS.md`의 DEC-016을 따른다.
추가 Test Dependency가 필요하면 Gate C를 적용한다.

### Backend 최소 검증 대상

- Wellness 분석 Service
- Recommendation 생성 Service
- Controller Request Validation 또는 API 동작

Test 코드가 없는 상태에서 `npm run build` 또는 `gradle build`만 성공하는 것을 충분한 Test로 간주하지 않는다.

---

## 11. 검증 구조

Project Bootstrap 이후 다음 검증 구조를 추가한다.

```text
scripts/
├── verify.ps1
└── verify.sh
```

예상 검증 흐름:

```text
Frontend Install / Build
        ↓
Backend Test / Build
        ↓
검증 성공
```

그 이후 GitHub Actions CI가 동일하거나 동등한 검증을 독립적으로 수행한다.

---

## 12. 환경 설정 및 Secret 관리

로컬 개발에 필요한 DB 접속 정보와 환경별 설정은 Source Code에 실제 Secret 값으로 고정하지 않는다.

- 기본 Local 개발 Port는 Frontend `5173`, Backend `8080`, MySQL `3306`을 사용한다.
- Frontend 개발 환경에서는 `/api` 요청을 `http://localhost:8080`으로 Proxy하는 방식을 우선한다.
- 민감값은 환경변수를 우선 사용한다.
- DB 접속 정보는 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 같은 환경변수로 관리한다.
- 예시 설정이 필요하면 `.env.example` 또는 안전한 예시 값을 사용한다.
- 실제 `.env` 및 개인 로컬 설정 파일은 `.gitignore` 대상이다.
- CI에서 Secret이 필요한 단계가 생기면 GitHub Secrets 사용을 검토한다.

초기 GitHub Actions CI에서는 별도의 MySQL Service Container를 실행하지 않는다.
초기 자동 Test는 Backend Unit Test, Controller Validation Test, Frontend Component Test, Frontend Build, Backend Build를 중심으로 구성한다.
Repository / Database Integration Test가 필요해지는 경우 별도의 Test DB 전략을 다시 결정한다.

---

## 13. GitHub Actions 도입 순서

GitHub Actions는 다음 순서로 도입한다.

1. Project Skeleton 및 기본 Build 확보
2. Local Verification Script 구성
3. GitHub Actions CI 구성
4. CI 성공 확인
5. Core Feature 구현 및 검증
6. GitHub Actions Bot 추가

Bot은 초기에는 Source Code를 자동 수정하지 않고 검증 결과 또는 자동화 기록을 남기는 역할부터 시작한다.
