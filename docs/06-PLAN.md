# 06. MoodFit v3 Implementation Plan

## 1. 문서 목적

이 문서는 MoodFit v3의 구현 순서, 선행 의존성, 산출물, 검증 방법, Human Approval Gate를 정의한다.

이 문서는 구현 코드가 아니다.
이 문서가 승인되기 전에는 Frontend/Backend 프로젝트 생성, npm 또는 Gradle 초기화, 실제 기능 코드 구현, GitHub Actions 생성 또는 수정, `docs/07-TASKS.md` 생성을 수행하지 않는다.

---

## 2. 계획 원칙

- `docs/09-DECISIONS.md`에 기록된 Human Approved 결정을 우선한다.
- Recommendation Refresh는 Core MVP 계획에 포함하지 않는다.
- Core MVP는 단일 사용자 환경을 기준으로 한다.
- Dashboard Metric은 Heart Rate, Respiratory Rate, Sleep Score, Stress Level, Energy Level 5개를 기준으로 한다.
- Trend는 외부 Chart Library 없이 CSS 또는 SVG 기반 단순 Component로 시작한다.
- 기술의 정확한 Version은 Gate A에서 Human Approved 되었으며, `docs/09-DECISIONS.md`의 DEC-015를 따른다.
- Wellness Analysis Rule은 TASK-005 Gate B Human Review에서 승인되었으며, `docs/09-DECISIONS.md`의 DEC-014를 따른다.
- 초기 Local Verification과 CI는 외부 MySQL 연결 없이 실행 가능해야 한다.
- Feature가 추가될 때마다 Local Verification과 CI의 검증 범위를 함께 확장한다.
- 새로운 외부 Dependency, API Contract 변경, DB Schema 주요 변경은 구현 전 Human Approval을 받는다.

---

## 3. 전체 Milestone

```text
Milestone 0  Planning Approval
Milestone 1  Project Bootstrap
Milestone 2  Initial Local Verification Harness
Milestone 3  Initial GitHub Actions CI
Milestone 4  Backend Domain / API Skeleton
Milestone 5  Wellness Analysis / Recommendation Rule Approval
Milestone 6  Backend Domain / API Core
Milestone 7  Frontend Foundation / Design System
Milestone 8  Daily Check-in
Milestone 9  Dashboard
Milestone 10 History / Trend
Milestone 11 Verification Hardening
Milestone 12 GitHub Actions Bot

# Post-MVP 보완 (2026-10-01 Human 지시로 추가, TASK-011 / TASK-012 후속 보완 작업 후보)
Milestone 13 Local Verification Environment Alignment (FU-2)
Milestone 14 Gradle Wrapper Version Review (FU-5)
Milestone 15 Timezone-fixed Date Display Test (FU-4)
Milestone 16 DB 연동 테스트 — 실제 MySQL (FU-3)
Milestone 17 API 계약 테스트 — Frontend / Backend (FU-1)

# Agent 자동화 / AWS 배포 (2026-10-02 Human 지시로 추가)
Milestone 18 Multi-Agent Harness Bootstrap (Policy + Minimal Orchestrator)
Milestone 19 CI Runner OS Transition Hardening (FU-6)
Milestone 20 Orchestrator Hardening (worktree / Resume / Guard)
Milestone 21 Git Automation / Branch / PR Harness
Milestone 22 GitHub CI Integration / PR Gate
Milestone 23 AWS Deployment Architecture / Cost Gate
Milestone 24 Deployment Artifact / Container / Health Strategy
Milestone 25 AWS SSO / GitHub OIDC / IAM / Environment Gate
Milestone 26 AWS Infrastructure as Code Foundation
Milestone 27 AWS Application Infrastructure (ECS / ALB / RDS)
Milestone 28 Staging Deployment / Smoke Test
Milestone 29 Staging Continuous Deployment
Milestone 30 Production Continuous Deployment / Approval / Rollback
Milestone 31 Operations / Cost Guard / Cleanup / Final Hardening
```

Milestone 13 ~ 17의 상세 범위와 승인 조건은 `docs/07-TASKS.md` TASK-013 ~ TASK-017을 따른다.
Milestone 18 ~ 31의 상세 범위와 승인 조건은 `docs/07-TASKS.md` TASK-018 ~ TASK-031과 `docs/tasks/`를 따른다.

Local Verification Harness와 GitHub Actions CI를 Core Feature 구현 이후가 아니라 Project Bootstrap 직후에 배치한다.
초기에는 Frontend Test/Build와 Backend Test/Build를 최소 검증 대상으로 삼고, Feature Task가 추가될 때마다 검증 범위를 점진적으로 확장한다.

Milestone 5를 별도 단계로 둔다.
Backend Core 구현은 Wellness Score 계산식, Temperature 처리 정책, Recommendation Rule, Rule Boundary / Edge Case 승인 없이는 진행할 수 없기 때문이다.

---

## 4. Human Approval Gate

### Gate A — Project Bootstrap 승인

위치:

```text
Milestone 0 완료 후
Milestone 1 시작 전
```

승인 대상 항목:

- React Version 후보와 선택 이유
- React DOM Version 후보와 선택 이유
- Vite Version 후보와 선택 이유
- TypeScript Version 후보와 선택 이유
- Node.js Version 후보와 선택 이유
- Spring Boot Version 후보와 선택 이유
- Gradle Version 후보와 선택 이유
- React Router Version 후보와 선택 이유
- Vitest Version 후보와 선택 이유
- React Testing Library Version 후보와 선택 이유
- @testing-library/dom Version 후보와 선택 이유
- jsdom Version 후보와 선택 이유

규칙:

- Gate A는 Human Approved 되었으며, 승인된 Version은 `docs/09-DECISIONS.md`의 DEC-015에 반영되어 있다.
- Spring Boot Version Re-review 결과 Spring Boot는 `4.1.1`로 Human Approved 되었으며, Gradle Wrapper `8.14.5`는 유지한다.
- 이후 TASK-014에서 Gradle Wrapper를 `9.8.0`으로 변경했다. (DEC-015 변경 이력)
- Gate A 승인 전에는 Frontend 프로젝트를 생성하지 않는다.
- Gate A 승인 전에는 Backend 프로젝트를 생성하지 않는다.
- Gate A 승인 전에는 npm 또는 Gradle 프로젝트를 초기화하지 않는다.

### Gate B — Wellness Analysis Rule 승인

위치:

```text
Milestone 4 완료 후
Milestone 6 시작 전
```

승인 전 제안해야 할 항목:

- Wellness Score 계산식
- Mood 판정 기준
- Metric 가중치
- Weather 영향
- Temperature 처리 정책
  - Wellness Score에 영향을 주는지
  - Mood에 영향을 주는지
  - Food Recommendation에 영향을 주는지
  - Music Recommendation에 영향을 주는지
  - 또는 Core MVP에서 영향을 주지 않는지
- Food Recommendation Rule
- Music Recommendation Rule
- Rule Boundary / Edge Case
  - 각 입력값의 최소값, 최대값, 경계값
  - 결측 또는 잘못된 값 처리
  - 극단 조합 입력 시 기대 결과
  - 테스트 가능한 대표 케이스

규칙:

- Gate B는 Human Approved 되었으며, 승인된 Rule은 `docs/09-DECISIONS.md`의 DEC-014에 반영되어 있다.
- TASK-006 구현 시 Wellness Analysis Service와 Recommendation 생성 Rule은 DEC-014를 따른다.
- DEC-014와 다른 Rule이 필요하면 구현 전에 Human Approval을 다시 받는다.

### Gate C — 주요 변경 승인

위치:

```text
전체 Milestone 공통
```

승인이 필요한 변경:

- 새로운 외부 Dependency 추가
- API Contract 변경
- DB Schema 주요 구조 변경
- 기술 스택 또는 주요 버전 변경
- 인증/인가 추가
- CI/CD Workflow 동작 방식 변경
- 외부 API 또는 외부 서비스 연동 추가
- 외부 MySQL 연결이 필요한 Database Integration Test 도입
- Test DB 전략 변경

규칙:

- 변경 이유, 영향 범위, 가능한 대안을 먼저 제시한다.
- Human Approval 전에는 변경을 구현하지 않는다.
- 승인된 결정은 `docs/09-DECISIONS.md`에 기록한다.

---

## 5. Milestone 상세 계획

### Milestone 0 — Planning Approval

목적:

`docs/06-PLAN.md`를 Human Review 대상으로 제출하고 구현 착수 조건을 명확히 한다.

선행 의존성:

- `AGENTS.md`
- `docs/01-PROJECT.md`
- `docs/02-V1-REFERENCE.md`
- `docs/03-UX_UI_SPEC.md`
- `docs/04-ARCHITECTURE.md`
- `docs/05-API_SPEC.md`
- `docs/09-DECISIONS.md`

주요 산출물:

- `docs/06-PLAN.md`
- Gate A/B/C 위치 정의
- 초기 Verification 우선순위 정의

검증 방법:

- 계획이 승인된 결정과 충돌하지 않는지 문서 검토
- Recommendation Refresh가 Core MVP에 포함되지 않았는지 확인
- 기술 Version은 Gate A에서 확정되었고, Wellness Rule은 Gate B에서 확정되었는지 확인
- Local Verification과 CI가 Project Bootstrap 직후로 배치되었는지 확인

Human Approval Gate:

- Gate A 완료
- 계획 자체에 대한 Human Approval 필요

완료 조건:

- Human이 `docs/06-PLAN.md`를 승인한다.
- 다음 단계에서 Gate A 승인 결과를 기준으로 Project Bootstrap Task를 정의할 수 있다.

### Milestone 1 — Project Bootstrap

목적:

승인된 기술 Version을 기준으로 Frontend/Backend 기본 프로젝트 구조를 생성한다.

선행 의존성:

- Milestone 0 완료
- Gate A 승인 완료

주요 산출물:

- `frontend/` 기본 구조
- `backend/` 기본 구조
- Frontend 개발 서버 기본 설정
- Backend Spring Boot 기본 설정
- `.env.example` 또는 안전한 예시 설정
- 기본 Local Port 정책 반영
  - Frontend: `5173`
  - Backend: `8080`
  - MySQL: `3306`
- 외부 MySQL 없이 실행 가능한 초기 Test/Build 기반

검증 방법:

- Frontend 기본 Test/Build 가능 여부 확인
- Backend 기본 Test/Build 가능 여부 확인
- 초기 Test가 외부 MySQL 연결 없이 실행 가능한지 확인
- Secret이 Repository에 포함되지 않았는지 확인

Human Approval Gate:

- Gate A 승인 없이는 시작하지 않는다.
- 새로운 Dependency가 필요한 경우 Gate C 적용
- Database Integration Test가 필요해지는 경우 Gate C에서 Test DB 전략을 다시 승인받는다.

완료 조건:

- Frontend/Backend Skeleton이 생성된다.
- 기본 Test/Build가 가능한 상태가 된다.
- 외부 MySQL 연결 없이 초기 검증을 실행할 수 있다.
- 실제 Feature 구현은 아직 포함하지 않는다.

### Milestone 2 — Initial Local Verification Harness

목적:

Project Bootstrap 직후 반복 가능한 로컬 검증 절차를 먼저 구성한다.

선행 의존성:

- Milestone 1 완료

주요 산출물:

- `scripts/verify.ps1`
- `scripts/verify.sh`
- Frontend Test/Build 검증 절차
- Backend Test/Build 검증 절차
- 실패 시 종료 코드 보장
- 초기 검증 범위 문서화

검증 방법:

- `scripts/verify.ps1` 실행
- `scripts/verify.sh` 실행 가능한 환경에서 실행
- Frontend Test/Build 실행 확인
- Backend Test/Build 실행 확인
- 외부 MySQL 연결 없이 실행되는지 확인
- 실패한 Test 또는 Build를 성공 처리하지 않는지 확인

Human Approval Gate:

- 검증 도구 추가 Dependency가 필요하면 Gate C 적용
- Database Integration Test가 필요하면 Gate C에서 Test DB 전략을 다시 승인받는다.

완료 조건:

- 로컬 검증 스크립트가 반복 실행 가능하다.
- 초기 Frontend/Backend Test/Build가 검증에 포함된다.
- 아직 존재하지 않는 Feature Test는 실패 요구사항으로 강제하지 않고 이후 Feature Task에서 추가한다.

### Milestone 3 — Initial GitHub Actions CI

목적:

초기 Local Verification Harness가 정상 동작한 뒤 동일하거나 동등한 검증을 GitHub Actions에서 수행한다.

선행 의존성:

- Milestone 2 완료
- Initial Local Verification 성공

주요 산출물:

- GitHub Actions CI Workflow
- Frontend Test/Build
- Backend Test/Build
- 외부 MySQL Service Container 없는 초기 CI 구조

검증 방법:

- GitHub Actions 실행 결과 확인
- 초기 CI에서 MySQL Service Container를 사용하지 않는지 확인
- Local Verification과 CI 검증 범위 비교

Human Approval Gate:

- CI/CD Workflow 동작 방식 변경이므로 Gate C 적용
- MySQL Service Container 또는 별도 Test DB 전략 필요 시 Gate C 적용

완료 조건:

- GitHub Actions CI가 초기 Test/Build를 정상 수행한다.
- CI 실패를 숨기지 않는다.
- 이후 Feature Task마다 CI 검증 범위를 확장할 기준이 생긴다.

### Milestone 4 — Backend Domain / API Skeleton

목적:

API Contract와 Domain 경계를 먼저 잡고, Wellness Rule 구현 전에도 검증 가능한 Backend 기반을 준비한다.

선행 의존성:

- Milestone 1 완료
- Milestone 2 완료
- Milestone 3 완료
- `docs/05-API_SPEC.md`
- `docs/09-DECISIONS.md`

주요 산출물:

- Request / Response DTO 구조
- Controller Skeleton
- Service Interface 또는 빈 Service 구조
- Repository 구조
- Error Response 구조
- `GET /api/check-ins/latest`의 Empty State `404 Not Found` 처리 구조
- `GET /api/check-ins/history?days=7`의 기본 7일 / 허용 범위 1~30일 Validation 구조
- Local Verification / CI 검증 범위 확장

검증 방법:

- Controller Validation Test 또는 API 동작 Test
- DTO와 Entity가 분리되어 있는지 확인
- Frontend가 DB Entity 구조에 의존하지 않도록 Contract 검토
- Local Verification 실행
- CI 실행 결과 확인

Human Approval Gate:

- API Contract 변경 필요 시 Gate C 적용
- DB Schema 주요 구조 변경 필요 시 Gate C 적용
- Database Integration Test가 필요하면 Gate C에서 Test DB 전략을 다시 승인받는다.
- 이 Milestone 완료 후 Gate B 진행

완료 조건:

- API Skeleton이 Contract와 충돌하지 않는다.
- Wellness Rule이 필요한 부분은 임시 확정 없이 명확히 보류되어 있다.
- 추가된 Backend 검증이 Local Verification과 CI에 반영된다.

### Milestone 5 — Wellness Analysis / Recommendation Rule Approval

목적:

Backend Core 구현 전에 Rule-based Analysis와 Recommendation 정책을 Human Review 대상으로 제안한다.

선행 의존성:

- Milestone 4 완료
- `docs/05-API_SPEC.md`
- `docs/09-DECISIONS.md`의 DEC-014

주요 산출물:

- Wellness Score 계산식 후보
- Mood 판정 기준 후보
- Metric 가중치 후보
- Weather 영향 규칙 후보
- Temperature 처리 정책 후보
- Food Recommendation Rule 후보
- Music Recommendation Rule 후보
- Rule Boundary / Edge Case 후보

검증 방법:

- 예시 입력에 대한 예상 Mood / Score / Recommendation 검토
- Temperature가 Score, Mood, Recommendation 중 어디에 영향을 주는지 검토
- 테스트 가능한 경계값과 Edge Case 검토
- 의료 진단으로 오해될 수 있는 표현이 없는지 검토
- 테스트 가능한 Service 구조로 구현 가능한지 검토

Human Approval Gate:

- Gate B

완료 조건:

- Human이 Wellness Analysis Rule, Temperature 처리 정책, Rule Boundary / Edge Case, Recommendation Rule을 승인한다.
- 승인된 Rule이 `docs/09-DECISIONS.md`에 기록된다.

### Milestone 6 — Backend Domain / API Core

목적:

승인된 Rule을 기반으로 Check-in 저장, 분석, 추천 생성, 최신 조회, History 조회를 구현한다.

선행 의존성:

- Milestone 4 완료
- Milestone 5 완료
- Gate B 승인 완료

주요 산출물:

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

검증 방법:

- Wellness Analysis Service Test
- Recommendation Service Test
- Rule Boundary / Edge Case Test
- Request Validation Test
- Latest Empty State `404` Test
- History `days` 허용 범위 1~30 Validation Test
- Backend Test/Build
- Local Verification 실행
- CI 실행 결과 확인

Human Approval Gate:

- DB Schema 주요 변경 필요 시 Gate C 적용
- API Contract 변경 필요 시 Gate C 적용
- Database Integration Test가 필요하면 Gate C에서 Test DB 전략을 다시 승인받는다.

완료 조건:

- Backend가 Check-in 저장과 분석 결과 생성을 수행한다.
- Recommendation Refresh API는 구현하지 않는다.
- 주요 Backend Test가 존재하고 통과한다.
- 추가된 Backend 검증이 Local Verification과 CI에 반영된다.

### Milestone 7 — Frontend Foundation / Design System

목적:

v1의 Dark Wellness Dashboard 방향성을 유지하면서 v3 화면 구현을 위한 공통 UI 기반을 만든다.

선행 의존성:

- Milestone 1 완료
- Milestone 2 완료
- Milestone 3 완료
- Gate A 승인 완료
- `docs/02-V1-REFERENCE.md`
- `docs/03-UX_UI_SPEC.md`

주요 산출물:

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

검증 방법:

- Frontend Build
- 공통 Component 렌더링 Test
- Keyboard Focus와 기본 접근성 상태 검토
- Mobile / Tablet / Desktop Layout 기본 검토
- Local Verification 실행
- CI 실행 결과 확인

Human Approval Gate:

- 새로운 UI Library 또는 외부 Dependency가 필요하면 Gate C 적용

완료 조건:

- 주요 화면을 연결할 Frontend 기반이 준비된다.
- Hard-coded 결과를 최종 기능처럼 표시하지 않는다.
- 추가된 Frontend 검증이 Local Verification과 CI에 반영된다.

### Milestone 8 — Daily Check-in

목적:

사용자가 신체 리듬과 날씨 상태를 입력하고 Backend 분석을 요청할 수 있게 한다.

선행 의존성:

- Milestone 6 완료
- Milestone 7 완료

주요 산출물:

- Daily Check-in 화면
- 입력 Form
- Client-side Validation 보조
- API 제출 흐름
- Submitting / Success / API Error 상태
- 완료 후 Dashboard 이동 또는 결과 요약
- Check-in 관련 Frontend Test
- Local Verification / CI 검증 범위 확장

검증 방법:

- Check-in Validation Test
- 제출 중 중복 Action 방지 검토
- API Error State Test
- Frontend Test/Build
- Backend 관련 Test 재실행
- Local Verification 실행
- CI 실행 결과 확인

Human Approval Gate:

- API Contract 변경 필요 시 Gate C 적용

완료 조건:

- 사용자가 Daily Check-in을 저장할 수 있다.
- Validation Error가 필드 가까이에 표시된다.
- 저장/분석 중 중복 제출이 방지된다.
- 추가된 Feature 검증이 Local Verification과 CI에 반영된다.

### Milestone 9 — Dashboard

목적:

사용자가 최신 Check-in 결과와 추천 정보를 한 화면에서 확인할 수 있게 한다.

선행 의존성:

- Milestone 6 완료
- Milestone 7 완료
- Milestone 8 완료

주요 산출물:

- Dashboard 화면
- Wellness Hero
- 5개 Body Metric Card
- Food Recommendation Card
- Music Recommendation Card
- Latest 없음 Empty State
- Loading / API Error / Retry 상태
- Dashboard 관련 Frontend Test
- Local Verification / CI 검증 범위 확장

검증 방법:

- Dashboard Empty State Test
- Recommendation Rendering Test
- 5개 Metric 표시 확인
- Latest `404`를 Empty State로 처리하는지 확인
- Responsive Layout 검토
- Frontend Test/Build
- Backend 관련 Test 재실행
- Local Verification 실행
- CI 실행 결과 확인

Human Approval Gate:

- API Contract 변경 필요 시 Gate C 적용
- 외부 시각화 Dependency 필요 시 Gate C 적용

완료 조건:

- Dashboard에서 최신 분석 결과를 확인할 수 있다.
- Empty / Loading / Error 상태가 명확히 처리된다.
- 추가된 Feature 검증이 Local Verification과 CI에 반영된다.

### Milestone 10 — History / Trend

목적:

사용자가 최근 7일 웰니스 상태 변화와 추천 이력 요약을 확인할 수 있게 한다.

선행 의존성:

- Milestone 6 완료
- Milestone 7 완료
- Milestone 9 완료

주요 산출물:

- History 화면
- 최근 7일 Wellness Score Trend
- 날짜별 Mood
- 주요 Metric 요약
- 추천 이력 요약
- Empty State
- History / Trend 관련 Test
- Local Verification / CI 검증 범위 확장

검증 방법:

- History API 조회 Test
- `days` 기본값 7 / 허용 범위 1~30 Validation 확인
- Trend Component 렌더링 Test
- 외부 Chart Library가 추가되지 않았는지 확인
- Frontend Test/Build
- Backend 관련 Test 재실행
- Local Verification 실행
- CI 실행 결과 확인

Human Approval Gate:

- 외부 Chart Library 필요 시 Gate C 적용

완료 조건:

- History에서 최근 7일 기록을 확인할 수 있다.
- Trend는 CSS 또는 SVG 기반 단순 Component로 동작한다.
- 추가된 Feature 검증이 Local Verification과 CI에 반영된다.

### Milestone 11 — Verification Hardening

목적:

Core Feature 완료 후 전체 Frontend/Backend Test와 Build 범위를 다시 검증하고, Local Verification과 CI가 동일하거나 동등한 품질 기준을 갖도록 정리한다.

선행 의존성:

- Milestone 8 완료
- Milestone 9 완료
- Milestone 10 완료
- Local Verification 누적 확장 완료
- CI 누적 확장 완료

주요 산출물:

- 전체 Frontend Test/Build 검증
- 전체 Backend Test/Build 검증
- Local Verification 범위 점검
- CI 범위 점검
- Core MVP 완료 전 Verification Gap 목록
- 필요 시 문서화된 보완 Task 후보

검증 방법:

- `scripts/verify.ps1` 실행
- `scripts/verify.sh` 실행 가능한 환경에서 실행
- GitHub Actions CI 실행 결과 확인
- Local Verification과 CI 검증 범위 비교
- 외부 MySQL 연결 없이 기본 검증이 가능한지 확인
- 실패한 Test 또는 Build를 성공 처리하지 않는지 확인

Human Approval Gate:

- 추가 검증 도구나 외부 Dependency가 필요하면 Gate C 적용
- Database Integration Test가 필요하면 Gate C에서 Test DB 전략을 다시 승인받는다.

완료 조건:

- Core Feature 전체에 대한 Frontend/Backend Test와 Build가 통과한다.
- Local Verification과 CI가 Core MVP 검증 범위를 반영한다.
- 남은 Verification Gap이 명확히 기록된다.

### Milestone 12 — GitHub Actions Bot

목적:

검증 결과나 Harness 관련 기록 자동화를 GitHub Actions Bot으로 확장한다.

선행 의존성:

- Milestone 2 완료
- Milestone 3 완료
- Milestone 11 완료
- Local Verification 안정화
- CI 안정화
- Core Feature 구현 및 검증 완료

주요 산출물:

- GitHub Actions Bot 도입 계획
- 검증 결과 또는 Harness 기록 자동화
- Source Code 자동 수정은 제외한 초기 Bot 동작

검증 방법:

- Bot이 Source Code를 자동 수정하지 않는지 확인
- 기록 또는 검증 결과가 의도한 위치에 남는지 확인
- Local Verification과 CI 안정 상태를 해치지 않는지 확인

Human Approval Gate:

- GitHub Actions Bot 구성은 Gate C 적용

완료 조건:

- Bot이 검증 결과 또는 Harness 관련 기록 자동화 역할부터 수행한다.
- Local Verification과 CI가 안정되고 Core Feature 구현/검증이 끝난 후에만 Bot을 추가한다.

---

## 6. Verification 확장 원칙

- Milestone 2에서 최소 Local Verification을 먼저 만든다.
- Milestone 3에서 최소 CI를 먼저 만든다.
- 이후 각 Feature Milestone은 기능 구현과 함께 관련 Test를 추가한다.
- Feature 관련 Test가 추가되면 Local Verification에 즉시 포함한다.
- Feature 관련 Test가 추가되면 CI에도 즉시 포함한다.
- 초기 단계에 존재하지 않는 Test는 실패 조건으로 강제하지 않고, 해당 Feature Task의 완료 조건에 포함한다.
- Core Feature 완료 후 Milestone 11에서 전체 Frontend/Backend Test와 Build 범위를 다시 검증한다.
- 기본 Test/Build는 외부 MySQL 연결 없이 실행 가능해야 한다.
- Database Integration Test가 필요해지면 Gate C에서 Test DB 전략을 다시 승인받는다.

---

## 7. 구현 순서 결정 이유

- Version 결정은 Project Bootstrap의 전제 조건이므로 Gate A를 Milestone 1 전에 배치한다.
- Local Verification을 Project Bootstrap 직후에 배치하면 이후 Feature마다 검증 범위를 누적 확장할 기준이 생긴다.
- GitHub Actions CI를 초기 Local Verification 직후에 배치하면 Feature 구현 초반부터 CI 실패를 볼 수 있다.
- Backend API Contract와 Domain Skeleton은 Frontend가 의존할 계약이므로 Core Feature보다 먼저 만든다.
- Wellness Analysis Rule은 계획 당시 Pending 상태였으므로 실제 Backend Core 구현 전에 Gate B로 분리했다.
- 현재는 Gate B가 완료되었고 DEC-014가 Human Approved 상태이므로 Backend Core 구현은 DEC-014를 따른다.
- Frontend Foundation은 Backend Contract와 병행 가능하지만, 사용자 흐름 구현은 Backend Core 이후가 안정적이다.
- Daily Check-in은 Dashboard와 History의 데이터 생성 경로이므로 먼저 구현한다.
- Dashboard는 최신 Check-in 결과와 Empty State 처리를 검증하는 핵심 화면이므로 History보다 먼저 구현한다.
- History / Trend는 저장된 기록과 Trend 표현에 의존하므로 Dashboard 이후로 배치한다.
- Verification Hardening은 Core Feature 완료 후 전체 Frontend/Backend Test와 Build 범위를 다시 확인하기 위해 둔다.
- GitHub Actions Bot은 Local Verification과 CI가 안정되고 Core Feature 구현/검증이 끝난 이후에만 배치한다.

---

## 8. Decision 상태

다음 결정은 TASK-005 Gate B Human Review를 통해 확정되었다.

- DEC-014 Wellness Analysis Rule
  - Wellness Score 계산식
  - Mood 판정 기준
  - Metric 가중치
  - Weather 영향
  - Temperature 처리 정책
  - Food Recommendation Rule
  - Music Recommendation Rule
  - Rule Boundary / Edge Case

현재 DEC-014는 `docs/09-DECISIONS.md`에 Human Approved 상태로 기록되어 있으며 Pending Decision이 아니다.

---

## 9. Risk

- Wellness Analysis Rule은 승인되었으므로 Backend Core 구현은 DEC-014를 따라 진행할 수 있다.
- Temperature 처리 정책과 Rule Boundary / Edge Case는 DEC-014에 승인되어 있으므로 TASK-006에서 해당 기준으로 Test를 확정한다.
- MySQL Integration Test가 필요해질 경우 초기 CI Database Strategy를 재검토해야 한다.
- API Contract 또는 DB Schema 변경이 발생하면 Frontend Type과 Test 계획도 함께 갱신해야 한다.
- 외부 Chart Library 없이 Trend를 구현하므로 표현 범위를 MVP 수준으로 제한해야 한다.
- Feature마다 Local Verification과 CI 범위를 확장하지 않으면 최종 Verification Hardening에서 검증 공백이 커질 수 있다.
- GitHub Actions Bot은 CI 안정화 이후로 미뤄야 하므로 초기 자동화 범위가 제한된다.

---

## 10. 계획 승인 후 다음 단계

Human이 이 계획을 승인하면 다음 순서로 진행한다.

1. Gate A 승인 결과를 기준으로 Project Bootstrap Task를 정의한다.
2. Project Bootstrap Task 승인 후 Project Bootstrap을 진행한다.
3. Project Bootstrap 직후 Initial Local Verification Harness Task를 정의한다.
4. Initial Local Verification Harness 성공 후 Initial GitHub Actions CI Task를 정의한다.
5. `docs/07-TASKS.md`는 계획 승인 이후 별도 지시에 따라 생성한다.
6. 구현 단계에서는 한 번에 하나의 Task만 수행한다.
