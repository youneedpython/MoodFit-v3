# TASK-049 — LLM Runtime Endpoint / Failure Diagnostics

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Staging에서 AI 코멘트 생성이 404로 실패한다. Bedrock 호출 경로를 실제로 동작이 확인된 쪽으로 바꾸고, 실패 원인을 로그로 구분할 수 있게 한다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시 "AI 코멘트 생성되지 않아", 2026-10-04)
- 선행: TASK-045(Code), TASK-046(환경 값 / 계정 간 Role)
- 실행: `node scripts/orchestrator/run.mjs TASK-049`

## 확인된 사실 (2026-10-04, Claude 세션)

- Staging에 LLM 환경 값을 적용한 뒤 소셜 로그인 사용자의 생성 요청이 모두 실패했다. Application Log: `LLM generation failure kind=NotFoundException status=404`.
  - 다른 계정의 Role을 빌리는 단계(AssumeRole)와 인증은 통과했다(권한 거부면 403이다).
  - 호출 Region을 서울에서 버지니아 북부로 바꿔도 같은 404였다.
- 현재 Code는 `BedrockMantleBackend`(Bedrock의 Messages API endpoint, `bedrock-mantle`)를 쓴다. 이 endpoint가 그 계정에서 모델 `anthropic.claude-sonnet-5-5`를 찾지 못한다. Anthropic 문서는 이 모델의 접근 조건을 "모델별로 다름"으로 적고 있다.
- 같은 계정의 Bedrock 콘솔 Playground는 **`bedrock-runtime` endpoint**로 Claude Sonnet 5.5가 응답한다(서울, 버지니아 북부 모두 Human이 확인).
- SDK(`com.anthropic:anthropic-java-bedrock:2.67.0`)에는 `bedrock-runtime`의 InvokeModel을 쓰는 `BedrockBackend`가 있다. Jar를 `javap`로 확인한 Builder Method: `awsCredentialsProvider(AwsCredentialsProvider)`, `region(Region)`, `fromEnv()`, `build()` — `BedrockMantleBackend`와 같은 형태다. Import: `com.anthropic.bedrock.backends.BedrockBackend`.
- Anthropic 문서: 최신 모델은 `bedrock-runtime`에서 기본 모델 ID로 호출하면 400("…Retry your request with the ID or ARN of an inference profile…")이 날 수 있고, 그때는 추론 Profile ID(예: 앞에 `global.`이 붙은 ID)를 쓴다. 이 모델의 정확한 Profile ID는 확인하지 못했다. 그래서 **모델 ID는 지금처럼 환경 값(`LLM_MODEL_ID`)으로 바꿀 수 있어야 하고, 실패 로그에 원인 문장이 남아야 한다.**
- `AnthropicServiceException`에서 확인한 Method: `statusCode()`, `errorType()`(Optional), `body()`, `getMessage()`.
- 지금 로그는 예외 Class 이름과 상태 Code만 남긴다. 404의 이유(모델 없음인지, 경로인지)를 알 수 없다.

## 설계 (실행 기준)

### 1. 호출 경로 선택

- 환경 값 `LLM_ENDPOINT`를 추가한다. 값: `runtime`(기본) 또는 `mantle`.
  - `runtime`: `BedrockBackend`(bedrock-runtime, InvokeModel)
  - `mantle`: 지금의 `BedrockMantleBackend`
  - 그 밖의 값 / 빈 값은 `runtime`으로 본다.
- 자격 증명(AssumeRole 또는 기본 Provider), Region, 시간 제한, 재시도, 요청 내용(모델 ID, System / User Message, 출력 길이 상한)은 두 경로가 같다. Backend 객체를 만드는 부분만 다르다.
- 이 값은 Code에서 읽는다(Infra Template은 이 Task에서 바꾸지 않는다. 기본이 `runtime`이라 환경 값 없이 동작한다).

### 2. 실패 진단 로그

- `AnthropicServiceException`(HTTP 오류)일 때 한 줄로 남긴다: 예외 Class 이름, 상태 Code, `errorType()`(있으면), **제공자가 준 오류 문장의 정리본**.
- 오류 문장 정리 규칙(반드시 지킨다):
  - 출처는 예외의 Message(`getMessage()`)다. 요청 본문, 입력 수치, 응답 본문(생성된 문장)은 로그에 넣지 않는다.
  - 12자리 연속 숫자는 `<acct>`로 바꾼다. `arn:`으로 시작하는 Token은 `<arn>`으로 바꾼다.
  - 줄바꿈 / 제어 문자를 공백으로 바꾸고 300자에서 자른다.
- 그 밖의 예외(Network, 시간 초과 등)는 지금처럼 Class 이름만 남긴다.
- 거절 / 길이 초과 종료의 로그가 한 시도에 두 번 남던 것(TASK-045 Review N-004)을 한 번만 남게 고친다.
- 로그 Level은 WARN, 형식은 기존 `LLM generation failure kind=...`를 유지하고 뒤에 항목을 덧붙인다(기존 검색 문구가 그대로 걸리게).

### 3. 다른 계정 Role의 권한 예시

- `infra/iam/llm-invocation-permission.example.json`: Action에 `bedrock:InvokeModel`을 추가한다(기존 `bedrock-mantle:CreateInference`는 유지). Resource는 지금처럼 `*`다(모델 / Profile 단위로 좁히는 정확한 형식은 확인하지 못했다. 추측한 ARN을 쓰지 않는다).
- `docs/24-LLM-INFRA.md`: 경로 선택(`LLM_ENDPOINT`), 권한 변경(Human이 다른 계정의 Role에 Action을 추가해야 함), 모델 ID가 400으로 거부될 때의 대응(로그의 오류 문장을 보고 `LlmModelId`를 추론 Profile ID로 바꿔 App Stack 갱신), 이번 404의 경과를 적는다.
- `docs/23-LLM-INSIGHT.md`: 환경 값 표에 `LLM_ENDPOINT` 추가, 로그에 남기는 것 / 남기지 않는 것 갱신.

### Test

- 설정 값에 따른 경로 선택(`runtime` 기본, `mantle`, 알 수 없는 값 → `runtime`). 실제 Bedrock을 호출하지 않는다. Backend 객체 생성이 Network를 요구하면 생성 자체를 Test하지 말고 선택 Logic만 분리해 Test한다.
- 오류 문장 정리: 12자리 숫자 / ARN 가림, 줄바꿈 제거, 300자 자르기, null / 빈 Message.
- 거절 / 길이 초과에서 로그가 한 번만 남는지(가능한 범위에서).
- 기존 Test는 그대로 통과해야 한다.

### 문서

- `docs/07-TASKS.md`: TASK-049 행과 절 추가, DONE(Milestone 49, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `prompts/`.

### Secret 검사 주의

- `token` / `secret` / `password` / `key`로 끝나는(뒤에 영숫자가 붙어도 포함) 이름 뒤에 콜론이나 등호와 값이 오면 차단된다. 변수 / Field 이름에 이 단어를 넣지 않는다(예: 가릴 대상을 가리키는 변수는 `part`, `piece`처럼 짓는다). 문서에도 그런 표기를 쓰지 않는다.

### 금지

- Dependency / Infra Template / Frontend / API 계약 변경
- 요청 본문, 입력 수치, 생성된 문장을 로그에 남기는 것
- 실제 Bedrock 호출을 하는 Test

### 참고 (Executor Sandbox)

- Sandbox에서 Gradle을 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 기본 경로가 `runtime`이고 두 경로의 요청 내용이 같은가
- 로그에 요청 / 응답 본문이 없고, 계정 번호와 ARN이 가려지는가
- LLM이 꺼진 상태와 기존 실패 처리(저장 안 함, 화면 fallback)가 그대로인가
- 추측한 API나 ARN이 없는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge → 자동 배포 뒤, Human이 다른 계정 Role에 권한을 추가하고 Staging에서 실제 생성을 확인한다. 실패하면 로그의 오류 문장으로 다음 조치를 정한다.
