# Prompt 35 — Agent 자동화 / AWS 배포 Roadmap 검토와 등록 (TASK-018 ~ TASK-031)

## 목적

Human이 추가한 Agent 자동화 / AWS 배포 Roadmap 문서를 검토해 보완하고,
TASK-018 ~ TASK-031을 `docs/07-TASKS.md`와 GitHub Milestone에 등록한다.

## 실행 단계

v3.0.0 Release
→ Roadmap 문서 검토 요청 (Human)
→ 검토 결과 보고 / Human 결정 (SSO 범위, FU-6 순서, Agent API 미사용)
→ 문서 재구성 (`docs/tasks/`)
→ Agent CLI 사전 검증 (Spike)
→ Orchestrator 언어 확정 (Node.js 24 + `.mjs`)
→ Roadmap 등록 (0단계)

## 사용 Context

AGENTS.md
docs/06-PLAN.md
docs/07-TASKS.md
docs/08-WORK_LOG.md
docs/09-DECISIONS.md (DEC-015, DEC-023, DEC-025)
docs/tasks/
scripts/create-milestones.js

## 실제 Prompt

```text
앞으로 개발은 agent 2개를 사용하여 완전 자동화하려고 해.
aws에 배포하고, 이후 개발은 CI/CD로 진행했으면 해.
docs에 추가된 md 파일을 보고, 아래 사항에 적합한지 검토

- agent 2개로 완전 자동화
- 실행: codex, 검토: claude, 승인: Human
- aws sso를 이용한 배포

이후, 수정/보완이 필요한 부분이 있으면 알려줘.
```

```text
- sso 범위: 사람이 로그인까지 진행, 이후 작업은 agent 진행
- FU-6 순서 앞당겨
- agent는 api 사용하지 않고, 현재 vs code에 로그인된 상태에서 사용하는 거야.
```

```text
agent로 완전 자동하기 위한 orchestration harness 구현 가능? 어떤 방식으로 하는게 권장이야?
```

```text
시간이 너무 길어. 5분 정도로 사전 검증(spike) 가능?
A로 진행.  (Codex CLI npm 전역 설치)
```

```text
Orchestrator를 js 파일로 생성해야 하지 않아?
응, 반영해.
```

```text
좋아! 커밋 후 0단계(Roadmap 등록) 진행!
```

## 결정 내용

| 항목 | 결정 |
|---|---|
| AWS SSO | Human이 로그인, 이후 Agent가 허용된 Profile로 작업 (Production은 Human 전용) |
| CI / CD 인증 | GitHub OIDC (SSO는 CI에서 사용 불가) |
| Agent 실행 | API Key 미사용, VS Code 로그인 계정으로 로컬 실행 (CLI 공유) |
| FU-6 | TASK-018로 앞당김 (2026-10-19 전 완료 목표) |
| Orchestrator 방식 | 결정적 Script + 로컬 CLI |
| Orchestrator 언어 | Node.js 24 + JavaScript(`.mjs`), Dependency 없음 |
| Multi-Agent 정책 Decision | DEC-026 (TASK-019) |

## 산출물

- `docs/tasks/` (Roadmap, COMMON, TASK-018 ~ TASK-031) — Commit `3ca9830`
- `docs/README.md` docs 색인 — Commit `3ca9830`
- `docs/07-TASKS.md`, `docs/06-PLAN.md`, `scripts/create-milestones.js`, `AGENTS.md` Roadmap 등록
- `docs/08-WORK_LOG.md` Out-of-Task 기록

## 상태

완료 (Milestone 18 ~ 31 생성 확인, Human 실행)

## Related Commit

- `3ca9830` docs: Agent 자동화 / AWS 배포 Roadmap 문서 추가 (TASK-018 ~ TASK-031)
- `5d7d8b4` docs: TASK-018 ~ TASK-031 Roadmap 등록 및 Milestone 연결
