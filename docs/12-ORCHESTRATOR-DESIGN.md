# 12. Local Orchestrator 설계

## TASK-025 AWS Profile Preflight

Contract의 선택 필드 `aws_profiles`는 중복 없는 Profile alias 배열이다. 없거나 빈 배열이면 AWS CLI / 로컬 기대값 검사를 생략하여 기존 Contract 동작을 유지한다. 허용 alias는 moodfit-readonly / moodfit-staging이며 Executor / Reviewer에는 이 alias만 전달한다.

비추적 config.local.json의 aws 설정에는 command 배열, allowed_profiles / forbidden_profiles 배열, profiles의 alias별 account / role 기대값을 둔다. Account는 정확한 12자리, role은 suffix를 포함한 정확한 SSO Role 이름이다. config.example.json은 Placeholder만 제공한다. aws 설정은 frozen.json에서 제외하고 Resume 시 로컬에서 다시 읽는다. 실제 기대값 / identity 응답은 Agent 입력이나 Run 기록에 넣지 않는다.

Preflight와 각 Verify 직전에 aws-preflight.mjs가 STS get-caller-identity를 명시적 profile / JSON 출력 / preflight_ms Timeout으로 호출한다. 기록되는 call wrapper를 사용하지 않는다. Account와 assumed-role ARN 내부 계정 및 Role 이름을 정확히 비교하며 부분 일치는 거부한다. CLI stdout / stderr는 메모리에서만 처리한다.

기대값 없음, 금지 / allowlist 밖 Profile, AdministratorAccess 포함 Role, 만료 / 조회 실패 / Timeout / 잘못된 응답, Account / Role 불일치, 환경변수의 다른 자격 증명 공급원은 HUMAN_REQUIRED다. Access Key 계열, AWS_PROFILE / AWS_DEFAULT_PROFILE, Web Identity / Role / Container credentials, 자격 증명 또는 config 경로 override를 차단한다. 재로그인 / 자동 재시도 / fallback은 없다. Verify 재확인 실패 시 Verify 명령과 Review를 호출하지 않는다.

Run 기록은 alias / 일치 여부 / UTC / 정지 사유 종류만 남기며 파일명과 Run 디렉터리로 호출과 Run을 구분한다. Fake CLI Test로 성공 / 거부 / 재확인과 전체 Run 기록의 민감 응답 비저장을 확인한다. 실제 Profile 검증은 Human 구성 후 TASK-026 실행 전에 한다.

## TASK-022 PR 관찰

Git 변경 전과 Commit / Push 전에 전체 페이지의 open PR / 원격 Task ref를 확인한다. 같은 Branch 또는 Task ID의 PR과 원격 SHA 충돌은 BLOCKED다. Draft PR 생성 뒤 repository / PR 번호 / main / Task Branch / head SHA를 git-result.json에 고정한다.

`node scripts/orchestrator/pr-gate.mjs <run-id>`는 저장된 PR을 한 번 관찰한다. 공통 Repository Lock, 기존 gh 인증, 30초 명령 Timeout, redacted Audit를 사용한다. 자동 polling / 재시도는 없다. ci.yml의 최신 current head pull_request Run에서 frontend / backend가 각각 completed / success일 때만 HUMAN_REVIEW_PENDING이다. 이전 SHA / 누락 / pending은 CI_PENDING이며 non-success는 BLOCKED다. concurrency queue의 이전 Run 성공이 최신 Run 성공을 대신하지 않는다.

Changes Requested는 head SHA와 Review ID / commit 근거를 보존한 REWORK_REQUIRED로 정지한다. PR Approve / Label / Comment는 완료 승인이나 Gate 입력이 아니다. Gate는 resume-approval.json을 유지한다. MERGED는 merged_by / merge SHA / 단일 parent 근거를 기록하며 승인된 Squash 전용 Ruleset을 전제로 한다. Merge / Auto Merge / 다음 Task 실행 / READY 승격은 수행하지 않는다.

dependency_evidence의 merged_by는 병합 수행자의 login이다. 단일 parent만으로 Squash와 Rebase Merge를 구분할 수 없으므로 Squash-only Ruleset에 의존한다. 해제되지 않은 이전 CHANGES_REQUESTED Review가 있으면 이미 병합된 PR도 MERGED보다 먼저 REWORK_REQUIRED로 정지한다. 이 안전한 판정 순서는 유지하며 Human이 오래된 Review를 검토하고 Dismiss한 뒤 관찰 명령을 다시 실행한다.

CI non-success와 identity 확인 후 조회 실패 / Timeout은 고정 상태 Comment를 기존 PR에 남긴다. 인증 실패 / identity 충돌은 Comment를 보내지 않는다. Comment 실패도 Audit에 남기고 재시도하지 않는다. 강제 취소 / Timeout은 Summary Step 실행을 보장하지 않으므로 로컬 관찰 Audit / Comment로 보완한다.

Comment 중복 제거는 없다. 같은 실패 head에서 pr-gate를 명시적으로 다시 실행하면 같은 형식의 Comment를 다시 시도한다. 1회 실행은 1회 관찰이며 자동 재시도는 수행하지 않는다.

CI가 성공했지만 Merge 없이 닫힌 PR은 BLOCKED / PR closed without Merge를 Audit에 기록하며 CI 실패 Comment를 보내지 않는다.

실제 E2E는 아직 수행하지 않았다. 승인된 Git Phase 후 관찰 명령으로 최신 SHA CI 근거를 남기고 Human Squash Merge 후 다시 관찰하여 dependency_evidence를 기록한다. TASK-022는 E2E 확인 전 IN_PROGRESS를 유지한다.

이번 Run이 직접 생성하는 Draft PR을 E2E 대상으로 삼는다. 최신 head의 frontend / backend success를 관찰하고 Human Squash Merge 후 다시 관찰한다. 이전 CHANGES_REQUESTED로 정지하면 Human의 오래된 Review Dismiss 후 다시 관찰하여 merged_by를 포함한 dependency_evidence를 남긴다. PR 번호 / CI Run / Merge 결과는 Merge 후 Claude 세션이 기록한다.

strict Required Checks로 인해 main이 이동하면 Human이 기존 PR Branch를 최신 main 기준으로 갱신해야 한다. 이때 head.sha가 바뀌므로 기존 Run의 관찰은 PR identity / head SHA conflict로 정지한다. 자동으로 저장 SHA를 따라가거나 identity 검사를 우회하지 않는다. E2E 복구는 Human이 기존 Run / PR 번호 / Task Branch / 이전·새 head SHA / main 기준 / 갱신 Diff를 검토하고 새 head에 대한 검증 및 Claude Review 근거와 저장 identity 갱신을 명시적으로 승인한 뒤 진행한다. 승인된 Human이 원래 git-result.json과 정지 Audit를 보존하고 승인 참조 / 이전·새 SHA를 별도 redacted Audit에 남긴 후 같은 PR의 commit_sha를 승인된 새 SHA로 갱신한다. Executor는 이 작업을 수행하지 않으며 관찰 CLI는 resume-approval.json을 소비하거나 identity 갱신을 자동 수행하지 않는다. Human이 관찰 명령을 명시적으로 다시 실행해 새 head의 최신 frontend / backend success를 확인하고, Human Squash Merge 후 동일 identity로 dependency_evidence를 기록한다. 이전 SHA의 CI / Review 근거만으로 Merge하지 않으며 Merge / Force Push / 다음 Task 자동 실행은 허용하지 않는다.

E2E 사전 확인에서 설치된 gh의 `gh api --help`에 --paginate / --slurp가 있는지 확인한다. 2026-10-02 Executor 환경에서 두 옵션 지원을 확인했으며 CLI 설치 / 업데이트는 수행하지 않았다. 다른 실행 환경에서 미지원이면 설치 / 업데이트 승인 없이 진행하지 않는다. Task ID가 후속 PR 본문의 선행 Task 참조로만 등장해도 현재 중복 검사에서 BLOCKED될 수 있다. 이 안전 정지는 Audit와 PR identity를 Human이 검토하며 자동 우회하지 않는다. 매칭 정밀화는 이번 Rework에서 수행하지 않았다.

## 범위 / 구성

TASK-018의 최소 설계를 기반으로 DEC-026과 TASK-020 / TASK-021을 구현한다. Node.js 24 / JavaScript ES Module / Node 내장 Module만 사용한다. TASK-021 승인 범위에서 기존 Task Branch의 Stage / Commit / Push / Draft PR 계층을 추가한다. Branch 생성과 Merge / Auto Merge는 수행하지 않는다.

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
| 실제 Human 결정 요청과 Reviewer PASS / HUMAN_REQUIRED | HUMAN_REQUIRED, 마지막 Verdict와 회차 보존 |
| 실제 Human 결정 요청과 Reviewer CHANGES_REQUIRED | Gate를 보존하며 같은 Task Rework, 최대 3회 후 HUMAN_REQUIRED |
| Human 결정 요청 없이 Reviewer CHANGES_REQUIRED | 같은 Task Finding만 Rework, 최대 3회 |
| Reviewer HUMAN_REQUIRED | HUMAN_REQUIRED |
| Reviewer PASS + handoff_actions 존재 | HANDOFF_PENDING, TASK-022 이후 승인된 모든 Task는 Git 단계 성공 후 후속 작업 대기 |
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
- Executor 필수 필드: status / changed_files / summary / verification / human_decisions_needed / handoff_actions / pr_overview / pr_changes / pr_follow_up. PR용 필드는 한글 개요 문자열 / 주요 변경 배열 / 후속 작업·잔여 위험 배열이다. Reviewer 필수 필드: verdict / findings. 추가 필드를 거부하며 CHANGES_REQUIRED는 하나 이상의 Finding을 요구한다. 기존 Resume는 frozen Schema / Template을 그대로 사용한다.
- 내장 Validator는 type / enum / const / required / properties / additionalProperties / items / uniqueItems / minItems / minLength만 지원한다. strict transport Schema는 CLI 지원 Keyword를 사용하고 내부 검증은 중복과 빈 경로도 검사한다.
- Timeout 설정은 양의 정수다. stdout / stderr는 각각 최대 8 MiB다. Timeout / 출력 초과 / SIGINT / SIGTERM 시 Windows taskkill /T /F 또는 POSIX Process Group을 종료한다.
- CLI 실패 분류 우선순위: quota → auth → sandbox → schema → 기타. auth는 HUMAN_REQUIRED, 나머지는 BLOCKED다. 실제 CLI Process의 spawn EPERM / EACCES / Sandbox denied·refused 등 오류 신호만 sandbox로 분류한다. CLI 정보성 Sandbox Header(`sandbox: workspace-write [workdir, /tmp, $TMPDIR]`)는 거부 신호가 아니다. model / approval Header와 user Prompt Echo도 분류에서 제외하며, 단순 sandbox / schema / Malformed 단어는 오류 신호가 아니다. Verify 실패는 출력 내용과 관계없이 verify / BLOCKED로 먼저 처리한다.

## Task Contract / Guard

- 실행 중인 Task의 harness/tasks/<id>.json은 allowed_paths에 포함돼도 변경을 차단한다. 다른 Task Contract 변경도 일반 경로 Guard를 따른다.
- TASK-021 Human 결정 2에 따라 Contract의 `agents_sections: ["12"]`로 12절 본문 변경을 허용한다. 제목과 비승인 절은 변경할 수 없다.

## TASK-021 Git 계층

TASK-022 이후 Human이 Contract를 승인한 모든 Task의 Decide 결과가 PASS / HANDOFF_PENDING이며 Executor DONE, Claude PASS, 모든 Contract Verify Exit 0, 미해결 Human Gate 없음일 때만 Git Phase를 호출한다. HANDOFF_PENDING의 다른 후속 작업은 유지한다. TASK-021 자체는 자동 Git을 호출하지 않는다.

Human이 준비한 task/<Task ID>-<slug> Branch와 최초 HEAD를 고정한다. detached worktree의 검토된 누적 Diff를 다시 Guard한 뒤 Workspace의 ignored Secret, Source Branch / HEAD / clean Working Tree 충돌, gh 인증과 origin/main 읽기 접근을 확인한다. Source의 Git 비추적 ignored Secret은 존재만으로 차단하지 않는다. changed_files / Stage 대상과 실제 staged 목록에 기존 secretFile 규칙의 Secret 경로가 있으면 BLOCKED한다. 인증 실패는 HUMAN_REQUIRED이며 설치 / 로그인은 시도하지 않는다. 인증 출력은 저장하지 않고 Exit / Failure만 기록한다. Process 실패 / Timeout은 BLOCKED이며 자동 재시도하지 않는다.

검토한 binary patch와 untracked 파일을 Source에 전달하고 Diff를 대조한다. allowed_paths 안의 파일별 literal pathspec Stage, staged 목록의 Secret 검사 / Allowlist 대조 후 Task ID와 Task 제목을 Commit 제목으로 쓰고 Codex / Claude Trailer를 넣는다. Commit 직전에도 staged 목록의 Secret 검사 / Allowlist 대조를 다시 수행한다. origin의 같은 Task Branch로 Force 없는 Push 후 gh pr create --draft --base main으로 생성한다. PR 전 Base / Head / SHA / 신규 파일 포함 목록 / Diff Summary / Test 결과를 기록하고 TASK-032의 한글 본문 형식을 적용한다. Run 기록은 .harness/runs 아래 저장하며 명령별 Audit를 보존한다.

Commit 직전 Workspace Snapshot이 검토 당시와 동일한지 다시 확인한다. 삭제되지 않은 각 파일은 Source Repository에서 `git hash-object --path <file> -- <Workspace 파일>`로 Git clean filter(core.autocrlf / attributes 포함)를 적용한 blob hash를 계산하고 `git rev-parse :<file>`의 실제 index blob hash와 대조한다. Source CRLF / Workspace LF라도 실제 Commit 내용이 같으면 허용하며, 실제 문자 변경 또는 binary 바이트 변경은 BLOCKED다. Working Tree 바이트 동일성으로 Commit 내용을 판정하지 않는다.

실패 후 자동 Rollback / 재시도는 없다. Commit / Push / PR 중 일부가 성공했다면 Audit와 Source Working Tree를 Human이 확인한다. Git 작업 실패 Run은 일반 Resume로 Git 작업을 다시 시도하지 못하도록 Source HEAD / clean 조건이 충돌을 차단한다. Human Squash Merge와 Remote CI는 후속 단계다.

Review 3회 한도로 정지한 Run은 Resume 승인이 있어도 추가 Review를 실행하지 않고 HUMAN_REQUIRED로 다시 정지한다. Resume는 반복 횟수를 초기화하지 않는다.

classify()의 내부 정지 사유 fallback은 quota → auth → timeout → sandbox → schema → secret → guard → verify → execution 순서다. Timeout은 Process 실행에서 직접 판정하며 BLOCKED다. CLI 진단 신호의 quota → auth → sandbox → schema 우선순위와 일치하고, fallback에서 timeout은 auth 다음에 둔다.

- 필수: id / title / task_file / allowed_paths / forbidden_paths / verify / max_review_cycles=3. verify는 명령 배열과 Repository 내부 상대 cwd를 사용한다.
- 경로는 정확한 파일 또는 /로 끝나는 디렉터리 Prefix다. Glob은 지원하지 않고 forbidden_paths가 우선한다. 절대 경로 / 역슬래시 / .. / .git / 중복 보고 / Symlink를 거부한다.
- Git status의 staged / unstaged / 삭제 / untracked를 모두 포함한다. changed_files는 최초 clean baseline 이후 누적 전체 목록이다. HEAD 대비 Diff와 비추적 내용을 Snapshot으로 보존하고 Verify / Review 이후에도 대조한다.
- Secret 파일과 알려진 Token Prefix / Private Key / Password·Secret·API Key 할당을 차단한다. tracked Diff는 추가 줄, untracked는 전체 내용을 검사한다. 삭제 줄과 Context의 기존 Test fixture는 새 Secret으로 취급하지 않는다. Workspace의 ignored Secret 파일도 Verify / Review 전에 검사한다. Source의 ignored Secret 존재만으로는 차단하지 않으며 Git 대상 경로와 실제 staged 목록에서 차단한다.
- 인코딩 Guard는 추가 줄과 untracked 내용에 물음표 3개 이상의 연속 치환 흔적 또는 U+FFFD가 있으면 BLOCKED로 정지한다. 정상 문서에는 해당 흔적이 필요하지 않다고 가정한다. 삭제 줄과 Context는 제외한다.
- 한글 문서는 apply_patch 등 UTF-8 보장 수단으로 작성한다. PowerShell Set-Content / Out-File 기본 인코딩과 Shell 리다이렉션으로 쓰지 않는다. 완료 전 변경 문서를 직접 확인한다.
- AGENTS.md가 allowed_paths에 있어도 guardAgents를 적용한다. syncAgents는 baseline과 docs/07-TASKS.md를 비교해 **3절 Current Task / Status 코드 블록만** 동기화한다. 임의 DONE / 다음 Task READY 승격은 하지 않으며 TASK-020 완료 전 TASK-021로 동기화하지 않는다.
- 완료 기록을 반영하는 Executor가 Contract에서 AGENTS.md를 허용할 때 syncAgents와 같은 방식으로 두 코드 블록 값을 편집한다. Orchestrator는 파일을 자동 편집하지 않고 guardAgents로 검증만 한다. Guard 비교에서는 CRLF / LF 혼용도 LF로 정규화한다.
- Human 승인 후 Contract의 선택 필드 `agents_sections`에 문자열 절 번호 배열(예: `["12"]`)을 명시한 경우에만 해당 `## <번호>.` 제목 아래부터 다음 같은 수준 제목 직전까지 본문 변경을 허용한다. 모든 같은 수준 절 제목의 순서 / 내용은 보존하며 제목 변경 / 삭제와 비승인 절 변경은 BLOCKED다. 필드가 없으면 기존 3절 코드 블록 동기화만 허용한다. 잘못된 타입 / 절 번호 / 중복은 Schema 및 run.mjs 검증에서 BLOCKED다. Executor는 자기 Contract를 변경할 수 없다.

## 실행 / 작업 공간 / Lock

Human이 승인한 Task Branch / clean Working Tree / 비민감 harness/config.local.json을 준비하고 Git Root에서 node scripts/orchestrator/run.mjs <TASK-ID> 또는 --config <path>로 실행한다.

Repository 공통 Git directory의 realpath Hash로 OS 임시 경로에 exclusive-create Lock을 만든다. 다른 Task / worktree도 같은 Lock을 공유한다. 충돌은 BLOCKED이며 기존 기록을 덮어쓰지 않는다. stale Lock은 자동 제거하지 않고 Human이 소유 PID / Run을 확인한다.

.harness/workspaces/<run-id의 SHA-256 앞 16자리>에 승인 HEAD의 detached worktree를 생성한다. state.json / frozen.json의 workspace와 workspace_name으로 Run 기록과 대응한다. 기존 Resume는 frozen.workspace의 절대 경로를 사용하므로 긴 이름도 유지한다. Execute / Guard / Verify / Review는 이 폴더에서 실행하며 Human 작업 폴더의 소스는 변경하지 않는다. 변경 worktree는 Diff 검토와 Resume를 위해 보존한다. cleanupWorkspace는 저장 루트 내부 realpath와 clean 상태를 확인한 뒤 정리하며 강제 삭제하지 않는다.

PR 생성 완료 후 상태는 HANDOFF_PENDING이다. 명시적 정리는 `node scripts/orchestrator/cleanup.mjs <run-id>`로 수행한다. 공통 Lock, state / frozen / git-result의 PR identity, Repository identity, 저장 루트의 직접 자식 realpath, baseline HEAD, 저장된 누적 Snapshot Hash를 확인한다. Node의 Windows 확장 경로로 작업 폴더를 삭제한 뒤 해당 worktree 등록만 제거한다. 정지 / 실패 / PR 미생성 / 이후 Diff 변경 Run은 정리하지 않는다. 자동 삭제는 없다. Run 기록과 Human Source는 보존한다.

## TASK-032 PR / Secret / AWS 보강

PR과 Commit 제목은 Contract id와 title을 공백으로 연결한다. 한글 본문에는 개요 / 기능·문서 단위 주요 변경 / Verify 결과 / Reviewer 판정·회차·비차단 Finding / 후속 작업·잔여 위험 / Human Squash Merge 안내와 Auto Merge 없음 / Co-author Trailer를 넣는다. 파일 목록과 Diff 통계는 끝의 details 영역에 둔다. PR 설명은 Git 변경 전에 완전한 본문과 제목의 Secret 검사를 통과해야 한다. 본문은 24,000 UTF-16 code unit을 넘으면 항목별 길이 상한과 생략 표시를 적용하여 필수 Section / Trailer / details 닫힘을 보존한다. 표시되지 않는 부분도 검사한다. 이 Task의 PR은 실행 시작 시점 Version으로 생성되므로 Claude 세션이 Merge 전에 제목 / 본문을 한글로 갱신한다.

기본 Secret 검사는 변경하지 않았다. Human 결정 A에 따라 redact / sanitize / assertNoSecrets / guard와 Secret 보조 구현을 main의 안정 Version으로 복원했다. 오탐 감소는 TASK-034(Contract의 Human 승인 허용 문구 목록)에서 다룬다. 기존 오탐 회피 작성 규칙과 PR 본문 assertNoSecrets 적용을 유지한다. 임의 Secret 검출을 보장하지 않는 기존 한계와 입력 금지 정책은 유지한다.

Gate가 있는 Rework는 checkpoint.pending_gate에 결정 요청을 보존한다. 다음 Executor가 요청을 생략해도 Gate는 유지된다. Resume의 명시 승인 범위는 기존 cycle 규칙을 유지하고 회차를 초기화하지 않는다. Reviewer BLOCKED는 즉시 정지하며 Gate 대기 중 Git은 실행하지 않는다.

AWS Preflight는 endpoint override 환경변수 전체와 CA bundle 환경변수를 차단한다. AWS 설정 파일의 endpoint 재지정은 검사하지 않는 한계가 있다. aws 설정이 없으면 missing-config로 구분한다. run의 env 주입을 Process와 AWS Preflight에 전달하여 Fake CLI Test를 host의 AWS 환경과 격리할 수 있다. 실제 AWS 호출 / 로그인 / 설정 변경은 이번 Task에서 수행하지 않는다.



PR 길이 제한은 surrogate pair를 나누지 않고 빈 Finding / 후속 작업 배열을 유지한다. 계정 ID / ARN 같은 민감 식별값은 Secret 검사 대상이 아니므로 Executor Prompt의 입력 금지 지시에 의존한다. 2026-10-03 Human 승인으로 Git 자동화는 TASK-022 이후 Human이 Contract를 승인한 모든 Task에 적용하며 Task 번호 상한을 없앴다. 기존 Verify / DONE / PASS / Gate / Branch 제한은 유지한다. Rework에서 Executor가 결정 요청을 생략해도 pending_gate를 보존하며 기존 Diff / 정지 사유에 연결된 Resume 승인이 이를 해제한다.

자기 구현을 변경하는 TASK-020은 실행 시작 시점의 안정 Module / Template / Schema로 실행하며 변경 중인 Module을 동적으로 import하지 않는다. Resume도 검증된 안정 Entrypoint로 실행한다.

## TASK-034 승인 문구 검사

Contract 선택 필드 `secret_scan_allow`는 Human이 승인한 literal 문자열 배열이다. 생략 / 빈 배열은 기존 동작을 유지한다. 대소문자를 구분하며 중복 없이 최대 50개, 항목당 3 ~ 200 UTF-16 code unit이다. 한 줄이며 제어 문자 / 앞뒤 공백은 거부한다. 정규식 / wildcard 실행 기능은 없고 해당 문자는 그대로 비교한다. Private Key Block / Bearer(HTTP 인증 헤더) 값 / OpenAI 및 GitHub Key 형식 / 장기 및 임시 AWS Access Key ID / URL 사용자 정보의 자격 증명 형태는 Contract 검증에서 BLOCKED다. 자격 증명 단어와 구분 기호를 포함한 문서 표기는 정확한 문구를 Human이 승인한 경우에만 제외한다.

차단 판정은 원문 입력에서는 승인 literal만 비교하고, JSON 직렬화된 Contract / Resume 승인 입력에서만 escape 형태를 비교한다. 긴 형태부터 한 번의 치환으로 중립 표기를 넣은 사본에 기존 판정을 적용한다. 일치 앞뒤는 공백 / 줄 경계 또는 쉼표·세미콜론·괄호로 분리되어야 한다(JSON에서는 문자열 경계 따옴표도 허용). Key / 값의 연속인 접미는 제외하지 않는다. 자격 증명 단어 단독과 값 없이 구분 기호로 끝나는 항목은 Contract 검증에서 거부한다. TASK-023 목록 표기는 자연어 설명까지 포함한 전체 문구를 승인한다. Guard는 Diff 추가 표시를 제거한 실제 추가 줄을 검사한다. 적용 대상은 Preflight의 Task 문서 / Contract, Resume 승인, Guard 추가 줄 / untracked, PR 전체 제목 / 본문과 Commit 메시지다. Contract 허용 목록은 메타데이터로 분리하여 형식 / 자격 증명 형태를 검증하고 나머지 Contract를 검사한다. 설정 입력에는 허용 목록을 적용하지 않는다.

Run 기록과 Executor / Reviewer 입력은 허용 목록과 무관하게 마스킹한다. 구조화 입력은 sanitize 후 JSON 직렬화하여 객체 / 배열 구조를 유지한다. 확장된 자격 증명 이름의 scalar 값도 마스킹하며 Schema 같은 객체 구조는 재귀 검사한다. Console 오류에는 내용을 넣지 않고 state의 `secret_locations`에 입력 종류 또는 파일 경로, 줄 번호, 규칙 종류만 기록한다. Guard는 추적 파일의 추가 줄에 대해 새 파일 좌표, untracked는 파일 내 좌표를 남긴다. JSON 입력은 직렬화 사본의 줄 번호다. 값 / 줄 원문은 위치 기록에 포함하지 않는다.

Resume은 실행을 시작한 Repository의 현재 Contract 파일에서 허용 목록만 갱신한다. 다른 필드와 중첩 값은 frozen fingerprint와 비교하여 변경되면 BLOCKED다. 허용 목록을 다시 검증하며 마스킹된 frozen 기록과 비교하는 대신 비목록 필드의 원본 fingerprint를 사용한다. Task 문서는 frozen baseline Commit의 blob과 줄바꿈을 정규화한 fingerprint로 복원 / 확인한다. 마스킹된 Run 문서를 검사 원문으로 쓰지 않는다. Workspace 생성 전 Secret 정지에도 frozen / checkpoint / Snapshot을 남긴다. 이 단계의 Snapshot은 활성 Contract 변경만 제외하고 나머지 Diff를 비교한다. Workspace 생성 후에는 기존 전체 Snapshot 검사를 유지한다. 기존 `resume-approval.json`의 정지 사유 / Snapshot 연결 승인이 필수이며 목록 변경만으로 재개하지 않는다. Executor의 자기 Contract 수정 금지 Guard는 유지한다.

원격 Task Branch가 이미 있으면 Human(또는 승인된 Claude 세션)이 허용 목록 Contract Commit을 Push한 뒤 Resume한다. 로컬에만 Commit하면 Git 단계의 원격 Branch SHA 검사에서 BLOCKED 된다.

기본 강화는 URL 사용자 정보, 임시 AWS Access Key ID 및 자격 증명 단어 뒤의 영숫자 / 밑줄 / 하이픈 접미가 있는 할당을 차단과 마스킹에 추가한다. 기존 네 규칙은 유지한다. 임의 Secret의 완전 탐지는 보장하지 않으며 입력 금지 정책은 계속 적용한다. Human이 넓은 문구를 승인하면 해당 정확한 문구 전체가 제외되므로 승인 범위를 검토해야 한다. 기존 Task 문서의 오탐 회피 작성 규칙은 Human이 해당 문구를 Contract에 승인한 범위에서 허용 목록으로 대체할 수 있다. 이 Run은 시작 Version의 Guard로 검사하므로 그 작성 규칙을 지킨다.

## Resume

Human이 허용 목록을 변경하여 Git 단계까지 재개하려면 해당 Task Branch에 활성 Contract의 목록 변경만 Commit한 뒤 승인 파일을 제공한다. Executor는 이 Commit을 수행하지 않는다. Source HEAD가 전진한 경우 이전 Source revision 이후 각 Commit이 단일 부모이며 활성 Contract 한 파일만 변경하고 비목록 필드 fingerprint가 동일한지 검사한다. 중간 Commit도 목록 자격 증명 검증을 통과해야 하며 Source Working Tree는 깨끗해야 한다. 다른 파일 / 필드 / Merge Commit은 BLOCKED다. 기존 Workspace HEAD와 누적 Diff 검사는 유지하고 Git 단계의 Source HEAD / Commit parent 기준만 검증된 새 Source revision으로 사용한다. Workspace 생성 전에는 새 Source revision에서 생성한다. 승인 파일 없는 목록 변경은 재개하지 않는다. 미Commit 목록 변경은 초기 Preflight 재개에 사용할 수 있으나 Git 단계의 clean 검사에서 차단되므로 Git 대상 Task에서는 먼저 Human이 Commit해야 한다.

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
