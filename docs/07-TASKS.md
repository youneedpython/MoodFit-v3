# 07. MoodFit v3 Tasks

## 1. 문서 목적

이 문서는 승인된 Implementation Plan을
실제 실행 가능한 Task 단위로 관리한다.

한 번에 하나의 Task만 실행한다.

현재 Task가 완료되고 Verification과 Human Review가 끝나기 전에는
다음 Task를 시작하지 않는다.

---

## 2. Task 상태 정의

READY
→ 선행 조건이 충족되어 실행 가능한 상태

BLOCKED
→ 선행 Task 또는 Human Approval이 필요한 상태

IN_PROGRESS
→ 현재 Codex가 수행 중인 Task

REVIEW
→ 구현과 검증이 끝나 Human Review를 기다리는 상태

DONE
→ Verification과 Human Review가 완료된 상태

---

## 3. Current Task

TASK-016 — DB 연동 테스트 (실제 MySQL)

Status:

```text
IN_PROGRESS
```

TASK-001 ~ TASK-012(Core MVP)은 모두 DONE 상태이다.
TASK-011 / TASK-012에서 정리한 후속 보완 작업 후보 FU-1 ~ FU-5를 Human 지시에 따라 TASK-013 ~ TASK-017로 등록했다. (권장 순서: FU-2 → FU-5 → FU-4 → FU-3 → FU-1)
TASK-013 ~ TASK-015는 Human Review 승인으로 DONE 상태이다. (TASK-014: Gradle Wrapper `9.8.0`, DEC-015 / TASK-015: 표시 Timezone `Asia/Seoul`, DEC-022)
TASK-016은 Gate C 승인(DEC-023: Testcontainers MySQL `mysql:8.0.46`) 후 Human 지시(Docker 실행)에 따라 진행 중이다.

---

## 4. 전체 Task 목록

| Task | Milestone | 작업 | 상태 | Dependency | Human Approval |
|---|---|---|---|---|---|
| TASK-001 | Milestone 1 | Project Bootstrap | DONE | docs/06-PLAN.md Human Approved, Gate A Human Approved, DEC-015 Human Approved, DEC-016 Human Approved, Spring Boot Version Re-review Human Approved | 승인 완료 |
| TASK-002 | Milestone 2 | Initial Local Verification Harness | DONE | TASK-001 완료 (충족), Human Approval 완료, Human Review 보완 완료 | 승인 완료 |
| TASK-003 | Milestone 3 | Initial GitHub Actions CI | DONE | TASK-002 완료 (충족), Local Verification 성공 (충족), DEC-017 Human Approved | Gate C 승인 완료 |
| TASK-004 | Milestone 4 | Backend Domain / API Skeleton | DONE | TASK-001, TASK-002, TASK-003 완료 (충족), Human 실행 승인 완료, Remote CI 성공 | Gate C 조건부 |
| TASK-005 | Milestone 5 | Wellness Analysis / Recommendation Rule Approval | DONE | TASK-004 완료 (충족), Human 실행 승인 완료, DEC-014 Human Approved | Gate B 승인 완료 |
| TASK-006 | Milestone 6 | Backend Domain / API Core | DONE | TASK-004 완료 (충족), TASK-005 완료 (충족), Gate B 승인 (DEC-014), Persistence Gate C 승인 (DEC-019) | Gate C 승인 완료 |
| TASK-007 | Milestone 7 | Frontend Foundation / Design System | DONE | TASK-001, TASK-002, TASK-003 완료 (충족), Gate A 승인 (충족) | Gate C 조건부 |
| TASK-008 | Milestone 8 | Daily Check-in | DONE | TASK-006, TASK-007 완료 (충족) | Gate C 조건부 |
| TASK-009 | Milestone 9 | Dashboard | DONE | TASK-006, TASK-007, TASK-008 완료 (충족) | Gate C 조건부 |
| TASK-010 | Milestone 10 | History / Trend | DONE | TASK-006, TASK-007, TASK-009 완료 (충족) | Gate C 조건부 |
| TASK-011 | Milestone 11 | Verification Hardening | DONE | TASK-008, TASK-009, TASK-010 완료 (충족), Local Verification/CI 누적 확장 완료 (충족), Human 실행 승인 완료, Local/Remote Verification 확인 완료 | Gate C 조건부 |
| TASK-012 | Milestone 12 | GitHub Actions Bot | DONE | TASK-002, TASK-003, TASK-011 완료 (충족), Local Verification/CI 안정화 (충족), DEC-021 Human Approved | Gate C 승인 완료 |
| TASK-013 | Milestone 13 | Local Verification Environment Alignment (FU-2) | DONE | Human Approval 완료, Local / Remote Verification 완료, Human Review 승인 완료 | 승인 완료 |
| TASK-014 | Milestone 14 | Gradle Wrapper Version Review (FU-5) | DONE | TASK-013 완료 (충족), Human Approval 완료, Human 결정(B안 9.8.0), Local / Remote Verification 완료, Human Review 승인 완료 | 승인 완료 |
| TASK-015 | Milestone 15 | Timezone-fixed Date Display Test (FU-4) | DONE | TASK-014 완료 (충족), Human Approval 완료, DEC-022 Human Approved, Local / Remote Verification 완료, Human Review 승인 완료 | 승인 완료 |
| TASK-016 | Milestone 16 | DB 연동 테스트 — 실제 MySQL (FU-3) | IN_PROGRESS | TASK-015 완료 (충족), DEC-023 Human Approved | Gate C 승인 완료 |
| TASK-017 | Milestone 17 | API 계약 테스트 — Frontend / Backend (FU-1) | BLOCKED | TASK-016 완료 | Gate C 필요 |

---

## TASK-001 — Project Bootstrap

### 상태

```text
DONE
```

Spring Boot Version Re-review 승인 완료:

```text
Spring Boot 4.1.1 Human Approved
```

TASK-001은 Project Bootstrap 구현, Verification, Human Review를 완료했다.
작업 결과와 Verification 기록은 `docs/08-WORK_LOG.md`를 따른다.

### 목적

Gate A에서 승인된 기술 Version을 사용하여
Frontend와 Backend의 최소 실행 가능한 Project Skeleton을 생성한다.

Feature 구현은 포함하지 않는다.

### 선행 조건

- docs/06-PLAN.md Human Approved
- Gate A Human Approved
- docs/09-DECISIONS.md DEC-015 Human Approved
- docs/09-DECISIONS.md DEC-016 Human Approved

### 승인된 기술 Version

docs/09-DECISIONS.md DEC-015를 Source of Truth로 사용한다.

Frontend Runtime

- Node.js 24.21.0

Frontend Core

- React 19.3.0
- React DOM 19.3.0
- Vite 8.3.1
- TypeScript 6.0.2
- React Router 8.4.0

Frontend Test

- Vitest 5.0.2
- React Testing Library 16.3.3
- @testing-library/dom 10.4.2
- jsdom 30.1.1

Backend

- Java 21
- Spring Boot 4.1.1
- Gradle Wrapper 8.14.5

### 작업 범위

Frontend에서는 최소한 다음 기반을 준비하는 Task로 정의한다.

- `frontend/` Project 생성
- React + TypeScript + Vite 기반
- 승인된 Version 사용
- `react-router` 사용
- `react-router-dom` 사용 금지
- Vitest
- React Testing Library
- `@testing-library/dom`
- jsdom
- 기본 Test Script
- 기본 Build Script
- Port 5173
- `/api` Proxy 기본 설정
  - `/api` → `http://localhost:8080`

Backend에서는 최소한 다음 기반을 준비하는 Task로 정의한다.

- `backend/` Project 생성
- Java 21
- Spring Boot 4.1.1
- Gradle Wrapper 8.14.5
- 기본 Test 가능 상태
- 기본 Build 가능 상태
- Port 8080
- 실제 Secret을 포함하지 않는 설정 구조
- 외부 MySQL 연결 없이 초기 Test/Build 가능 상태

Root에서는 필요한 경우 다음을 준비하는 범위로 정의한다.

- `.env.example`
- 기존 `.gitignore` 보완

단, 실제 파일 생성은 이 Task 정의 단계에서 하지 않는다.

### 제외 범위

TASK-001에서는 다음을 하지 않는다.

- Dashboard 구현
- Daily Check-in 구현
- History 구현
- Wellness Analysis Rule 구현
- Recommendation Rule 구현
- Entity/DTO/API Core 구현
- MySQL Integration Test
- GitHub Actions 생성
- `scripts/verify.ps1` 생성
- `scripts/verify.sh` 생성
- GitHub Actions Bot 생성
- Recommendation Refresh 구현
- 인증/인가 구현

### Dependency 정책

새로운 Dependency가 필요하면 docs/09-DECISIONS.md에서 이미 승인된 Dependency인지 확인한다.

승인되지 않은 Dependency를 추가해야 하면 Gate C를 적용하고 Human Approval 전에 설치하지 않는다.

### 승인된 Bootstrap Dependency Set

다음 항목은 TASK-001 Project Bootstrap에 필요한 최소 Bootstrap Dependency / Plugin Set이다.

docs/09-DECISIONS.md DEC-016을 Source of Truth로 사용한다.

Frontend Bootstrap Support:

| Dependency / Plugin | 추천 Version | 유형 | TASK-001 필요 여부 | 이유 | Compatibility |
|---|---:|---|---|---|---|
| `@vitejs/plugin-react` | 6.1.1 | devDependency | 필요 | Vite React Template의 React Fast Refresh / JSX 변환 기반 Plugin | Vite 8.3.1 공식 React + TypeScript Template과 일치 |
| `@types/react` | 19.3.0 | devDependency | 필요 | React 19 TypeScript 타입 정의 | React 19.3.0과 Major/Minor 일치 |
| `@types/react-dom` | 19.3.0 | devDependency | 필요 | React DOM 19 TypeScript 타입 정의 | React DOM 19.3.0과 Major/Minor 일치 |
| `@types/node` | 24.13.6 | devDependency | 필요 | `vite.config.ts` 등 Node API 타입 정의 | Vite 8.3.1 공식 React + TypeScript Template과 일치, Node.js 24 계열 |

Frontend 제외 Dependency:

| Tooling / Dependency | TASK-001 포함 여부 | 이유 | 후속 검토 |
|---|---|---|---|
| `oxlint` | 제외 | Vite Template에는 포함되지만 TASK-001의 최소 Test/Build Skeleton에 필수는 아님 | Lint 정책이 필요해지는 시점에 Gate C 검토 |
| ESLint | 제외 | 초기 Skeleton Test/Build에 필수 아님 | 정적 검사 정책 확정 시 Gate C 검토 |
| Prettier | 제외 | Formatting 정책 도구이며 초기 실행 Skeleton 필수 요건 아님 | Formatting 정책 확정 시 Gate C 검토 |
| 추가 Testing Utility | 제외 | Vitest, React Testing Library, `@testing-library/dom`, jsdom으로 초기 Component Test 가능 | 구체적 테스트 요구 발생 시 Gate C 검토 |
| 추가 UI Library | 제외 | Core MVP는 자체 최소 Component로 시작 | UI Library 필요 시 Gate C 검토 |

Backend Bootstrap:

| Dependency / Plugin | 추천 Version | 유형 | TASK-001 필요 여부 | 이유 | Compatibility |
|---|---:|---|---|---|---|
| `org.springframework.boot` Gradle Plugin | 4.1.1 | Gradle plugin | 필요 | Spring Boot Application 빌드와 Boot task 제공 | DEC-015 Spring Boot 4.1.1과 일치 |
| `io.spring.dependency-management` Gradle Plugin | 1.1.7 | Gradle plugin | 필요 | Spring Boot dependency management 기반으로 Starter Version을 직접 지정하지 않게 함 | DEC-016 승인 정책과 일치 |
| `spring-boot-starter-webmvc` | Spring Boot BOM 관리 | implementation | 필요 | Spring Web MVC 기반 REST API Skeleton과 embedded web server 기반 | Spring Boot 4.1.1 Managed Dependency |
| `spring-boot-starter-validation` | Spring Boot BOM 관리 | implementation | 필요 | Request DTO Bean Validation 기반 | Spring Boot 4.1.1 Managed Dependency |
| `spring-boot-starter-webmvc-test` | Spring Boot BOM 관리 | testImplementation | 필요 | Spring MVC Test와 `spring-boot-starter-test` 포함 테스트 기반 | Spring Boot 4.1.1 Managed Dependency |

Backend 제외 Dependency:

| Dependency / Plugin | TASK-001 포함 여부 | 이유 | 후속 검토 |
|---|---|---|---|
| `spring-boot-starter-web` | 제외 | Spring Boot 4에서 deprecated이며 `spring-boot-starter-webmvc`를 사용하기로 승인됨 | Web stack 변경 필요 시 Gate C 검토 |
| `spring-boot-starter-test` | 제외 | `spring-boot-starter-webmvc-test`가 포함하므로 직접 중복 선언하지 않음 | 테스트 starter 정책 변경 필요 시 Gate C 검토 |
| Spring Data JPA | 제외 | TASK-001은 Skeleton 단계이며 Entity/Repository/Core 구현 전 | Backend Core 또는 DB 저장 구조 확정 시 Gate C 검토 |
| MySQL Connector | 제외 | 초기 Test/Build는 외부 MySQL 없이 성공해야 함 | Database Integration Test 또는 실제 DB 연결 시 Gate C 검토 |
| Database Migration Tool | 제외 | 초기 Schema/Migration 정책 미확정 | DB Schema 변경 단계에서 Gate C 검토 |
| Lombok | 제외 | 필수 아님, 교육 환경에서 명시적 코드가 더 재현 가능 | 필요성 발생 시 Gate C 검토 |
| Security | 제외 | 인증/인가는 Core MVP 제외 | 인증/인가 설계 시 Gate C 검토 |
| OAuth | 제외 | Core MVP 제외 | 인증/인가 설계 시 Gate C 검토 |
| Actuator | 제외 | 초기 Skeleton Test/Build 필수 아님 | 운영/모니터링 요구 발생 시 Gate C 검토 |

Gradle Dependency Management 정책:

- Spring Boot Gradle Plugin `4.1.1`을 사용한다.
- `io.spring.dependency-management` Plugin `1.1.7`을 사용한다.
- Spring Boot가 제공하는 dependency management를 사용한다.
- Starter Dependency에는 별도 Version을 직접 지정하지 않고 Spring Boot `4.1.1` dependency management에 맡긴다.
- 별도의 Gradle native BOM 방식은 이번 Project Bootstrap에서 사용하지 않는다.

### Test Script 정책

Frontend `npm test`는 watch mode가 아니라 CI와 Local Verification에서 종료 가능한 방식이어야 한다.

TASK-001의 기본 정책:

```text
test → vitest run
```

필요하면 별도의 watch script는 이후 Task에서 Gate C 검토 후 추가한다.

### 예상 산출물

TASK-001 실행 후 예상되는 산출물은 다음과 같다.

```text
frontend/
backend/
.env.example
docs/08-WORK_LOG.md
```

Frontend 예상 산출물:

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/src/`
- 최소 Test/Build 실행 기반

Backend 예상 산출물:

- `backend/build.gradle`
- `backend/settings.gradle`
- `backend/gradlew`
- `backend/gradlew.bat`
- `backend/gradle/wrapper/`
- `backend/src/`
- 최소 Test/Build 실행 기반

단, 실제 생성 명령이나 파일 생성은 이번 Task 정의 단계에서는 실행하지 않는다.

Work Log 예상 산출물:

- TASK-001 구현과 Verification이 완료되면 Human Review 전에 `docs/08-WORK_LOG.md`를 최초 생성한다.
- TASK-001에서 수행한 작업을 기록한다.
- Test / Build 결과를 기록한다.
- 발생한 오류와 해결 내용이 있으면 기록한다.
- TASK 상태를 REVIEW로 전환하기 전에 WORK_LOG를 갱신한다.
- 현재 시점에는 `docs/08-WORK_LOG.md`를 생성하지 않는다.

### Verification

TASK-001 완료 시 최소한 다음을 확인한다.

Frontend:

- 승인된 Version이 `package.json`과 lock file에 반영되었는가
- `package-lock.json`이 존재하는가
- `npm test`가 `vitest run`으로 종료 가능한 방식인가
- `npm run build`가 성공하는가
- React Router 8에서 `react-router`를 사용하고 있는가
- `react-router-dom`이 설치되지 않았는가
- `/api` Proxy가 `http://localhost:8080`을 대상으로 하는가
- Port 5173 설정이 유지되는가

Backend:

- Java 21 기준인가
- Spring Boot 4.1.1인가
- Gradle Wrapper 8.14.5인가
- `spring-boot-starter-webmvc`를 사용하는가
- `spring-boot-starter-web`을 사용하지 않는가
- `spring-boot-starter-validation`을 사용하는가
- `spring-boot-starter-webmvc-test`를 사용하는가
- `./gradlew test` 또는 Windows의 `gradlew.bat test`가 성공하는가
- `./gradlew build` 또는 `gradlew.bat build`가 성공하는가
- Port 8080 설정이 반영되는가
- 외부 MySQL 연결 없이 초기 Test/Build가 가능한가

Repository:

- 실제 Secret이 포함되지 않았는가
- 불필요한 build 결과물이 Git 대상에 포함되지 않았는가

### 완료 조건

TASK-001은 다음 조건을 모두 충족해야 완료할 수 있다.

- Frontend Skeleton 생성
- Backend Skeleton 생성
- 승인된 Version 사용
- Frontend Test 성공
- Frontend Build 성공
- Backend Test 성공
- Backend Build 성공
- 외부 MySQL 없이 초기 검증 성공
- Secret 미포함
- Feature 구현 미포함
- TASK-001 작업 결과가 `docs/08-WORK_LOG.md`에 기록되어 있음
- Human Review 완료

### Human Approval

TASK-001 실행 전에 Human Approval을 받아야 한다.

TASK-001 실행 승인과 완료 후 Human Review가 모두 완료되었다.

---

## TASK-002 — Initial Local Verification Harness

### 상태

```text
DONE
```

TASK-002는 Local Verification Harness 구현, Human Review 보완, 재검증, Human Review를 완료했다.
작업 결과와 Verification 기록은 `docs/08-WORK_LOG.md`를 따른다.

### 목적

Project Bootstrap 직후 반복 가능한 로컬 검증 절차를 구성한다.

### 선행 Dependency

- TASK-001 완료
- Frontend/Backend Skeleton의 기본 Test/Build 가능 상태

### 주요 산출물

- `scripts/verify.ps1`
- `scripts/verify.sh`
- Frontend Test/Build 검증 절차
- Backend Test/Build 검증 절차
- 실패 시 종료 코드 보장

### Verification

- PowerShell 검증 스크립트 실행
- Shell 검증 스크립트 실행 가능한 환경에서 실행
- Frontend Test/Build 포함 확인
- Backend Test/Build 포함 확인
- 외부 MySQL 연결 없이 실행되는지 확인

### Human Approval 또는 Gate

- TASK-002 실행 전 Human Approval 완료
- 검증 도구 추가 Dependency가 필요하면 Gate C 적용
- Database Integration Test가 필요하면 Gate C에서 Test DB 전략 승인 필요

### 완료 조건

- 로컬 검증 스크립트가 반복 실행 가능하다.
- 초기 Frontend/Backend Test/Build가 검증에 포함된다.
- 존재하지 않는 Feature Test를 실패 조건으로 강제하지 않는다.

---

## TASK-003 — Initial GitHub Actions CI

### 상태

```text
DONE
```

TASK-003은 DEC-017 기준 CI Workflow 구현, Local Verification, Remote CI Verification, Human Review를 완료했다.
작업 결과와 Verification 기록은 `docs/08-WORK_LOG.md`를 따른다.

### 목적

초기 Local Verification Harness와 동일하거나 동등한 검증을 GitHub Actions에서 수행한다.

### 선행 Dependency

- TASK-002 완료
- Local Verification 성공

### 주요 산출물

- GitHub Actions CI Workflow
- Frontend Test/Build
- Backend Test/Build
- 외부 MySQL Service Container 없는 초기 CI 구조

### Verification

- GitHub Actions 실행 결과 확인
- 초기 CI에서 MySQL Service Container를 사용하지 않는지 확인
- Local Verification과 CI 검증 범위 비교

### Human Approval 또는 Gate

- CI/CD Workflow 생성이므로 Gate C 적용
  - Gate C Human Approved: DEC-017
- DEC-017에 없는 Action, Cache, Permission, Trigger 변경이 필요하면 Gate C 재검토
- MySQL Service Container 또는 Test DB 전략 필요 시 Gate C 적용

### 완료 조건

- GitHub Actions CI가 초기 Test/Build를 정상 수행한다.
- CI 실패를 숨기지 않는다.
- 이후 Feature Task마다 CI 검증 범위를 확장할 기준이 생긴다.

---

## TASK-004 — Backend Domain / API Skeleton

### 상태

```text
DONE
```

TASK-004는 구현, Human Review 보완, Local Verification, Remote CI Verification, Human Review를 완료했다.
작업 결과와 Verification 기록은 `docs/08-WORK_LOG.md`를 따른다.

### 목적

API Contract와 Domain 경계를 먼저 잡고, Wellness Rule 구현 전에도 검증 가능한 Backend 기반을 준비한다.

### 선행 Dependency

- TASK-001 완료
- TASK-002 완료
- TASK-003 완료
- docs/05-API_SPEC.md 확인
- docs/09-DECISIONS.md 확인

### 주요 산출물

- Request / Response DTO 구조
- Controller Skeleton
- Service Interface 또는 빈 Service 구조
- Repository 구조
- Error Response 구조
- Latest Empty State `404 Not Found` 처리 구조
- History 기본 7일 / 허용 범위 1~30일 Validation 구조
- Local Verification / CI Backend 검증 범위 확장

### Verification

- Controller Validation Test 또는 API 동작 Test
- DTO와 Entity 분리 확인
- Frontend가 DB Entity 구조에 의존하지 않는지 Contract 검토
- Local Verification 실행
- CI 실행 결과 확인

### Human Approval 또는 Gate

- API Contract 변경 필요 시 Gate C 적용
- DB Schema 주요 구조 변경 필요 시 Gate C 적용
- Database Integration Test가 필요하면 Gate C 적용
- TASK-004 완료 후 TASK-005에서 Gate B 진행

### 완료 조건

- API Skeleton이 Contract와 충돌하지 않는다.
- Wellness Rule이 필요한 부분은 임시 확정 없이 보류된다.
- 추가된 Backend 검증이 Local Verification과 CI에 반영된다.

---

## TASK-005 — Wellness Analysis / Recommendation Rule Approval

### 상태

```text
DONE
```

TASK-005는 Rule 후보 제안, Gate B Human Review, Human Review 보완을 완료했다.
승인된 Rule은 `docs/09-DECISIONS.md` DEC-014에 기록했다.

### 목적

DEC-014 Wellness Analysis Rule 후보를 제안하고 Human Review를 받는다.

실제 Wellness Rule 구현은 하지 않는다.

### 선행 Dependency

- TASK-004 완료
- docs/05-API_SPEC.md 확인
- docs/09-DECISIONS.md DEC-014 확인

### 주요 산출물

- Wellness Score 계산식 후보
- Mood 판정 기준 후보
- Metric 가중치 후보
- Weather 영향 규칙 후보
- Temperature 처리 정책 후보
- Food Recommendation Rule 후보
- Music Recommendation Rule 후보
- Rule Boundary / Edge Case 후보

### Verification

- 예시 입력에 대한 예상 Mood / Score / Recommendation 검토
- Temperature 영향 범위 검토
- 테스트 가능한 경계값과 Edge Case 검토
- 의료 진단으로 오해될 수 있는 표현이 없는지 검토
- Service 구조로 테스트 가능하게 구현할 수 있는지 검토

### Human Approval 또는 Gate

- Gate B 필요
- Human Approval 전에는 Wellness Analysis Service Rule을 구현하지 않는다.
- Human Approval 전에는 Recommendation 생성 Rule을 구현하지 않는다.

### 완료 조건

- Human이 Wellness Analysis Rule, Temperature 처리 정책, Rule Boundary / Edge Case, Recommendation Rule을 승인한다.
- 승인된 Rule이 docs/09-DECISIONS.md에 기록된다.

---

## TASK-006 — Backend Domain / API Core

### 상태

```text
DONE
```

TASK-006은 구현, Human Review 보완, Local Verification, Remote CI Verification, Local MySQL 실행 확인, Human Review를 완료했다.
작업 결과와 Verification 기록은 `docs/08-WORK_LOG.md`를 따른다.
Persistence Dependency와 DB Schema는 `docs/09-DECISIONS.md` DEC-019를 Source of Truth로 사용한다.

### 목적

승인된 Rule을 기반으로 Check-in 저장, 분석, 추천 생성, 최신 조회, History 조회를 구현한다.

### 선행 Dependency

- TASK-004 완료
- TASK-005 완료
- Gate B 승인 완료

### 주요 산출물

- WellnessCheckin Entity
- Check-in 종속 Food / Music Recommendation 저장 구조
- Wellness Analysis Service
- Recommendation Service
- `POST /api/check-ins`
- `GET /api/check-ins/latest`
- `GET /api/check-ins/history?days=7`
- Backend 주요 Service Test
- Controller Validation 또는 API Test
- Local Verification / CI Backend 검증 범위 확장

### Verification

- Wellness Analysis Service Test
- Recommendation Service Test
- Rule Boundary / Edge Case Test
- Request Validation Test
- Latest Empty State `404` Test
- History `days` 허용 범위 1~30 Validation Test
- Backend Test/Build
- Local Verification 실행
- CI 실행 결과 확인

### Human Approval 또는 Gate

- DB Schema 주요 변경 필요 시 Gate C 적용
- API Contract 변경 필요 시 Gate C 적용
- Database Integration Test가 필요하면 Gate C 적용

### 완료 조건

- Backend가 Check-in 저장과 분석 결과 생성을 수행한다.
- Recommendation Refresh API는 구현하지 않는다.
- 주요 Backend Test가 존재하고 통과한다.
- 추가된 Backend 검증이 Local Verification과 CI에 반영된다.

---

## TASK-007 — Frontend Foundation / Design System

### 상태

```text
DONE
```

TASK-007은 구현, Local Verification, Remote CI Verification, Human Review를 완료했다.
작업 결과와 Verification 기록은 `docs/08-WORK_LOG.md`를 따른다.

### 목적

v1의 Dark Wellness Dashboard 방향성을 유지하면서 v3 화면 구현을 위한 공통 UI 기반을 만든다.

### 선행 Dependency

- TASK-001 완료
- TASK-002 완료
- TASK-003 완료
- Gate A 승인 완료
- docs/02-V1-REFERENCE.md 확인
- docs/03-UX_UI_SPEC.md 확인

### 주요 산출물

- React Router 기반 Route 구조
  - `/`
  - `/check-in`
  - `/history`
- 공통 Layout
- Button / Card / Badge / MetricCard 등 최소 공통 Component
- `styles/tokens.css`
- `styles/global.css`
- API Client 기본 구조
- Loading / Error / Empty 표현 패턴
- Local Verification / CI Frontend 검증 범위 확장

### Verification

- Frontend Build
- 공통 Component 렌더링 Test
- Keyboard Focus와 기본 접근성 상태 검토
- Mobile / Tablet / Desktop Layout 기본 검토
- Local Verification 실행
- CI 실행 결과 확인

### Human Approval 또는 Gate

- 새로운 UI Library 또는 외부 Dependency가 필요하면 Gate C 적용

### 완료 조건

- 주요 화면을 연결할 Frontend 기반이 준비된다.
- Hard-coded 결과를 최종 기능처럼 표시하지 않는다.
- 추가된 Frontend 검증이 Local Verification과 CI에 반영된다.

---

## TASK-008 — Daily Check-in

### 상태

```text
DONE
```

TASK-008은 구현, Human Review 보완, Local Verification, Remote CI Verification, Human 실행 확인, Human Review를 완료했다.
작업 결과와 Verification 기록은 `docs/08-WORK_LOG.md`를 따른다.

### 목적

사용자가 신체 리듬과 날씨 상태를 입력하고 Backend 분석을 요청할 수 있게 한다.

### 선행 Dependency

- TASK-006 완료
- TASK-007 완료

### 주요 산출물

- Daily Check-in 화면
- 입력 Form
- Client-side Validation 보조
- API 제출 흐름
- Submitting / Success / API Error 상태
- 완료 후 Dashboard 이동 또는 결과 요약
- Check-in 관련 Frontend Test
- Local Verification / CI 검증 범위 확장

### Verification

- Check-in Validation Test
- 제출 중 중복 Action 방지 검토
- API Error State Test
- Frontend Test/Build
- Backend 관련 Test 재실행
- Local Verification 실행
- CI 실행 결과 확인

### Human Approval 또는 Gate

- API Contract 변경 필요 시 Gate C 적용

### 완료 조건

- 사용자가 Daily Check-in을 저장할 수 있다.
- Validation Error가 필드 가까이에 표시된다.
- 저장/분석 중 중복 제출이 방지된다.
- 추가된 Feature 검증이 Local Verification과 CI에 반영된다.

---

## TASK-009 — Dashboard

### 상태

```text
DONE
```

TASK-009는 구현, Local Verification, Remote CI Verification, Human Review를 완료했다.
작업 결과와 Verification 기록은 `docs/08-WORK_LOG.md`를 따른다.

### 목적

사용자가 최신 Check-in 결과와 추천 정보를 한 화면에서 확인할 수 있게 한다.

### 선행 Dependency

- TASK-006 완료
- TASK-007 완료
- TASK-008 완료

### 주요 산출물

- Dashboard 화면
- Wellness Hero
- 5개 Body Metric Card
- Food Recommendation Card
- Music Recommendation Card
- Latest 없음 Empty State
- Loading / API Error / Retry 상태
- Dashboard 관련 Frontend Test
- Local Verification / CI 검증 범위 확장

### Verification

- Dashboard Empty State Test
- Recommendation Rendering Test
- 5개 Metric 표시 확인
- Latest `404`를 Empty State로 처리하는지 확인
- Responsive Layout 검토
- Frontend Test/Build
- Backend 관련 Test 재실행
- Local Verification 실행
- CI 실행 결과 확인

### Human Approval 또는 Gate

- API Contract 변경 필요 시 Gate C 적용
- 외부 시각화 Dependency 필요 시 Gate C 적용

### 완료 조건

- Dashboard에서 최신 분석 결과를 확인할 수 있다.
- Empty / Loading / Error 상태가 명확히 처리된다.
- 추가된 Feature 검증이 Local Verification과 CI에 반영된다.

---

## TASK-010 — History / Trend

### 상태

```text
DONE
```

TASK-010은 구현, Local Verification, Remote CI Verification, Human Review를 완료했다.
작업 결과와 Verification 기록은 `docs/08-WORK_LOG.md`를 따른다.
History 응답의 추천 이름 필드 추가는 DEC-020을 따른다.

### 목적

사용자가 최근 7일 웰니스 상태 변화와 추천 이력 요약을 확인할 수 있게 한다.

### 선행 Dependency

- TASK-006 완료
- TASK-007 완료
- TASK-009 완료

### 주요 산출물

- History 화면
- 최근 7일 Wellness Score Trend
- 날짜별 Mood
- 주요 Metric 요약
- 추천 이력 요약
- Empty State
- History / Trend 관련 Test
- Local Verification / CI 검증 범위 확장

### Verification

- History API 조회 Test
- `days` 기본값 7 / 허용 범위 1~30 Validation 확인
- Trend Component 렌더링 Test
- 외부 Chart Library가 추가되지 않았는지 확인
- Frontend Test/Build
- Backend 관련 Test 재실행
- Local Verification 실행
- CI 실행 결과 확인

### Human Approval 또는 Gate

- 외부 Chart Library 필요 시 Gate C 적용

### 완료 조건

- History에서 최근 7일 기록을 확인할 수 있다.
- Trend는 CSS 또는 SVG 기반 단순 Component로 동작한다.
- 추가된 Feature 검증이 Local Verification과 CI에 반영된다.

---

## TASK-011 — Verification Hardening

### 상태

```text
DONE
```

TASK-011은 전체 Local / Remote CI 재검증, Verification Gap 정리, Human Review 보완(GAP-1 해결), Human Review를 완료했다.
작업 결과와 Verification Gap / 후속 보완 작업 후보는 `docs/08-WORK_LOG.md`를 따른다.

### 목적

Core Feature 완료 후 전체 Frontend/Backend Test와 Build 범위를 다시 검증하고,
Local Verification과 CI가 동일하거나 동등한 품질 기준을 갖도록 정리한다.

### 선행 Dependency

- TASK-008 완료
- TASK-009 완료
- TASK-010 완료
- Local Verification 누적 확장 완료
- CI 누적 확장 완료

### 주요 산출물

- 전체 Frontend Test/Build 검증
- 전체 Backend Test/Build 검증
- Local Verification 범위 점검
- CI 범위 점검
- Core MVP 완료 전 Verification Gap 목록
- 필요 시 문서화된 보완 Task 후보

### Verification

- `scripts/verify.ps1` 실행
- `scripts/verify.sh` 실행 가능한 환경에서 실행
- GitHub Actions CI 실행 결과 확인
- Local Verification과 CI 검증 범위 비교
- 외부 MySQL 연결 없이 기본 검증이 가능한지 확인
- 실패한 Test 또는 Build를 성공 처리하지 않는지 확인

### Human Approval 또는 Gate

- 추가 검증 도구나 외부 Dependency가 필요하면 Gate C 적용
- Database Integration Test가 필요하면 Gate C 적용

### 완료 조건

- Core Feature 전체에 대한 Frontend/Backend Test와 Build가 통과한다.
- Local Verification과 CI가 Core MVP 검증 범위를 반영한다.
- 남은 Verification Gap이 명확히 기록된다.

---

## TASK-012 — GitHub Actions Bot

### 상태

```text
DONE
```

TASK-012는 DEC-021 범위의 CI Step Summary 구성, Local 확인, Remote CI Verification, Human Review를 완료했다.
작업 결과와 Verification 기록은 `docs/08-WORK_LOG.md`를 따른다.

### 목적

검증 결과나 Harness 관련 기록 자동화를 GitHub Actions Bot으로 확장한다.

### 선행 Dependency

- TASK-002 완료
- TASK-003 완료
- TASK-011 완료
- Local Verification 안정화
- CI 안정화
- Core Feature 구현 및 검증 완료

### 주요 산출물

- GitHub Actions Bot 도입 계획
- 검증 결과 또는 Harness 기록 자동화
- Source Code 자동 수정은 제외한 초기 Bot 동작

### Verification

- Bot이 Source Code를 자동 수정하지 않는지 확인
- 기록 또는 검증 결과가 의도한 위치에 남는지 확인
- Local Verification과 CI 안정 상태를 해치지 않는지 확인

### Human Approval 또는 Gate

- GitHub Actions Bot 구성은 Gate C 적용
- GitHub Milestone 자동 Close(`.github/workflows/milestones.yml`)는 DEC-018로 먼저 도입되었다. TASK-012에서는 이를 포함해 Bot 범위를 검토한다.

### 완료 조건

- Bot이 검증 결과 또는 Harness 관련 기록 자동화 역할부터 수행한다.
- Local Verification과 CI가 안정되고 Core Feature 구현/검증이 끝난 후에만 Bot을 추가한다.

---

## TASK-013 — Local Verification Environment Alignment

### 상태

```text
DONE
```

구현, Local / Remote Verification, Human Review가 완료되었다.

### 목적

Local Verification과 GitHub Actions CI의 실행 환경 차이를 줄인다. (FU-2, GAP-3 / GAP-4)

### 주요 산출물

- `scripts/verify.ps1`, `scripts/verify.sh`에 `npm ci` 단계 추가 (CI와 같은 lock file 기준 설치)
- `.nvmrc` 또는 `package.json` `engines`로 Node.js `24.21.0` 명시 (DEC-015)
- 필요 시 Local Node.js Version 불일치 안내

### Verification

- `verify.ps1`, `verify.sh` 성공 / 실패 경로 재검증
- Local Verification과 CI의 Frontend 설치 / Test / Build 단계 비교

### Human Approval 또는 Gate

- Local Verification Script 동작 변경이므로 실행 전 Human Approval 필요
- 새로운 Dependency가 필요하면 Gate C 적용

### 완료 조건

- Local Verification이 CI와 같은 방식으로 Frontend 의존성을 설치한다.
- 승인된 Node.js Version이 Repository에 명시된다.

---

## TASK-014 — Gradle Wrapper Version Review

### 상태

```text
DONE
```

Gradle Wrapper `9.8.0` 변경(Human 결정 B안), Local / Remote Verification, Human Review가 완료되었다.

### 목적

TASK-012 CI Summary에서 확인된 "Gradle version is out of date" 안내를 검토하고, Gradle Wrapper Version 유지 / 변경을 결정한다. (FU-5)

### 주요 산출물

- Gradle Wrapper `8.14.5` 유지 또는 상위 Version 전환 검토 자료 (Spring Boot 4.1.1 호환 범위: Gradle 8.14+ / 9.x)
- 변경 승인 시 Gradle Wrapper 갱신과 DEC-015 갱신

### Verification

- Backend Test / Build, Local Verification, Remote CI
- `gradle/actions/setup-gradle` Wrapper 검증 통과 확인

### Human Approval 또는 Gate

- 기술 Version 변경이므로 Human Approval 필요 (DEC-015 변경)

### 완료 조건

- Gradle Wrapper Version 결정이 DEC-015에 기록된다.
- 변경 시 Backend Test / Build와 CI가 통과한다.

---

## TASK-015 — Timezone-fixed Date Display Test

### 상태

```text
DONE
```

구현, Human Review 보완(DEC-022), Local / Remote Verification, Human Review가 완료되었다.

### 목적

화면의 날짜 / 시각 표시가 실행 환경 Timezone에 따라 달라지는 부분을 고정 Timezone 기준으로 검증한다. (FU-4, GAP-6)

### 주요 산출물

- 고정 Timezone 기준 날짜 / 시각 표시 Frontend Test

### Verification

- Frontend Test / Build, Local Verification, Remote CI

### Human Approval 또는 Gate

- 실행 전 Human Approval 필요
- 새로운 Dependency가 필요하면 Gate C 적용

### 완료 조건

- 날짜 / 시각 표시 Test가 실행 환경 Timezone과 관계없이 같은 결과를 낸다.

---

## TASK-016 — DB 연동 테스트 (실제 MySQL)

### 상태

```text
IN_PROGRESS
```

선행 Task(TASK-015)는 완료되었다. Gate C 승인 완료 (`prompts/29-TASK-016-DB-INTEGRATION-TEST-GATE-C-REVIEW.md`, DEC-023) 후 진행 중이다.

### 목적

Backend를 실제 MySQL에 연결해 Flyway Schema, 저장 / 조회 동작을 검증한다. (FU-3, GAP-5)

### 주요 산출물

- 실제 MySQL 기반 DB 연동 테스트 (예: Testcontainers)
- Local Verification / CI 반영 방식 결정 (Docker 필요 여부, 실행 시간)

### Verification

- DB 연동 테스트, Backend Test / Build, Local Verification, Remote CI

### Human Approval 또는 Gate

- 검증 도구 / Dependency 추가와 DEC-009(CI Database Strategy), DEC-019 재검토가 필요하므로 Gate C 필요

### 완료 조건

- 실제 MySQL에서 Schema 적용과 저장 / 조회가 자동 검증된다.
- CI Database Strategy 변경이 DEC로 기록된다.

---

## TASK-017 — API 계약 테스트 (Frontend / Backend)

### 상태

```text
BLOCKED
```

TASK-016 완료 후 진행한다.

### 목적

Frontend와 Backend가 약속한 API 형식(`docs/05-API_SPEC.md`)을 양쪽이 지키는지 자동 검증한다. (FU-1, GAP-2)

### 주요 산출물

- API 계약 테스트 방식 결정 (공유 예시 JSON 기반 Contract Test, Pact, E2E 중 선택)
- 선택한 방식의 계약 테스트

### Verification

- Backend 응답이 계약과 다르거나 Frontend 기대 형식이 계약과 다르면 Test가 실패하는지 확인
- Frontend / Backend Test / Build, Local Verification, Remote CI

### Human Approval 또는 Gate

- 검증 도구 / 방식 선택이 필요하므로 Gate C 필요

### 완료 조건

- API 계약 위반이 Local Verification과 CI에서 자동으로 발견된다.

---

## 5. Human Approval 필요 Task

다음 Task는 실행 전 Human Approval 또는 Gate 확인이 필요하다.

- TASK-001: Project Bootstrap 실행 전 Human Approval 완료
- TASK-002: Verification Script 생성 전 Human Approval 완료
- TASK-003: GitHub Actions CI 생성이므로 Gate C 필요
- TASK-005: Wellness Analysis Rule 확정을 위한 Gate B 필요
- TASK-006: Gate B 승인 후 실행 가능, 변경 발생 시 Gate C 필요
- TASK-007: 외부 UI Dependency 필요 시 Gate C 필요
- TASK-008: API Contract 변경 필요 시 Gate C 필요
- TASK-009: API Contract 또는 외부 시각화 Dependency 필요 시 Gate C 필요
- TASK-010: 외부 Chart Library 필요 시 Gate C 필요
- TASK-011: 추가 검증 도구 또는 Database Integration Test 필요 시 Gate C 필요
- TASK-012: GitHub Actions Bot 구성이므로 Gate C 필요
- TASK-013: Local Verification Script 동작 변경이므로 Human Approval 필요
- TASK-014: Gradle Wrapper Version 변경 시 Human Approval 필요 (DEC-015)
- TASK-015: 실행 전 Human Approval 필요
- TASK-016: DB 연동 테스트 도구와 CI Database Strategy 변경이므로 Gate C 필요
- TASK-017: API 계약 테스트 방식 / 도구 선택이므로 Gate C 필요

---

## 6. 현재 Pending Decision

현재 Core MVP 구현을 막는 Pending Decision은 없다.

DEC-014 Wellness Analysis Rule은 TASK-005 Gate B Human Review에서 Human Approved 되었으므로 Pending Decision이 아니다.
DEC-015 기술 Version은 Gate A와 Spring Boot Version Re-review에서 Human Approved 되었으므로 Pending Decision이 아니다.
DEC-016 Bootstrap Dependency Set은 Gate C와 Spring Boot Version Re-review에서 Human Approved 되었으므로 Pending Decision이 아니다.
DEC-019 Persistence Dependency / DB Schema는 TASK-006 Gate C Human Review에서 Human Approved 되었으므로 Pending Decision이 아니다.
