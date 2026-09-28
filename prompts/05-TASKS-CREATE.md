# Prompt 05 — Tasks Create

## 목적

승인된 docs/06-PLAN.md를 기준으로
MoodFit v3의 구현 작업을 실행 가능한 Task 단위로 분해하고
docs/07-TASKS.md를 생성한다.

## 실행 단계

Planning Approval
→ Gate A Approval
→ Task Definition

## 사용 Context

AGENTS.md

docs/01-PROJECT.md
docs/02-V1-REFERENCE.md
docs/03-UX_UI_SPEC.md
docs/04-ARCHITECTURE.md
docs/05-API_SPEC.md
docs/06-PLAN.md
docs/09-DECISIONS.md

## 실제 Prompt

아래 내용을 이번 작업의 전체 지시사항으로 기록한다.

---
AGENTS.md와 다음 문서를 먼저 읽어.

- docs/01-PROJECT.md
- docs/02-V1-REFERENCE.md
- docs/03-UX_UI_SPEC.md
- docs/04-ARCHITECTURE.md
- docs/05-API_SPEC.md
- docs/06-PLAN.md
- docs/09-DECISIONS.md
- prompts/README.md
- prompts/04-GATE-A-TECH-VERSIONS.md

현재 상태:

- docs/06-PLAN.md Human Approved
- Gate A Human Approved
- DEC-015 기술 Version Human Approved
- DEC-014 Wellness Analysis Rule Pending
- 아직 Frontend/Backend Project Bootstrap은 수행하지 않음

이번 작업의 목적은 docs/06-PLAN.md를 실제 실행 가능한 Task 단위로 분해하여 docs/07-TASKS.md를 생성하는 것이다.

아직 실제 구현은 하지 않는다.

생성할 Prompt History:

- prompts/05-TASKS-CREATE.md

생성할 Task 문서:

- docs/07-TASKS.md

docs/07-TASKS.md는 다음 Task 상태를 사용한다.

- READY
- BLOCKED
- IN_PROGRESS
- REVIEW
- DONE

현재 실제 구현을 시작하지 않았으므로 IN_PROGRESS나 DONE 상태는 사용하지 않는다.

기본 Task 목록:

- TASK-001 Project Bootstrap
- TASK-002 Initial Local Verification Harness
- TASK-003 Initial GitHub Actions CI
- TASK-004 Backend Domain / API Skeleton
- TASK-005 Wellness Analysis / Recommendation Rule Approval
- TASK-006 Backend Domain / API Core
- TASK-007 Frontend Foundation / Design System
- TASK-008 Daily Check-in
- TASK-009 Dashboard
- TASK-010 History / Trend
- TASK-011 Verification Hardening
- TASK-012 GitHub Actions Bot

현재 실행 가능한 Task는 TASK-001뿐이므로 TASK-001은 READY, TASK-002부터 TASK-012는 BLOCKED로 둔다.
단, 각 Task의 실제 Dependency를 명확히 기록한다.

TASK-001은 가장 상세하게 작성한다.

TASK-001에는 다음을 포함한다.

- 상태
- 목적
- 선행 조건
- 승인된 기술 Version
- 작업 범위
- 제외 범위
- Dependency 정책
- 예상 산출물
- Verification
- 완료 조건
- Human Approval

TASK-001은 Gate A에서 승인된 기술 Version을 사용하여 Frontend와 Backend의 최소 실행 가능한 Project Skeleton을 생성하는 Task로 정의한다.
Feature 구현은 포함하지 않는다.

TASK-001 승인된 기술 Version:

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
- Spring Boot 3.5.16
- Gradle Wrapper 8.14.5

TASK-001 제외 범위:

- Dashboard 구현
- Daily Check-in 구현
- History 구현
- Wellness Analysis Rule 구현
- Recommendation Rule 구현
- Entity/DTO/API Core 구현
- MySQL Integration Test
- GitHub Actions 생성
- scripts/verify.ps1 생성
- scripts/verify.sh 생성
- GitHub Actions Bot 생성
- Recommendation Refresh 구현
- 인증/인가 구현

TASK-002부터 TASK-012는 목적, 상태, 선행 Dependency, 주요 산출물, Verification, Human Approval 또는 Gate 여부, 완료 조건을 포함한다.

특히 다음 의존성을 지킨다.

- TASK-002는 TASK-001 완료 후 실행 가능
- TASK-003은 TASK-002 Local Verification 성공 후 가능하며 Gate C 적용
- TASK-004는 초기 CI까지 정상화된 후 Backend API Skeleton 진행
- TASK-005는 DEC-014 후보 Rule을 제안하는 Human Approval Task이며 실제 Wellness Rule 구현 금지, Gate B
- TASK-006은 TASK-005와 Gate B 승인 후에만 가능
- TASK-007부터 TASK-010은 docs/06-PLAN.md의 Feature 순서를 따른다.
- 각 Feature마다 Local Verification과 CI 검증 범위를 확장한다.
- TASK-011은 전체 Core Feature 완료 후 Verification Hardening
- TASK-012는 Core Feature, Local Verification, CI 안정화 후 실행하며 Source Code 자동 수정 Bot은 초기 범위에서 제외

AGENTS.md의 작업 전 읽기 순서 또는 Source of Truth 규칙을 확인한다.
docs/06-PLAN.md와 docs/07-TASKS.md가 구현 단계에서 읽어야 할 문서로 이미 정의되어 있다면 AGENTS.md를 수정하지 않는다.
정의되어 있지 않다면 AGENTS.md의 읽기 순서 부분에만 최소한으로 추가한다.

prompts/README.md의 Prompt Index에 다음 항목을 추가한다.

05 | Tasks Create | Task Definition | Human Review 중

작업 범위 제한:

- Frontend 프로젝트 생성 금지
- Backend 프로젝트 생성 금지
- npm init 금지
- npm create vite 금지
- npm install 금지
- Gradle Project 생성 금지
- Spring Boot Project 생성 금지
- Dependency 설치 금지
- package.json 생성 금지
- package-lock.json 생성 금지
- build.gradle 생성 금지
- application 설정 파일 생성 금지
- scripts 생성 금지
- GitHub Actions 생성 또는 수정 금지
- Wellness Rule 결정 금지
- docs/09-DECISIONS.md 수정 금지
- Project Bootstrap 실행 금지
- git commit 금지
- git push 금지

작업 완료 후 다음을 보고한다.

1. 생성한 파일
2. 수정한 파일
3. 전체 Task 목록과 상태
4. Current Task
5. TASK-001 주요 범위
6. TASK-001 제외 범위
7. TASK-001 Verification
8. Human Approval이 필요한 Task
9. AGENTS.md 수정 여부와 이유
10. git status --short 결과

보고 후 작업을 멈추고 TASK-001을 실행하지 말고 Human Review를 기다린다.
---

## 기대 산출물

- docs/07-TASKS.md
- 전체 Task 목록
- Task 간 의존성
- TASK-001 Project Bootstrap 상세 정의
- Human Approval이 필요한 Task 표시

실제 구현 코드는 생성하지 않는다.

## Human Approval

필수.

TASK-001 실행 전에 Human Review를 받아야 한다.

## 상태

실행 완료 / Human Approved

## Related Commit

Pending
