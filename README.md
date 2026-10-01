# MoodFit v3

MoodFit v3는 사용자의 신체 리듬 정보와 날씨 정보를 기반으로 현재 웰니스 상태를 추정하고, 음식과 음악을 추천하는 Full-stack 프로젝트입니다.

이번 버전의 핵심은 기능 구현 자체보다 **Harness Engineering을 적용한 Codex 개발 프로세스**에 있습니다.

- Repository: https://github.com/youneedpython/MoodFit-v3 (이전 이름: `today-v3`)

## v3 핵심 목표

```text
Specification
    ↓
Rules
    ↓
Plan
    ↓
Human Approval
    ↓
Task
    ↓
Implementation
    ↓
Verification
    ↓
Work Log
```

## 현재 단계

현재 Repository는 **TASK-011 — Verification Hardening 완료** 단계입니다.

Current Task:

```text
TASK-012 — GitHub Actions Bot
READY (Gate C Human Approved, DEC-021)
```

진행 흐름:

```text
Requirements Review → Decision Sync → Implementation Plan
    ↓
Gate A Technology Version Approval → Task Definition
    ↓
Gate C Bootstrap Dependency Approval → Pre-Bootstrap Sync → Spring Boot Version Re-review
    ↓
TASK-001 ~ TASK-003   Project Bootstrap / Local Verification / GitHub Actions CI
    ↓
TASK-004 ~ TASK-006   Backend Skeleton / Wellness Rule(Gate B) / Backend Core
    ↓
TASK-007 ~ TASK-010   Frontend Foundation / Daily Check-in / Dashboard / History
    ↓
TASK-011              Verification Hardening
    ↓
TASK-012              GitHub Actions Bot  ← 현재 (실행 지시 대기)
```

Task별 진행 결과:

| Task | 주요 결과 | 상태 |
|---|---|---|
| TASK-001 Project Bootstrap | Frontend / Backend 최소 Skeleton 생성, Test / Build 검증 | DONE |
| TASK-002 Local Verification Harness | `scripts/verify.ps1`, `scripts/verify.sh` 구성, 성공 / 실패 경로 검증 | DONE |
| TASK-003 GitHub Actions CI | DEC-017 기준 `.github/workflows/ci.yml`, `frontend` / `backend` Job | DONE |
| TASK-004 Backend Domain / API Skeleton | API Skeleton, Validation / Error Response 구조 | DONE |
| TASK-005 Wellness Rule Approval | Gate B를 거쳐 Wellness Analysis / Recommendation Rule을 DEC-014로 확정 | DONE |
| TASK-006 Backend Domain / API Core | Check-in 저장, DEC-014 분석 / 추천, 최신 / History 조회, Local MySQL 실행 확인 | DONE |
| TASK-007 Frontend Foundation | Route 구조, 공통 Layout / Component, Design Token, API Client | DONE |
| TASK-008 Daily Check-in | 입력, Validation, 제출 / 오류 / 결과 요약 흐름 | DONE |
| TASK-009 Dashboard | 최신 결과, 5개 Body Metric, 음식 / 음악 추천, Empty / Loading / Error 상태 | DONE |
| TASK-010 History / Trend | 최근 7일 Wellness Score Trend, 날짜별 Mood / Metric / 추천 이력(DEC-020) | DONE |
| TASK-011 Verification Hardening | 전체 Local / Remote CI 재검증, Verification Gap(GAP-1 ~ GAP-6) 정리 | DONE |

Core Feature(Daily Check-in, Dashboard, History / Trend) 구현이 완료되었습니다.

TASK-011 Verification Hardening이 완료되었고, TASK-012 GitHub Actions Bot의 Gate C Human Approval(DEC-021)이 완료되어, 현재는 사용자의 명시적인 TASK-012 실행 지시를 기다리고 있습니다.
각 Task의 상세 기록은 `docs/08-WORK_LOG.md`, 승인된 결정은 `docs/09-DECISIONS.md`를 참고합니다.

## 현재 구조

```text
MoodFit-v3/
├── AGENTS.md
├── README.md
├── .gitignore
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── milestones.yml
├── frontend/
│   └── React + TypeScript + Vite (Router / Design System / API Client / Daily Check-in / Dashboard / History)
├── backend/
│   ├── Spring Boot + Spring Data JPA + Flyway (Check-in API)
│   └── src/main/java/com/moodfit/
│       ├── config/
│       ├── controller/
│       ├── dto/
│       ├── entity/
│       ├── exception/
│       ├── repository/
│       └── service/
├── scripts/
│   ├── verify.ps1
│   ├── verify.sh
│   └── create-milestones.js
├── docs/
│   ├── 01-PROJECT.md
│   ├── 02-V1-REFERENCE.md
│   ├── 03-UX_UI_SPEC.md
│   ├── 04-ARCHITECTURE.md
│   ├── 05-API_SPEC.md
│   ├── 06-PLAN.md
│   ├── 07-TASKS.md
│   ├── 08-WORK_LOG.md
│   ├── 09-DECISIONS.md
│   ├── 10-WELLNESS-RULE-PROPOSAL.md
│   └── images/ (Task별 화면 검토 캡처)
└── prompts/
    ├── README.md
    └── 01 ~ 22 Prompt History
```

## Local 실행

Test와 CI는 H2 In-memory DB로 실행되므로 MySQL이 필요 없습니다.
Backend를 직접 실행할 때만 Local MySQL이 필요합니다.

```bash
# 1. v3 전용 DB 생성 (최초 1회)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS moodfit_v3 CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

# 2. .env.example을 복사해 .env.local 작성 (Commit 금지)
#    DB_URL=jdbc:mysql://localhost:3306/moodfit_v3

# 3. 환경변수 불러오기 (Git Bash, 새 터미널마다)
set -a; source .env.local; set +a

# 4. Backend 실행 (Flyway가 Table을 자동 생성)
cd backend && ./gradlew bootRun
```

- DB 이름은 `moodfit_v3`처럼 v3 전용으로 사용합니다. today-v2가 사용하는 `moodfit` DB를 공유하면 Flyway가 실행을 중단합니다.
- `.env.local`은 `.gitignore`로 제외되어 Git Commit 대상이 아닙니다.
- 프로젝트 ZIP / 학생 배포본을 만들 때는 `.env.local`과 `.git/` 폴더를 제외합니다. 폴더 전체를 압축하면 Git 제외 대상 파일도 함께 포함됩니다.

## 보조 스크립트

- `scripts/create-milestones.js`: `docs/07-TASKS.md`의 Milestone 1~12를 GitHub Milestone으로 생성하는 일회성 도구입니다. TASK 산출물이나 Local Verification / CI 대상이 아닙니다.
  - 실행: `GITHUB_TOKEN` 환경변수를 설정한 뒤 `node scripts/create-milestones.js`
  - Token은 Repository에 Commit하지 않습니다.
- `.github/workflows/milestones.yml`: `docs/07-TASKS.md`에서 DONE이 된 Task의 GitHub Milestone을 자동으로 Close합니다. (DEC-018)
  - Milestone을 처음 생성한 직후에는 GitHub Actions 화면에서 `Sync Milestones`를 수동 실행(`workflow_dispatch`)하면 이미 DONE인 Milestone이 Close됩니다.

## v1 / v2 / v3 비교

| 버전 | 핵심 |
|---|---|
| v1 | 자연어 요청 중심의 UI 프로토타입 |
| v2 | Markdown 명세 기반 Full-stack 구현 + GitHub Actions CI |
| v3 | Harness 기반 계획·Task·검증·기록 중심 개발 |

## 기술 스택

- Frontend: Node.js 24.21.0 + React 19.3.0 + TypeScript 6.0.2 + Vite 8.3.1
- Backend: Java 21 + Spring Boot 4.1.1 + Gradle Wrapper 8.14.5
- Database: MySQL
- CI: GitHub Actions

정확한 기술 Version과 Bootstrap Dependency는 이미 Human Approved 상태입니다.
Version 결정은 `docs/09-DECISIONS.md`의 DEC-015를 따르고,
Bootstrap Dependency Set은 DEC-016을 Source of Truth로 사용합니다.

## 다음 단계

1. TASK-012 GitHub Actions Bot 실행 (DEC-021: CI Step Summary)
2. Remote CI 확인 및 TASK-012 Human Review
3. 필요 시 TASK-011 후속 보완 작업 후보(FU-1 ~ FU-4) 승인 및 진행
