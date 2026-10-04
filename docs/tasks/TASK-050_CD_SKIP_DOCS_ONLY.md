# TASK-050 — Skip Staging CD for Docs-only Changes

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

문서만 바뀐 Commit이 `main`에 들어왔을 때는 Staging 자동 배포(CD)를 실행하지 않는다. 지금은 문서 PR을 Merge해도 Backend / Frontend를 다시 Build하고 배포한다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-04)
- 선행: TASK-029(Staging CD), TASK-039
- 실행: `node scripts/orchestrator/run.mjs TASK-050`

## Human 지시 (2026-10-04)

"문서를 github에 push할 때는 cd는 진행되지 않도록 해."

- CD Workflow의 동작을 바꾸는 것이라 Gate C 대상이며, Human의 직접 지시로 승인된 것으로 기록한다.
- CI(`ci.yml`)는 바꾸지 않는다. 문서만 바뀐 PR / push에도 CI는 지금처럼 실행한다(Branch 보호 규칙의 필수 검사라 건너뛰면 Merge할 수 없다).

## 현재 구조 (Claude 세션 확인)

- `.github/workflows/deploy-staging.yml`: `main` push의 CI가 성공하면 `workflow_run`으로 시작한다. 수동 실행(`workflow_dispatch`, Commit SHA 입력)도 있다. Job은 `deploy` 하나이고 `environment: staging`, 최상위 권한은 `contents: read`, Job에만 OIDC 발급 권한이 있다.
- 배포 대상 Commit을 checkout한 뒤 SHA를 검증한다(40자리 16진수, `main`에 포함).
- `main`은 Squash Merge만 허용하므로 `main`의 Commit은 부모가 하나다.

## 설계 (실행 기준)

1. **판정**: 자동 실행(`workflow_run`)일 때, 배포 대상 Commit이 **바로 앞 Commit(첫 번째 부모)과 비교해 바꾼 파일**을 구한다(`git diff --name-only <sha>^ <sha>`). 바뀐 파일이 **모두** 아래 "문서 경로"에 해당하면 "문서만 변경"으로 판정한다.
   - 문서 경로: `docs/` 아래 전체, `prompts/` 아래 전체, `harness/tasks/` 아래 전체(Task Contract), 저장소 어디에 있든 확장자가 `.md`인 파일.
   - 하나라도 그 밖의 파일이 있으면 배포한다. 바뀐 파일이 0개이거나, 부모를 구할 수 없거나, 판정 명령이 실패하면 **배포한다**(안전한 쪽).
2. **수동 실행(`workflow_dispatch`)은 항상 배포한다.** 판정을 하지 않는다(재배포 / 롤백 용도).
3. **건너뛰는 방식**: 문서만 변경이면 Build / AWS 자격 증명 / 배포 / Smoke Step을 실행하지 않고 Workflow를 **성공**으로 끝낸다. Step Summary에 "문서만 변경되어 배포를 건너뜀"과 Commit SHA, 바뀐 파일 수를 적는다(파일 이름 목록은 최대 20개까지만).
   - 구현 형태는 둘 중 하나: (a) 판정만 하는 가벼운 Job을 앞에 두고 `deploy` Job에 `if` 조건을 건다, (b) `deploy` Job 안에서 판정 Step의 출력으로 이후 Step마다 `if`를 건다. **(a)를 권장한다** — 건너뛸 때 `environment: staging`과 OIDC 권한이 있는 Job이 아예 시작되지 않는다.
   - 판정 Job은 `contents: read`만 쓴다. AWS 자격 증명, Environment, Secret을 쓰지 않는다.
4. **입력 처리**: Commit SHA는 지금처럼 env로 전달하고 Script에 직접 끼워 넣지 않는다. 판정 Job에서도 SHA 형식(40자리 16진수)을 검사한다. 파일 이름을 출력할 때 Shell이 해석하지 않게 다룬다(파일 이름에 특수 문자가 있어도 안전하게).
5. 기존 `concurrency`, Trigger, Action 고정 SHA, 배포 Step의 내용은 바꾸지 않는다.
6. **알려진 한계(문서에 적는다)**: 판정은 그 Commit 하나만 본다. 바로 앞의 Code Commit 배포가 실패한 상태에서 문서 Commit이 들어오면 배포를 건너뛰므로, 앞의 Code는 다음 Code Commit이나 수동 실행 때 배포된다. 이 경우 수동 실행으로 배포한다.

## 문서

- `docs/21-STAGING-CD.md`: 판정 규칙, 문서 경로 목록, 수동 실행은 항상 배포, 한계.
- `docs/09-DECISIONS.md`: 새 Decision(최신 번호 다음, Human Approved 2026-10-04)과 DEC-032(Staging CD Gate C) 변경 이력.
- `docs/07-TASKS.md`: TASK-050 행과 절 추가, DONE(Milestone 50, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `prompts/`.

## Secret 검사

- Workflow의 OIDC 발급 권한 줄은 Contract에 허용 문구로 승인되어 있다. 정확한 문구는 Workspace의 `harness/tasks/TASK-050.json`에서 읽는다. 그 줄은 지금 위치(`deploy` Job)에 그대로 둔다. 판정 Job에는 넣지 않는다.
- 자격 증명 단어 뒤에 콜론 / 등호와 값이 오는 표기를 새로 쓰지 않는다.

## 금지

- CI Workflow 변경, 배포 Step 내용 변경, 새 외부 Action 추가
- 문서만 변경일 때 실패(빨간 X)로 끝내는 것

## Verification

- Workflow YAML 구조 검사, `git diff --check`
- Executor Sandbox에서는 Workflow를 실행할 수 없다. 판정 Script는 문서에 예시 입력과 기대 결과를 적어 Review가 읽고 확인할 수 있게 한다(문서만 / Code 포함 / 파일 0개 / `.md`가 아닌 `docs/` 밖 파일).

## Claude Review 기준

- 판정이 실패하거나 애매할 때 배포하는 쪽으로 가는가
- 수동 실행이 항상 배포하는가
- 건너뛸 때 OIDC / Environment가 있는 Job이 시작되지 않는가(권장안 기준), 결과가 성공으로 표시되는가
- SHA와 파일 이름을 안전하게 다루는가
- 배포 Step과 Trigger를 바꾸지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 뒤 문서만 바꾼 Commit과 Code를 바꾼 Commit에서 각각 기대대로 동작하는지 확인한다.
