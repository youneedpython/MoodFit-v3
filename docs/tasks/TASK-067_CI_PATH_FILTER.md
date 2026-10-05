# TASK-067 — CI Path Filter (바뀐 경로에 따라 필요한 CI Job만 실행)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

지금 CI는 화면 CSS 한 줄이나 문서만 바꿔도 Frontend Job과 Backend Job을 모두 돌린다(Backend Job 약 3분). 바뀐 파일의 경로를 보고 **필요한 Job만** 돌려 PR 대기 시간을 줄인다. Workflow와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-022(CI / PR Gate), TASK-050(문서 전용 변경의 배포 생략)
- 실행: `node scripts/orchestrator/run.mjs TASK-067`

## Human 결정 (2026-10-05, Gate C — CI 동작 변경)

"'작은 후속 후보' 모두 진행해." 후보 가운데 "CI가 화면만 바꿔도 Backend Test까지 도는 점"을 이 Task가 맡는다. CI 동작 변경이므로 Gate C에 해당하며, 위 지시로 승인된 범위는 아래 "설계"의 내용이다.

## 현재 구조 (Claude 세션 확인)

- `.github/workflows/ci.yml`: `push`(main)와 `pull_request`(main 대상)에서 `frontend` Job과 `backend` Job을 조건 없이 실행한다. 각 Job은 마지막에 Step Summary를 쓴다(DEC-021).
- `.github/workflows/deploy-staging.yml`: `main`의 CI Workflow가 **성공**하면(`workflow_run`, `conclusion == 'success'`) 시작한다. `classify` Job이 `git diff --name-only`로 바뀐 경로를 보고 문서 전용이면 배포를 건너뛴다(TASK-050). 분류할 수 없으면 배포하는 쪽으로 간다(안전한 기본값).
- `main` Branch에는 Branch Protection(필수 Status Check)이 설정되어 있지 않다.

## 설계 (실행 기준)

### 1. `changes` Job 추가

`ci.yml`에 가장 먼저 도는 `changes` Job을 더한다. 바뀐 경로를 보고 두 Output을 낸다: `frontend`(`true` / `false`), `backend`(`true` / `false`).

- 비교 범위
  - `pull_request`: PR의 Base(`github.event.pull_request.base.sha`)와 Head(`github.event.pull_request.head.sha`) 사이. 두 SHA의 공통 조상 기준(`git diff --name-only base...head`)으로 본다.
  - `push`(main): `github.event.before`와 `github.sha` 사이.
- Checkout은 비교에 필요한 History를 가져온다(`fetch-depth: 0`, `persist-credentials: false`).
- **경로 규칙**

  | 바뀐 경로 | frontend | backend |
  |---|---|---|
  | `frontend/**` | 실행 | - |
  | `backend/**` | - | 실행 |
  | `contracts/**` | 실행 | 실행 |
  | `.github/**`, `scripts/**`, `harness/**`, Root의 `package.json` / `package-lock.json` / `.nvmrc` | 실행 | 실행 |
  | `docs/**`, `prompts/**`, Root의 `*.md`(`README.md`, `AGENTS.md` 등), `infra/**` | - | - |
  | 위 어디에도 속하지 않는 경로 | 실행 | 실행 |

  여러 경로가 섞이면 합집합이다(하나라도 "실행"이면 실행).
- **안전한 기본값**: 다음 경우에는 둘 다 `true`로 낸다.
  - 비교할 SHA가 없거나 형식이 맞지 않음(새 Branch의 첫 Push처럼 `before`가 0으로만 된 SHA 포함)
  - `git diff`가 실패함, 경로 목록이 비어 있음
  - Event가 `push` / `pull_request`가 아님
- 분류 Script는 Workflow 안에 직접 쓰되(`deploy-staging.yml`의 `classify`와 같은 방식, Python 3 표준 Library만), 경로 → 결과 판단을 **함수 하나**로 분리해 같은 Step 안에서 **자체 검사**(위 표의 각 행과 섞인 경우, 빈 목록)를 먼저 돌린 뒤 실제 분류를 한다. 자체 검사가 실패하면 Step이 실패한다.
- 경로와 SHA는 신뢰할 수 없는 입력으로 다룬다. Shell 문자열에 끼워 넣지 않고 환경변수로 넘기며, `git`은 인자 배열로 부른다. Step Summary에 경로를 쓸 때는 Escape하고 개수를 제한한다(최대 20개, 나머지는 "외 N개").
- Step Summary에 결과를 쓴다: 비교 범위, 바뀐 경로 수, frontend / backend 실행 여부와 이유.
- 권한은 지금처럼 `contents: read`만 쓴다. 새 Action을 추가하지 않는다(외부 Path Filter Action을 쓰지 않는다).

### 2. `frontend` / `backend` Job

- 두 Job에 `needs: changes`와 Job 수준 조건을 건다: `if: needs.changes.outputs.frontend == 'true'`(backend도 같은 방식).
- 조건이 거짓이면 Job은 **건너뜀(skipped)**이 된다. GitHub는 건너뛴 Job을 실패로 보지 않으므로 Workflow 결론은 `success`다. 따라서 `deploy-staging.yml`의 시작 조건은 그대로 동작한다.
- Job 안의 Step(설치, Test, Build, Summary)은 바꾸지 않는다. Job 이름(`frontend`, `backend`)도 바꾸지 않는다.

### 3. 배포와의 관계 (바꾸지 않는다)

- `deploy-staging.yml`은 고치지 않는다. 배포 여부는 지금처럼 그쪽 `classify`가 정한다.
- 화면만 바뀐 Commit은 CI에서 Backend Test를 건너뛰지만, 배포 Workflow는 지금처럼 Backend Image를 직접 Build하고 Test한다. 이 Task는 배포 쪽 최적화를 하지 않는다.

### Verification 보강

- Workflow 구조 검사: `ci.yml`을 YAML로 읽어 `changes` / `frontend` / `backend` Job이 있고 두 Job이 `needs: changes`와 `if`를 갖는지 확인한다(Contract의 verify 명령).
- 분류 함수의 자체 검사는 Workflow가 실제로 돌 때 실행된다. Local에서도 확인할 수 있게, 같은 Python 코드를 `python3 -`로 돌려 자체 검사만 수행하는 방법을 `docs/21-STAGING-CD.md`나 새 문서에 적는다.

### 문서

- `docs/09-DECISIONS.md`: 새 Decision(다음 번호) — 경로에 따른 CI Job 실행, 안전한 기본값, 건너뛴 Job과 배포의 관계.
- `docs/21-STAGING-CD.md`: CI가 일부 Job을 건너뛸 수 있다는 점과 배포 시작 조건에 영향이 없다는 점.
- `README.md`의 "품질 검증" 표: CI 행에 "바뀐 경로에 따라 필요한 Job만 실행" 한 구절.
- `docs/07-TASKS.md`: TASK-067 행과 절을 `docs/tasks/COMMON.md` "9. `docs/07-TASKS.md` 작성 형식"대로 추가한다(DONE, Milestone 67).
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### 금지

- `deploy-staging.yml`, `milestones.yml`, 배포 Script, Application 코드 변경
- 새 GitHub Action / Dependency 추가, 권한 확대, `pull_request_target` 사용
- Job 이름 변경, 기존 Step 변경, Test를 줄이거나 건너뛰는 다른 조건 추가
- Branch Protection 설정 변경(Human 권한)

### 참고 (Executor Sandbox)

- Sandbox에서는 GitHub Actions를 실행할 수 없다. 실제 동작은 이 Task의 PR에서 CI가 도는 것으로 확인한다(이 PR은 `.github/**`를 바꾸므로 두 Job이 모두 돌아야 한다).

## Verification

- `ci.yml` 구조 검사(Contract의 Python 한 줄)
- `git diff --check`

## Claude Review 기준

- 경로 규칙이 표와 같은가, 섞인 경우 합집합인가, 분류할 수 없을 때 둘 다 실행하는가
- 경로 / SHA를 Shell에 끼워 넣지 않는가, 권한과 Action이 늘지 않았는가
- 건너뛴 Job이 Workflow를 실패로 만들지 않고, `deploy-staging.yml`을 건드리지 않았는가
- 자체 검사가 실제 분류보다 먼저 돌고 실패 시 Step이 실패하는가
- `docs/07-TASKS.md`의 TASK-067 절이 공통 형식을 따르는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 이 PR의 CI에서 `changes` 결과와 두 Job 실행을 확인하고, Merge 뒤 문서 전용 / 화면 전용 변경에서 Job이 건너뛰는지 확인한다.
