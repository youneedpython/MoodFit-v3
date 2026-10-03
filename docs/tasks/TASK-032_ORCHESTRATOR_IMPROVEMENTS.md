# TASK-032 — Orchestrator Improvements (PR 본문 / Secret Guard / 자동 Rework)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

TASK-022 ~ TASK-025를 Orchestrator로 실행하며 반복해서 드러난 문제를 AWS Infra Task(TASK-026 ~) 전에 고친다. Human이 2026-10-03 등록과 실행 순서(TASK-032 → TASK-033 → TASK-026)를 승인했다. Task ID는 Orchestrator / CI / Milestone 자동화가 `TASK-숫자 3자리`만 인식하므로 Roadmap 끝 번호 다음을 쓴다.

## 초기 상태 / Dependency

- 초기: `READY`
- 선행: TASK-025 DONE
- 실행: `node scripts/orchestrator/run.mjs TASK-032` (실행 시작 시점의 안정 Version이 자기 자신을 보강한다. TASK-020 / TASK-021과 같은 방식)

## Human Gate

- Runtime / Dependency는 DEC-026 그대로다(Node.js 24 `.mjs`, Dependency 없음). 새 Dependency가 필요하면 Gate C로 정지한다.
- Secret 검사 변경은 보안 정책에 영향을 준다. 아래 "반드시 차단" 사례를 하나라도 통과시키는 완화는 구현하지 않고 `HUMAN_REQUIRED`로 정지한다.
- Git 권한 범위(Commit / Push / Draft PR만, Merge 금지)는 바꾸지 않는다.

## Codex 작업 범위

### 1. PR 제목 / 본문 / Commit 메시지 (Human 지적, 2026-10-03)

현재 자동 PR은 제목이 `chore: TASK-0xx 승인 작업 반영`이고 본문은 영어 고정 문구와 파일 목록 / Diff 통계뿐이다. Human이 "무슨 작업을 했는지 내용을 작성해야 한다"고 지적했다. PR #5 / #7 / #8 / #9는 Claude 세션이 수동으로 다시 썼다.

- 제목: `<TASK ID> <Task 제목>` (Contract의 `id` / `title`). Commit 제목도 같게 한다.
- 본문은 **한글**로 작성하고 다음을 포함한다: 개요(무엇을 왜 했는지), 주요 변경(기능 / 문서 단위 설명), 검증(Verify 명령과 결과), Review 결과(판정, 회차, 비차단 지적 요약), 후속 작업 / 잔여 위험, 승인 안내(Human Squash Merge, Auto Merge 없음), Co-author Trailer. 파일 목록 / Diff 통계는 본문 끝의 접힌 영역(`<details>`)으로 옮긴다.
- 작업 설명의 출처: Executor 결과에 PR용 필드(개요 / 주요 변경 / 후속 작업)를 추가한다. 내부 Schema와 Codex 전달용 strict Schema, Executor Prompt Template, Fake CLI Fixture, Test를 함께 갱신한다. Reviewer 결과의 판정과 Finding은 Orchestrator가 본문에 넣는다.
- 본문에도 Secret 검사를 유지한다. 본문 길이 상한을 두고 넘으면 잘라서 표시한다.
- Squash Merge 설정은 PR 제목 / 본문을 Commit 메시지로 쓰므로 main 이력이 읽을 수 있게 된다.

### 2. Secret 검사 정밀화

현재 `redact` / `assertNoSecrets`는 자격 증명을 뜻하는 단어(password, token, secret, api key 등) 뒤에 구분 기호(콜론 또는 등호)와 값이 오면 모두 Secret으로 본다. 다음 오탐이 실제로 Run을 막았다.

- Task 문서의 한글 설명 줄: 목록 항목 이름이 그 단어이고 뒤에 "AWS Managed Secret 방식" 같은 자연어 설명이 온 경우 (TASK-023 Preflight BLOCKED)
- Secrets Manager ARN 안의 Resource 종류 구분자 뒤에 이름이 온 경우 (TASK-025 사전 확인)

요구 사항:

- **반드시 차단** (기존과 동일, 회귀 Test 유지 / 추가): Private Key Block, Bearer(HTTP 인증 헤더) 값, OpenAI 형식 Key, GitHub Token 형식, AWS Access Key ID 형식, env 형식 Key-Value 할당(자격 증명 이름의 변수에 실제 값), JSON / YAML의 따옴표 값 할당, URL에 포함된 자격 증명.
- **허용으로 바꿀 것** (오탐 제거, Test 추가): 값이 Placeholder(꺾쇠 / `${...}` / 이중 중괄호 / REDACTED 표기 / 빈 값)인 경우, AWS ARN 안의 Resource 종류 구분자, IAM Action 이름, 한글이나 공백이 섞인 자연어 설명 문장(값이 자격 증명 형태가 아님), Markdown 표 / 목록의 항목 이름.
- 판단 기준과 한계를 `docs/12-ORCHESTRATOR-DESIGN.md`에 적는다. 자연어 설명과 실제 값의 구분 규칙은 결정적이어야 한다(같은 입력에 같은 결과).
- 기존 오탐 회피 문구(Task 문서의 작성 규칙)는 이번 Task에서 지우지 않는다. 다음 Task 문서부터 불필요해진다고 기록한다.
- 이번 Task의 Diff / 문서 / Test Fixture 자체가 **현재 Version의 검사**에 걸리지 않게 작성한다(이 Run은 실행 시작 시점의 구 Version Guard로 검사된다). Test에 필요한 차단 사례 문자열은 실행 시점에 조각을 이어 붙여 만들고 Source에 완성된 형태로 두지 않는다.

### 3. Gate 보고와 Review 수정 요구가 겹칠 때 자동 Rework

현재 Executor가 `HUMAN_REQUIRED`를 보고하면 Reviewer가 `CHANGES_REQUIRED`여도 정지한다(TASK-025 Run 1). Human이 검토되지 않은 자료를 받지 않도록 다음처럼 바꾼다.

- Executor `HUMAN_REQUIRED` + Reviewer `CHANGES_REQUIRED` → Finding으로 Rework를 자동 진행한다(`max_review_cycles` 한도 유지). Reviewer가 `PASS` / `HUMAN_REQUIRED`가 되거나 한도에 도달하면 `HUMAN_REQUIRED`로 정지한다. 정지 사유에 마지막 Review 판정과 회차를 함께 기록한다.
- Reviewer `BLOCKED`는 즉시 정지한다.
- Gate 대기 상태에서는 Git 단계(Commit / Push / PR)를 실행하지 않는다. 기존 Resume 승인 방식은 유지한다.

### 4. 작업 폴더 경로 길이 / 정리 (Windows)

Windows에서 Run 작업 폴더(`.harness/workspaces/<run-id>`) 안의 `node_modules` 경로가 길어 `git worktree remove`가 `Filename too long`으로 실패했다(TASK-024).

- 작업 폴더 이름을 짧게 한다(예: Run ID의 짧은 고유 부분). Run 기록 폴더 이름과의 대응을 `state.json` / `frozen.json`에 남긴다. 기존 Run의 Resume 호환을 유지한다.
- Git 단계까지 성공한 Run(`HANDOFF_PENDING`으로 PR 생성 완료)의 작업 폴더를 정리하는 방법을 제공한다. 긴 경로에서도 동작해야 한다. 정지 / 실패한 Run의 작업 폴더는 Human 검토를 위해 자동으로 지우지 않는다.

### 5. AWS Preflight 보강 (TASK-025 Review N-004 ~ N-006)

- `AWS_ENDPOINT_URL`, `AWS_ENDPOINT_URL_STS`, `AWS_CA_BUNDLE` 등 endpoint / CA 재지정 환경변수를 차단 목록에 추가하고 Fake CLI Test를 추가한다.
- `aws` 로컬 설정 자체가 없을 때 정지 사유를 `missing-config`로 구분한다.
- Test가 host 환경변수(`AWS_PROFILE` 등)에 의존하지 않도록 `run()`에 env 주입을 허용하거나 Test에서 격리한다.

### 6. 문서

- `docs/12-ORCHESTRATOR-DESIGN.md`를 구현과 일치시킨다. `docs/11`의 관련 정책 문구(PR 본문 형식, Secret 검사 기준)를 갱신한다.
- `docs/08-WORK_LOG.md`에 기록한다. 완료 반영: TASK-032 DONE / TASK-033 READY / AGENTS.md 3절.

## Run 1 결과와 Run 2 작업 범위 (2026-10-03, Claude 세션 기록)

Run 1(`2026-10-03T05-40-21-199Z-de33ee52`) 경과:

- 1회차: Codex 구현 → Verify 성공 → Claude Review **CHANGES_REQUIRED**(F-001 ~ F-008). Secret 검사 완화가 기존 차단 사례를 통과시키는 회귀(F-001 ~ F-003)가 핵심이다.
- 2회차: Codex Rework 후 Guard에서 **BLOCKED**(`Secret-like input detected`). 원인은 실제 Secret이 아니라 `scripts/orchestrator/lib.mjs`에 추가한 지역 변수 선언이다. 변수 이름이 `Token`으로 끝나고 바로 뒤에 등호와 식이 와서 실행 시점의 구 Version Guard가 Key-Value 할당으로 판정했다. 2회차 변경은 Verify / Review를 거치지 않았다.
- Claude 세션이 작업 폴더 상태(1회차 + 2회차 Rework 진행분)를 **검토 미완료 WIP**로 Task Branch에 Commit했다. 작업 폴더에서 Orchestrator Test는 102 / 102 통과였다. 이 Commit은 Review PASS를 받은 것이 아니다.

Run 2 Codex 작업 범위:

1. WIP Commit 상태에서 이어서 작업한다. 아래 Run 1 Review Finding 전부(F-001 ~ F-008)가 실제로 해결되었는지 하나씩 확인하고, 미해결이면 고친다. 차단 Finding(F-001 ~ F-004)은 회귀 Test로 증명한다.
2. **구 Version Guard 회피 규칙** (이 Run도 실행 시작 시점의 구 Version Guard로 검사된다. 추가하거나 고치는 모든 줄에 적용):
   - 자격 증명을 뜻하는 단어(password, passwd, token, secret, api key 계열)로 **끝나는 식별자 바로 뒤에 등호나 콜론**이 오는 Code를 쓰지 않는다. 예: 변수 이름을 `firstToken` 대신 `firstPart`, `tokenText` 대신 `leadText`처럼 그 단어로 끝나지 않게 짓는다. 객체 Key도 마찬가지다.
   - 기존 WIP의 `lib.mjs`에 있는 해당 변수 선언(`candidate.split(...)`의 결과를 받는 줄)을 이름을 바꿔 고친다. 이 줄은 이미 Commit된 기준선에 있으므로 수정하면 삭제 / 추가 줄이 되고, 추가 줄이 Guard에 걸리지 않아야 한다.
   - Test의 차단 사례 문자열은 실행 시점에 조각을 이어 붙여 만든다(기존 요구와 동일).
   - 작업을 마치기 전에 `git diff`의 추가 줄 전체를 대상으로 위 형태가 없는지 스스로 검색해 확인한다.
3. F-007(자동 Git 단계의 Task 번호 범위): 현재 조건은 TASK-022 ~ TASK-031이다. 범위 확대는 Git 권한 범위(AGENTS.md 12절, DEC-026) 변경이므로 **이번 Run에서 Code를 바꾸지 않는다.** PR의 후속 작업 / 잔여 위험과 WORK_LOG에 Human 결정 필요 사항으로 기록한다. Claude 세션이 Human에게 별도로 묻는다.
4. 완료 반영(TASK-032 DONE / TASK-033 READY / AGENTS.md 3절)과 WORK_LOG 기록을 유지 / 갱신한다.

### Run 1 Review Finding 원문

- **F-001** [차단 / Secret 완화] 새 할당 정규식은 Key 앞에 줄 시작 또는 공백·여는 중괄호·쉼표가 있어야만 일치한다(lib.mjs:27). 구 정규식에는 이 조건이 없었다. guard()는 tracked Diff의 추가 줄을 '+' 접두사가 붙은 채로 검사하므로(lib.mjs:205-208), 열 0에서 시작하는 env 형식 할당(자격 증명 이름 변수 + 등호 + 실제 값)이나 최상위 YAML Key가 추가 줄에 있으면 '+' 때문에 일치하지 않아 Guard를 통과한다. 이는 Task의 '반드시 차단' 항목(env 형식 Key-Value 할당)을 통과시키는 회귀다. 수정: 검사 전에 추가 줄의 '+' 접두사를 제거하거나 접두 조건을 단어 경계 방식으로 바꾼다. '+' 접두 Diff 줄 형태의 차단 회귀 Test를 실행 시 조합 방식으로 추가한다.
- **F-002** [차단 / Secret 완화] F-001과 같은 접두 조건 때문에 구 Version이 차단하던 다음 형태가 통과한다. (1) 점으로 이어진 Key: Spring properties 형식(spring.datasource 계열의 자격 증명 Key에 등호 + 값), 객체 속성 대입(obj.자격증명이름 등호 따옴표 값). (2) URL Query / 연결 문자열에서 '&', ';', '?' 뒤에 오는 자격 증명 이름 + 등호 + 값. (3) '[' 또는 '(' 바로 뒤의 할당. (4) run.mjs:100, 145, 183처럼 JSON.stringify 뒤에 redact / assertNoSecrets를 적용하는 경로: 줄바꿈이 역슬래시+n 문자로 바뀌어 열 0 할당 앞이 줄 시작이 아니게 되므로 Task 문서 / Diff / untracked 파일 안의 할당이 Preflight 검사와 Executor·Reviewer 입력 Redaction에서 빠진다. 수정: 위 구분자 뒤의 Key도 일치하도록 접두 조건을 고치고, 직렬화 전 원문에 검사를 적용하거나 직렬화된 줄바꿈을 경계로 처리한다. 각 형태의 차단 Test를 추가한다. ARN / IAM Action 허용은 Key 판정이 아니라 현재처럼 값 / 구분자 판정으로 유지한다.
- **F-003** [차단 / Secret 완화] 콜론 자연어 예외(lib.mjs:35)는 따옴표 없는 값에 공백·한글·세로선이 하나만 있어도 허용한다. 그래서 YAML의 따옴표 없는 실제 값 뒤에 주석이 붙은 형태(자격 증명 Key 콜론 값 공백 # 주석)나 세로선이 들어간 값이 통과한다. 수정: 판정 전에 후행 YAML 주석(공백 + #)을 제거한다. 그리고 첫 Token이 자격 증명 형태(공백 없는 영숫자·기호 연속, 일정 길이 이상)이면 차단하는 결정적 규칙을 추가한다. 이중 중괄호 Placeholder 판정(lib.mjs:40)은 greedy라서 Placeholder 사이에 실제 값이 끼어도 허용되므로 내부에 닫는 중괄호가 없도록 제한한다. 해당 회귀 Test를 추가하고 docs/12의 판단 기준 / 한계를 구현에 맞게 갱신한다.
- **F-004** [차단 / Resume] Gate가 pending_gate로만 보존되고 Rework 뒤 Executor가 결정 요청을 생략하면(fake의 gate-rework 시나리오와 같음), Human이 resume-approval로 승인해도 Gate가 해제되지 않는다. run.mjs:63은 checkpoint.executor의 status / human_decisions_needed만 보고 approved_cycle을 설정하므로 이 경우 approved_cycle이 삭제된다. Decide(run.mjs:196-198)는 pending_gate를 다시 합쳐 HUMAN_REQUIRED로 정지하고, 그다음 Resume는 Review 한도에 걸린다. Task의 '기존 Resume 승인 방식 유지'에 어긋난다. Git 미실행 방향이라 Gate 우회는 아니지만 Run을 승인할 방법이 없어진다. 수정: Resume 승인 판정에 checkpoint.pending_gate 존재를 포함한다. gate-rework로 정지한 뒤 승인 Resume가 정상 진행하는 Test와, 승인 없는 Resume가 계속 Git을 실행하지 않는 Test를 추가한다.
- **F-005** [문서 불일치] docs/12는 AWS Preflight가 'configured endpoint override를 차단한다'고 적었다. 구현(aws-preflight.mjs:3, 15)은 환경변수 이름만 검사하며, 기본 위치의 AWS 설정 파일에 든 endpoint_url 설정은 확인하지 않는다. 문서를 '환경변수만 차단, 설정 파일의 endpoint 재지정은 검사하지 않음(한계)'으로 고치거나 실제 차단을 구현하고 Fake CLI Test를 추가한다.
- **F-006** [비차단 / PR 본문] 길이 상한 경로(pr-description.mjs의 limited 분기)에서 Finding이나 후속 작업이 비어 있으면 빈 문자열 항목 하나로 바뀌어 '비차단 지적 없음' / '없음' 대신 빈 목록 기호가 출력된다. slice가 UTF-16 surrogate pair 중간을 자를 수 있다. 빈 배열은 그대로 두고 code point 경계에서 자르도록 고친다. 또한 Executor 서술의 민감 식별값(12자리 계정 ID, ARN 등)은 assertNoSecrets 대상이 아니고 Prompt 지시에만 의존한다. 이 한계를 docs/12에 적거나 결정적 검사를 추가한다.
- **F-007** [비차단 / Human 확인 필요] 자동 Git 단계 조건은 Task 번호 22~31로 그대로다(run.mjs:201). Task 문서는 새 PR 형식을 TASK-033의 PR에서 처음 확인한다고 했으나, 현재 조건으로는 TASK-033에서 자동 Commit / Push / Draft PR이 실행되지 않는다. 범위 확대는 AGENTS.md 12절의 Git 권한 범위 변경이므로 Executor가 임의로 바꾸지 말고, PR의 후속 작업 / 잔여 위험과 WORK_LOG에 Human 결정 필요 사항으로 기록한다.
- **F-008** [비차단] hardening.test.mjs의 Test 이름 'Human requests persist across all reviewer verdicts'가 바뀐 동작(CHANGES_REQUIRED는 REWORK)과 맞지 않는다. docs/12 Decide 표의 'Reviewer PASS + handoff_actions 존재 → Git 실행 없이 대기' 행도 Git 성공 뒤 상태를 HANDOFF_PENDING으로 바꾸는 새 동작(run.mjs:204)을 반영하지 않는다. 이름과 표를 구현에 맞춘다.

## Run 2 결과, Human 결정(F-007), Run 3 작업 범위 (2026-10-03, Claude 세션 기록)

Run 2(`2026-10-03T06-09-25-106Z-087818bc`, main의 안정 Version Orchestrator로 실행): Verify 성공, Claude Review **CHANGES_REQUIRED**(R2-001 ~ R2-004). Run 1 Finding 중 F-001, F-002, F-004 ~ F-008은 해결을 확인했고 F-003 계열의 Secret 완화 경로(R2-001, R2-002)가 남았다. Executor가 F-007을 Human 결정 필요로 보고해 구 Version 규칙대로 정지했다. 작업 폴더 상태는 **검토 미완료 WIP**로 Commit했다.

### Human 결정 (2026-10-03): 자동 Git 범위 확대 (F-007)

Human이 자동 Commit / Push / Draft PR 범위를 **TASK-022 이후 Human이 Contract를 승인한 모든 Task**로 넓히는 것을 승인했다. 기존 TASK-022 ~ TASK-031 상한을 없앤다. 다른 제한은 그대로다: Verify 성공 + Executor DONE + Claude PASS + 미해결 Human Gate 없음일 때만 실행, 승인된 `task/` Branch만, main Push / Force Push / History Rewrite / Merge / Auto Merge 금지. Contract `agents_sections`에 `12`를 추가했다(Claude 세션).

### Run 3 Codex 작업 범위

1. **Secret 검사 구조 정리** (R2-001, R2-002, R2-003, R2-004). 예외를 덧붙이는 방식이 새 우회 경로를 만들고 있으므로 다음 원칙으로 단순하게 다시 구성한다.
   - 한 줄에 후보(자격 증명 단어 + 구분 기호 + 값)가 여러 개면 **모든 후보를 각각 독립적으로** 검사한다. 한 후보를 허용했다고 줄의 나머지 검사를 건너뛰지 않는다.
   - 허용 판정은 값 전체가 아니라 **값의 첫 단어(공백 전까지)**에만 적용한다. 첫 단어가 허용 형태(Placeholder, ARN, IAM Action 형식, 후행 구두점 / backtick 제거 후 판정)일 때만 그 후보를 허용하고, 그 뒤의 문자열은 계속 검사 대상이다.
   - 자연어 설명 판정 근거에서 세로선을 빼거나 앞뒤 공백이 있는 표 구분자일 때만 인정한다. 첫 단어가 자격 증명 형태(공백 없는 영숫자 / 기호 연속, 일정 길이 이상, 또는 숫자 / 기호 혼합)이면 뒤에 설명이 와도 차단한다.
   - 등호 형식(env / properties / URL Query)은 Placeholder 외에는 자연어 예외를 적용하지 않는다.
   - `redact()`는 내부 문자열 치환 뒤에도 직렬화 결과 전체에 원문 검사를 이어서 적용한다.
   - 위 규칙으로도 "반드시 차단" 사례와 "허용" 사례를 동시에 만족할 수 없는 경우가 있으면 **차단을 우선**하고, 남는 오탐을 `docs/12`의 한계로 기록한다. 차단 기준을 낮추는 선택이 필요하면 구현하지 않고 Human 결정으로 보고한다.
   - R2 Finding의 회귀 Test를 추가한다(차단 사례 문자열은 실행 시 조합).
2. **자동 Git 범위 확대** (위 Human 결정): `run.mjs`의 Task 번호 상한 조건을 없애고 Test를 추가한다(TASK-032 / TASK-033 형태의 ID에서 Git 단계 실행, TASK-021 이하는 미실행 유지). `docs/11`, `docs/12`, AGENTS.md 12절의 범위 문구를 고친다. 12절은 범위 문구만 수정하고 다른 규칙은 바꾸지 않는다.
3. 구 Version Guard 회피 규칙(Run 2 범위의 2번)은 그대로 적용한다. 이 Run도 main의 안정 Version Guard로 검사된다.
4. 이번 Run에서 새로 Human 결정이 필요한 사항이 없으면 `human_decisions_needed`를 비운다. F-007은 결정되었다.
5. 완료 반영과 WORK_LOG 기록을 갱신한다.

### Run 2 Review Finding 원문

- **R2-001** [차단 / Secret 완화] 허용 분기가 같은 줄의 나머지를 다시 검사하지 않아 env 형식 할당이 통과한다. 따옴표 없는 값은 쉼표나 줄 끝까지 한 번에 잡히고(lib.mjs:36), 자연어 예외(lib.mjs:46)와 ARN 예외(lib.mjs:43)는 그 전체를 그대로 반환한다. 그래서 한 줄 안에서 '자격 증명 단어 + 콜론 + 한글 설명' 뒤에 '자격 증명 이름 변수 + 등호 + 실제 값'이 오면(쉼표 없음) 뒤쪽 할당이 검사되지 않는다. Secrets Manager ARN 뒤에 공백을 두고 같은 할당이 오는 줄도 같다. 구 Version은 이 줄을 차단했으므로 Task의 '반드시 차단'(env 형식 Key-Value 할당)을 통과시키는 회귀다. 수정: 따옴표 없는 값에서 허용 분기를 탈 때 값 부분을 같은 검사기로 다시 검사하거나, ARN 분기는 공백 전까지의 ARN만 허용하고 나머지는 계속 검사한다. '한글 설명 뒤 env 할당'과 'ARN 뒤 env 할당' 차단 회귀 Test를 실행 시 조합 방식으로 추가하고, 기존 허용 Test(TASK-023 / TASK-025 오탐 형태)가 계속 통과하는지 확인한다. 추가 줄에는 Task 문서의 구 Version Guard 회피 규칙을 그대로 적용한다.
- **R2-002** [차단 / Secret 완화] 자연어 예외(lib.mjs:46)는 값에 세로선만 있어도 적용된다. 공백과 한글이 없고 세로선이 든 8자 미만의 콜론 값은 통과하는데, 세로선이 없는 같은 길이의 값은 차단된다. 세로선은 Markdown 표의 칸 구분자일 때만 의미가 있으므로, 세로선 앞뒤에 공백이 있을 때만 자연어 근거로 인정하거나 세로선을 근거에서 빼고 공백 / 한글만 사용한다. 짧은 세로선 포함 값의 차단 Test를 추가하고 docs/12의 판단 기준 문단을 구현에 맞춘다.
- **R2-003** [비차단 / 오탐 잔존] IAM Action 허용(lib.mjs:42)은 Action 이름이 줄 끝이나 쉼표, 따옴표로 바로 끝날 때만 동작한다. Markdown에서 backtick으로 감싼 Secrets Manager Action 이름이나, Action 이름 뒤에 공백과 설명이 이어지는 목록 줄은 Action 이름이 8자 이상의 ASCII 첫 단어로 판정되어 차단된다. Task의 '허용으로 바꿀 것: IAM Action 이름'이 문서 표기에서는 충족되지 않으며 TASK-026 이후 IAM 문서에서 다시 오탐이 날 수 있다. 수정: 첫 단어에서 backtick / 닫는 괄호 / 마침표 같은 후행 구두점을 떼어 낸 뒤 Action 형식을 판정하고, 나머지 부분은 R2-001 방식으로 계속 검사한다. backtick 형태와 설명이 붙은 형태의 허용 Test를 추가한다.
- **R2-004** [비차단 / Redaction 불완전] redact()는 입력이 JSON 객체이고 내부 문자열에서 하나라도 치환되면 곧바로 반환한다(lib.mjs:24-30). 이때 객체의 Key-Value 자체가 자격 증명 형태인 항목은 원문 검사를 거치지 않아 반환값에 그대로 남는다. assertNoSecrets는 변경 여부만 보므로 차단에는 영향이 없다. 그러나 run.mjs:145, 183의 Executor / Reviewer 입력 Redaction과 문자열 Run 기록에서는 일부만 가려질 수 있다. 수정: 내부 문자열 치환 뒤에도 직렬화 결과에 원문 검사를 이어서 적용한다. 내부 문자열 일치와 객체 Key 일치가 함께 있는 입력의 Redaction Test를 추가한다.
- **R2-005** [확인 결과 / 조치 불필요] 이번 Diff의 변수 이름 변경은 Secret 판정 동작을 바꾸지 않는다. F-001, F-002, F-004 ~ F-008은 구현과 Test, docs/12에서 해결을 확인했다: 접두 조건과 직렬화 문자열 재귀 검사, Resume 승인 판정의 pending_gate 포함(run.mjs:63), AWS 설정 파일 한계 문서화, PR 길이 제한의 빈 배열 / surrogate 처리, 자동 Git 범위 22~31 유지(run.mjs:201)와 Human 결정 필요 기록, Test 이름과 Decide 표. F-003은 주석 제거 / 첫 단어 검사 / 이중 중괄호 제한은 반영됐으나 R2-001, R2-002의 경로가 남아 있다. TASK-033 자동 Git 범위는 여전히 Human 결정 대상이며 이 Review는 그 승인을 대신하지 않는다.

## Run 3 결과와 Human 결정 A — Secret 검사 변경 분리 (2026-10-03, Claude 세션 기록)

Run 3(`2026-10-03T06-17-24-363Z-e1d74891`, main의 안정 Version으로 실행): Review 3회 모두 **CHANGES_REQUIRED**, 한도 도달로 정지했다. 이전 지적은 매번 해결되었지만 Secret 검사 완화에서 매 회차 새 우회 경로가 나왔다(Run 1부터 5회 연속). PR 제목 / 본문, 자동 Rework, 작업 폴더, AWS Preflight 보강, 자동 Git 범위 확대는 Review에서 문제를 찾지 못했다. Verify 114 / 114. 작업 폴더 상태는 검토 미완료 WIP로 Commit했다(`65f33fd`).

차단 Finding 요약:

- **R3-001** [차단 / Redaction 회귀] 차단된 따옴표 없는 후보에서 가리는 범위가 값의 첫 단어(또는 Placeholder 형태 부분)로 줄었다(lib.mjs:38, 53). 이전 구현과 main의 안정 Version은 쉼표 / 줄 끝까지 가렸다. 이제 등호·콜론 뒤 값에 공백이 있으면 첫 단어만 가려지고 나머지는 redact() 결과에 남는다. 꺾쇠나 환경변수 Placeholder 바로 뒤에 붙은 실제 값도 Placeholder 부분만 치환되고 뒤 문자열이 남는다…
- **R3-002** [차단 / 허용 요구 미충족, Preflight 경로] JSON 객체 입력은 내부 문자열을 원문으로 검사한 뒤 직렬화 문자열 전체를 다시 검사한다(lib.mjs:26-33). 직렬화 형태에서는 줄 끝이 역슬래시+n, 문자열 끝이 따옴표로 보이므로 원문에서 허용되는 값이 차단된다. (1) 줄 끝 / 문자열 끝의 Placeholder는 next 문자가 역슬래시나 따옴표라서 lib.mjs:43의 경계 조건을 통과하지 못하고, 등호 형식이라 차단된다. (2) 줄 끝의 …
- **R3-003** [비차단 / 오탐 잔존] IAM Action 허용은 key.trim()이 정확히 'secretsmanager:'일 때만 동작한다(lib.mjs:45). Key 정규식이 여는 따옴표를 Key에 포함하므로, IAM Policy JSON의 표준 표기인 따옴표로 감싼 Action 이름은 Key가 따옴표로 시작해 이 분기를 타지 못하고 차단된다. 저장소에 이미 이 형태가 있다(infra/iam/ecs-execution-role-policy.json:35). TASK-02…
- **R3-004** [비차단 / 허용 범위와 문서] 콜론 뒤 값의 첫 단어가 'arn:'으로 시작하기만 하면 그 후보를 허용한다(lib.mjs:46의 첫 번째 조건). Run 2 구현과 main Version은 차단하던 형태다. Task 문서의 Run 3 범위가 첫 단어 ARN 허용을 요구하므로 방향은 맞다. 다만 실제 ARN 구조를 확인하지 않아 임의 문자열도 통과한다. 수정: partition / service 구획을 갖춘 ARN 형태일 때만 허용하도록 좁히고, 'arn:' 접…
- **R4-001** [차단 / Secret 완화] 구분 기호 바로 뒤에 ASCII 공백 / Tab이 아닌 공백 문자(NBSP U+00A0, 전각 공백 U+3000, form feed, vertical tab 등)가 오면 후보로 잡히지 않아 검사를 통과한다. 새 정규식(lib.mjs:38)은 구분 기호 뒤를 [ \t]*로만 넘긴 뒤 lookahead의 마지막 대안 [^\s,]+가 곧바로 일치해야 하는데, \s에는 이 문자들이 포함되어 lookahead가 실패한다. 그래서 '자격 증명…
- **R4-002** [차단 / Secret 완화] 허용된 후보의 구분 기호 바로 뒤에서 시작하는 다음 할당이 검사되지 않는다. 일치는 접두 문자 + Key + 구분 기호를 소비하고(lib.mjs:38), 다음 후보는 접두 조건 (^|[^\w-])에 소비되지 않은 문자가 필요하다. Secrets Manager ARN에서 resource 종류 구분자(자격 증명 단어 + 콜론) 바로 뒤에 '자격 증명 이름 변수 + 등호 + 실제 값'이 붙으면, resource 구분자 후보는 ARN 예외…
- **R4-003** [비차단 / JSON 구조 검사 누락] 입력 전체가 JSON 객체이면 redact()는 평문 검사를 하지 않고 구조 검사만 한다(lib.mjs:26-31). redactStrings(lib.mjs:77-80)는 자격 증명 이름 Key의 값이 문자열일 때만 가린다. 값이 숫자 / boolean이면 그대로 남고, 값이 배열이나 객체이면 내부 문자열은 Key 문맥 없이 평문 검사만 받아 통과한다. 기준선은 직렬화 문자열에 정규식을 적용해 이 형태를 차단했다. 영향 범…
- **R5-001** [차단 / Secret 완화] Placeholder 판정(lib.mjs:84, 후보 정규식 lib.mjs:38의 환경변수 형태 분기)은 달러 + 중괄호 안의 내용을 제한하지 않는다. 그래서 shell / Compose의 기본값 확장(중괄호 안에 변수 이름 + 하이픈 또는 콜론-하이픈 + 실제 기본값)이 값 전체로서 Placeholder로 허용된다. 안쪽 변수 이름이 자격 증명 단어를 포함하고 콜론이 뒤따르는 형태는 안쪽 후보가 독립 검사되어 우연히 차단된다. 그…
- **R5-002** [차단 / Secret 완화] 닫히지 않은 따옴표 바로 뒤에 공백이 오는 값이 빈 값으로 판정되어 통과한다. 따옴표 분기(lib.mjs:38)가 닫는 따옴표를 찾지 못하면 마지막 분기가 따옴표 한 글자만 raw로 잡고, lib.mjs:41에서 앞뒤 따옴표를 떼면 candidate가 빈 문자열이 되어 lib.mjs:43의 Placeholder(빈 값) 허용으로 반환된다. 그 뒤의 실제 값은 후보가 아니므로 검사되지 않는다. 등호 / 콜론 모두 해당하며 구 Vers…
- **R5-003** [비차단 / 오탐 잔존] ARN 문맥 판정(lib.mjs:47-50)은 후보 앞 문자열을 공백 / 따옴표 / backtick으로만 나눈다. Guard는 tracked Diff의 추가 줄을 '+' 접두사가 붙은 채 검사하므로(lib.mjs:249), 열 0에서 시작하는 Secrets Manager ARN 줄은 before가 '+'로 시작해 ARN으로 인정되지 않고 차단된다. 여는 괄호 / 꺾쇠 / 세로선 / 대괄호 바로 뒤의 ARN도 같다. 통과 방향이 아니라 차…
- **R5-004** [비차단 / 한계 기록] JSON 구조 검사(lib.mjs:26-31, 74-82)는 JSON.parse 결과만 본다. (1) 객체 Key 문자열 자체는 알려진 Key 형태 / Bearer [REDACTED] URL 자격 증명 검사를 거치지 않는다. (2) 같은 Key가 중복된 JSON 원문은 앞쪽 값이 parse에서 사라지므로 뒤쪽 값이 허용 형태이면 원문이 그대로 반환된다. 현재 assertNoSecrets 호출 경로(run.mjs:58, 100과 guard…

### Human 결정 A (2026-10-03)

- **Secret 검사 변경을 TASK-032에서 제외**한다. 이 문서의 "2. Secret 검사 정밀화"는 수행하지 않는다.
- Secret 오탐 감소는 **TASK-034**로 분리하고 설계를 "Human 승인 허용 문구 목록(Contract의 literal 문자열)" 방식으로 바꾼다.
- 실행 순서: TASK-032 → TASK-033 → TASK-034 → TASK-026.
- 그때까지 Task 문서의 오탐 회피 작성 규칙을 계속 쓴다.

### Run 4 Codex 작업 범위

1. **Secret 검사를 main과 같은 상태로 되돌린다.** `git show main:scripts/orchestrator/lib.mjs`와 비교해 `redact`, `sanitize`, `assertNoSecrets`, `guard`의 Secret 판정과 그 보조 함수를 main의 구현과 동작이 같게 복원한다. 이 Task가 Secret 판정을 위해 추가한 함수 / 정규식 / 분기는 남기지 않는다. `lib.mjs`의 다른 변경(Secret 판정과 무관한 것)은 유지한다.
2. Secret 완화를 검증하던 Test(허용 사례, 완화 회귀 사례)를 제거한다. 기존 main의 차단 Test는 그대로 통과해야 한다. main과 같은 판정임을 확인하는 Test(대표 차단 사례가 계속 차단됨)는 유지하거나 추가한다. 차단 사례 문자열은 실행 시 조합한다.
3. `docs/11` / `docs/12`에서 Secret 완화 판단 기준 서술을 제거하고 "기본 검사는 변경하지 않았다. 오탐 감소는 TASK-034(허용 문구 목록)에서 다룬다"로 바꾼다. PR 본문에 `assertNoSecrets`를 적용하는 것은 유지한다.
4. 나머지 개선(1, 3, 4, 5번과 자동 Git 범위 확대)은 그대로 둔다. Run 3 Review의 비차단 지적 중 Secret과 무관한 것이 있으면 반영한다.
5. 완료 반영: TASK-032 DONE / **TASK-033 READY** / AGENTS.md 3절. `docs/07`의 TASK-032 설명에서 Secret 검사 정밀화가 TASK-034로 분리되었음을 적는다(TASK-034 등록은 Claude 세션이 이미 했다).
6. 구 Version Guard 회피 규칙은 그대로 적용한다. `human_decisions_needed`는 새 결정이 필요할 때만 쓴다.

## 제외 범위

- Auto Merge, Merge 자동화, CI Workflow 변경
- `scripts/verify.*`, `scripts/container-smoke.sh`, Frontend / Backend Source
- AWS 실제 호출 (Fake CLI로만 검증)

## 필수 Test (Fake CLI, 기존 87개 유지)

- PR 제목 / 본문: 한글 본문 구성 요소 포함, Executor PR 필드 누락 시 Schema 오류, 본문 Secret 차단, 길이 상한
- Secret 검사: 위 "반드시 차단" 전부 차단, "허용" 전부 통과, TASK-023 / TASK-025 실제 오탐 형태 회귀
- 자동 Rework: Gate + CHANGES_REQUIRED → Rework → PASS 후 `HUMAN_REQUIRED` 정지(Git 단계 미실행), 한도 도달, Reviewer BLOCKED 즉시 정지
- 작업 폴더: 짧은 이름 생성, Resume 호환, 성공 Run 정리, 정지 Run 미삭제
- AWS Preflight: endpoint 환경변수 차단, `missing-config`, env 격리

## Verification

- `node --test "scripts/orchestrator/*.test.mjs"`
- `git diff --check`
- `package.json` / `package-lock.json` 변경 없음

## Claude Review 기준

- Secret 검사 완화로 실제 Secret이 통과하는 경로가 생기지 않았는가 (가장 중요)
- PR 본문에 Executor 서술이 그대로 들어가도 Secret / 민감 식별값이 섞이지 않는가
- 자동 Rework가 무한 Loop나 Gate 우회(승인 없는 Git 단계 실행)를 만들지 않는가
- 작업 폴더 정리가 Human의 작업 폴더나 정지 Run을 지우지 않는가
- Resume / Lock / 기존 Guard가 그대로 동작하는가

## 완료 조건

개선 사항이 Fake CLI Test로 검증되고 설계 문서가 구현과 일치하면 REVIEW. 이 Task의 PR 자체는 실행 시작 시점의 구 Version이 만들므로 Claude 세션이 Merge 전에 PR 제목 / 본문을 한글 작업 설명으로 다시 쓴다. 새 형식은 TASK-033의 PR에서 처음 확인한다.
