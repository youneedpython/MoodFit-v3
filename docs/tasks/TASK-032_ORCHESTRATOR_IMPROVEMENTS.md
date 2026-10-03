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
