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

현재 Repository는 **TASK-001 — Project Bootstrap 실행 준비** 단계입니다.

Status:

```text
READY
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
```

현재는 실제 Project Bootstrap 실행 직전이며, 사용자의 명시적인 TASK-001 실행 지시를 기다리는 상태입니다.

## 초기 구조

```text
today-v3/
├── AGENTS.md
├── README.md
├── .gitignore
├── docs/
│   ├── 01-PROJECT.md
│   ├── 02-V1-REFERENCE.md
│   ├── 03-UX_UI_SPEC.md
│   ├── 04-ARCHITECTURE.md
│   ├── 05-API_SPEC.md
│   ├── 06-PLAN.md
│   ├── 07-TASKS.md
│   └── 09-DECISIONS.md
└── prompts/
    ├── README.md
    └── 01 ~ 08 Prompt History
```

## v1 / v2 / v3 비교

| 버전 | 핵심 |
|---|---|
| v1 | 자연어 요청 중심의 UI 프로토타입 |
| v2 | Markdown 명세 기반 Full-stack 구현 + GitHub Actions CI |
| v3 | Harness 기반 계획·Task·검증·기록 중심 개발 |

## 예정 기술 스택

- Frontend: React + TypeScript + Vite
- Backend: Java 21 + Spring Boot + Gradle Wrapper
- Database: MySQL
- CI: GitHub Actions

정확한 기술 Version과 Bootstrap Dependency는 이미 Human Approved 상태입니다.
Version 결정은 `docs/09-DECISIONS.md`의 DEC-015를 따르고,
Bootstrap Dependency Set은 DEC-016을 Source of Truth로 사용합니다.

## 다음 단계

1. TASK-001 Project Bootstrap 실행
2. TASK-001 Test / Build Verification
3. `docs/08-WORK_LOG.md` 최초 생성 및 TASK-001 작업 기록
4. TASK-001 Human Review
5. TASK-001 DONE
6. TASK-002 Initial Local Verification Harness 준비
