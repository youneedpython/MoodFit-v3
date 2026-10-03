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
