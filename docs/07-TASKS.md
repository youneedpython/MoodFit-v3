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

TASK-030 — Production Continuous Deployment / Approval / Rollback

Status:

```text
BLOCKED
```

TASK-001 ~ TASK-028, TASK-032 ~ TASK-034는 DONE이다. TASK-028은 2026-10-04 Staging 최초 배포와 Smoke 검증을 마쳤으며 완료는 PR #15의 Human Squash Merge로 확정한다.
TASK-029는 2026-10-04 승인 Contract에 따른 Executor 구현 완료를 DONE으로 반영했다. 실제 자동 배포 두 번과 롤백 경로 확인은 Merge 이후이며 최종 완료 승인은 Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge로 확정한다. TASK-030은 Production 생성 승인과 선행 기능 Task 후 READY이며 현재 BLOCKED다. TASK-035(위치 인식 + 날씨 자동 조회)는 PR #16 Human Squash Merge(2026-10-04)로 DONE이다. 계획한 순서(TASK-029 뒤)보다 먼저 Merge되었고 Frontend만 바뀌어 다른 Task에 영향은 없다. Staging에는 아직 배포되지 않았으며 TASK-029의 CD 또는 수동 Frontend 배포로 반영한다. TASK-036(추천 5개 / 음악 재생)은 별도 Branch에서 개발 중이다.

---

## 4. 전체 Task 목록

| Task | Milestone | 작업 | 상태 | Dependency | Human Approval |
|---|---|---|---|---|---|
| TASK-042 | Milestone 42 | Social Login / Guest / User Scoped Data | DONE | TASK-029, TASK-036, TASK-039 | Human Approved 2026-10-04; Executor 구현 완료, Verify / Review / Merge 대기 |
| TASK-043 | Milestone 43 | Infra: OAuth 값 주입 — App / IAM Stack | DONE | TASK-042 Merge / Staging 체험 로그인 확인 | Executor 구현 완료, Verify / Review / Human Merge 및 실제 적용은 후속 확인 |
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
| TASK-016 | Milestone 16 | DB 연동 테스트 — 실제 MySQL (FU-3) | DONE | TASK-015 완료 (충족), DEC-023 Human Approved, Local / Remote Verification 완료, Human Review 승인 완료 | Gate C 승인 완료 |
| TASK-017 | Milestone 17 | API 계약 테스트 — Frontend / Backend (FU-1) | DONE | TASK-016 완료 (충족), DEC-024 Human Approved, Local / Remote Verification 완료, Human Review 승인 완료 | Gate C 승인 완료 |
| TASK-018 | Milestone 18 | Multi-Agent Harness Bootstrap (Policy + Minimal Orchestrator) | DONE | DEC-026 Human Approved, A ~ D단계 완료, PR Squash Merge 승인 | 승인 완료 |
| TASK-019 | Milestone 19 | CI Runner OS Transition Hardening (FU-6) | DONE | TASK-018 완료 (충족), Ubuntu 26.04 Remote 검증 성공 / B 단계 복귀 완료 | C→B 승인 완료, PR #2 Human Squash Merge로 DONE 승인 완료 |
| TASK-020 | Milestone 20 | Orchestrator Hardening (worktree / Resume / Guard) | DONE | TASK-019 완료, A ~ 완료 정리 / Review 4회차 PASS | Human 결정 A, PR Squash Merge 승인으로 확정 |
| TASK-021 | Milestone 21 | Git Automation / Branch / PR Harness | DONE | TASK-020 완료 (충족), Human 결정 1 / 2 반영, Rework 1 / 2회차 Claude PASS | PR Squash Merge 승인으로 확정 |
| TASK-022 | Milestone 22 | GitHub CI Integration / PR Gate | DONE | TASK-021 완료 (충족), Review PASS, E2E(PR #5 → CI → Human Squash Merge) 검증 | Gate C 승인 완료, PR #5 Human Squash Merge로 DONE 승인 완료 |
| TASK-023 | Milestone 23 | AWS Deployment Architecture / Cost Gate | DONE | TASK-022 완료 (충족), Human 실행 지시 | DEC-027 Human Approved (2026-10-03), 완료는 PR Squash Merge로 확정 |
| TASK-024 | Milestone 24 | Deployment Artifact / Container / Health Strategy | DONE | TASK-023 Architecture 승인(DEC-027), Human 명시 실행 지시, DEC-028 승인 | Gate C 승인 완료, 이번 PR Human Squash Merge로 완료 확정 |
| TASK-025 | Milestone 25 | AWS SSO / GitHub OIDC / IAM / Environment Gate | DONE | TASK-023 / TASK-024, DEC-029 Human Approved | B단계 구현 완료 반영, Human Squash Merge로 확정 |
| TASK-026 | Milestone 26 | AWS Infrastructure as Code Foundation | DONE | TASK-032 / TASK-033 / TASK-034 구현 완료 반영 (충족), TASK-023 / TASK-025 및 Permission Set / Profile / 실제 Preflight 확인 충족 | 필요 (비용 Resource Checkpoint) |
| TASK-027 | Milestone 27 | AWS Application Infrastructure (ECS / ALB / RDS) | DONE | TASK-024, TASK-026 완료 | DEC-031 승인, PR 구현 완료 반영 / Human Squash Merge로 확정 |
| TASK-028 | Milestone 28 | Staging Deployment / Smoke Test | DONE | TASK-025 ~ TASK-027 완료. 2026-10-04 Staging Stack 8개 생성, Image / Frontend 배포, Smoke 통과 | Human이 Change Set 직접 실행, PR #15 Squash Merge로 확정 |
| TASK-029 | Milestone 29 | Staging Continuous Deployment | DONE | TASK-028 완료 (충족), 실제 CD 확인은 Merge 이후 | Gate C 사전 승인 (DEC-032), 완료 승인 대기 |
| TASK-030 | Milestone 30 | Production Continuous Deployment / Approval / Rollback | BLOCKED | Production 생성 승인과 선행 기능 Task 후 READY | 필요 (Production 항상 Human Approval) |
| TASK-031 | Milestone 31 | Operations / Cost Guard / Cleanup / Final Hardening | BLOCKED | TASK-030 완료 | 필요 (파괴적 작업) |
| TASK-032 | Milestone 32 | Orchestrator Improvements (PR 본문 / Secret Guard / 자동 Rework) | DONE | TASK-025 완료. 이번 PR 완료 반영 / Human Squash Merge 대기 | Secret 검사 정밀화는 TASK-034로 분리 / 새 Dependency 시 Gate |
| TASK-033 | Milestone 33 | MySQL 8.4 Alignment (Local / Testcontainers / CI) | DONE | TASK-032 완료, DEC-030 사전 승인. 이번 PR 구현 완료 반영 / Human Squash Merge 대기 | Gate C 승인 완료 (DEC-030) |
| TASK-034 | Milestone 34 | Secret Guard Allowlist (Human 승인 허용 문구) | DONE | 사전 승인과 명시 실행에 따른 이번 PR 구현 완료 반영 / Human Squash Merge 대기 | 2026-10-03 형식 / 거부 기준 / 적용 범위 / Resume / 강화 규칙 사전 승인 |
| TASK-035 | Milestone 35 | Location / Weather Auto Fill (위치 인식 + 날씨 자동 조회) | DONE | Human 지시(2026-10-04), Frontend만 변경, Review PASS | Gate 사전 승인, PR #16 Human Squash Merge로 확정 |
| TASK-036 | Milestone 36 | Recommendation Five / Music Playback (추천 5개 + 추천 음악 바로 듣기) | DONE | Human 지시(2026-10-04), TASK-035 완료, Review PASS | Gate 사전 승인, PR #17 Human Squash Merge로 확정 |
| TASK-037 | Milestone 37 | Logo / Favicon (로고 / 파비콘) | DONE | Human 지시와 시안 A 선택(2026-10-04), Review PASS | PR #19 Human Squash Merge로 확정 |
| TASK-038 | Milestone 38 | GitHub OIDC Immutable Subject Trust | DONE | TASK-029 Merge (PR #18), Executor 구현 완료 반영 | Human 사전 승인 (2026-10-04), 최종 완료 승인 대기 |
| TASK-039 | Milestone 39 | Staging CD Rollout Wait Fix | DONE | TASK-029, TASK-038 | Human 명시 실행 승인 (2026-10-04), 최종 완료 승인 대기 |
| TASK-040 | Milestone 40 | Weather Auto Default / Region Display | DONE | TASK-035, TASK-037 완료 | Human Gate 사전 승인 및 명시 실행 (2026-10-04), 최종 완료 승인 대기 |
| TASK-041 | Milestone 41 | Header Logo Link / Alignment (로고 클릭 이동 + 정렬) | DONE | TASK-037 완료 | Human 명시 실행 승인 (2026-10-04), 최종 완료 승인 대기 |
| TASK-042 | Milestone 42 | Social Login / Guest / User Scoped Data | DONE | TASK-029, TASK-036, TASK-039 | Human Approved 2026-10-04; Executor 구현 완료, Verify / Review / Merge 대기 |
| TASK-043 | Milestone 43 | Infra: OAuth 값 주입 — App / IAM Stack | READY | TASK-042 구현 후 실환경 확인 | TASK-042 후속 등록, 실제 값 / AWS 실행은 후속 Contract와 Gate에 따름 |
| TASK-044 | Milestone 44 | Check-in Region Record (지역 저장 / Dashboard · History 표시) | DONE | TASK-040, TASK-042 | Human Approved 2026-10-04, Executor 구현 완료 / Verify · Review · Merge 대기 |
| TASK-045 | Milestone 45 | LLM Insight (AI 맞춤 코멘트 + 주간 리포트) | DONE | TASK-042, TASK-044 | Human Approved 2026-10-04, Executor 구현 완료 / Verify · Review · Merge 대기 |
| TASK-046 | Milestone 46 | LLM Value Injection (Infra) | DONE | TASK-043, TASK-045 | Human Approved 2026-10-04, Executor 구현 완료 / Verify · Review · Merge 대기 |
| TASK-047 | Milestone 47 | UI Polish (AI 코멘트 자동 생성 / 음식 아이콘 / History 페이지 나누기) | DONE | TASK-036, TASK-045 | Human 명시 실행 승인 (2026-10-04), Executor 구현 완료 / Verify · Review · Merge 대기 |
| TASK-048 | Milestone 48 | Recommendation Variety (추천 다양화) + History 여백 | DONE | TASK-036, TASK-042, TASK-047 | Human Approved 2026-10-04, Executor 구현 완료 / Verify · Review · Merge 대기 |
| TASK-049 | Milestone 49 | LLM Runtime Endpoint / Failure Diagnostics | DONE | TASK-045, TASK-046 | Human 승인 Contract 및 명시 실행 지시 (2026-10-04), Executor 구현 완료 / Verify · Review · Merge 대기 |
| TASK-050 | Milestone 50 | Skip Staging CD for Docs-only Changes | DONE | TASK-029, TASK-039 | Human Gate C 승인 (2026-10-04), Executor 구현 완료 / Verify · Review · Merge 대기 |
| TASK-051 | Milestone 51 | AI Comment Readability | DONE | TASK-045, TASK-047, TASK-049 | Human 실행 지시 (2026-10-04), Executor 구현 완료 / Verify · Review · Merge 대기 |

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
DONE
```

Gate C 승인(DEC-023), 구현, Local / Remote Verification, Human Review가 완료되었다.

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
DONE
```

Gate C 승인(DEC-024), 구현, Local / Remote Verification, Human Review가 완료되었다.

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

## TASK-018 — Multi-Agent Harness Bootstrap (Policy + Minimal Orchestrator)

### 상태

```text
DONE
```

A ~ D단계 완료, PR Squash Merge로 Human Review 승인

Reviewer가 Sandbox 밖에서 수정 후 Fake CLI Test tests 32 / pass 32 / fail 0을 확인했다. Repository 밖 임시 Git Repo의 TASK-901 실제 CLI Smoke Run은 3회차 PASS(Exit 0, 약 39초)이며 Execute / Guard / Verify / Claude Review / Decide를 통과했다. DEC-026 정책은 AGENTS.md에 반영했다. Human Review 완료 / DONE은 이 PR의 Squash Merge 시 확정된다.

### 목적

Codex 실행 후 Claude가 자동으로 검토하는 자동화 기반을 만든다. 정책(DEC-026)과 최소 Local Orchestrator(`codex exec` → Verify → `claude -p` Review → Rework 최대 3회 → Gate 정지)를 구축한다. 이 Task만 Claude Code 세션이 임시 Orchestrator 역할을 한다.

### Human Approval 또는 Gate

- DEC-026 Human Approval, 승인 후 AGENTS.md 반영

### 완료 조건

- DEC-026이 승인되고 최소 Orchestrator가 Fake CLI Test와 실제 CLI Smoke Run을 통과하며 AGENTS.md에 정책이 반영된다.

### 상세 Task Contract

[`docs/tasks/TASK-018_HARNESS_BOOTSTRAP.md`](tasks/TASK-018_HARNESS_BOOTSTRAP.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-019 — CI Runner OS Transition Hardening (FU-6)

### 상태

```text
DONE
```

2026-10-02 Human 승인 C→B를 완료했다. Commit 3a59adb의 Ubuntu 26.04 PR CI(frontend / backend)와 Task Branch Milestone Workflow가 모두 성공하여 runs-on 3곳을 ubuntu-latest로 복귀했다. FU-6 DONE은 이 PR의 Human Squash Merge 시 확정되며 Claude 자동 Review / 최종 Remote CI / Human Review는 별도 절차다. 검증 근거는 08-WORK_LOG.md를 따른다.

### 목적

`ubuntu-latest` → Ubuntu 26 전환(2026-10-19)에 대비해 CI를 보완한다. (FU-6) Orchestrator로 실행하는 첫 Task(시범 운영)다.

### Human Approval 또는 Gate

- Runner 전략(`ubuntu-24.04` 고정 / `ubuntu-latest` 유지 + 보완)은 CI 동작 변경이므로 Human Approval

### 완료 조건

- 승인된 Runner 전략이 Remote CI에서 검증되고 FU-6이 DONE으로 기록된다.

### 상세 Task Contract

[`docs/tasks/TASK-019_CI_RUNNER_OS_HARDENING.md`](tasks/TASK-019_CI_RUNNER_OS_HARDENING.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-020 — Orchestrator Hardening (worktree / Resume / Guard)

### 상태

```text
DONE
```

A ~ 완료 정리 / 실제 CLI Smoke Run / 필수 검증 / Review 4회차 PASS를 완료했다. Human 결정 A로 elevated 전환을 반영했다. DONE은 이 PR의 Human Squash Merge 승인으로 확정된다.

### 목적

최소 Orchestrator에 worktree 작업 공간 분리, Resume, 실행 Lock, Path / Secret Guard, 오류 분류, 전체 Test를 더한다. 시범 운영(TASK-019) 결과를 반영한다.

### Human Approval 또는 Gate

- 확정된 언어 / Runtime(Node.js 24 + `.mjs`, Dependency 없음) 외 Runtime이나 새 Dependency가 필요하면 Gate C

### 완료 조건

- 보강된 Orchestrator가 Fake CLI Test와 실제 CLI Run으로 검증되고 설계 문서가 구현과 일치한다.

### 상세 Task Contract

[`docs/tasks/TASK-020_ORCHESTRATOR_HARDENING.md`](tasks/TASK-020_ORCHESTRATOR_HARDENING.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-021 — Git Automation / Branch / PR Harness

### 상태

```text
DONE
```

Human 결정 1 / 2 반영, 검증과 Rework 1 / 2회차 Claude Review PASS를 완료했다. Human 승인에 따라 DONE을 PR 안에 반영하며 완료 승인은 이 PR의 Human Squash Merge로 확정된다. Merge 후 Sync Milestones가 Milestone 21을 종료한다.

### 목적

Orchestrator에 안전한 Branch / Stage / Commit / Push / PR 계층을 추가한다. (Human GitHub 로그인 후 사용)

### Human Approval 또는 Gate

- Git 권한 확대, GitHub CLI 도입, Auto Merge 정책은 Human Approval

### 완료 조건

- Task Branch → Safe Stage → Commit → Push → PR 흐름이 정책대로 검증된다.

### 상세 Task Contract

[`docs/tasks/TASK-021_GIT_PR_HARNESS.md`](tasks/TASK-021_GIT_PR_HARNESS.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-022 — GitHub CI Integration / PR Gate

### 상태

```text
DONE
```

Gate C(권장안 A / PR 상태 Comment / strict Required Checks) 구현이 Orchestrator Review PASS를 받았고, Orchestrator가 직접 만든 Draft PR #5의 최신 head CI 성공 후 Human Squash Merge(2026-10-02)로 완료 승인되었다. E2E 근거는 WORK_LOG에 기록했다.

### 목적

로컬 Harness가 만든 PR을 GitHub의 Deterministic CI와 Human 승인으로 마무리하는 흐름을 완성한다. GitHub Actions에서는 Agent를 실행하지 않는다.

### Human Approval 또는 Gate

- CI 동작 변경 / Branch Protection은 Gate C

### 완료 조건

- End-to-End Harness Run(로컬 실행 → PR → CI → Human Approve → Merge)이 검증된다.

### 상세 Task Contract

[`docs/tasks/TASK-022_GITHUB_CI_INTEGRATION.md`](tasks/TASK-022_GITHUB_CI_INTEGRATION.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-023 — AWS Deployment Architecture / Cost Gate

### 상태

```text
DONE
```

2026-10-03 Human이 B안과 비용 / 보안 기준 및 Domain 8949db.kr / HTTPS origin을 승인했다(DEC-027 Human Approved). DONE / TASK-024 READY는 이번 PR에 반영하며 Human Squash Merge로 확정한다. DNS 위임 복구와 hostname 최종 확정은 TASK-026 전 후속 조건이다. DEC-023 변경은 TASK-026 전 별도 Decision / Gate / Task이며 이번 Task 실행을 막지 않는다.

### 목적

AWS Resource 생성 전 Architecture / Cost / Security / 계정 구조 / RDS Version을 결정한다.

### Human Approval 또는 Gate

- Architecture, Region, 계정 / SSO 범위, Network, RDS, 비용 상한은 Human Approval

### 완료 조건

- Architecture / Cost Decision이 Human Approved 된다.

### 상세 Task Contract

[`docs/tasks/TASK-023_AWS_ARCHITECTURE_GATE.md`](tasks/TASK-023_AWS_ARCHITECTURE_GATE.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-024 — Deployment Artifact / Container / Health Strategy

### 상태

```text
DONE
```

2026-10-03 Human Gate C 승인(DEC-028) 후 Run 2에서 Actuator / app.jar / digest 고정 non-root Container / Smoke와 운영 Health 회귀 Test를 구현했다. 이번 PR에 DONE / TASK-025 READY를 포함한다. Executor DONE은 구현 완료이며 Orchestrator Verify / Claude PASS 이후 Human Squash Merge가 Task 완료 승인이다. Smoke 실측은 Orchestrator Verify Log 기준으로 보완한다.

### 목적

Frontend / Backend 배포 Artifact를 재현 가능하게 만들고 Health Check 전략을 확정한다.

### Human Approval 또는 Gate

- 새 Dependency, Health API, API Contract, Base Image 정책 변경 시 Gate C

### 완료 조건

- 배포 Artifact가 로컬에서 재현 / 검증되고 Health 전략이 문서화된다.

### 상세 Task Contract

[`docs/tasks/TASK-024_DEPLOYMENT_ARTIFACT_CONTAINER_HEALTH.md`](tasks/TASK-024_DEPLOYMENT_ARTIFACT_CONTAINER_HEALTH.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-025 — AWS SSO / GitHub OIDC / IAM / Environment Gate

### 상태

```text
DONE
```

2026-10-03 DEC-029 승인 후 명시 실행한 B단계 Profile Preflight / Fake CLI Test를 구현했다. 실제 AWS CLI / 설정은 사용하지 않았다. DONE은 PR 완료 반영이며 Verify / Claude PASS 이후 Human Squash Merge로 확정한다. Human의 Permission Set / Profile 구성과 실제 Profile Preflight 확인은 TASK-026 실행 선행 조건이다.

### 목적

사람 / 로컬 Agent는 AWS SSO(Human 로그인 후 Agent 작업), CI / CD는 GitHub OIDC로 장기 Access Key 없이 접근하도록 설계한다.

### Human Approval 또는 Gate

- IAM Identity Center, Permission Set, IAM, GitHub Environment, Secret 정책은 Human Approval

### 완료 조건

- SSO / OIDC / IAM / Environment 정책이 승인되고 Human이 SSO / Profile 구성을 마친다.

### 상세 Task Contract

[`docs/tasks/TASK-025_AWS_SSO_OIDC_IAM_GATE.md`](tasks/TASK-025_AWS_SSO_OIDC_IAM_GATE.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-026 — AWS Infrastructure as Code Foundation

### 상태

```text
DONE
```

승인된 CloudFormation Foundation 구현 완료를 이번 PR에 반영했다. DONE은 Executor 구현 완료 표시이며 최종 확정은 Orchestrator Verify / Claude Review / Human Squash Merge다. 실제 AWS 적용은 TASK-028 별도 승인 대상이다. docs/17-AWS-IAC-FOUNDATION.md를 따른다.

### 목적

Network / ECR / S3·CloudFront / RDS / Secret Reference를 IaC(CloudFormation 우선)로 정의한다.

### Human Approval 또는 Gate

- 실제 비용 Resource 생성 전 Human Approval Checkpoint

### 완료 조건

- IaC가 정적 검증되고 최초 Apply / Change Set 승인 준비가 된다.

### 상세 Task Contract

[`docs/tasks/TASK-026_AWS_IAC_FOUNDATION.md`](tasks/TASK-026_AWS_IAC_FOUNDATION.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-027 — AWS Application Infrastructure (ECS / ALB / RDS)

### 상태

```text
DONE
```

2026-10-03 사전 승인 Contract / DEC-031과 명시 실행 지시에 따라 Application Template / Data 연결 / API routing을 구현했다. DONE은 이번 PR의 Executor 구현 완료 반영이며 Orchestrator Verify / Claude Review / Human Squash Merge로 최종 확정한다. 실제 AWS 조회 / 생성 / 변경은 수행하지 않았다. 의존 순서·검증 한계·위험은 docs/17-AWS-IAC-FOUNDATION.md를 따른다.

### 목적

ECS Fargate / ALB / RDS 연동과 Frontend → API Routing을 IaC로 완성한다.

### Human Approval 또는 Gate

- IaC 검증과 비용 Gate

### 완료 조건

- Application Infra Template이 검증되고 Staging 적용 준비가 된다.

### 상세 Task Contract

[`docs/tasks/TASK-027_AWS_APPLICATION_INFRA.md`](tasks/TASK-027_AWS_APPLICATION_INFRA.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-028 — Staging Deployment / Smoke Test

### 상태

```text
DONE
```

A단계(절차 / Script / Budget / 조회 정책 준비, Review PASS)와 B단계(2026-10-04 Human이 Change Set으로 Staging Stack 8개를 생성, Image와 Frontend 배포, Claude 세션이 조회 권한으로 상태 확인과 Smoke 실행)를 마쳤다. `https://staging.moodfit.8949db.kr`이 동작한다. 결과는 WORK_LOG에 있다. 완료는 PR #15의 Human Squash Merge로 확정한다.

### 목적

최초 Staging 환경을 로컬(SSO Staging Profile)에서 배포하고 End-to-End Smoke Test를 한다.

### Human Approval 또는 Gate

- Change Set 적용과 비용 Resource 생성은 Human Approval

### 완료 조건

- Staging URL / API가 동작하고 Smoke Test PASS, Resource / 비용 Inventory가 기록된다.

### 상세 Task Contract

[`docs/tasks/TASK-028_STAGING_DEPLOYMENT_SMOKE.md`](tasks/TASK-028_STAGING_DEPLOYMENT_SMOKE.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-029 — Staging Continuous Deployment

### 상태

```text
DONE
```

2026-10-04 Gate C 사전 승인(DEC-032)과 명시 실행 지시에 따른 Workflow / 문서 구현 완료를 반영한다. Executor DONE은 실제 자동 배포 PASS를 의미하지 않는다. 두 번의 배포와 롤백 경로는 Merge 후 확인한다. 검증·Review·Remote CI와 Human Squash Merge 전 완료 승인을 주장하지 않는다. 운영 절차는 docs/21-STAGING-CD.md를 따른다.

### 목적

`main`의 검증된 변경을 GitHub OIDC로 Staging에 자동 배포한다.

### Human Approval 또는 Gate

- CD 동작 변경은 Gate C

### 완료 조건

- 검증된 Commit이 Staging에 자동 배포되고 Smoke Test가 자동 PASS한다.

### 상세 Task Contract

[`docs/tasks/TASK-029_STAGING_CD.md`](tasks/TASK-029_STAGING_CD.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-030 — Production Continuous Deployment / Approval / Rollback

### 상태

```text
BLOCKED
```

Production 생성 승인과 선행 기능 Task 후 READY로 전환한다. TASK-029 실환경 검증을 확인하며 현재는 BLOCKED를 유지한다.

### 목적

Release Tag(`v3.x.y`, DEC-025) 단위로 Staging에서 검증된 Artifact를 Human 승인 후 Production에 배포한다.

### Human Approval 또는 Gate

- Production 배포 / 최초 생성 / 파괴적 Migration은 Human Approval

### 완료 조건

- Human 승인 후 Production 배포와 Smoke Test가 성공하고 Rollback 절차가 검증된다.

### 상세 Task Contract

[`docs/tasks/TASK-030_PRODUCTION_CD.md`](tasks/TASK-030_PRODUCTION_CD.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-031 — Operations / Cost Guard / Cleanup / Final Hardening

### 상태

```text
BLOCKED
```

TASK-030 완료 후 진행한다.

### 목적

운영 / 비용 / 삭제 / 복구 관점의 최종 Hardening과 문서 동기화를 한다.

### Human Approval 또는 Gate

- Resource 삭제, RDS Snapshot / Delete, Budget, Destructive Cleanup은 Human Approval

### 완료 조건

- 운영 / 비용 / 삭제 / 복구 정책이 Human Review를 통과하고 문서와 실제 환경이 동기화된다.

### 상세 Task Contract

[`docs/tasks/TASK-031_OPERATIONS_COST_CLEANUP.md`](tasks/TASK-031_OPERATIONS_COST_CLEANUP.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-032 — Orchestrator Improvements (PR 본문 / Secret Guard / 자동 Rework)

### 상태

```text
DONE
```

승인된 Contract와 명시 실행 지시에 따라 구현했다. Fake CLI 회귀 Test와 설계 문서를 보강했다. 이번 PR의 DONE 반영이며 최종 완료 승인은 Human Squash Merge다.

### 목적

자동 PR 제목 / 본문을 한글 작업 설명으로 만들고, Gate 보고와 Review 수정 요구가 겹칠 때 자동 Rework하도록 Orchestrator를 보강한다. Human 결정 A에 따라 Secret 검사 정밀화는 TASK-034(승인 허용 문구 목록)로 분리하며 기본 검사는 main과 동일하게 유지한다.

### Human Approval 또는 Gate

- Secret 검사 완화가 차단 기준을 낮추거나 새 Dependency가 필요하면 Human Approval

### 완료 조건

- 개선 사항이 Fake CLI Test로 검증되고 설계 문서가 구현과 일치한다.

### 상세 Task Contract

[`docs/tasks/TASK-032_ORCHESTRATOR_IMPROVEMENTS.md`](tasks/TASK-032_ORCHESTRATOR_IMPROVEMENTS.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-033 — MySQL 8.4 Alignment (Local / Testcontainers / CI)

### 상태

```text
DONE
```

DEC-030 사전 승인에 따라 고정 Image / CI 표시 / 영향 조사 / Local 안내를 구현했다. DONE은 이번 PR 구현 완료 반영이며 Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge로 최종 확정한다. TASK-026의 선행 조건이다.

### 목적

Local / Testcontainers / CI의 MySQL 기준을 DEC-027의 RDS MySQL 8.4에 맞춘다. (DEC-023 변경)

### Human Approval 또는 Gate

- DEC-023 변경, 대상 Version, Dependency Version 변경은 Gate C

### 완료 조건

- Local 검증과 Remote CI가 MySQL 8.4에서 통과하고 Decision이 Human Approved 된다.

### 상세 Task Contract

[`docs/tasks/TASK-033_MYSQL_84_ALIGNMENT.md`](tasks/TASK-033_MYSQL_84_ALIGNMENT.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-034 — Secret Guard Allowlist (Human 승인 허용 문구)

### 상태

```text
DONE
```

2026-10-03 Human 사전 승인과 명시 실행 지시에 따라 literal 허용 목록 / Resume / 위치 기록 / 차단 강화를 구현했다. Run 2 기준 Orchestrator Test는 114개가 통과했다(기존 103개 포함). DONE은 이번 PR 구현 완료 반영이며 Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge로 최종 확정한다. TASK-026 선행 조건을 충족 표시했다.

### 목적

Secret 검사의 차단 기준은 그대로 두고, Task Contract에 Human이 승인한 정확한 문자열만 검사에서 제외해 오탐을 줄인다.

### Human Approval 또는 Gate

- 허용 문자열 형식 제한 / 자격 증명 형태 거부 기준은 Gate. 기본 차단 규칙 변경은 Human Approval

### 완료 조건

- Fake CLI Test로 검증되고 설계 문서가 구현과 일치한다.

### 상세 Task Contract

[`docs/tasks/TASK-034_SECRET_GUARD_ALLOWLIST.md`](tasks/TASK-034_SECRET_GUARD_ALLOWLIST.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-035 — Location / Weather Auto Fill (위치 인식 + 날씨 자동 조회)

### 상태

```text
DONE
```

2026-10-04 Human 지시로 병행 개발했다. Check-in 화면에서 현재 위치의 기온과 날씨를 자동으로 채운다(Open-Meteo, API Key 없음). Frontend만 변경했고 Backend / API 계약 / Dependency는 그대로다. Claude Review PASS, PR #16 Human Squash Merge로 완료했다.

### 목적

Check-in의 기온과 날씨 입력을 현재 위치 기준으로 자동으로 채운다. 위치 권한은 처음 한 번만 묻고 이후에는 자동으로 조회한다.

### Human Approval 또는 Gate

- 외부 날씨 API 사용, 좌표 처리 방식(소수 1자리로 줄여 날씨 API에만 전송, 저장하지 않음)은 Human 사전 승인

### 완료 조건

- 검증과 Review 통과, Staging 배포 화면에서 동작 확인

### 상세 Task Contract

[`docs/tasks/TASK-035_LOCATION_WEATHER_AUTOFILL.md`](tasks/TASK-035_LOCATION_WEATHER_AUTOFILL.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-036 — Recommendation Five / Music Playback (추천 5개 + 추천 음악 바로 듣기)

### 상태

```text
DONE
```

2026-10-04 Human 지시로 병행 개발했다. 추천 음식과 추천 음악을 각각 5개(기분 기준 3개 + 날씨 / 상황 기준 2개)로 늘리고, 추천 음악을 화면에서 바로 재생한다(YouTube 영상 embed). Backend 추천 규칙, DB Migration(`V2`, 영상 ID Column 추가), API 계약, Frontend를 함께 바꿨다. Claude Review PASS, PR #17 Human Squash Merge로 완료한다.

### 목적

추천을 더 풍부하게 보여 주고, 추천 음악을 다른 사이트로 이동하지 않고 들을 수 있게 한다.

### Human Approval 또는 Gate

- 추천 개수 변경, 응답에 영상 ID 추가(API 계약 변경), 외부 영상 embed 사용은 Human 사전 승인
- 이전 기록에는 영상 ID가 없으며 그 경우 재생 버튼을 보여 주지 않는다

### 완료 조건

- 검증과 Review 통과, Staging 자동 배포 뒤 화면에서 동작 확인

### 상세 Task Contract

[`docs/tasks/TASK-036_RECOMMENDATION_FIVE_AND_MUSIC_PLAYBACK.md`](tasks/TASK-036_RECOMMENDATION_FIVE_AND_MUSIC_PLAYBACK.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-037 — Logo / Favicon (로고 / 파비콘)

### 상태

```text
DONE
```

2026-10-04 Human 지시로 병행 개발했다. Claude 세션이 시안 3개를 제시했고 Human이 시안 A(맥박선이 M 모양을 이루는 gradient 사각형)를 선택했다. 브라우저 탭 아이콘, 홈 화면 아이콘, 상단 메뉴, README에 같은 로고를 쓴다. Frontend만 변경했다. Claude Review PASS, PR #19 Human Squash Merge로 완료한다.

### 목적

서비스의 얼굴이 되는 로고와 파비콘을 추가한다.

### Human Approval 또는 Gate

- 로고 시안 선택은 Human 결정. Asset 파일은 Claude 세션이 만들어 제공했고 구현 중 바꾸지 않았다.

### 완료 조건

- 검증과 Review 통과, 390 / 768 / 1280px 상단 메뉴 배치 확인(`docs/images/task-037/`), Staging 배포 뒤 탭 아이콘 확인

### 상세 Task Contract

[`docs/tasks/TASK-037_LOGO_FAVICON.md`](tasks/TASK-037_LOGO_FAVICON.md) (공통 규칙: [`docs/tasks/COMMON.md`](tasks/COMMON.md))

---

## TASK-038 — GitHub OIDC Immutable Subject Trust

### 상태

```text
DONE
```

### Dependency / 승인

TASK-029 Merge(PR #18), 2026-10-04 Human 사전 승인과 명시 실행 지시에 따라 수행한다. Milestone 38이다.

### 구현 / 완료 경계

두 배포 Role의 subject를 owner / repository 숫자 ID가 포함된 immutable 형식으로 변경한다. 숫자 전용 필수 Parameter 두 개와 예시 Placeholder를 추가하고 Trust 예시 / 운영 문서 / DEC-029 이력을 맞춘다. StringEquals 단일 값, audience, 환경 분리와 기존 권한은 유지한다. 실제 ID와 AWS 실행은 포함하지 않는다.

DONE은 Executor 구현 완료 반영이며 Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge 전 완료 승인을 뜻하지 않는다. Merge 후 Human이 IAM Stack Change Set을 적용하고 실패한 배포를 재실행해 OIDC 통과를 확인한다. TASK-030 / Current Task는 BLOCKED를 유지한다.

### 상세 Task Contract

[`TASK-038_OIDC_IMMUTABLE_SUBJECT.md`](tasks/TASK-038_OIDC_IMMUTABLE_SUBJECT.md)와 [공통 규칙](tasks/COMMON.md)을 따른다.

---

## TASK-039 — Staging CD Rollout Wait Fix

### 상태

```text
DONE
```

### Dependency / 승인

TASK-029, TASK-038과 2026-10-04 Human의 "CD 에러 해결" 명시 실행 지시에 따른다. Milestone 39다.

### 구현 / 완료 경계

services-stable 이후 DescribeServices를 15초 간격으로 최대 10분 조회한다. 목표 Task Definition과 단일 목표 Deployment, COMPLETED, desired 2 / running 2 / pending 0을 모두 만족해야 성공한다. Service가 이전 revision으로 복귀하거나 목표 Deployment가 FAILED면 즉시 실패한다. 나머지 상태는 제한 시간 안에서 기다리며 실패 이유에는 식별값이나 AWS 원문을 포함하지 않는다.

DONE은 Executor 구현 완료 반영이며 Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge 전 완료 승인이 아니다. Merge 후 Frontend 배포와 Smoke까지 자동 배포가 통과하는지 확인한다. TASK-030 / Current Task는 BLOCKED를 유지한다.

### 상세 Task Contract

[`TASK-039_CD_ROLLOUT_WAIT.md`](tasks/TASK-039_CD_ROLLOUT_WAIT.md)와 [공통 규칙](tasks/COMMON.md)을 따른다.

---

## TASK-040 — Weather Auto Default / Region Display

### 상태

```text
DONE
```

2026-10-04 사전 승인 Contract와 명시 실행 지시에 따라 Milestone 40의 Executor 구현 완료를 반영했다. 저장값이 없으면 자동으로 조회하고 지역 · 날씨 · 기온을 요약한다. 직접 입력으로 전환할 수 있으며 실패 시 입력을 제공한다. BigDataCloud 지역 이름 조회와 두 API의 소수 둘째 자리 좌표 처리, 개인정보 비저장 정책은 DEC-033을 따른다.

DONE은 Executor 구현 완료이며 Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge 전 최종 완료 승인이 아니다. TASK-030 / Current Task의 BLOCKED와 다른 Task 상태는 유지한다. Merge 후 Staging에서 자동 조회 / 지역 표시 / 실패 후 제출과 화면 배치를 확인한다.

### 상세 Task Contract

[TASK-040_WEATHER_AUTO_REGION.md](tasks/TASK-040_WEATHER_AUTO_REGION.md)와 [공통 규칙](tasks/COMMON.md)을 따른다.

---

## TASK-041 — Header Logo Link / Alignment

- 상태: DONE (Milestone 41), 승인 Contract에 따른 Executor 구현 완료 반영.
- 로고 그림과 MoodFit 이름을 하나의 react-router Link(`/`)로 연결하고 날짜는 밖에 유지했다. 그림은 빈 alt로 장식 처리하고 링크 이름은 MoodFit 한 번만 읽힌다.
- 브랜드와 날짜를 세로 가운데 정렬했다. 기존 gradient, 간격 Token, 모바일 메뉴 배치와 전역 focus-ring을 유지했다.
- 기존 테스트에 루트 링크와 단일 접근 가능한 이름, Check-in / History에서 Dashboard 이동 검증을 추가했다.
- `bash scripts/verify.sh`는 Sandbox 밖 npm 캐시 접근 EPERM으로 npm ci 단계에서 중단됐다. Test / Build 성공을 주장하지 않으며 Sandbox 밖 Orchestrator Verify가 검증 기준이다.
- Claude 세션의 390 / 768 / 1280px 캡처 확인, Remote CI / Human Squash Merge가 남아 있다. DONE은 최종 완료 승인이 아니다.
- Current Task TASK-030 / BLOCKED와 다른 Task 상태를 유지한다. [TASK-041 Contract](tasks/TASK-041_HEADER_LOGO_LINK.md)를 따른다.

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
- TASK-018: DEC-026 Human Approval, 승인 후 AGENTS.md 반영
- TASK-019: Runner 전략(`ubuntu-24.04` 고정 / `ubuntu-latest` 유지 + 보완)은 CI 동작 변경이므로 Human Approval
- TASK-020: 확정된 언어 / Runtime(Node.js 24 + `.mjs`, Dependency 없음) 외 Runtime이나 새 Dependency가 필요하면 Gate C
- TASK-021: Git 권한 확대, GitHub CLI 도입, Auto Merge 정책은 Human Approval
- TASK-022: CI 동작 변경 / Branch Protection은 Gate C
- TASK-023: Architecture, Region, 계정 / SSO 범위, Network, RDS, 비용 상한은 Human Approval
- TASK-024: 새 Dependency, Health API, API Contract, Base Image 정책 변경 시 Gate C
- TASK-025: IAM Identity Center, Permission Set, IAM, GitHub Environment, Secret 정책은 Human Approval
- TASK-026: 실제 비용 Resource 생성 전 Human Approval Checkpoint
- TASK-027: IaC 검증과 비용 Gate
- TASK-028: Change Set 적용과 비용 Resource 생성은 Human Approval
- TASK-029: CD 동작 변경은 Gate C
- TASK-030: Production 배포 / 최초 생성 / 파괴적 Migration은 Human Approval
- TASK-031: Resource 삭제, RDS Snapshot / Delete, Budget, Destructive Cleanup은 Human Approval
- TASK-032: Secret 검사 차단 기준 완화, 새 Dependency는 Human Approval
- TASK-033: DEC-023 변경(MySQL 8.4), Dependency Version 변경은 Gate C
- TASK-034: 허용 문자열 기준, 기본 차단 규칙 변경은 Human Approval

---

## 6. 현재 Pending Decision

현재 Core MVP 구현을 막는 Pending Decision은 없다.

2026-10-03 TASK-027 현재 기준: 승인된 Application Template를 구현했으며 이 Task의 새 Human 결정은 없다. Current Task는 TASK-028 BLOCKED다. Human의 비용 승인과 Stack 생성 권한 결정 후 READY로 전환한다. DONE은 PR 구현 완료 반영이며 최종 완료 승인은 Human Squash Merge다. 아래 TASK-025 당시 서술은 이력이며 현재 상태는 3절과 Task 목록을 따른다.

DEC-026 / DEC-027 / DEC-028 / DEC-029는 Human Approved다. TASK-025에 미해결 Human Gate는 없다. TASK-025 DONE / TASK-026 READY는 이번 PR 완료 반영이며 Human Squash Merge로 확정한다. TASK-026은 Human의 Permission Set / Profile 구성과 실제 Profile Preflight 확인 후 명시 실행하며 TASK-027 이후 BLOCKED다. Domain 8949db.kr / HTTPS origin은 승인 완료이며 DNS 위임 복구와 hostname 최종 확정은 TASK-026 전 후속 조건이다. DEC-023 변경은 별도 Decision / Gate / Task가 필요하다. 미조회 단가 / ACM 비용 / Region 가용성은 TASK-026 전에 확인한다. 후속 Gate의 해당 실행은 승인 전에 수행하지 않는다.

DEC-014 Wellness Analysis Rule은 TASK-005 Gate B Human Review에서 Human Approved 되었으므로 Pending Decision이 아니다.
DEC-015 기술 Version은 Gate A와 Spring Boot Version Re-review에서 Human Approved 되었으므로 Pending Decision이 아니다.
DEC-016 Bootstrap Dependency Set은 Gate C와 Spring Boot Version Re-review에서 Human Approved 되었으므로 Pending Decision이 아니다.
DEC-019 Persistence Dependency / DB Schema는 TASK-006 Gate C Human Review에서 Human Approved 되었으므로 Pending Decision이 아니다.

---

## TASK-042 — Social Login / Guest / User Scoped Data

- Milestone 42 / DONE: 승인 Contract와 F-001 ~ F-007에 따른 Executor 구현 완료 반영이다. Orchestrator Verify / Claude PASS / Human Squash Merge를 대신하지 않는다.
- Dependency: TASK-029 / TASK-036 / TASK-039. Human 승인: 2026-10-04 제공된 Task Contract의 Gate 결정과 명시 Rework 실행 지시.
- Backend: 승인 Dependency 5개, Java 제공자 등록, JDBC Session / CSRF / JSON 오류, V3 사용자 / Session Migration, 사용자별 저장 / 최신 / 이력.
- Frontend: 로그인 화면, 미인증 / 401 이동, Cookie / CSRF 요청, 아바타 메뉴. 로고 / 날짜 영역은 유지한다.
- Smoke / 계약 / 인증 운영 문서를 갱신했다. Frontend 126 Test와 Build, 두 Smoke Script 구문 검사, Diff 공백 검사를 수행했다. Backend Compile / H2 / MySQL / Container 검증은 Sandbox 밖 Orchestrator가 판정한다.
- 실서비스 Google / Kakao 로그인은 TASK-043 이후 확인한다. 다른 Task 상태와 기존 Current Task는 변경하지 않았다.

## TASK-043 — Infra: OAuth 값 주입 — App / IAM Stack

- Milestone 43 / DONE: 승인 Contract와 명시 실행 지시에 따른 Executor 구현 완료다. Verify / Review / Human Squash Merge 전 최종 완료 승인이 아니다.
- Dependency: TASK-042 Merge(PR #24), Staging 체험 로그인 확인. Human Approved 2026-10-04 / DEC-035.
- 구현: 조건부 OAuth 주입과 ExecutionRole 권한, 필수 공개 HTTPS 주소, 체험 로그인 Parameter 및 배포 문서. 실제 적용은 Merge 후 Human이 수행한다. 다른 Task 상태와 Current Task는 유지한다.
- 범위: Secrets Manager / ECS 환경 변수 주입, 환경별 공개 주소 및 제공자 Callback 등록, Google / Kakao 실제 로그인 확인.
- Production 승인과 IAM / Infra 변경 Gate를 유지한다. 실제 값은 Repository / Prompt / Log에 기록하지 않는다.

## TASK-044 — Check-in Region Record (지역 저장 / Dashboard · History 표시)

- Milestone 44 / DONE: 2026-10-04 Human 승인 Contract와 명시 실행 지시에 따른 Executor 구현 완료 반영이다. Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge를 대신하지 않는다.
- Dependency: TASK-040 / TASK-042. DEC-036는 지역 이름 저장만 승인하며 좌표 비전송 / 비저장과 사용자별 분리를 유지한다.
- Backend: 선택 region 검증 / V4 nullable 컬럼 / 생성·최신·이력 반환, H2 / MySQL 저장·Migration / 사용자 분리 테스트.
- Frontend: 자동 조회된 이름만 전송하고 직접 입력 수정 시 유지한다. 대체 문구는 보내지 않으며 Dashboard / History / 결과에 지역이 있을 때만 표시한다.
- API 예시의 region은 null로 유지하며 개인정보 안내 / 승인 Decision / Prompt / README를 갱신했다. 자체 실행은 npm 캐시 / Gradle 잠금 / Docker 권한 제약으로 제한되었다. 상세 증거는 WORK_LOG를 따른다.
- Merge 후 Staging에서 저장 → Dashboard / History 표시와 지역 없는 기존 기록을 확인한다. 390 / 768 / 1280px 캡처 / 시각 검토를 남긴다. 다른 Task 상태와 TASK-030 / BLOCKED는 유지한다.

## TASK-045 — LLM Insight (AI 맞춤 코멘트 + 주간 리포트)

- Milestone 45 / DONE: Human Approved 2026-10-04 Contract와 Run 2 실행 지시의 Executor 구현 완료다. Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge를 대신하지 않는다.
- Dependency: TASK-042 / TASK-044. 생성 대상, 전송 자료, 비용 한도 및 AssumeRole 계정 구조는 DEC-037을 따른다.
- Backend: 꺼짐 기본값 / 지연 Client / V5 / 저장·재사용 / 소유권 / 소셜 사용자 / DB 시도 한도 / 주간 리포트 / 실패 fallback과 Test.
- Frontend: 결과 자동 생성, Dashboard 조회와 버튼, History 주간 리포트, 꺼짐 숨김 / 체험 안내 / 진행·실패·한도·기록 부족 안내.
- Sandbox의 npm 캐시 접근과 Docker 권한 / app.jar 부재로 자체 실행 검증과 캡처가 제한됐다. 검증 기준은 Orchestrator이며 실행 성공을 주장하지 않는다. 실제 Bedrock 호출은 TASK-046 뒤 Staging에서 확인한다.

## TASK-046 — LLM Value Injection (Infra)

- Milestone 46 / DONE: 2026-10-04 승인 Contract와 명시 실행 지시에 따른 Executor 구현 완료다. Verify / Claude Review / Human Squash Merge를 대신하지 않는다.
- Dependency: TASK-043 / TASK-045. DEC-038(A안)에 따른 조건부 ECS 환경 값과 TaskRole의 특정 호출 Role AssumeRole 권한, 다른 계정 Policy 예시와 Human 적용 절차를 구현했다.
- TASK-045 문서가 없어 [24-LLM-INFRA.md](24-LLM-INFRA.md)에 기록했다. 다른 Task 상태와 Current Task TASK-030 / BLOCKED는 유지한다.
- 자체 IaC 검증은 실행 환경의 AWS CLI 부재로 시작 단계에서 중단됐다. 실제 Template 오류 판정이 아니며 Sandbox 밖 Orchestrator Verify가 기준이다. 실제 호출 / 비용 확인은 Merge 후 Human 실행이다.

## TASK-047 — UI Polish (AI 코멘트 자동 생성 / 음식 아이콘 / History 페이지 나누기)

- Milestone 47 / DONE: 2026-10-04 승인 Contract와 명시 실행 지시에 따른 Executor 구현 완료다. Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge 전 최종 완료 승인이 아니다.
- Dependency: TASK-036 / TASK-045. Dashboard와 결과 화면에서 저장된 코멘트가 없고 기능 및 계정이 이용 가능하면 자동 생성은 진입당 한 번만 한다. 실패 뒤 수동 다시 시도와 진행 표시를 제공한다.
- 공통 추천 음식 Card에 이름 낱말 기반 장식 Emoji를 추가했다. 현재 규칙의 모든 음식 이름과 기본 아이콘 / 접근성 Test를 추가했고 음악과 추천 규칙은 유지한다.
- History 기록은 최신순으로 5개씩 표시하며 이전 / 다음, 위치 알림, 제목 focus와 기록 감소 시 페이지 보정을 제공한다. 그래프와 주간 리포트는 전체 기록을 사용한다.
- Sandbox의 npm 캐시 EPERM으로 자체 Verify가 설치 단계에서 중단되어 Test / Build를 실행하지 못했다. 판정은 Sandbox 밖 Orchestrator Verify이며 Claude 세션이 390 / 768 / 1280px 화면 캡처를 확인한다. 다른 Task 상태와 Current Task TASK-030 / BLOCKED는 유지한다.


## TASK-048 — Recommendation Variety (추천 다양화) + History 여백

- 상태: DONE (Executor 구현 완료, 최종 완료 승인 대기).
- Milestone: 48. Dependency: TASK-036 / TASK-042 / TASK-047. Human Approved 2026-10-04 / DEC-040.
- 음식 기분 8개 / 상황 6개, 음악 기분 13~26곡 / 상황 6~10곡의 Code 상수 Pool과 서울 날짜별 순환 선택을 구현했다. 기분 3개 / 상황 2개와 중복 제거, 기존 판정 / 저장 기록 / API 형식을 유지한다.
- 계약 예시 / API 문서 / Smoke 검사, 전체 메뉴별 Emoji Test와 History 공통 Card 간격을 동기화했다.
- 자체 Verify는 npm 캐시 EPERM으로 설치 단계가 중단됐다. Backend 단독 Test는 Gradle Wrapper lock 생성 제한, Container Smoke는 JAR 미생성과 Docker 접근 제한으로 실행하지 못했다. 검증 기준은 Sandbox 밖 Orchestrator Verify이며 통과를 주장하지 않는다.
- 다른 Task 상태와 Current Task TASK-030 / BLOCKED는 유지한다. Human Squash Merge 후 Staging에서 날짜 변화와 Smoke를 확인한다.

## TASK-049 — LLM Runtime Endpoint / Failure Diagnostics

- 상태: DONE (Executor 구현 완료), Milestone 49.
- 승인: 2026-10-04 Human 승인 Contract 및 명시 실행 지시. Dependency는 TASK-045 / TASK-046이다.
- 기본 runtime / 선택 mantle Backend, 동일 요청 설정, 마스킹된 HTTP 오류 진단과 거절 / 길이 초과 단일 로그를 구현했다. InvokeModel 권한 예시와 운영 문서를 갱신했다.
- 선택 Logic / 오류 문장 정리 / 실패 로그 Test를 추가했다. 실제 Bedrock 호출은 수행하지 않았다.
- Sandbox 자체 Verify는 npm 캐시 stat EPERM으로 설치 단계에서 중단됐다. Orchestrator Verify / Claude Review / Remote CI / Human Squash Merge가 최종 기준이며 DONE은 이를 대신하지 않는다.
- Merge / 자동 배포 후 Human이 다른 계정 호출 Role의 권한을 추가하고 Staging 실제 생성을 확인한다. 400이 추론 Profile을 요구하면 정확한 ID를 확인해 LlmModelId와 App Stack을 갱신한다. 다른 Task 상태와 Current Task는 유지한다.

## TASK-050 — Skip Staging CD for Docs-only Changes

- 상태: DONE (Executor 구현 완료), Milestone 50.
- 승인: 2026-10-04 Human 직접 지시와 승인 Contract, Gate C / DEC-039. Dependency는 TASK-029 / TASK-039다.
- 자동 실행에 읽기 전용 판정 Job을 추가했다. 문서 전용이면 배포 Job을 생략하며 수동 실행 / 판정 실패 / 파일 0개는 배포한다. CI와 기존 배포 Step은 유지한다.
- 자체 참고 검증: 판정 Script 8개 분기 및 기존 배포 본문 / Trigger / concurrency 보존 확인, git diff --check 통과. 현재 Python에 PyYAML이 없어 Contract YAML 구조 검사는 실행하지 못했다. 설치하지 않았으며 Sandbox 밖 Orchestrator Verify가 기준이다.
- DONE은 Verify / Claude Review / Remote CI / Human Squash Merge를 대신하지 않는다. Merge 후 문서 전용 / 코드 포함 자동 실행 및 수동 실행을 확인한다. 다른 Task 상태와 Current Task TASK-030 / BLOCKED는 유지한다.

## TASK-051 — AI Comment Readability

- 상태: DONE (Executor 구현 완료), Milestone 51.
- 승인: 2026-10-04 Human 명시 실행 지시와 [TASK-051 Contract](tasks/TASK-051_AI_COMMENT_READABILITY.md).
- 코멘트의 문장별 줄바꿈과 주간 리포트 문단 Prompt, 줄바꿈 없는 응답의 결정적 보정과 기존 줄 정리를 구현했다. 길이 제한과 저장 / 실패 처리를 유지한다.
- 상태 / 날씨는 기존 한국어 표시 이름으로 모델에 보내며 개인정보 제외와 입력 범위를 유지한다. 결과 화면은 날씨 / 지역 → 추천 → AI 코멘트 → 버튼 순서와 기존 간격 Token을 적용한다. Dashboard 위치는 유지한다.
- Backend 문장 / 소수점 / 약어 / 기존 줄 / 길이 제한과 입력 투영 Test, Frontend DOM 순서 / 줄바꿈 본문 Class Test를 추가했다.
- Executor 자체 Verify는 npm 캐시 접근 EPERM으로 설치 단계에서 중단됐다. Sandbox 밖 Orchestrator Verify가 기준이며 DONE은 검증 / Review / 최종 완료 승인을 뜻하지 않는다.
- Claude 세션의 390 / 768 / 1280px 화면 캡처와 Merge 후 Staging 새 생성 확인이 남는다. 다른 Task 상태와 Current Task TASK-030 / BLOCKED는 유지한다.
