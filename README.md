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

현재 Repository는 **TASK-001 — Project Bootstrap 완료** 단계입니다.

Current Task:

```text
TASK-002 — Initial Local Verification Harness
BLOCKED (Human Approval 대기)
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
```

Frontend / Backend 최소 Skeleton이 생성되었고 Test / Build Verification과 Human Review가 완료되었습니다.
현재는 TASK-002 실행에 대한 Human Approval을 기다리는 상태입니다.

## 현재 구조

```text
today-v3/
├── AGENTS.md
├── README.md
├── .gitignore
├── .env.example
├── frontend/
│   └── React + TypeScript + Vite Skeleton
├── backend/
│   └── Spring Boot + Gradle Wrapper Skeleton
├── docs/
│   ├── 01-PROJECT.md
│   ├── 02-V1-REFERENCE.md
│   ├── 03-UX_UI_SPEC.md
│   ├── 04-ARCHITECTURE.md
│   ├── 05-API_SPEC.md
│   ├── 06-PLAN.md
│   ├── 07-TASKS.md
│   ├── 08-WORK_LOG.md
│   └── 09-DECISIONS.md
└── prompts/
    ├── README.md
    └── 01 ~ 09 Prompt History
```

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

1. TASK-002 Initial Local Verification Harness 실행 Human Approval
2. `scripts/verify.ps1`, `scripts/verify.sh` 구성
3. TASK-002 Verification 및 Work Log 기록
4. TASK-002 Human Review
5. TASK-003 Initial GitHub Actions CI 준비
