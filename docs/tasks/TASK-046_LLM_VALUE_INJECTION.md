# TASK-046 — LLM Value Injection (Infra)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

TASK-045가 만든 AI 코멘트 / 주간 리포트 기능을 켤 수 있게 한다. ECS Task에 LLM 환경 값을 주입하고, Task Role이 다른 AWS 계정의 Bedrock 호출 전용 Role을 빌릴(AssumeRole) 수 있게 한다.

## 초기 상태 / Dependency

- 초기: `READY` (Human Gate 승인 2026-10-04, LLM Gate와 "A안")
- 선행: TASK-043(OAuth 값 주입 방식), TASK-045(Code)
- 실행: `node scripts/orchestrator/run.mjs TASK-046`

## Human 결정 / 확인된 사실 (2026-10-04)

1. **계정 구조(A안, Human 승인)**: MoodFit이 있는 AWS 계정에서는 Bedrock의 Claude Sonnet 5.5를 쓸 수 없다("not available for this account"). Human의 다른 AWS 계정(관리 계정)에서는 서울 / 버지니아 북부 모두 응답한다. 그 계정에 **Bedrock 호출 전용 Role**을 Human이 만들고, MoodFit의 ECS Task Role이 `sts:AssumeRole`로 빌려 호출한다. API Key는 쓰지 않는다. 비용은 그 계정에 청구된다.
2. Claude 세션과 Agent는 그 다른 계정에 접근하지 않는다. Role 생성은 Human이 콘솔에서 한다. 이 Task는 **절차 문서와 Policy 예시**를 제공한다.
3. Backend가 읽는 환경 변수(TASK-045): `LLM_ENABLED`(`true`일 때만 켜짐), `LLM_MODEL_ID`(기본 `anthropic.claude-sonnet-5-5`), `LLM_REGION`(기본 `ap-northeast-2`), `LLM_ROLE_ARN`(있으면 AssumeRole), `LLM_DAILY_INSIGHT_LIMIT`(기본 10), `LLM_DAILY_REPORT_LIMIT`(기본 2).
4. SDK는 Bedrock의 Messages API endpoint(`https://bedrock-mantle.<region>.api.aws/anthropic/v1/messages`)를 SigV4로 호출한다. Claude 세션이 서울 / 버지니아 / 도쿄 endpoint가 응답하는 것을 확인했다(인증 없는 요청에 401). 필요한 IAM Action은 Anthropic 문서 기준 `bedrock-mantle:CreateInference`다.
   - **확인하지 못한 것**: 이 Action의 Resource ARN 형식. AWS 문서에서 확정하지 못했다. 그래서 다른 계정 Role의 권한 Policy 예시는 Action을 이 하나로 제한하고 Resource는 `*`로 두되, 문서에 "Resource를 모델 단위로 좁히는 형식은 확인 필요"라고 적는다. 추측한 ARN 형식을 쓰지 않는다.
5. CD는 현재 Task Definition을 복사해 Image만 바꾼다. App Stack을 갱신할 때는 `BackendImage`에 현재 실행 중인 digest를 넣는다(TASK-043과 같은 절차).
6. Secret 검사 주의: `token` / `secret` / `password` / `key`로 끝나는 이름(뒤에 영숫자가 붙어도 포함) 뒤에 콜론이나 등호와 값이 오면 차단된다. 이 Task의 환경 변수 이름에는 그런 단어가 없다. `app.yaml`의 기존 자격 증명 주입 목록 줄은 **건드리지 않는다**(바꾸면 검사에 걸린다).

## 설계 (실행 기준)

### `infra/cloudformation/app.yaml`

- Parameter 추가:
  - `LlmEnabled`: `true` / `false`, 기본 `false`
  - `LlmRoleArn`: 기본 빈 문자열. 빈 문자열 또는 IAM Role ARN 형식만 허용(`AllowedPattern`, 구분 콜론은 `[:]`로 쓴다 — TASK-043의 `OAuthCredentialArn`과 같은 방식)
  - `LlmModelId`: 기본 `anthropic.claude-sonnet-5-5`, 영숫자 / 점 / 하이픈 / 콜론만 허용
  - `LlmRegion`: 기본 `ap-northeast-2`, Region 형식만 허용
- Container `Environment`에 `LLM_ENABLED`, `LLM_MODEL_ID`, `LLM_REGION`을 추가한다. `LLM_ROLE_ARN`은 값이 있을 때만 추가한다(Condition + `AWS::NoValue`).
- 하루 한도 두 개는 Parameter로 만들지 않는다(Backend 기본값 사용). 문서에 적는다.
- 그 밖의 설정(Secrets 목록, Health Check, Image, Log 등)은 바꾸지 않는다.

### `infra/cloudformation/iam.yaml`

- Parameter `LlmRoleArn`(기본 빈 문자열, 같은 형식 제한)을 추가한다.
- 값이 있으면 **TaskRole**(App이 실행 중 쓰는 Role)에 Statement를 추가한다: `sts:AssumeRole`, Resource는 그 ARN 하나(wildcard 금지). 빈 문자열이면 추가하지 않는다. ExecutionRole은 바꾸지 않는다.
- Staging TaskRole에만 적용한다. Production용 Role이 같은 Template의 다른 Resource라면 같은 Parameter로 같은 Statement를 추가하되, 환경이 섞이지 않게 한다(Template 구조를 읽고 판단, 문서에 적는다).

### 다른 계정의 Role (문서와 예시 파일)

- `infra/iam/`에 예시 파일 2개를 추가한다(Placeholder 사용, 실제 계정 ID / ARN 금지):
  - Trust Policy: Principal은 MoodFit 계정의 **Task Role ARN 하나**. Action `sts:AssumeRole`.
  - Permission Policy: Action `bedrock-mantle:CreateInference`만. Resource는 위 4번 설명대로.
- `docs/23-LLM-INSIGHT.md`에 Human 절차를 적는다:
  1. 다른 계정 콘솔 → IAM → Role 생성(사용자 지정 신뢰 정책) → 예시 Trust Policy에 Task Role ARN 입력 → 예시 Permission Policy 연결 → Role 이름(예: `moodfit-bedrock-invoke`) → 만든 Role의 ARN 확인
  2. MoodFit 계정: IAM Stack Change Set(UPDATE, `LlmRoleArn`) → App Stack Change Set(UPDATE, `LlmEnabled` true, `LlmRoleArn`, `BackendImage`는 현재 실행 중인 digest)
  3. 확인: 소셜 로그인 → Check-in → AI 코멘트 표시. 실패하면 Application Log의 실패 종류(권한 거부 / 시간 초과 등)를 본다.
  4. 끄는 방법: `LlmEnabled`를 `false`로 App Stack 갱신. 비용을 완전히 막으려면 다른 계정의 Role을 삭제하거나 Trust를 비운다.
- Task Role ARN은 문서에 쓰지 않는다("IAM Stack 출력에서 확인"이라고 적는다).

### 문서

- `docs/23-LLM-INSIGHT.md`(위 절차, 환경 값 표 갱신, 확인하지 못한 것), `docs/18-STAGING-DEPLOYMENT-RUNBOOK.md`(적용 순서), `docs/15-AWS-ACCESS-POLICY.md`(계정 간 AssumeRole 추가), `docs/09-DECISIONS.md`(새 Decision, 최신 번호 다음, Human Approved 2026-10-04), `docs/07-TASKS.md`(TASK-046 DONE, Milestone 46 — 행 / 절이 없으면 추가, 다른 Task 상태는 바꾸지 않는다), `docs/08-WORK_LOG.md`, `prompts/`, Parameter 예시 파일 2개(Placeholder).
- TASK-045의 문서(`docs/23-LLM-INSIGHT.md`)가 이 Branch에 아직 없을 수 있다(TASK-045 PR이 Merge 전이면). 그 경우 **새 문서 `docs/24-LLM-INFRA.md`에 적고** `docs/23`은 만들지 않는다(Merge 충돌 방지). `docs/07`의 TASK-046 행 / 절도 같은 이유로 없으면 추가한다.

### 금지

- 실제 계정 ID / ARN을 추적 파일에 쓰는 것, 추측한 ARN 형식
- Workflow, Backend, Frontend, 다른 Stack 변경. Stack 갱신 실행과 다른 계정 작업(Human)
- `app.yaml`의 기존 자격 증명 주입 목록 줄 변경

## Verification

- `bash scripts/iac-validate.sh`
- `git diff --check`

## Claude Review 기준

- TaskRole의 AssumeRole 권한이 그 ARN 하나로 제한되고 빈 값일 때 생기지 않는가
- `LLM_ROLE_ARN`이 빈 값일 때 주입되지 않는가, 기본 상태(`LlmEnabled` false)에서 기존 동작이 그대로인가
- 다른 계정 Role 예시가 최소 권한인가, 추측한 ARN이 없는가, 확인하지 못한 것이 문서에 드러나 있는가
- 기존 자격 증명 주입 줄과 다른 설정을 바꾸지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 Human이 다른 계정에 Role을 만들고 IAM / App Stack을 갱신한다. Staging에서 실제 AI 코멘트 생성을 확인한다.
