# 12. Local Orchestrator 설계

## 범위 / 구성

TASK-018의 최소 설계를 기반으로 DEC-026과 TASK-020을 구현한다. Node.js 24 / JavaScript ES Module / Node 내장 Module만 사용한다. Dependency와 Git Branch / Commit / Push / PR / Merge 자동화는 추가하지 않는다.

- run.mjs: 실행 / Resume / Phase 기록 / Agent와 Verify 호출.
- lib.mjs: Process / Schema / Git Snapshot / 경로·Secret·인코딩 Guard / Redaction / 오류 분류.
- workspace.mjs: detached worktree / Repository 공통 Lock / clean worktree 정리.
- state-machine.mjs: Executor 요청과 Reviewer Verdict의 결정적 전이.
- status-sync.mjs: AGENTS.md 3절 Current Task / Status 동기화와 변경 제한 Guard.
- harness/tasks / schemas / prompts / policies: 실행 계약 / 결과 계약 / 역할 Template / 문서 책임 규칙. Markdown Task와 승인 Decision을 JSON이 대체하지 않는다.
- Fake CLI와 임시 Git Repository로 단위 / 통합 검증한다.

## State Machine

Preflight → Workspace → Execute → Guard → Verify → Review → Decide 순서다. Phase별 입력 / 출력과 state.json을 저장한다.

| 조건 | 전이 / 종료 |
|---|---|
| Preflight 성공 | Workspace / Execute |
| main / detached HEAD / 더러운 초기 Working Tree / 설정·계약 오류 / CLI 실행 불가 | BLOCKED |
| 로그인 만료·미확인 | HUMAN_REQUIRED, 로그인 시도 없음 |
| Executor DONE / HUMAN_REQUIRED, 계약과 Guard 정상 | Verify → Review |
| Executor FAILED / CLI 실패 / Timeout / Schema 오류 | BLOCKED |
| 변경 파일 불일치 / 경로 위반 / Symlink / Secret / 인코딩 손상 | BLOCKED, Review 호출 없음 |
| Verify 실패 / Verify 또는 Review의 Working Tree 변경 | BLOCKED, 자동 Rework 없음 |
| Reviewer BLOCKED | BLOCKED, Executor 재호출 없음 |
| 실제 Human 결정 요청과 Reviewer PASS / CHANGES_REQUIRED / HUMAN_REQUIRED | HUMAN_REQUIRED, Verdict와 Finding 보존, 자동 Rework 없음 |
| Human 결정 요청 없이 Reviewer CHANGES_REQUIRED | 같은 Task Finding만 Rework, 최대 3회 |
| Reviewer HUMAN_REQUIRED | HUMAN_REQUIRED |
| Reviewer PASS + handoff_actions 존재 | HANDOFF_PENDING, Git 실행 없이 후속 작업 대기 |
| Reviewer PASS, 후속 작업 없음 | PASS |
| 세 번째 Review도 CHANGES_REQUIRED / Review 한도 도달 | HUMAN_REQUIRED, 네 번째 Execute / Review 없음 |
| Script 내부 오류 | ERROR |

Executor의 human_decisions_needed와 handoff_actions를 구분하며 내부 / Codex strict Schema 모두 필수다. HUMAN_REQUIRED라도 후속 작업만 있으면 Human Gate로 간주하지 않는다. Contract verify 명령과 자동 Guard / Verify / Review / Decide는 handoff_actions에 적지 않는다. Commit / Push / PR 등 Orchestrator 밖 후속 작업만 적는다. state.json에 Executor 요청과 Reviewer Verdict를 함께 보존한다. PASS와 HANDOFF_PENDING은 Human 승인이나 Task DONE을 대신하지 않는다.

## 호출 규격

- 설정 명령은 실행 파일과 고정 인자의 문자열 배열이다. spawn은 shell:false / windowsHide:true다. .cmd / .bat 대신 Node와 CLI JS entry를 사용한다.
- Preflight: Git Root / Branch / Working Tree / Node 24 / CLI Version / Codex 로그인 / Timeout / 계약 확인. 로그인은 성공 Exit Code로 판단하며 계정 정보를 Prompt에 넣지 않는다. Claude 인증 오류는 실제 호출에서 분류한다.
- Codex: exec -s workspace-write -c windows.sandbox="<config.sandbox>" --output-schema <strict-schema> -o <temporary-result> -. 설정은 elevated / unelevated만 허용하고 그 외는 BLOCKED다. 기본값은 elevated(2026-10-02 TASK-020 재검증 / Human 결정 A)다. Template / Contract / Task / Finding을 stdin으로 전달하고 stdin.end(prompt)로 닫는다.
- Claude: -p --output-format json --allowedTools Read,Grep,Glob --tools Read,Grep,Glob --strict-mcp-config. 쓰기 / Shell / MCP 도구는 제공하지 않는다. 입력은 Template / 결과 Schema / Contract / Task / 실제 누적 Diff / Verify Log다. Executor summary / verification 자기 설명은 전달하지 않는다.
- Claude envelope의 result는 순수 JSON / Code Block / 설명으로 둘러싼 단일 JSON 객체를 허용한다. 여러 객체 / is_error / permission_denials는 BLOCKED다.
- Executor 필수 필드: status / changed_files / summary / verification / human_decisions_needed / handoff_actions. Reviewer 필수 필드: verdict / findings. 추가 필드를 거부하며 CHANGES_REQUIRED는 하나 이상의 Finding을 요구한다.
- 내장 Validator는 type / enum / const / required / properties / additionalProperties / items / uniqueItems / minItems / minLength만 지원한다. strict transport Schema는 CLI 지원 Keyword를 사용하고 내부 검증은 중복과 빈 경로도 검사한다.
- Timeout 설정은 양의 정수다. stdout / stderr는 각각 최대 8 MiB다. Timeout / 출력 초과 / SIGINT / SIGTERM 시 Windows taskkill /T /F 또는 POSIX Process Group을 종료한다.
- CLI 실패 분류 우선순위: quota → auth → sandbox → schema → 기타. auth는 HUMAN_REQUIRED, 나머지는 BLOCKED다. 실제 CLI Process의 spawn EPERM / EACCES / Sandbox denied·refused 등 오류 신호만 sandbox로 분류한다. CLI 정보성 Sandbox Header(`sandbox: workspace-write [workdir, /tmp, $TMPDIR]`)는 거부 신호가 아니다. model / approval Header와 user Prompt Echo도 분류에서 제외하며, 단순 sandbox / schema / Malformed 단어는 오류 신호가 아니다. Verify 실패는 출력 내용과 관계없이 verify / BLOCKED로 먼저 처리한다.

## Task Contract / Guard

classify()의 내부 정지 사유 fallback은 quota → auth → timeout → sandbox → schema → secret → guard → verify → execution 순서다. Timeout은 Process 실행에서 직접 판정하며 BLOCKED다. CLI 진단 신호의 quota → auth → sandbox → schema 우선순위와 일치하고, fallback에서 timeout은 auth 다음에 둔다.

- 필수: id / title / task_file / allowed_paths / forbidden_paths / verify / max_review_cycles=3. verify는 명령 배열과 Repository 내부 상대 cwd를 사용한다.
- 경로는 정확한 파일 또는 /로 끝나는 디렉터리 Prefix다. Glob은 지원하지 않고 forbidden_paths가 우선한다. 절대 경로 / 역슬래시 / .. / .git / 중복 보고 / Symlink를 거부한다.
- Git status의 staged / unstaged / 삭제 / untracked를 모두 포함한다. changed_files는 최초 clean baseline 이후 누적 전체 목록이다. HEAD 대비 Diff와 비추적 내용을 Snapshot으로 보존하고 Verify / Review 이후에도 대조한다.
- Secret 파일과 알려진 Token Prefix / Private Key / Password·Secret·API Key 할당을 차단한다. tracked Diff는 추가 줄, untracked는 전체 내용을 검사한다. 삭제 줄과 Context의 기존 Test fixture는 새 Secret으로 취급하지 않는다. ignored Secret 파일도 Verify / Review 전에 검사한다.
- 인코딩 Guard는 추가 줄과 untracked 내용에 물음표 3개 이상의 연속 치환 흔적 또는 U+FFFD가 있으면 BLOCKED로 정지한다. 정상 문서에는 해당 흔적이 필요하지 않다고 가정한다. 삭제 줄과 Context는 제외한다.
- 한글 문서는 apply_patch 등 UTF-8 보장 수단으로 작성한다. PowerShell Set-Content / Out-File 기본 인코딩과 Shell 리다이렉션으로 쓰지 않는다. 완료 전 변경 문서를 직접 확인한다.
- AGENTS.md가 allowed_paths에 있어도 guardAgents를 적용한다. syncAgents는 baseline과 docs/07-TASKS.md를 비교해 **3절 Current Task / Status 코드 블록만** 동기화한다. 임의 DONE / 다음 Task READY 승격은 하지 않으며 TASK-020 완료 전 TASK-021로 동기화하지 않는다.
- 완료 기록을 반영하는 Executor가 Contract에서 AGENTS.md를 허용할 때 syncAgents와 같은 방식으로 두 코드 블록 값을 편집한다. Orchestrator는 파일을 자동 편집하지 않고 guardAgents로 검증만 한다. 원래 줄바꿈을 보존하며 Guard 비교에서는 CRLF / LF를 정규화한다. 코드 블록 밖의 내용 변경은 차단한다.

## 실행 / 작업 공간 / Lock

Human이 승인한 Task Branch / clean Working Tree / 비민감 harness/config.local.json을 준비하고 Git Root에서 node scripts/orchestrator/run.mjs <TASK-ID> 또는 --config <path>로 실행한다.

Repository 공통 Git directory의 realpath Hash로 OS 임시 경로에 exclusive-create Lock을 만든다. 다른 Task / worktree도 같은 Lock을 공유한다. 충돌은 BLOCKED이며 기존 기록을 덮어쓰지 않는다. stale Lock은 자동 제거하지 않고 Human이 소유 PID / Run을 확인한다.

.harness/workspaces/<run-id>에 승인 HEAD의 detached worktree를 생성한다. Execute / Guard / Verify / Review는 이 폴더에서 실행하며 Human 작업 폴더의 소스는 변경하지 않는다. 변경 worktree는 Diff 검토와 Resume를 위해 보존한다. cleanupWorkspace는 저장 루트 내부 realpath와 clean 상태를 확인한 뒤 정리하며 강제 삭제하지 않는다.

자기 구현을 변경하는 TASK-020은 실행 시작 시점의 안정 Module / Template / Schema로 실행하며 변경 중인 Module을 동적으로 import하지 않는다. Resume도 검증된 안정 Entrypoint로 실행한다.

## Resume

Human이 정지 사유와 Diff를 검토하고 원인을 해결한 뒤 Run directory에 resume-approval.json을 제공한다.

```json
{
  "run_id": "stopped-run-id",
  "snapshot_hash": "recorded-snapshot-hash",
  "stop_reason": "recorded-stop-reason",
  "approved": true,
  "reference": "Human 승인 기록의 비민감 참조"
}
```

node scripts/orchestrator/run.mjs --resume <run-id>는 Lock / HUMAN_REQUIRED 또는 BLOCKED 상태 / Repository identity / HEAD / 누적 Snapshot Hash / 승인 정보를 확인한다. 승인 없이 정지를 해제하지 않는다. 승인 기록을 보존하고 입력 파일은 소비한다. 기존 Human Gate 승인도 해당 cycle에만 적용한다.

frozen.json은 설정 / Contract / Task / Schema / Template / 작업 공간 / baseline HEAD를 보존한다. checkpoint.json은 cycle / Finding / Guard 통과 Executor 결과를 보존한다. 결과가 있으면 Guard와 Verify부터, 없으면 같은 cycle의 Execute부터 재개한다. Resume에서도 Review는 누적 최대 3회다. 자동 재시도 / 계정 전환 / API 우회를 금지한다. PASS / HANDOFF_PENDING은 재개하지 않으며 Crash나 Snapshot 불일치는 Human 검토가 필요하다.

## 기록 / Exit Code

Run ID는 UTC Timestamp + UUID다. .harness/runs/<run-id> / workspace / config.local.json은 Git 비추적이다. Prompt / 결과 / stdout / stderr / Verify Log / state는 저장 전에 Redaction한다. Executor 원본은 OS 임시 경로에서 읽은 뒤 삭제한다. Redaction은 임의 Secret 검출을 보장하지 않으므로 CLI 인자 / Task / Prompt에 Secret을 넣지 않는다. 실패해도 state.json을 남기고 실제 변경을 되돌리거나 Commit하지 않는다. Ctrl+C로 정지할 수 있다.

| 종료 상태 | Exit Code |
|---|---:|
| PASS / HANDOFF_PENDING | 0 |
| ERROR | 1 |
| HUMAN_REQUIRED | 2 |
| BLOCKED | 3 |

## 검증 / 남은 단계

- node --test "scripts/orchestrator/*.test.mjs": Fake CLI / Human 요청 후 Verify·Review / handoff / Guard / worktree / Lock / Resume / AGENTS 동기화 / 오류 분류 검증.
- git diff --check, package.json / package-lock.json 무변경과 새 Dependency 없음을 확인한다.
- Deterministic Verification은 Orchestrator가 Sandbox 밖에서 실행한다. unelevated에서 관찰된 spawn EPERM 등 Sandbox 제약으로 Test를 실행하지 못한 것만으로 FAILED / HUMAN_REQUIRED를 반환하지 않고 DONE + verification에 사유를 적는다. DONE은 구현 결과이며 Verify 성공이나 Human 완료 승인을 대신하지 않는다. 실제 검증 실패를 숨기지 않는다.
- Verify 실패는 BLOCKED이며 자동 Rework / Review를 진행하지 않는다. 이번 Finding 수정은 Human의 명시적 지시에 따른 Rework다. Sandbox 밖 Verify 성공 후 다음 Review를 요청한다.
- unelevated에서 확인된 Node 자식 Process spawn EPERM 제약은 elevated 재검증에서 해소됐다. elevated에서도 Orchestrator Verify가 기준이며 Executor 자체 Test는 참고 증거다. 전환 근거는 DEC-026 변경 이력을 따른다.
- 제안: 후속 승인 Task에서 scripts/verify.*에 Orchestrator Test를 포함하고 CI에 Node 결정적 검사를 추가한다. 현재 Contract에서 해당 Script / .github를 수정하지 않는다. CI 동작 변경은 Gate C 대상이다.
