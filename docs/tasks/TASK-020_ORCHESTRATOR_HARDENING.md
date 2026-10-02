# TASK-020 — Orchestrator Hardening

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

TASK-018에서 만든 최소 Orchestrator를 장기 운영이 가능한 수준으로 보강한다.
TASK-019(첫 시범 운영)에서 발견한 문제를 반영하고, 작업 공간 분리 / 재개 / Guard / 전체 Test를 갖춘다. Git 자동화는 아직 하지 않는다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- 선행: TASK-019 DONE
- 실행: `node scripts/orchestrator/run.mjs TASK-020` (Orchestrator가 자기 자신을 보강하므로, 변경 중인 Orchestrator가 아니라 실행 시작 시점의 안정 Version으로 실행한다)

## Human Gate

- 확정된 언어 / Runtime(Node.js 24 + `.mjs`, Dependency 없음, DEC-026) 외의 Runtime이나 새 Dependency가 필요하면 Gate C
- Agent 호출 방식이 DEC-026과 다르면(예: API Key 사용) 즉시 `HUMAN_REQUIRED`

## Codex 작업 범위

1. **작업 공간 분리**: Task마다 `git worktree`로 전용 작업 폴더를 만들어 Human의 작업 폴더와 분리한다.
2. **Resume**: `node scripts/orchestrator/run.mjs --resume <run-id>`로 `HUMAN_REQUIRED` / `BLOCKED` 이후 이어서 실행한다. (Human 승인 / 재로그인 / 사용량 한도 해소 후)
3. **실행 Lock**: 같은 Task / 같은 Repository의 동시 실행을 막는다.
4. **Guard 강화**
   - Machine-readable Task Contract의 allowed_paths / forbidden_paths를 실제 diff 기준으로 검사하고, 위반 시 Claude 호출 전에 실패
   - Secret File(`.env.local` 등) / Secret-like 문자열 검사
5. **Task Contract 형식 정리**: `harness/tasks`, `harness/policies`, `harness/schemas`, `harness/prompts` (Markdown Task 파일과의 관계 정의)
6. **오류 분류**: CLI 미로그인, 사용량 한도, Timeout, Sandbox 거부, Schema 오류를 구분해 Run 기록과 정지 사유에 남긴다.
7. **설계 문서 갱신**: `docs/12-ORCHESTRATOR-DESIGN.md`를 실제 구현과 일치시킨다.
8. Orchestrator Test를 `scripts/verify.*` / CI에 포함할지 제안한다. (CI 변경은 Gate C)
9. Git Branch / Commit / Push / PR은 하지 않는다. (TASK-021)
10. Windows Codex Sandbox의 `elevated` 전환 시 자식 Process 생성 / Deterministic Verification을 재검증한다. TASK-018에서 확인한 `unelevated`의 `spawn EPERM` 제약과 Orchestrator의 Sandbox 밖 Verify 기준을 확인한 뒤 전환 여부를 다시 결정한다.

## 권장 구조 (TASK-018 최소 구현 기준으로 확장)

```text
Orchestrator (Node.js 24 + .mjs, 결정적 State Machine, Dependency 없음)
  1. Preflight   CLI 로그인 확인(codex / claude, 이후 gh / aws), Working Tree, 실행 Lock
  2. Workspace   git worktree로 Task 전용 작업 폴더 생성
  3. Execute     codex exec (stdin 닫기, Sandbox, Output Schema, Timeout)
  4. Guard       실제 git diff 대조, allowed_paths / forbidden_paths, Secret 검사
  5. Verify      scripts/verify.sh (Deterministic Test / Build)
  6. Review      claude -p (새 Session, Read-only 도구, 입력은 Task 계약 + Diff + 검증 Log만)
  7. Decide      PASS → 완료 / CHANGES_REQUIRED → 3단계 (최대 3회) / HUMAN_REQUIRED · BLOCKED → 정지
  8. Record      Run 기록(.harness/runs/<run-id>/, Git 비추적) 저장, Resume 지원
```

```text
scripts/orchestrator/
├── run.mjs              진입점 (Task 실행 / Resume)
├── state-machine.mjs    Phase 전이와 Verdict 처리
├── agents/codex.mjs     codex exec 호출
├── agents/claude.mjs    claude -p 호출
├── guards.mjs           diff 대조, 경로, Secret 검사
├── workspace.mjs        git worktree, Lock
├── verify.mjs           검증 실행과 결과 수집
├── schema.mjs           최소 JSON Schema 검증
└── *.test.mjs           node:test (fixtures/의 Fake CLI)
```

Agent CLI 사전 검증 결과와 구현 시 주의 사항은 [TASK-018](TASK-018_HARNESS_BOOTSTRAP.md)을 따른다.

## 필수 Test (TASK-018 Test에 추가)

- allowed / forbidden path 위반 → Claude 호출 전 실패
- Secret File / Secret-like 입력 차단
- worktree 생성 / 정리, Human 작업 폴더 무변경
- Resume: `HUMAN_REQUIRED` 정지 후 재개 → 이어서 진행
- 동시 실행 Lock
- CLI 미로그인 / 사용량 한도 / Timeout / Sandbox 거부 분류

## Verification

- `node --test "scripts/orchestrator/*.test.mjs"`
- `scripts/verify.ps1`, `scripts/verify.sh`
- `package.json` / `package-lock.json` 변경 없음 (새 Dependency 없음)
- `git diff --check`

## Claude Review 기준

- State Machine이 결정적이며 무한 Loop가 없는가
- Path Guard가 실제 Diff 기준으로 동작하는가
- Resume이 중복 실행이나 상태 불일치를 만들지 않는가
- Secret이 Log / Prompt / Result에 남지 않는가
- Git 자동화가 섞이지 않았는가
- 기존 프로젝트 Verification을 우회하지 않는가

## 완료 조건

보강된 Orchestrator가 Fake CLI Test와 실제 CLI Run으로 검증되고 설계 문서가 구현과 일치하면 REVIEW. Git 자동화는 TASK-021에서만 진행한다.
