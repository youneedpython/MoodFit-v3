# TASK-020 — Local Multi-Agent Orchestrator

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

DEC-026에서 승인된 정책을 Code로 옮겨, **로컬에서 한 명령으로 Codex 실행 → Deterministic Verify → Claude Review → 제한된 Rework Loop**가 동작하는 최소 Orchestrator를 만든다. Git 자동화는 아직 하지 않는다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- 시작 조건: TASK-019 DONE, DEC-026 Human Approved, 승인된 정책이 AGENTS.md에 반영됨

## Human Gate

- 새 Top-level `harness/` 구조, 아래 확정된 언어 / Runtime 외의 Runtime이나 새 Dependency(npm Package 포함)가 필요하면 Gate C
- Agent 호출 방식이 DEC-026과 다르면(예: API Key 사용) 즉시 `HUMAN_REQUIRED`

## 구현 언어 / Runtime (Human 확정, 2026-10-02)

| 항목 | 결정 |
|---|---|
| Runtime | Node.js `24.21.0` (`.nvmrc`, 프로젝트 승인 Version) |
| 언어 | JavaScript ES Module (`.mjs`), 필요 시 JSDoc으로 Type 설명 |
| Dependency | **없음** — Node 내장 Module만 사용 (`node:child_process`, `node:fs`, `node:path`, `node:crypto`, `node:test`, `node:assert`) |
| Test | `node --test scripts/orchestrator/` (Fake CLI로 Agent 대체) |
| 설정 / 계약 형식 | JSON (YAML은 Parser Dependency가 필요해 사용하지 않음) |
| JSON Schema 검증 | 외부 Library 없이 필요한 범위(required / type / enum / additionalProperties)를 직접 구현 |
| 실행 Shell | Windows PowerShell / Git Bash 모두에서 `node`로 실행 가능해야 함 |

TypeScript는 Frontend Build 설정과 섞이지 않도록 사용하지 않는다.

## Agent 호출 방식

- Codex: VS Code와 로그인을 공유하는 로컬 `codex` CLI의 비대화형 실행
- Claude: VS Code와 로그인을 공유하는 로컬 `claude` CLI의 비대화형 실행, Read-only 도구 설정
- Preflight에서 두 CLI의 설치 / 로그인 상태를 확인한다. 로그인되어 있지 않으면 `HUMAN_REQUIRED`
- 구독 사용량 한도 / Rate Limit 응답은 `BLOCKED`로 처리하고 재시도하지 않는다.
- 정확한 CLI 옵션은 구현 시점의 공식 문서로 확인해 문서화한다.

## 사전 검증 결과 (2026-10-02, Windows 10 Pro 개발 PC)

Repository 밖 임시 폴더에서 두 CLI를 비대화형으로 실행해 확인했다.

| 항목 | Claude (Reviewer) | Codex (Executor) |
|---|---|---|
| 실행 파일 | VS Code 확장 포함 `claude.exe` (2.1.286, PATH 없음) | npm 전역 `codex` (`@openai/codex` 0.160.0) |
| 로그인 | VS Code 로그인 재사용, API Key 없음 | 기존 ChatGPT 로그인 재사용(`codex login status`), API Key 없음 |
| 비대화형 실행 | `claude -p "<prompt>"` (약 7초) | `codex exec "<prompt>"` (약 12 ~ 14초) |
| 구조화 결과 | `--output-format json` → 결과 객체의 `result` 필드 | `--output-schema <schema.json> -o <result.json>` → Schema에 맞는 JSON |
| 권한 제한 | `--allowedTools "Read"`: 쓰기 시도 거부, `permission_denials`에 `Write` 기록 | `-s workspace-write`: 작업 폴더만 쓰기 허용 |
| 변경 대조 | — | 보고한 `changed_files`가 `git status`와 일치 |

구현 시 반드시 반영할 사항:

1. **Codex stdin을 닫는다.** 열려 있으면 "Reading additional input from stdin..."에서 멈춘다. (`< /dev/null` 또는 Process stdin 종료) 모든 Agent 호출에 Timeout을 둔다.
2. **Windows에서 Codex 쓰기 Sandbox는 `windows.sandbox` 설정이 필요하다.** 설정이 없으면 `-s workspace-write`를 지정해도 `read-only`로 낮아진다. 검증은 `-c 'windows.sandbox="unelevated"'`로 했다. `elevated`(격리 강화, 최초 관리자 설정 필요)와 `unelevated` 중 선택은 DEC-026 결정 항목이다.
3. **Claude 결과는 JSON만 오지 않을 수 있다.** Code Block(```json)이나 설명 문장으로 감싸질 수 있으므로 JSON을 추출한 뒤 Schema로 검증하고, 실패하면 `BLOCKED`로 처리한다.
4. **Claude 실행 파일 경로는 설정으로 받는다.** VS Code 확장 경로에 Version이 포함되어 업데이트마다 바뀐다.

## Codex 작업 범위

1. 승인된 구조로 `harness/`와 `scripts/orchestrator/`를 만든다.
2. Machine-readable Task Contract, Gate / Permission Policy, Executor / Reviewer 결과 JSON Schema를 구현한다.
3. Local Entrypoint를 제공한다: `node scripts/orchestrator/run.mjs TASK-XXX` (Resume: `node scripts/orchestrator/run.mjs --resume <run-id>`)
4. Phase 순서: Preflight(로그인 / Working Tree) → Gate Check → Executor → Deterministic Verify → Reviewer → Decision → 최대 3회 Rework
5. Verdict는 `PASS`, `CHANGES_REQUIRED`, `HUMAN_REQUIRED`, `BLOCKED`만 허용한다.
6. Agent가 반환한 changed_files를 실제 `git diff`와 대조한다.
7. allowed_paths / forbidden_paths 위반 시 Claude 호출 전에 실패시킨다.
8. Secret 값을 Prompt / Result / Log에 남기지 않는다.
9. Runtime Log는 기본적으로 Git 비추적 영역에 둔다.
10. 이 Task에서는 Git Branch / Commit / Push / PR을 자동화하지 않는다.
11. 구현 전에 설계 문서 `docs/12-ORCHESTRATOR-DESIGN.md`를 작성하고, 구현과 함께 최신 상태로 유지한다.
    - 구성 요소와 폴더 구조 (`harness/`, `scripts/orchestrator/`, Run 기록 위치)
    - State Machine (Phase, 전이 조건, Verdict별 처리, 최대 Rework 횟수, Resume)
    - Agent 호출 규격 (CLI 명령, 입력 Prompt 구성, 출력 Schema, Timeout, 오류 분류)
    - Task Contract / Policy 형식 (allowed_paths, forbidden_paths, 허용 Profile, Gate)
    - 실행 방법과 실패 시 Human 조치 방법

## 권장 구조 (Human 검토안, 설계 문서의 출발점)

```text
Orchestrator (Node.js 24 + .mjs, 결정적 State Machine, Dependency 없음)
  1. Preflight   CLI 로그인 확인(codex / claude, 이후 gh / aws), Working Tree, 실행 Lock
  2. Workspace   git worktree로 Task 전용 작업 폴더 생성 (Human의 작업 폴더와 분리)
  3. Execute     codex exec (stdin 닫기, Sandbox, Output Schema, Timeout)
  4. Guard       실제 git diff 대조, allowed_paths / forbidden_paths, Secret 검사
  5. Verify      scripts/verify.sh (Deterministic Test / Build)
  6. Review      claude -p (새 Session, Read-only 도구, 입력은 Task 계약 + Diff + 검증 Log만)
  7. Decide      PASS → 완료 / CHANGES_REQUIRED → 3단계 (최대 3회) / HUMAN_REQUIRED · BLOCKED → 정지
  8. Record      Run 기록(.harness/runs/<run-id>/, Git 비추적) 저장, Resume 지원
```

- 다음 단계 결정은 Script 규칙으로만 한다. Agent에게 흐름 결정을 맡기지 않는다. (Reviewer 독립성 유지)
- Git / PR 단계는 TASK-021, GitHub CI 연동은 TASK-022에서 추가한다.

파일 구성 예시 (설계 문서에서 확정):

```text
scripts/orchestrator/
├── run.mjs              진입점 (Task 실행 / Resume)
├── state-machine.mjs    Phase 전이와 Verdict 처리
├── agents/
│   ├── codex.mjs        codex exec 호출 (stdin 닫기, Sandbox, Output Schema, Timeout)
│   └── claude.mjs       claude -p 호출 (Read-only 도구, JSON 추출)
├── guards.mjs           git diff 대조, allowed / forbidden paths, Secret 검사
├── verify.mjs           scripts/verify.sh 실행과 결과 수집
├── schema.mjs           최소 JSON Schema 검증
└── *.test.mjs           node:test 기반 Test (fixtures/의 Fake CLI 사용)

harness/
├── tasks/               Task Contract (JSON)
├── policies/            Gate / Permission Policy (JSON)
├── schemas/             Executor / Reviewer 결과 Schema (JSON)
└── prompts/             Executor / Reviewer Prompt Template
```

## 필수 테스트

- PASS 경로
- Executor 실패
- Verification 실패
- Claude `CHANGES_REQUIRED` → 재실행
- `HUMAN_REQUIRED` 즉시 중지
- `BLOCKED` 즉시 중지
- Review 3회 초과 → `HUMAN_REQUIRED`
- allowed path 위반
- malformed JSON result
- Agent CLI 미로그인 / 사용량 한도 응답 (Fake CLI로 재현)
- Secret Redaction 또는 Secret-like 입력 차단

## 산출물

- `docs/12-ORCHESTRATOR-DESIGN.md` (설계 문서)
- `harness/` (Task Contract / Policy / Schema / Prompt Template)
- `scripts/orchestrator/` (Orchestrator와 Test)
- `docs/08-WORK_LOG.md` TASK-020 기록, Prompt 기록 1개

## Verification

- Orchestrator 자체 Test: `node --test scripts/orchestrator/` (실제 Agent 대신 Fake CLI 사용)
- Orchestrator Test를 `scripts/verify.*` / CI에 포함할지 설계 문서에 제안한다. (CI 변경은 Gate C)
- `package.json` / `package-lock.json` 변경 없음 확인 (새 Dependency 없음)
- `scripts/verify.ps1`, `scripts/verify.sh`
- `git diff --check`
- 기존 Frontend / Backend Test / Build Regression 없음

## Claude Review 기준

- State Machine이 결정적이며 무한 Loop가 없는가
- Agent 자연어가 아닌 Schema 결과를 검증하는가
- Path Guard가 실제 Diff 기준으로 동작하는가
- Secret이 Log / Prompt / Result에 남지 않는가
- API Key 없이 로그인된 CLI만 사용하는가
- Git 자동화가 섞이지 않았는가
- 기존 프로젝트 Verification을 우회하지 않는가

## 완료 조건

Local Multi-Agent Loop가 Fake CLI와 실제 로그인된 CLI로 재현 가능하고 검증되면 REVIEW. Git 자동화는 TASK-021에서만 진행한다.
