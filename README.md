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

현재 Repository는 **Harness Definition / Human Review** 단계입니다.

아직 Frontend / Backend 구현을 시작하지 않습니다.

프로젝트 목적, v1 UI 참고 기준, UI/UX 요구사항, 아키텍처, API Contract를 문서로 검토·정리한 뒤 첫 Harness Checkpoint를 Commit하고, 그 다음 Codex가 구현 계획을 작성합니다.

## 초기 구조

```text
today-v3/
├── AGENTS.md
├── README.md
├── .gitignore
└── docs/
    ├── 01-PROJECT.md
    ├── 02-V1-REFERENCE.md
    ├── 03-UX_UI_SPEC.md
    ├── 04-ARCHITECTURE.md
    └── 05-API_SPEC.md
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

세부 버전과 추가 라이브러리는 구현 계획 검토와 Human Approval 후 확정합니다.

## 다음 단계

1. 초기 문서 Human Review 완료
2. Harness Definition 첫 Commit
3. Codex에게 문서 전체 검토 요청
4. Codex가 `docs/06-PLAN.md` 초안 작성
5. Human Review / Approval
6. `docs/07-TASKS.md` 생성
7. 프로젝트 Skeleton 구현 시작
