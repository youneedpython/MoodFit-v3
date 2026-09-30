# MoodFit v3

MoodFit v3는 사용자의 신체 리듬 정보와 날씨 정보를 기반으로 현재 웰니스 상태를 추정하고, 음식과 음악을 추천하는 Full-stack 프로젝트입니다.

이번 버전의 핵심은 기능 구현 자체보다 **Harness Engineering을 적용한 Codex 개발 프로세스**에 있습니다.

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

현재 Repository는 **TASK-006 — Backend Domain / API Core 완료** 단계입니다.

Current Task:

```text
TASK-007 — Frontend Foundation / Design System
READY (실행 지시 대기)
```

완료된 Harness 단계는 다음과 같습니다.

```text
Requirements Review
    ↓
Decision Sync
    ↓
Implementation Plan
    ↓
Gate A Technology Version Approval
    ↓
Task Definition
    ↓
Gate C Bootstrap Dependency Approval
    ↓
Pre-Bootstrap Sync
    ↓
Spring Boot Version Re-review
    ↓
TASK-001 Project Bootstrap
    ↓
TASK-002 Initial Local Verification Harness
    ↓
TASK-003 Initial GitHub Actions CI
```

Frontend / Backend 최소 Skeleton이 생성되었고 Test / Build Verification과 Human Review가 완료되었습니다.
`scripts/verify.ps1`, `scripts/verify.sh` Local Verification Harness가 구성되었고 성공/실패 경로 검증과 Human Review가 완료되었습니다.
DEC-017 기준 GitHub Actions CI(`.github/workflows/ci.yml`)가 구성되었고, Remote CI에서 `frontend` / `backend` Job이 모두 성공했으며 Human Review가 완료되었습니다.
TASK-004 Backend API Skeleton 구현, Local / Remote CI Verification, Human Review가 완료되었습니다.
TASK-005 Gate B Human Review를 거쳐 Wellness Analysis / Recommendation Rule이 DEC-014로 확정되었습니다.
TASK-006에서 Check-in 저장, DEC-014 분석 / 추천, 최신 / History 조회를 구현했고 Local / Remote CI Verification, Local MySQL 실행 확인, Human Review를 완료했습니다.
현재는 사용자의 명시적인 TASK-007 실행 지시를 기다리는 상태입니다.

## 현재 구조

```text
today-v3/
├── AGENTS.md
├── README.md
├── .gitignore
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── milestones.yml
├── frontend/
│   └── React + TypeScript + Vite Skeleton
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
│   └── 10-WELLNESS-RULE-PROPOSAL.md
└── prompts/
    ├── README.md
    └── 01 ~ 17 Prompt History
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

1. TASK-007 Frontend Foundation / Design System 실행
2. 필요 시 UI / Frontend Dependency Gate C 검토
3. Local Verification 및 Remote CI 확인
4. TASK-007 Human Review
