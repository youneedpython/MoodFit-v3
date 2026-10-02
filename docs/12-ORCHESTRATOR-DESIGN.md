# 12. 최소 Local Orchestrator 설계

## 범위 / 구성

- TASK-018 B단계, DEC-026 Human Approved 정책을 구현한다. Node.js 24 / JavaScript ES Module / Node 내장 Module만 사용한다.
- `scripts/orchestrator/run.mjs`: CLI / State Machine / 기록, `lib.mjs`: Process / Schema / Git Guard / Redaction.
- `scripts/orchestrator/*.test.mjs`, `fixtures/fake-cli.mjs`: 임시 Git Repository와 Fake CLI 통합 검증.
- `harness/tasks/<TASK-ID>.json`: Task Contract, `schemas/`: 결과 계약, `prompts/`: 역할 Template, `config.example.json`: 비민감 설정 예시.
- Git / PR / Branch 자동화, worktree, Resume, Lock은 구현하지 않는다. PASS는 Human 승인 / Task DONE을 대신하지 않는다.

## State Machine

Preflight → Execute → Guard → Verify → Review → Decide 순서다. 각 Phase의 입력 / 출력과 state.json을 저장한다.

| 조건 | 전이 / 종료 |
|---|---|
| Preflight 성공 | Execute |
| main / detached HEAD / 더러운 Working Tree / CLI 실행 불가 / 설정·계약 오류 | BLOCKED |
| 로그인 만료·미확인 | HUMAN_REQUIRED (로그인 시도 없음) |
| Execute DONE / 계약 정상 | Guard |
| Execute FAILED / Process 실패 / Timeout / 사용량 한도 | BLOCKED |
| Execute HUMAN_REQUIRED | Guard 검사 후 HUMAN_REQUIRED |
| Guard 변경 파일 불일치 / 허용 경로 위반 / 금지 경로 / Symlink | BLOCKED, Review 호출 없음 |
| Verify 명령 실패 / Timeout | BLOCKED, 자동 Rework 없음 (DEC-026 §8) |
| Review PASS | Decide → PASS |
| Review CHANGES_REQUIRED | Finding을 다음 Execute에 전달 |
| Review HUMAN_REQUIRED / BLOCKED | Decide → 해당 상태로 즉시 정지 |
| 세 번째 Review도 CHANGES_REQUIRED | HUMAN_REQUIRED, 네 번째 Execute / Review 없음 |
| JSON / Schema 오류 | BLOCKED |
| Script 내부 오류 | ERROR |

Review 횟수는 첫 Review를 1로 센다. Rework의 changed_files는 최초 clean baseline 이후의 **누적 전체 변경 목록**이다. Reviewer / Verify 이후에도 변경 Snapshot을 대조해 읽기 전용 / 검증 도구의 변경을 BLOCKED로 처리한다.

## 호출 규격

- 설정의 `codex.command`, `claude.command`는 실행 파일 + 고정 인자 문자열 배열이다. 모든 호출은 `spawn(..., {shell:false})`다. `.cmd` / `.bat`는 거부하고 Windows npm Shim 대신 `["node", "<codex JS entry>"]`를 설정한다. Claude 확장 Version별 경로도 설정에서 받는다.
- Preflight: Git Root / Branch / `git status --porcelain=v1 -z -uall --no-renames`, Node 24, `codex --version`, `codex login status`, `claude --version` 확인. 로그인 결과는 성공 Exit Code만 판단하며 계정 정보를 Prompt에 넣지 않는다.
- Execute: 설정 명령에 `exec -s workspace-write -c windows.sandbox="unelevated" --output-schema <schema> -o <temporary result> -`를 추가한다. 역할 Template + Contract + Task 문서 + 이전 Review Finding을 stdin으로 전달하고 **stdin.end(prompt)**로 닫는다.
- Reviewer: 설정 명령에 `-p --output-format json --allowedTools Read,Grep,Glob --tools Read,Grep,Glob --strict-mcp-config`를 추가한다. 쓰기 / Shell / MCP 도구를 제공하지 않는다. 입력은 Reviewer Template + 결과 Schema + Contract + Task 문서 + 실제 Diff(HEAD 대비 staged / unstaged와 비추적 파일 내용) + Verify Log다. Executor summary / verification 자기 설명은 전달하지 않는다.
- Claude envelope의 `result` 문자열은 순수 JSON / JSON Code Block / 설명으로 둘러싼 단일 JSON 객체를 허용한다. 서로 다른 객체가 여러 개이면 모호한 결과로 거부한다. `is_error` / permission_denials는 BLOCKED다.
- Executor Schema: status(DONE / FAILED / HUMAN_REQUIRED), changed_files(중복 없는 문자열 배열), summary, verification, human_decisions_needed 필수. Reviewer Schema: verdict(PASS / CHANGES_REQUIRED / HUMAN_REQUIRED / BLOCKED), findings(각 id / message / path 문자열) 필수. 추가 필드는 거부한다. CHANGES_REQUIRED는 Finding을 하나 이상 요구한다.
- 내장 Validator는 이 Repository Schema에서 사용하는 type / enum / const / required / properties / additionalProperties / items / uniqueItems / minItems / minLength만 지원한다. 알 수 없는 검증 Keyword는 오류로 거부한다. 범용 JSON Schema 라이브러리가 아니다.
- Timeout은 config의 preflight_ms / executor_ms / reviewer_ms / verify_ms 양의 정수다. Output은 각 stdout / stderr 최대 8 MiB, 초과하면 BLOCKED. Windows는 taskkill /T /F, POSIX는 Process Group SIGKILL로 종료한다. SIGINT / SIGTERM도 자식 종료 후 BLOCKED 기록을 남긴다.
- 오류 분류: quota(한도) → BLOCKED, auth(만료 / 미확인) → HUMAN_REQUIRED, spawn / timeout / exit / malformed / guard / verify → BLOCKED. 분류는 Process 실패에서 적용하며 자연어 성공 설명을 PASS 근거로 쓰지 않는다.

## Task Contract / 경로

- 필수: id, title, task_file, allowed_paths, forbidden_paths, verify, max_review_cycles=3.
- verify 항목: `{ "command": ["실행 파일", "인자"], "cwd": "." }`. cwd는 Repository 내부 상대 경로만 허용한다. Shell Script는 명시적으로 `["bash", "scripts/verify.sh"]`처럼 호출한다.
- 경로 규칙은 정확한 파일 또는 `/`로 끝나는 디렉터리 Prefix다. Glob은 지원하지 않는다. 절대 경로, 역슬래시, `..`, `.git/`, 중복 보고, Symlink는 거부한다. forbidden_paths가 우선한다.
- Task Contract와 Template / Schema / Task 문서는 Preflight에서 읽어 메모리에 고정한다. 실제 변경 목록은 Git status를 사용하며 삭제·추가·staged·unstaged를 포함한다.
- TASK-019 예시는 조사 / 전략 제안 단계다. CI 변경은 Human Gate 전 금지 경로로 둔다. 승인 이후 별도 Human 지시로 Contract를 검토·갱신해야 하며 Script는 Gate 승인을 추론하지 않는다. TASK-018 DONE / TASK-019 실행 지시 전 예시를 실행하지 않는다.

## 실행 / 정지 / 결과 / Exit Code

1. Human이 승인한 Task Branch에서 clean Working Tree를 준비한다.
2. config.example.json을 `harness/config.local.json`으로 복사하고 PC별 CLI 경로 / Timeout을 입력한다. Secret / 계정 정보는 넣지 않는다.
3. `node scripts/orchestrator/run.mjs <TASK-ID>` 또는 `--config <path>`로 실행한다. Git Root에서만 실행한다.
4. Ctrl+C로 정지한다. Resume는 없으며 변경을 Human이 검토한 뒤 새 실행을 준비한다.
5. stdout의 run_dir와 `.harness/runs/<run-id>/state.json`에서 phase / status / reason / review_cycles를 확인한다. Phase별 Prompt / JSON / stdout / stderr / Verify Log도 같은 폴더에 남긴다.

| 종료 상태 | Exit Code |
|---|---:|
| PASS | 0 |
| 내부 오류 ERROR | 1 |
| HUMAN_REQUIRED | 2 |
| BLOCKED | 3 |

Run ID는 UTC Timestamp + UUID다. 기록 디렉터리와 config.local.json은 Git 비추적이다. 로그 / Prompt / 결과는 저장 전에 Bearer / 알려진 Token Prefix / Password·Secret·API Key 할당 / Private Key를 Redaction한다. Executor -o 원본은 OS 임시 디렉터리에 받고 읽은 뒤 삭제한다. Redaction은 일반 임의 문자열의 Secret 여부를 보장하지 않으므로 CLI / Task 입력에 Secret을 넣지 않는다. 실패 시에도 최종 state.json을 기록하며 실제 변경을 되돌리거나 Commit하지 않는다.

## 검증 / 남은 단계

- `node --test "scripts/orchestrator/*.test.mjs"`: Fake CLI와 임시 Git Repo로 성공 / 반복 / 즉시 정지 / Timeout / JSON / Guard / Preflight / 기록 검증.
- `git diff --check`, package.json / package-lock.json / build.gradle 무변경 확인.
- 실제 CLI Smoke Run은 C단계 Claude 세션, AGENTS.md 정책 반영은 D단계다.
- Reviewer(Claude)가 Sandbox 밖에서 Node 24.21.0으로 위 glob 명령을 실행해 tests 30 / pass 30 / fail 0을 확인했다 (약 22.7초). `.mjs` 조건을 유지하며 `index.js` 예외는 필요 없다.
- Reviewer가 Claude CLI 2.1.286의 `--tools`, `--strict-mcp-config`, `--allowedTools`, `--output-format` 옵션 존재를 확인했다.
- 알려진 제약: Codex `unelevated` Sandbox 안에서는 Node 자식 Process 생성이 `spawn EPERM`으로 차단된다. Test / Build 같은 Deterministic Verification은 Executor가 아니라 Orchestrator가 Sandbox 밖에서 실행한다 (현재 Verify Phase 설계와 일치). Executor 결과의 verification은 참고 정보이며 Orchestrator Verify가 기준이다.
- `elevated` 전환 시 재검증은 TASK-020 항목이다.
