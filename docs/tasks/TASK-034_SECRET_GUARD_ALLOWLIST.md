# TASK-034 — Secret Guard Allowlist (Human 승인 허용 문구)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Orchestrator Secret 검사의 오탐을 **검사 기준을 낮추지 않고** 줄인다. TASK-032에서 추측 규칙(자연어 / ARN / Placeholder 예외)으로 완화를 시도했으나 Claude Review에서 5회 연속 새 우회 경로가 지적되어 Human이 2026-10-03 분리를 결정했다. 이 Task는 설계를 바꿔, Human이 승인한 **정확한 문자열 목록**만 검사에서 제외한다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- 선행: TASK-033 DONE
- TASK-026 전에 실행한다(IaC / IAM 정책 파일에서 오탐이 가장 많이 예상된다).
- 실행: `node scripts/orchestrator/run.mjs TASK-034`

## 설계 방향 (Human 승인, 2026-10-03)

- 기본 검사(`redact` / `assertNoSecrets`)의 차단 규칙은 바꾸지 않는다.
- Task Contract에 선택 필드(예: `secret_scan_allow`)를 두고, Human이 승인한 **literal 문자열**만 넣는다. 정규식 / wildcard는 허용하지 않는다.
- 검사 전에 입력에서 허용 문자열과 정확히 일치하는 부분만 중립 표기로 바꾼 뒤 기존 검사를 그대로 적용한다. 허용 문자열 앞뒤의 다른 내용은 계속 검사된다.
- 허용 문자열 자체가 자격 증명 형태(기존 Token / Key 형식 규칙에 걸리는 값, 긴 무작위 문자열 등)이면 Contract 검증에서 거부한다.
- 허용 목록은 Contract에 있으므로 Executor가 바꿀 수 없다(자기 Contract 수정 금지 Guard).
- 오탐이 새로 나오면 Human이 Contract에 문구를 추가 승인한다.

## Human 결정 (2026-10-03, Gate 사전 승인) / 실행 기준

Human이 아래 5개 항목을 승인했다. 이 Run은 Gate 제안에서 멈추지 않고 구현까지 진행한다.

1. **허용 문자열 형식**: Contract 선택 필드 `secret_scan_allow`(문자열 배열, 중복 없음). 정확히 일치하는 literal만 허용한다. 정규식 / wildcard 없음, 대소문자 구분. 각 항목은 한 줄(줄바꿈 / 제어 문자 없음), 앞뒤 공백 없음, 3 ~ 200자, 최대 50개. 필드가 없거나 빈 배열이면 기존 동작과 같다.
2. **허용 문자열 자체 검증**: 항목이 Key / Token 형식 규칙(Private Key Block, Bearer(HTTP 인증 헤더) 값, OpenAI 형식 Key, GitHub Token 형식, AWS Access Key ID 형식(장기 / 임시), URL 안의 자격 증명)에 해당하면 Contract 검증에서 `BLOCKED`로 거부한다. 자격 증명 단어 + 구분 기호 형태(오탐의 원인이 되는 표기)는 Human이 승인한 항목이므로 허용한다.
3. **적용 범위**: 차단 판정(`assertNoSecrets`, `guard`의 추가 줄 / untracked 검사, PR 제목 / 본문, Commit 메시지, Preflight의 Task 문서 / Contract 검사)에만 적용한다. Run 기록과 Executor / Reviewer 입력의 마스킹(`redact` / `sanitize`)은 허용 목록과 무관하게 기존처럼 엄격하게 유지한다.
   - 차단 판정 방법: 입력에서 허용 문자열과 정확히 일치하는 부분을 자격 증명 단어가 없는 중립 표기로 바꾼 사본을 만들고, 그 사본에 기존 판정을 그대로 적용한다. 허용 문자열 앞뒤의 다른 내용은 계속 검사된다. 긴 항목부터 적용해 겹침 결과가 결정적이게 한다.
   - `JSON.stringify`를 거친 입력(Preflight의 Task 문서, Resume 승인 등)에서도 같은 결과가 나오게 한다(허용 문자열에 따옴표 / 역슬래시가 있을 때의 직렬화 형태 포함).
4. **막혔을 때 흐름**:
   - Secret 판정으로 정지할 때 Run 기록에 위치만 남긴다: 파일 경로(또는 입력 종류), 줄 번호, 걸린 규칙 종류 / 단어. 값과 줄 원문은 기록하지 않는다. Console 정지 사유는 지금처럼 내용을 숨긴다.
   - Human이 작업 폴더에서 해당 줄을 확인하고 Contract에 문구를 추가 승인한 뒤 `--resume`으로 이어간다. Resume은 Run의 frozen Contract를 쓰되 **`secret_scan_allow`만 현재 Contract 파일에서 다시 읽는다**(AWS 로컬 설정을 다시 읽는 방식과 같다). 다른 Contract 필드가 frozen과 다르면 `BLOCKED`.
   - Resume에는 기존 `resume-approval.json` 승인이 그대로 필요하다. 허용 목록 변경만으로 자동 진행하지 않는다.
   - 다시 읽은 허용 목록도 2번 검증을 거친다.
5. **기본 차단 규칙 강화** (TASK-032 Review R6-003의 기존 누락): 다음을 차단 / 마스킹에 추가한다.
   - URL 안의 자격 증명(scheme 뒤 사용자 정보에 구분 기호와 값이 있는 형태)
   - 임시 AWS Access Key ID 형식(`ASIA` 접두)
   - 자격 증명 단어 뒤에 다른 단어가 이어지는 변수 이름에 값을 할당하는 형태(AWS 비밀 Access Key 환경변수 형식 등). 단어 뒤에 `_` 또는 `-`로 이어지는 영숫자 접미가 붙은 Key도 할당이면 차단한다.
   - 기존 4개 규칙의 차단 범위를 좁히지 않는다. 새 규칙으로 기존 저장소 파일(추적 중인 문서 / Code)이 차단되더라도 Guard는 추가 줄만 검사하므로 기존 파일은 영향이 없다. Task 문서 / Contract는 Preflight에서 전체가 검사되므로 이 문서가 새 규칙에 걸리지 않게 작성했다.

Codex 작업 범위 (이 Run):

1. 위 1 ~ 5를 구현한다(`lib.mjs`, `run.mjs`, `git-automation.mjs`, `pr-description.mjs`, Contract Schema). Node.js 24 내장 Module만 쓴다.
2. Fake CLI / 단위 Test:
   - 허용 목록 없음 → 기존과 동일하게 차단
   - TASK-023(목록 항목 이름 + 자연어 설명), TASK-025(Secrets Manager ARN의 Resource 종류 구분자), TASK-032(자격 증명 단어로 끝나는 식별자에 대입) 형태가 허용 문자열로 통과
   - 허용 문자열 바로 앞 / 뒤 / 같은 줄의 다른 실제 할당은 계속 차단
   - 허용 문자열의 부분 일치 / 대소문자 차이는 허용되지 않음
   - 2번 검증 거부 사례, 형식 제한(길이 / 줄바꿈 / 개수 / 중복) 거부
   - 마스킹은 허용 목록과 무관하게 유지
   - 정지 시 위치 기록에 값이 남지 않음
   - Resume: 허용 목록 추가 후 이어서 진행, 다른 필드 변경 시 BLOCKED, 승인 파일 없으면 진행하지 않음
   - 5번 강화 규칙 차단 사례와 기존 규칙 회귀
   - 기존 Test(103개)를 깨지 않는다. 차단 사례 문자열은 실행 시점에 조각을 이어 붙여 만든다.
3. 문서: `docs/12`(Contract 필드, 판정 순서, Resume, 위치 기록, 강화 규칙, 한계), `docs/11`(Secret / Log 정책). Task 문서의 "오탐 회피 작성 규칙"은 허용 목록으로 대체할 수 있다고 적는다.
4. 완료 반영: TASK-034 DONE / **TASK-026 READY** / AGENTS.md 3절. `docs/07`의 TASK-026 선행 조건을 충족으로 갱신한다.
5. 이 Run 자체는 현재 Version의 Guard로 검사된다(허용 목록 없음). 추가하는 모든 줄에서 자격 증명 단어로 끝나는 식별자 / Key 바로 뒤에 콜론이나 등호와 값이 오지 않게 한다(변수 이름을 그 단어로 끝내지 않는다). 작업을 마치기 전에 `git diff`의 추가 줄을 스스로 검색해 확인한다.
6. 새로 Human 결정이 필요한 사항만 `human_decisions_needed`로 보고한다. 기본 차단 규칙을 좁혀야만 구현할 수 있는 요구가 있으면 구현하지 않고 보고한다.

## Run 1 결과와 Run 2 작업 범위 (2026-10-03, Claude 세션 기록)

Run 1(`2026-10-03T08-10-10-490Z-b506848a`):

- 1회차: Codex 구현 → Verify 성공 → Claude Review **CHANGES_REQUIRED**(R1-001 ~ R1-004).
- 2회차: 자동 Rework 도중 Codex CLI가 "Selected model is at capacity" 오류로 종료했다(일시적 서버 용량 문제). Orchestrator는 이를 `Executor: quota`로 분류해 BLOCKED 했다. 분류가 틀린 원인은 Codex 출력에 포함된 Code Diff 본문의 단어가 사용량 한도 판정 정규식에 걸린 것이다(개선 후보로 WORK_LOG에 기록).
- 2회차 Rework는 일부만 진행된 상태에서 멈췄다. Claude 세션이 작업 폴더 상태를 **검토 미완료 WIP**로 Commit했다. Codex CLI는 이후 정상 응답을 확인했다. WIP 상태에서 Orchestrator Test는 111개 중 2개가 실패한다(Rework가 중간에 끊긴 영향). Run 2에서 전체 통과로 만든다.

Run 2는 Branch의 WIP Orchestrator가 아니라 main의 안정 Version으로 실행한다.

Run 2 Codex 작업 범위:

1. WIP Commit 상태에서 이어서 작업한다. 아래 Run 1 Review Finding 전부가 해결되었는지 하나씩 확인하고 미해결이면 고친다. 일부만 고쳐진 Code가 있을 수 있으므로 Finding별로 구현과 Test를 다시 점검한다.
2. R1-002(허용 문구의 경계 조건)는 이 Task의 핵심 안전 조건이다. 다음을 만족해야 한다.
   - 허용 문구와 일치한 부분의 바로 앞 / 뒤 문자가 같은 Key 또는 값의 연속이면(공백 / 줄 경계 / 구두점으로 분리되지 않으면) 그 일치는 허용으로 처리하지 않는다.
   - 허용 문구가 자격 증명 단어만이거나 "단어 + 구분 기호"로 끝나 값이 없는 형태일 때, 그 뒤에 오는 값을 허용하지 않는다. 구체적으로: 치환 후 사본에서 그 위치 뒤에 값이 이어지면 차단되어야 한다. 구현 방식은 자유지만, "승인 문구가 사실상 wildcard가 되는 경우"가 없음을 Test로 증명한다. 필요한 경우 이런 형태의 문구는 Contract 검증에서 거부하되, TASK-023 형태(목록 항목 이름 + 자연어 설명)는 **설명까지 포함한 전체 문구**를 승인하는 방식으로 해결할 수 있음을 Test와 문서로 보인다.
3. R1-001(Resume 후 Git 단계): Human이 Contract의 허용 목록을 고친 뒤 Resume하는 흐름이 Git 단계까지 도달해야 한다. 권장 방향은 **Human이 Contract 변경을 Task Branch에 Commit한 뒤 Resume**하는 것이다(Working Tree가 깨끗한 상태). 이 경우 Source HEAD가 Run 시작 revision에서 Contract Commit만큼 앞서게 되므로, Resume의 HEAD / Diff 일치 검사와 Git 단계의 parent 검사가 "frozen revision 이후 Commit이 해당 Task Contract 파일의 `secret_scan_allow` 변경뿐인 경우"를 허용하도록 정의하고 Test한다. 그 밖의 변경이 섞여 있으면 `BLOCKED`. 다른 방식이 더 단순하고 안전하면 그 방식을 택하고 근거를 문서에 적는다.
4. R1-003, R1-004를 반영한다.
5. 현재 Version Guard 회피 규칙(실행 기준 5번)을 그대로 지킨다.
6. 완료 반영과 WORK_LOG 기록을 유지 / 갱신한다. 새로 Human 결정이 필요한 사항만 `human_decisions_needed`로 보고한다.

### Run 1 Review Finding 원문

- **R1-001** Human 결정 4의 Resume 흐름이 TASK-022 이후 실제 Task에서는 Git 단계에 도달하지 못한다. Resume은 sourceRoot의 `harness/tasks/<TASK>.json`을 Human이 수정한 상태(미Commit)를 전제로 하며 run.mjs는 Preflight dirty 검사와 Workspace 생성 전 Snapshot에서만 이 파일을 제외한다. 그러나 git-automation.mjs의 `checkSource`는 `changes(sourceRoot).length`가 0이 아니면 'Dirty Working Tree conflict before Git'으로 BLOCKED한다. 이후의 `guard(transferred, files, contract)`(changed_files mismatch), `transferred.diff !== reviewed.diff`, Commit 전 `git diff` 검사, Commit 후 `changes` 검사도 같은 이유로 실패한다. Human이 Contract 변경을 Commit하면 'Resume HEAD mismatch' 또는 'Git branch / HEAD conflict'가 되고, 되돌리면 허용 목록이 사라져 Preflight / Guard가 다시 차단되므로 빠져나갈 경로가 없다. 신규 Fake CLI Test는 Git 단계를 건너뛰는 TASK-019이고 Workspace 생성 전 정지만 다루어 이 경로를 검증하지 않는다. 수정: Git 단계에서 활성 Contract의 허용 목록만 바뀐 경우를 어떻게 처리할지(Stage 제외와 비교 제외, 또는 다른 승인된 방식) 구현하고 docs/12에 적는다. 기본 차단 규칙이나 Git 정책을 넓혀야만 가능하다면 구현하지 말고 `human_decisions_needed`로 보고한다. Test 추가: (a) Guard 단계(Workspace 생성 후) Secret 정지 → 허용 목록 추가 → 승인 Resume, (b) TASK-022 이상 ID로 Resume 후 Git handoff까지 도달.
- **R1-002** 허용 문구 치환에 경계 조건이 없어 승인 문구가 주변 값의 검사를 무력화한다(Review 기준 1 / 2, Human 결정 3의 '앞뒤의 다른 내용은 계속 검사된다' 위반). `scanCopy`는 일치 부분을 공백으로 감싼 중립 표기로 바꾸므로 두 경우가 통과한다. (1) 승인 문구가 할당 형태(자격 증명 단어 + 구분 기호 + 값)일 때 그 바로 뒤에 공백 없이 이어 붙인 임의 문자열은 원래 같은 할당 값의 일부로 차단되지만, 치환 후에는 Key가 사라져 검사되지 않는다. (2) 승인 문구가 자격 증명 단어만이거나 단어 + 구분 기호로 끝나면(값 없음, 3자 이상이면 `validateSecretAllow` 통과) 그 Key에 대한 모든 할당이 통과해 사실상 wildcard가 된다. 현재 Test는 문구 뒤에 또 다른 완전한 할당이 오는 경우와 문구를 줄인 경우만 확인한다. 수정 예: 일치 직전 / 직후 문자가 할당 Key 또는 값의 연속이면(공백 / 줄 경계 / 승인된 구분 문자가 아니면) 치환하지 않는다. 그리고 자격 증명 단어 단독 또는 구분 기호로 끝나 값이 없는 항목은 Contract 검증에서 거부한다. 두 경우의 차단 Test를 조각 연결 방식으로 추가한다. 항목 거부 기준을 바꾸는 것이 Human 결정 2의 범위를 넘는다고 판단하면 구현하지 말고 `human_decisions_needed`로 보고한다.
- **R1-003** `scanCopy`가 모든 입력에 원문 형태와 JSON escape 형태를 함께 적용한다. JSON 직렬화를 거치지 않는 입력(Task 문서 원문, Guard 추가 줄, PR 본문, Commit 메시지)에서도 escape 형태(따옴표 / 역슬래시 앞에 역슬래시가 붙은 표기)가 승인 문구로 취급되어, Human이 승인하지 않은 문자열이 제외된다. '정확히 일치하는 literal만' 기준에 맞게 호출부가 입력이 직렬화된 것인지 알려 주고(Preflight Contract, Resume 승인만 해당) 그 경우에만 escape 형태를 적용한다. 원문 입력에서 escape 형태가 차단되는 Test를 추가한다.
- **R1-004** docs/12의 `### TASK-034 승인 문구 검사` 절이 `## Resume` 제목과 기존 Resume 본문('Human이 정지 사유와 Diff를 검토하고…' 및 승인 JSON 예시) 사이에 들어갔다. 기존 Resume 설명이 TASK-034 하위 절에 속한 것처럼 읽힌다. 새 절을 기존 Resume 본문 뒤나 별도 상위 절로 옮긴다. R1-001에서 정한 Resume 후 Git 단계의 Contract 처리와 R1-002의 경계 규칙 / 한계도 함께 기록해 설계 문서가 구현과 일치하게 한다.

## Human Gate

- 허용 문자열의 형식 제한, 최대 개수 / 길이, 자격 증명 형태 거부 기준은 Gate에서 확정한다.
- 기본 차단 규칙을 바꾸는 제안은 구현하지 않고 `HUMAN_REQUIRED`로 정지한다.

## Codex 작업 범위

1. Contract Schema 필드와 검증, 검사 전 치환 적용(Preflight / Guard / PR 본문 / Run 기록 Redaction 경로 모두 일관되게), Test
2. TASK-023 / TASK-025 / TASK-032에서 실제로 난 오탐 형태를 허용 목록으로 해결하는 예시와 Test
3. `docs/11`, `docs/12` 갱신, Task 문서의 "오탐 회피 작성 규칙"이 불필요해지는 범위를 기록

## Verification

- `node --test "scripts/orchestrator/*.test.mjs"`
- `git diff --check`

## Claude Review 기준

- 허용 목록이 실제 Secret을 통과시키는 경로가 되지 않는가 (literal 일치만, 자격 증명 형태 거부)
- 허용 문자열 주변의 내용이 계속 검사되는가
- 기본 차단 규칙이 main과 같은가

## 완료 조건

Fake CLI Test로 검증되고 설계 문서가 구현과 일치하면 REVIEW. 완료 후 TASK-026을 READY로 전환한다.
