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

### 현재 상태

아직 확정하지 않는다.

Backend Wellness Analysis Service 구현 전에 다음 사항을 정의해야 한다.

```text
Wellness Score 계산식

Mood 판정 기준

입력 Metric의 가중치

Weather 영향 규칙

Food Recommendation Rule

Music Recommendation Rule
```

Codex가 후보 Rule을 제안하고
Human Review를 받은 후 구현한다.

승인 전에는 분석 규칙을 임의로 구현하지 않는다.

### 상태

```text
Pending Human Approval
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
Gradle Wrapper 8.14.5
```

### Version 고정 정책

- React와 React DOM은 동일 Version으로 유지한다.
- React Router 8에서는 `react-router` `8.4.0`을 사용한다.
- `react-router-dom`은 설치하지 않는다.
- TypeScript는 Vite `8.3.1` 공식 React + TypeScript Template 기준의 `6.0.2`를 사용한다.
- `package.json`의 직접 Dependency는 Core MVP 재현성을 위해 정확한 Version으로 고정한다.
- `package-lock.json`은 Repository에 Commit한다.
- Gradle Wrapper Version은 `8.14.5`로 고정한다.
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
