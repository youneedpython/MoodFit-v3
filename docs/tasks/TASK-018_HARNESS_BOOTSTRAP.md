# TASK-018 — Multi-Agent Harness Bootstrap (Policy + Minimal Orchestrator)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

이번 Roadmap의 핵심은 **Agent를 이용한 완전 자동화 개발**이다.
Codex가 실행하면 Claude가 **자동으로** 검토하고, Human은 승인이 필요한 지점에서만 개입한다. Human이 Agent 사이에서 결과를 옮기지 않는다.

이 Task는 그 흐름을 가능하게 하는 최소 기반을 만든다.

1. Multi-Agent 자동화 정책 (DEC-026, `docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md`)
2. 최소 Local Orchestrator: `codex exec` → Deterministic Verify → `claude -p` Review → Rework(최대 3회) → Gate에서 정지

TASK-019부터는 이 Orchestrator로 실행한다.

## 초기 상태 / Dependency

- 초기: `READY`
- 선행 Task 없음

## 실행 방식 (Bootstrap 예외)

Orchestrator가 아직 없으므로 이 Task만 **Claude Code 세션이 임시 Orchestrator 역할**을 한다.

- Claude 세션이 Bash로 `codex exec`를 직접 호출해 Codex에게 구현을 맡긴다.
- Claude 세션이 결과 Diff / Verification을 검토하고, `CHANGES_REQUIRED`면 Finding을 담아 Codex를 다시 호출한다. (최대 3회)
- Human은 DEC-026 승인, Commit / Push 승인, 최종 Human Review에만 개입한다.
- Claude가 흐름을 지휘하는 방식은 Bootstrap 1회에 한정한다. 이후 흐름 결정은 Script(Orchestrator) 규칙으로만 한다.

## 진행 단계

```text
A. 정책     Codex: DEC-026 초안 + 정책 문서 → Claude 자동 Review → Human: DEC-026 승인
B. 구현     Codex: 설계 문서 + 최소 Orchestrator + Test → Claude 자동 Review
C. 검증     Fake CLI Test + 실제 CLI Smoke Run(Repository 밖 임시 Git Repo)
D. 반영     Codex: 승인된 정책을 AGENTS.md에 반영 → Claude 자동 Review → Human Review → DONE
```

## A. 정책 (DEC-026)

Codex 작업 범위:

1. `docs/09-DECISIONS.md`에 `DEC-026 — Multi-Agent Automation Policy` 초안 추가 (`Pending Human Approval`)
2. `docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md` 작성
3. Codex / Claude / Orchestrator / Human의 권한과 금지
4. Agent 실행 방식: API Key 미사용, VS Code 로그인을 공유하는 로컬 CLI(`codex`, `claude`), Claude는 Read-only 도구, 사용량 한도 도달 시 `BLOCKED`
5. Human Gate: Dependency / Major Version, API Contract, DB Schema, Business Rule, CI / CD 동작, GitHub Permission, AWS Architecture, IAM / Network, 비용 Resource, Production, 파괴적 DB 작업, Secret 정책
6. Human 승인 채널: Bootstrap 단계에서는 Orchestrator가 정지 후 Human이 CLI / 대화로 승인, TASK-021 이후 PR Approve / Label, Production은 GitHub Environment Required Reviewer
7. 로그인 / 자격 증명: Human 로그인 후 Agent 진행, Agent 허용 Profile, 만료 시 `HUMAN_REQUIRED` (AWS 상세는 TASK-025)
8. Git 정책: Agent Branch만 자동화, `main` 직접 Push 금지, Force Push / History Rewrite 금지, Commit 형식과 Co-author Trailer (Git 자동화 구현은 TASK-021)
9. Review Loop: `PASS / CHANGES_REQUIRED / HUMAN_REQUIRED / BLOCKED`, `MAX_REVIEW_CYCLES=3`
10. Deterministic Verification과 AI Review의 역할 분리

Human Decision Matrix에 반드시 포함할 항목:

- Codex Source 수정 권한 / Commit / Push 권한
- Claude 완전 Read-only 여부
- Orchestrator Commit / Push / PR 권한 (단계별)
- Agent 실행 방식과 사용량 한도 처리
- Windows Codex Sandbox 모드: `elevated` / `unelevated`
- Agent CLI 설치 / Version 관리 (Codex npm 전역, Claude VS Code 확장 실행 파일 경로)
- Human 승인 채널
- AWS / GitHub 로그인 방식과 Agent 허용 Profile
- Auto Merge 조건, MAX_REVIEW_CYCLES, Human Gate 목록
- Secret 전달 / Log 정책
- Staging 자동 배포 허용 여부, Production 항상 Human Approval 여부
- Release / Tag 규칙(DEC-025)과 자동화의 관계

## B. 최소 Orchestrator

구현 언어 / Runtime (Human 확정, 2026-10-02):

| 항목 | 결정 |
|---|---|
| Runtime | Node.js `24.21.0` (`.nvmrc`) |
| 언어 | JavaScript ES Module (`.mjs`), 필요 시 JSDoc |
| Dependency | **없음** — Node 내장 Module만 사용 |
| Test | `node --test "scripts/orchestrator/*.test.mjs"` (Fake CLI) |
| 설정 / 계약 형식 | JSON |

Codex 작업 범위:

1. 설계 문서 `docs/12-ORCHESTRATOR-DESIGN.md`를 먼저 작성한다. (구성 요소, State Machine, Agent 호출 규격, Task Contract 형식, 실행 / 정지 / 재개 방법)
2. Entrypoint: `node scripts/orchestrator/run.mjs <TASK-ID>`
3. 최소 Phase: Preflight(CLI 로그인, Working Tree) → Execute(`codex exec`) → Verify(`scripts/verify.sh` 또는 Task가 지정한 명령) → Review(`claude -p`) → Decide
4. Verdict는 `PASS`, `CHANGES_REQUIRED`, `HUMAN_REQUIRED`, `BLOCKED`만 허용한다. `CHANGES_REQUIRED`는 Finding을 담아 Execute로 돌아가며 3회를 넘으면 `HUMAN_REQUIRED`.
5. Reviewer 입력은 Task Contract + 실제 `git diff` + Verification Log로 한정한다. (Codex의 설명을 넘기지 않음)
6. Executor / Reviewer 결과는 JSON Schema로 검증한다. 형식이 틀리면 `BLOCKED`.
7. Agent가 보고한 changed_files와 실제 `git diff`가 다르면 `BLOCKED`.
8. Run 기록은 Git 비추적 위치(`.harness/runs/<run-id>/`)에 남긴다. Secret 값을 남기지 않는다.
9. Git Commit / Push / PR, worktree 분리, Resume은 하지 않는다. (TASK-020 / TASK-021)

### 사전 검증 결과 (2026-10-02, Windows 10 Pro 개발 PC)

| 항목 | Claude (Reviewer) | Codex (Executor) |
|---|---|---|
| 실행 파일 | VS Code 확장 포함 `claude.exe` (2.1.286, PATH 없음) | npm 전역 `codex` (`@openai/codex` 0.160.0) |
| 로그인 | VS Code 로그인 재사용, API Key 없음 | 기존 ChatGPT 로그인 재사용(`codex login status`), API Key 없음 |
| 비대화형 실행 | `claude -p "<prompt>"` (약 7초) | `codex exec "<prompt>"` (약 12 ~ 14초) |
| 구조화 결과 | `--output-format json` → 결과 객체의 `result` 필드 | `--output-schema <schema.json> -o <result.json>` |
| 권한 제한 | `--allowedTools "Read"`: 쓰기 거부(`permission_denials`에 `Write`) | `-s workspace-write`: 작업 폴더만 쓰기 |
| 변경 대조 | — | 보고한 `changed_files`가 `git status`와 일치 |

구현 시 반드시 반영할 사항:

1. Codex stdin을 닫는다. 열려 있으면 "Reading additional input from stdin..."에서 멈춘다. 모든 Agent 호출에 Timeout을 둔다.
2. Windows에서 Codex 쓰기 Sandbox는 `windows.sandbox` 설정이 필요하다. 없으면 `workspace-write`가 `read-only`로 낮아진다. (검증: `-c 'windows.sandbox="unelevated"'`)
3. Claude 결과는 Code Block이나 설명 문장으로 감싸질 수 있다. JSON을 추출해 Schema로 검증한다.
4. Claude 실행 파일 경로는 설정으로 받는다. (VS Code 확장 Version이 경로에 포함됨)

## 필수 Test (Fake CLI)

- PASS 경로
- Executor 실패 / Timeout
- Verification 실패
- `CHANGES_REQUIRED` → 재실행 → PASS
- `HUMAN_REQUIRED` / `BLOCKED` 즉시 정지
- Review 3회 초과 → `HUMAN_REQUIRED`
- malformed JSON (Executor / Reviewer)
- changed_files와 실제 diff 불일치

## 허용 경로

- `docs/07-TASKS.md`, `docs/08-WORK_LOG.md`, `docs/09-DECISIONS.md`, `docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md`, `docs/12-ORCHESTRATOR-DESIGN.md`
- `harness/`, `scripts/orchestrator/`, `.gitignore`(Run 기록 제외), `prompts/`
- `AGENTS.md` (D 단계, DEC-026 승인 후)

## Verification

- `node --test "scripts/orchestrator/*.test.mjs"`
- 실제 CLI Smoke Run 1회: Repository 밖 임시 Git Repo에서 작은 Task로 Execute → Verify → Review → PASS 확인
- `scripts/verify.ps1`, `scripts/verify.sh` (기존 Frontend / Backend Regression 없음)
- `package.json` / `build.gradle` 변경 없음, `git diff --check`

## Claude Review 기준

- 정책이 기존 AGENTS.md / Gate A / B / C와 충돌하는가, Human Gate 범위가 적절한가
- State Machine이 결정적이고 무한 Loop가 없는가
- Agent 자연어가 아닌 Schema 결과로 판단하는가
- Reviewer 입력이 독립적인가 (Codex 설명 미포함)
- API Key 없이 로그인된 CLI만 쓰는가, Secret이 Log에 남지 않는가
- Git 자동화가 섞이지 않았는가

## 완료 조건

1. DEC-026이 Human Approved 된다.
2. 최소 Orchestrator가 Fake CLI Test와 실제 CLI Smoke Run을 통과한다.
3. 승인된 정책이 AGENTS.md에 반영되고 Human Review를 통과하면 DONE.
4. DONE 이후 TASK-019는 `node scripts/orchestrator/run.mjs TASK-019`로 실행한다.
