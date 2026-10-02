# Prompt 36 — TASK-018 Multi-Agent Harness Bootstrap

## 목적

TASK-018 A단계(정책)만 수행하고 DEC-026 초안 / 정책 / 작업 상태 / 이력을 작성한다.

## 실행 단계

Human 지시 → Claude 임시 Orchestrator의 `codex exec` → Codex A단계 작성 → Claude 자동 Review → Human DEC-026 승인 대기

## 사용 Context

- `AGENTS.md`, `docs/tasks/TASK-018_HARNESS_BOOTSTRAP.md` (A. 정책 / 허용 경로), `docs/tasks/COMMON.md`
- `docs/07-TASKS.md`, `docs/08-WORK_LOG.md` 마지막 부분, `docs/09-DECISIONS.md` DEC-021 ~ DEC-025 형식
- `prompts/README.md`, Prompt 35
- Human 제공 Context: 이 실행은 Claude 세션(임시 Orchestrator)에서 `codex exec`로 시작되었다.

## 실제 Prompt

Human이 기록하도록 제공한 선행 지시:

```text
커밋/푸시 승인!
```

이번 Executor 실행 지시:

```text
너는 MoodFit v3 Repository의 Executor(Codex)다. 현재 작업 폴더가 Repository Root다.
TASK-018 — Multi-Agent Harness Bootstrap 중 A단계(정책)만 수행한다.
이 실행은 Claude 세션(임시 Orchestrator)에서 codex exec로 시작되었다.
먼저 TASK-018(A. 정책 / 허용 경로), COMMON.md, AGENTS.md, TASKS,
WORK_LOG 마지막 부분, DEC-021 ~ DEC-025 형식, prompts/README.md를 읽는다.

1. TASKS Current Task(3절) Status / 전체 목록 TASK-018 행 / TASK-018 섹션 상태를 IN_PROGRESS로 변경.
   AGENTS.md는 3절 Current Task Status 값만 변경하고 다른 내용은 수정하지 않는다.
2. DEC-026 Multi-Agent Automation Policy 초안을 끝에 추가.
   Pending Human Approval, 기존 결정 / 범위 / 유지 / 상태 형식 유지.
3. docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md 작성.
   A. 정책 1~10과 필수 Matrix 항목을 모두 포함하고 표에 권장안 / Human 결정(미정) 열을 둔다.
4. WORK_LOG 끝에 TASK-018 — Multi-Agent Harness Bootstrap 섹션 추가.
   IN_PROGRESS 상태와 A단계 작업 내용 기록.
5. Prompt 36을 기존 형식으로 작성하고 README 표 36번 행(진행 중) 추가.
   실제 Prompt에 "커밋/푸시 승인!"과 Claude 세션의 codex exec 시작을 기록한다.

지정 파일 외 수정 금지. Source Code, scripts/, harness/, .github/,
package.json, build.gradle 수정 금지. B단계 구현 금지.
git commit / push / branch 작업 금지. Secret / Token / 계정 ID 기록 금지.
Human 결정은 미정으로 남긴다. 한국어 / 기존 표와 - 목록 문체 / 영문 기술 용어 유지.
LF, 제어 문자 금지. git diff --check 실행 결과를 verification에 기록한다.
최종 응답은 지정 JSON Schema만 사용하고 실제 changed_files / human_decisions_needed를 적는다.
```

Human 승인 원문 (2026-10-02, Review 2회차 PASS 후):

```text
권장안대로 승인, Sandbox는 elevated / unelevated
unelevated, 커밋/push/PR 승인
```

승인 반영 지시: 지정된 5개 파일에 승인 내용을 반영하며 정책 내용 자체는 새로 바꾸지 않는다. AGENTS.md 수정 / Git 작업 / Secret / 계정 정보 / Ruleset ID 기재는 금지한다. 한국어 / 기존 문체 / LF / 제어 문자 금지를 유지하고 `git diff --check` 결과를 기록한다.

## 기대 산출물

- TASK-018 / AGENTS.md Current Task IN_PROGRESS
- DEC-026 Pending Human Approval 초안 / 정책 / Human Decision Matrix
- WORK_LOG / Prompt 36 / Index 36 / Verification 결과

## Human Approval 여부

- A단계 실행: 승인됨 (명시적 지시)
- DEC-026 / Matrix: Human Approved (2026-10-02), 모든 항목 권장안대로 승인
- 선행 "커밋/푸시 승인!"은 이력 기록이며 이번 실행의 명시적 Git 작업 금지가 적용된다.
- B단계 / D단계 정책 반영 / 최종 Review: 이번 실행에서 수행하지 않음

## 결과 또는 상태

완료 (Human Review 대기). TASK-018 REVIEW, A ~ D단계 완료, 최종 Human Review(PR Squash Merge) 대기.

## 관련 문서

- `docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md`
- `docs/09-DECISIONS.md` DEC-026
- `docs/tasks/TASK-018_HARNESS_BOOTSTRAP.md`
- `docs/08-WORK_LOG.md` TASK-018

## Related Commit

```text
Pending
```

### Review 2회차: Branch 전략 / 승인 채널 반영 (2026-10-02)

- Reviewer(Claude)의 `CHANGES_REQUIRED` Finding F1 ~ F6만 지정된 4개 파일에 반영했다.
- Human이 확정한 Task별 Branch / PR / Squash Merge 전략과 TASK-018 ~ TASK-020의 Human 승인 후 Claude 세션 또는 Human Git 작업, TASK-021 Script Git 자동화 경계를 기록했다.
- Task 완료 승인 = Human의 PR Squash Merge, Required approvals 0 / Required status checks / Auto Merge 비활성 유지, TASK-021 작성자 분리 검토를 반영했다.
- 기존 Codex Co-author Trailer의 Squash Commit 메시지 포함과 Human의 gh 설치 / 로그인 완료, Human 로그인 → Agent 사용 원칙을 기록했다. 계정명 / Token은 기록하지 않았다.
- DEC-026은 `Pending Human Approval`, TASK-018은 `IN_PROGRESS`로 유지하고 다른 Human 결정 항목은 미정으로 남겼다. Git 변경 작업과 B / C / D단계는 수행하지 않았다.

- 실제 Rework 지시: F1 ~ F6만 정책 5 / 6 / 7절과 Matrix, DEC-026 범위, TASK-018 기록 / Prompt 36에 반영한다. 지정된 4개 파일 외 수정 / Git 작업 / Secret 및 계정 정보 기재는 금지하며 한국어 / 기존 문체 / LF / 제어 문자 금지를 유지한다.

- Review 2회차 Verification: `git diff --check` 통과 (Exit Code 0, whitespace 오류 없음). 지정된 4개 파일 UTF-8 / LF / 제어 문자 없음 확인. 문서 Rework이므로 Test / Build는 실행하지 않았다.

### A단계 Human 승인 (2026-10-02)

- Reviewer(Claude) PASS(Review 2회차) 후 Human이 DEC-026 / Decision Matrix의 모든 항목을 권장안대로 승인했다.
- Windows Codex Sandbox는 `unelevated`로 시작한다 (사전 검증 완료, 추가 설정 없음). `elevated` 전환은 TASK-020(Orchestrator Hardening)에서 검증 후 다시 결정한다.
- Human 승인 후 Claude 세션이 `gh api`로 GitHub 설정을 적용했다 (2026-10-02).
- Squash Merge만 허용하고 Merge Commit / Rebase는 비활성화했다. Squash Commit 제목 = PR 제목, 본문 = PR 본문이며 Merge 후 Head Branch를 자동 삭제한다.
- Branch Ruleset `main-protection`: Active, 기본 Branch 대상, Bypass 없음. 삭제 금지 / Force Push 금지 / Linear History / PR 필수(Required approvals 0, Squash만 허용) / Required status checks `frontend` / `backend`를 적용했다.
- Agent가 Human의 GitHub 로그인을 사용하므로 Bypass가 있으면 Agent도 main에 직접 Push할 수 있어 Bypass를 두지 않았다. 긴급 시 Human이 Ruleset을 일시 Disabled로 전환한다.
- A단계 결과의 Task Branch Commit / Push / Draft PR 생성을 승인했다. Git 작업은 Claude 세션이 수행하며 이번 Executor 실행에서는 수행하지 않았다.
- A단계 완료(DEC-026 Human Approved), B단계 진행 예정. TASK-018 IN_PROGRESS / TASK-019 이후 BLOCKED 유지. AGENTS.md 정책 반영은 D단계에서 수행한다.

- Human 승인 반영 Verification: `git diff --check` 통과 (Exit Code 0, whitespace 오류 없음). 지정된 5개 파일 UTF-8 / LF / 제어 문자 없음 확인. 문서 변경이므로 Test / Build는 실행하지 않았다.

### B단계 실행 기록 (2026-10-02)

- 목적: Human Approved DEC-026에 따라 최소 Local Orchestrator 설계 / 구현 / Fake CLI Test를 작성한다.
- 실행 단계: Human 명시 지시 → Executor 설계 문서 작성 → Contract / Schema / Template / 설정 → 최소 Script / Fake CLI Test → 가능한 검증 / 기록. Claude B단계 자동 Review / C단계 실제 Smoke / D단계 정책 반영은 이번 실행에서 수행하지 않는다.
- Context: TASK-018(B / 사전 검증 / 필수 Test / 허용 경로), COMMON, AGENTS, 프로젝트 문서 / PLAN / TASKS, DEC-026, Multi-Agent Policy, TASK-019 조사 / CI 변경 Human Gate.
- Human Approval: B단계 실행 명시 승인, A단계 DEC-026 Human Approved. Dependency 없음 / Node.js 24 / JavaScript ES Module(.mjs) / JSON 조건 유지. Git 작업은 이번 지시에서 금지.

실제 B단계 실행 지시 (핵심 조건 기록):

```text
너는 MoodFit v3 Repository의 Executor(Codex)다. Repository Root,
Branch task/TASK-018-harness-bootstrap에서 TASK-018 B단계(최소 Orchestrator 구현)를 수행한다.
A단계(DEC-026)는 Human Approved 되었다.
TASK-018, COMMON, Multi-Agent Policy, DEC-026, AGENTS.md를 먼저 읽는다.
Node.js 24 + JavaScript ES Module(.mjs), Dependency 없음, 설정 / 계약 JSON.
package.json / package-lock.json / build.gradle 수정 금지.
설계 docs/12-ORCHESTRATOR-DESIGN.md를 먼저 작성한다.
harness/tasks/TASK-019.json, executor / reviewer Schema, 역할 Template,
CLI 명령 배열 / Timeout / unelevated 설정 예시를 작성한다.
실제 PC 설정은 Git 비추적 harness/config.local.json에서 읽으며 Claude 경로는 설정으로 받는다.
run.mjs <TASK-ID>: Preflight → Execute → Guard → Verify → Review → Decide.
Preflight CLI / Codex 로그인 / clean Working Tree / main 금지.
Codex exec workspace-write + windows.sandbox="unelevated" + output-schema + -o,
Prompt는 stdin 전달 후 닫는다. 모든 Agent 호출 Timeout.
Guard 실제 git status --porcelain -uall 변경과 changed_files 대조,
allowed / forbidden 위반과 Schema 오류는 Review 전에 BLOCKED.
Verify 명령 Exit Code / Log 수집, 실패 처리를 설계와 일치시킨다.
Claude -p --output-format json --allowedTools Read,Grep,Glob,
입력은 Contract + Task 문서 + 실제 Diff(신규 / 비추적 포함) + Verify Log,
Executor summary 제외. envelope result 문자열에서 JSON 추출 / Schema 검증.
CHANGES_REQUIRED Finding 전달 후 재실행, 최대 Review 3회.
.harness/runs/<run-id>에 Phase 입력 / 출력 / Log / state, 저장 전 Redaction.
PASS=0, HUMAN_REQUIRED=2, BLOCKED=3, 내부 오류=1.
Windows codex.cmd는 shell:false 직접 실행하지 않고 명령 배열로 안전하게 설정한다.
.gitignore에 .harness/runs/ 및 harness/config.local.json 추가.
임시 Git Repo + Fake CLI로 PASS / Executor 실패·Timeout / Verify 실패 /
Rework PASS / HUMAN_REQUIRED·BLOCKED 즉시 정지 / Review 상한 / malformed JSON /
changed_files 불일치 / allowed path / main / dirty Working Tree를 검증한다.
WORK_LOG TASK-018와 Prompt 36에 B단계 기록,
TASKS 설명은 B단계 구현 완료, C단계 검증 예정, 상태 IN_PROGRESS 유지.
Git Commit / Push / PR / Branch, worktree, Resume, Lock, 실제 Agent CLI,
AGENTS.md, CI Workflow 변경과 Secret / 계정 기록 금지.
허용 경로는 설계 문서, harness/, scripts/orchestrator/, .gitignore,
TASKS, WORK_LOG, Prompt 36뿐이다.
node --test scripts/orchestrator/ 및 git diff --check를 직접 실행하고
Dependency Manifest 무변경을 확인한다. 최종 응답은 지정 JSON Schema만 사용한다.
```

- 결과: B단계 구현 산출물 작성 완료, TASK-018 IN_PROGRESS / C단계 검증 예정. 전체 Test PASS / Claude Review PASS를 주장하지 않는다.
- Verification: 지정 Test는 `spawn EPERM`으로 실패. 프로세스 격리 없는 폴더 명령은 `ERR_UNSUPPORTED_DIR_IMPORT`, .test.mjs 직접 지정 통합 Test도 자식 Process 생성 차단. 순수 lib.test.mjs는 5 / 5 성공. 5개 .mjs 문법 검사 / git diff --check 통과, package.json / package-lock.json / build.gradle 무변경.
- Human 확인 필요: Node 24 지정 폴더 Test 명령의 index.js 호환 진입점 예외 또는 Test 명령 변경. 자식 Process 허용 환경에서 전체 Fake CLI Test 재실행, 이후 Claude B단계 Review / C단계 Smoke / D단계 / 최종 Review가 남아 있다.
- Related Commit: Pending (이번 실행은 Git 작업 금지).

### B단계 Review 1회차 (2026-10-02)

- Reviewer(Claude) 판정: `CHANGES_REQUIRED`. Finding F1 ~ F4만 허용된 문서 6개에 반영했다. 코드 / harness / Git 변경 작업은 수행하지 않았다.
- Executor의 `HUMAN_REQUIRED` 사유: Node 24 폴더 Test 명령의 진입점 / 명령 변경 확인과 Sandbox 자식 Process 차단으로 인한 전체 Test 미확인, Claude CLI 필수 옵션 확인. 두 항목은 Human 결정이 아니라 Reviewer가 해결했다.
- Reviewer가 Sandbox 밖에서 Node 24.21.0으로 `node --test "scripts/orchestrator/*.test.mjs"`를 직접 실행했다: tests 30 / pass 30 / fail 0, 약 22.7초. `.mjs` 조건을 유지하며 `index.js` 예외는 필요 없다.
- Reviewer가 Claude CLI 2.1.286의 `--tools`, `--strict-mcp-config`, `--allowedTools`, `--output-format` 옵션 존재를 확인했다.
- 설계 / TASK-018 / TASK-020의 Test 명령을 glob 명령으로 통일했다. 설계에 `unelevated` Sandbox의 `spawn EPERM` 제약, Orchestrator의 Sandbox 밖 Deterministic Verification, Executor verification은 참고 정보 / Orchestrator Verify가 기준임을 명시했다. `elevated` 전환 재검증은 TASK-020에 기록했다.
- TASKS의 미확인 문단을 Reviewer 확인 결과로 교체했다. TASK-018은 `IN_PROGRESS`, 설명은 "B단계 구현 / Review 진행, C단계 검증 예정"이다. Review PASS는 미확정이며 C단계 / D단계 / 최종 Human Review가 남아 있다. 기존 B단계 실패 / Human 확인 대기 기록은 당시 이력이며 이번 Reviewer 확인 결과로 해소되었다.
- Verification: `git diff --check` 통과 (Exit Code 0, whitespace 오류 없음). 수정 문서 6개 UTF-8 / LF / 제어 문자 없음 확인. 문서 Rework이므로 Test / Build는 재실행하지 않았으며 30 / 30 통과는 Reviewer 제공 결과다.

### C?? Smoke Run 1?? ? CHANGES_REQUIRED / F1 ~ F4 Rework (2026-10-02)

- Reviewer(Claude) ??: Repository ? ?? Git Repo?? TASK-901? ?? codex / claude CLI? ????. ? ??? Reviewer ?? ??? ??? ?? ??? Dirty Working Tree Guard? BLOCKED???? Guard ?? ??? ????.
- ? ?? ??? codex --version / login status / claude --version Preflight? ????? Execute exit 1? BLOCKED???. Codex stderr? invalid_request_error / invalid_json_schema? changed_files? uniqueItems ???? ?????. C?? Review 1?? ??? CHANGES_REQUIRED?.
- Human? F1 ~ F4 ?? ??? ?? Codex ??? ?? Schema? ???? run.mjs? ?? Schema ?? ??? ????. ?? ?? Schema? ?? ??? ???? ?? / ? ??? ????. ?? Schema? ?? properties? required? ???? additionalProperties: false? ????.
- Fake CLI? --output-schema ??? ?? ??? Keyword / object ?? ?? ? exit 1? invalid_json_schema? ????. uniqueItems / minLength ?? Test? ?? Schema / ?? ?? Unit Test? ????. ?? ?? ?? ??? ?? ??? Smoke ?? ??? ????.
- Verification: run.mjs / fake-cli.mjs / orchestrator.test.mjs ?? ?? ??. node --test --test-isolation=none scripts/orchestrator/lib.test.mjs? tests 6 / pass 6 / fail 0??.
- ? Fake CLI ?? Test? ??? ?? ?? Process ?? ???? exit code null? ???? ????. Process ?? ??? Assertion? ????? ????. ?? ?? Test? ???? ???? Reviewer? Sandbox ??? ?????. ?? codex / claude ??, Dependency ??, Git ?? ??? ???? ???.
- git diff --check: exit 0, ?? ?? ??. ?? tracked ??? Git? LF ? CRLF ??? ??? ?? ?? ??? LF / ?? ?? ???? ????.
- TASK-018? IN_PROGRESS ??. C?? Smoke ??? / Reviewer ???, D?? ?? ?? / ?? Human Review? ?? ??. ?? Rework ??? Task DONE ?? Review PASS? ??? ???.

- ?? Rework Prompt: C?? Review 1?? F1 ~ F4? ????. Codex ?? Schema? strict ???? ???? ?? ??? ???? Fake CLI? Schema ?? / ?? Test, ?? ?? ??, Smoke ? ?? ??? ????. ?? ??? ???? Dependency / Git ?? ?? / ?? CLI ?? / Secret? ????. ??? ??? git diff --check ??? ???? ?? JSON Schema? ?? changed_files? ????. Human ?? ?? ?? ??, Related Commit ??.

### C단계 Smoke Run (2026-10-02, Reviewer 실행 결과)

- Repository 밖 임시 Git Repo에서 TASK-901(`hello.md` 생성)과 실제 codex / claude CLI로 실행했다.
- 1회차: Reviewer가 실행 출력 파일을 임시 저장소 안에 만들어 Preflight Dirty Working Tree Guard로 `BLOCKED`. Guard 정상 동작을 확인했다.
- 2회차: Execute에서 `BLOCKED`. Codex `--output-schema`가 strict 규칙상 `uniqueItems`를 거부했다. C단계 Review 1회차 `CHANGES_REQUIRED`에 따라 Codex 전달용 strict Schema를 분리하고 Fake CLI 회귀 Test를 추가했다.
- 수정 후 Reviewer가 Sandbox 밖에서 `node --test "scripts/orchestrator/*.test.mjs"`를 실행했다: tests 32 / pass 32 / fail 0.
- 3회차: `PASS` (Exit 0, 약 39초). Preflight → Execute(`DONE`, changed_files `[hello.md]`) → Guard → Verify(`node check.mjs` 통과) → Review(Claude `PASS`, findings 없음) → Decide를 확인했다.
- 위 Test / 실제 CLI 결과는 Reviewer 제공 기록이며 이번 문서 작업에서 재실행하지 않았다. 앞선 C단계 Rework 기록의 검증 대기는 이 결과로 해소되었다.

### D단계 AGENTS.md 반영 (2026-10-02)

- DEC-026(Human Approved) / 확정 정책 / Orchestrator 설계에 따라 Multi-Agent 역할 / 권한 / 금지, 읽기 순서, 자동 Verify / Review / Rework 상한 / Human Gate 정지를 반영했다.
- Task Branch / PR / Human Squash Merge, TASK-018 ~ TASK-020의 승인 후 Git 수행 역할과 TASK-021 Git 자동화 경계, Commit / Codex Co-author Trailer / DEC-025를 반영했다.
- Agent API Key 미사용 / Human 로그인 / 자격 증명 출력 금지 / Run Redaction을 반영하고 기존 문서 읽기 / Task 단위 / 검증 / 기록 / Prompt / UI·UX / 보안 / 승인 규칙을 유지했다.
- A ~ D단계 완료, TASK-018 `REVIEW`, 최종 Human Review(PR Squash Merge) 대기. 이번 D단계 Claude 자동 Review는 후속 검토 대상이다. TASK-019 이후 `BLOCKED` 유지, 다음 Task는 실행하지 않았다.
- 허용된 문서 5개만 수정했다. 기존 B / C단계 변경을 유지했으며 TASK-018 Contract / scripts / harness / docs/11 / docs/12와 Git 변경 작업은 수행하지 않았다.
- Verification: `git diff --check` 통과 (Exit Code 0, whitespace 오류 없음). 수정 문서 5개 UTF-8 / LF / 제어 문자 없음 확인. 문서 변경이므로 Test / Build는 재실행하지 않았다.

### C / D단계 실행 지시 기록

- 목적: Reviewer의 C단계 결과를 기록하고 승인된 DEC-026을 AGENTS.md에 반영한다.
- Context: DEC-026 / docs/11 / docs/12 / TASK-018 Contract, Reviewer 제공 2026-10-02 Smoke Run / 32개 Test 결과.
- Human Approval: D단계 실행 명시 승인. DEC-026 Human Approved. 최종 Task 완료 승인은 PR Squash Merge 대기이며 이번 실행의 Git 작업은 금지이다.

실제 실행 지시 (핵심 조건 기록):

```text
TASK-018 D단계(승인된 정책을 AGENTS.md에 반영)와 C단계 결과 기록을 수행한다.
AGENTS.md 역할 / 읽기 순서 / 실행 흐름 / Git·Commit / 보안 규칙을 DEC-026에 맞게 갱신한다.
TASKS Current Task / 전체 목록 / TASK-018 섹션과 AGENTS Status를 REVIEW로 맞춘다.
상태 설명은 A ~ D단계 완료, 최종 Human Review(PR Squash Merge) 대기로 기록한다.
WORK_LOG와 Prompt 36에 C / D단계 결과를 추가하고 Prompt Index 36은 완료 (Human Review 대기)로 변경한다.
허용 파일은 AGENTS.md, docs/07-TASKS.md, docs/08-WORK_LOG.md,
prompts/36-TASK-018-HARNESS-BOOTSTRAP.md, prompts/README.md뿐이다.
기존 B / C단계 변경은 유지한다. TASK-018 Contract / scripts / harness / docs/11 / docs/12 수정 금지.
Git 작업 / Secret / 계정 정보 금지, 기존 승인 규칙 유지, 새 권한 금지.
한국어 / 기존 문체 / LF / 제어 문자 금지. git diff --check 결과를 verification에 기록한다.
최종 응답은 지정 JSON Schema만 사용하며 changed_files는 git status 기준 누적 변경 파일 전체이다.
```

- Related Commit: Pending (이번 실행 Git 작업 금지).
