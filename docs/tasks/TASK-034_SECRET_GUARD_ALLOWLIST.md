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
