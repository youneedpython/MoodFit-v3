# TASK-045 — LLM Insight (AI 맞춤 코멘트 + 주간 리포트)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Check-in 결과를 사람이 읽기 쉬운 **AI 맞춤 코멘트**로 풀어 주고, 최근 7일 기록으로 **주간 리포트**를 만든다. LLM은 Amazon Bedrock의 Claude를 쓴다.

## 초기 상태 / Dependency

- 초기: `READY` (Human Gate 승인, 2026-10-04)
- 선행: TASK-042(로그인), TASK-044(지역, Migration `V4`)
- 후속: TASK-046(Infra: LLM 환경 값 주입과 Task Role 권한). 이 Task는 **LLM 설정이 없어도 App이 시작되고 기존 기능이 그대로 동작**하게 만든다(기능만 꺼진다).
- 실행: `node scripts/orchestrator/run.mjs TASK-045`

## Human 결정 (2026-10-04, Gate 10개 항목 + 후속 결정)

1. 기능: ① 오늘의 맞춤 코멘트(2 ~ 3문장, 실천 제안 1 ~ 2개) ② 주간 리포트(최근 7일 추세 해석).
2. 역할 분리: Score, 상태, 추천 항목은 **규칙이 결정**한다. LLM은 그 결과를 풀어 쓸 뿐이며 값을 바꾸지 못한다.
3. 연동: Amazon Bedrock + Anthropic 공식 Java SDK. API Key를 쓰지 않는다.
4. 모델: Claude Sonnet 5.5.
5. 호출 시점: Check-in 저장과 분리한다. 저장 뒤 따로 요청하고 결과는 **DB에 저장**해 다시 볼 때 재호출하지 않는다.
6. 실패 처리: 시간 초과 / 오류 / 거절 때는 기존 규칙 문장만 보여 준다. 서비스는 계속 동작한다.
7. 안전: 진단 / 치료 / 약 권유 금지. 화면에 "의학적 조언이 아닙니다"를 표시한다. 모델이 응답을 거절한 경우도 실패로 처리한다.
8. 개인정보: 수치와 날씨만 보낸다. 이름, 이메일, 좌표, **지역 이름**, 사용자 번호는 보내지 않는다.
9. 비용 통제: 응답 길이 상한, 사용자당 하루 호출 한도, **소셜 로그인 사용자만 호출**(체험 계정 제외).
10. 처리 위치: Bedrock global endpoint라 추론이 해외 Region에서 처리될 수 있다(수치만 보내므로 수용).
11. **계정 구조(A안)**: MoodFit이 있는 AWS 계정에서는 이 모델을 쓸 수 없다. 다른 AWS 계정(Human의 관리 계정)에 Bedrock 호출 전용 Role을 두고, ECS Task Role이 그 Role을 **AssumeRole**로 빌려 호출한다. Role ARN은 환경 값으로 받는다(TASK-046).

## 확인된 사실 (Claude 세션, 2026-10-04)

### Dependency (Sandbox 밖에서 해석 확인, 이 프로젝트와 같은 Plugin 구성)

| 좌표 | 해석 결과 |
|---|---|
| `com.anthropic:anthropic-java:2.67.0` | 2.67.0 |
| `com.anthropic:anthropic-java-bedrock:2.67.0` | 2.67.0 |
| `software.amazon.awssdk:sts` (Version 생략) | 2.46.8 (Bedrock Module이 끌어오는 AWS SDK와 같은 Version) |

- 위 3개를 `implementation`으로 추가한다. 앞의 두 개는 Version을 명시하고, `sts`는 Version을 생략한다. 그 밖의 Dependency는 추가하지 않는다.
- 함께 해석되는 것: `anthropic-java-core` / `anthropic-java-client-okhttp` 2.67.0, AWS SDK `auth` / `regions` 2.46.8, `jackson-databind` 2.21.5(SDK 요구 범위 안).
- **Executor는 Gradle을 실행하지 않아도 된다.** Compile과 Test는 Sandbox 밖 Orchestrator Verify가 판정한다.

### SDK API (Jar를 `javap`로 확인 / 공식 문서)

```java
import com.anthropic.bedrock.backends.BedrockMantleBackend;
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.ContentBlock;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .backend(BedrockMantleBackend.builder()
        .awsCredentialsProvider(provider)          // software.amazon.awssdk.auth.credentials.AwsCredentialsProvider
        .region(Region.of("ap-northeast-2"))       // software.amazon.awssdk.regions.Region
        .build())
    .timeout(Duration.ofSeconds(20))
    .maxRetries(1)
    .build();

Message message = client.messages().create(
    MessageCreateParams.builder()
        .model("anthropic.claude-sonnet-5-5")
        .maxTokens(2048L)
        .system(systemText)
        .addUserMessage(userText)
        .build());

message.content().stream().filter(ContentBlock::isText).findFirst()
    .map(block -> block.asText().text());
```

- `BedrockMantleBackend.Builder`에서 확인한 Method: `awsCredentialsProvider(AwsCredentialsProvider)`, `region(Region)`, `fromEnv()`, `build()`.
- 오류 Type(`com.anthropic.errors`): `AnthropicServiceException`(HTTP 오류의 상위), `AnthropicIoException`(Network), `RateLimitException`, `PermissionDeniedException`, 최상위 `AnthropicException`.
- 종료 사유: `message.stopReason()`(Optional). 거절(`refusal`)이나 길이 초과(`max_tokens`)인지 확인한다. 상수 이름이 불확실하면 `message._stopReason().asString()`으로 문자열을 비교한다.
- 모델 ID: `anthropic.claude-sonnet-5-5`(Bedrock의 Messages API endpoint 기준). 서울 Region은 global endpoint만 지원한다.
- Claude Sonnet 5.5 주의: `thinking`을 `disabled`로 보내면 400이다. **`thinking` / `temperature` 같은 선택 Parameter를 보내지 않는다.** thinking이 기본으로 켜져 출력 Token을 쓰므로 `maxTokens`는 2048로 둔다(코멘트 길이는 Prompt와 Server 쪽 자르기로 제한한다).
- 이 endpoint는 Structured outputs를 지원하지 않는다. 일반 Text 응답을 받는다.
- AssumeRole(AWS SDK v2): `StsAssumeRoleCredentialsProvider.builder().stsClient(StsClient.builder().region(region).build()).refreshRequest(AssumeRoleRequest.builder().roleArn(arn).roleSessionName("moodfit-llm").build()).build()` (`software.amazon.awssdk.services.sts.*`, `...sts.auth.StsAssumeRoleCredentialsProvider`, `...sts.model.AssumeRoleRequest`). Role ARN이 없으면 `DefaultCredentialsProvider`를 쓴다.
- 확인하지 못한 API는 추측으로 쓰지 말고 `~/.gradle` Cache의 Jar를 읽어 확인한다. 확인할 수 없으면 `docs/08-WORK_LOG.md`에 "Verify에서 확인 필요"로 적는다.

### Secret 검사 주의 (중요)

검사는 `token` / `secret` / `password` / `key`로 끝나는(뒤에 영숫자가 더 붙어도 포함) 이름 뒤에 **콜론이나 등호와 값**이 오면 차단한다. 대소문자를 가리지 않는다.

- Java에서 출력 길이 상한을 담는 **변수 / 상수 / Field 이름에 위 단어를 넣지 않는다**(예: 이름을 `outputLimit`, `lengthLimit`처럼 짓는다). 위 단어가 들어간 이름에 값을 대입하는 줄은 차단된다. SDK의 Builder Method 호출(`.maxTokens(2048L)`)은 괜찮다.
- 설정 파일 / 문서 / JSON 예시에 API의 출력 길이 Parameter 이름을 Key로 쓰고 바로 값을 붙이는 표기를 쓰지 않는다. 설명이 필요하면 문장으로 쓴다.
- 환경 변수 이름에 위 단어를 넣지 않는다.

## 설계 (실행 기준)

### 설정 (환경 값, 모두 선택)

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `LLM_ENABLED` | `false` | `true`일 때만 기능을 켠다 |
| `LLM_MODEL_ID` | `anthropic.claude-sonnet-5-5` | 모델 ID |
| `LLM_REGION` | `ap-northeast-2` | Bedrock Region |
| `LLM_ROLE_ARN` | (없음) | 있으면 이 Role을 AssumeRole해서 호출 |
| `LLM_DAILY_INSIGHT_LIMIT` | `10` | 사용자당 하루 코멘트 생성 한도 |
| `LLM_DAILY_REPORT_LIMIT` | `2` | 사용자당 하루 주간 리포트 생성 한도 |

- 값은 Java Code에서 읽는다. `LLM_ENABLED`가 `true`가 아니면 Client를 만들지 않고, 생성 요청은 "사용할 수 없음"으로 응답한다. **설정이 없어도 App 시작 / 기존 Test / Smoke가 그대로 통과**해야 한다.
- Client는 App 전체에서 하나만 만든다(지연 생성). 종료 때 닫는다.

### API (모두 로그인 필요, 본인 기록만)

| Method / 경로 | 동작 |
|---|---|
| `GET /api/check-ins/{id}/insight` | 저장된 코멘트 조회. 200 `{ "available": bool, "text": string 또는 null, "generatedAt": string 또는 null }`. `available`은 "이 사용자가 지금 생성 요청을 할 수 있는가"(기능 켜짐 + 소셜 로그인 사용자)다 |
| `POST /api/check-ins/{id}/insight` | 저장된 것이 있으면 그대로 돌려준다(재호출 없음). 없으면 생성해 저장하고 돌려준다. 응답 형식은 GET과 같다. 생성에 실패하면 200에 `text` null |
| `GET /api/reports/weekly` | 가장 최근 주간 리포트 조회. 200 `{ "available": bool, "text": ..., "periodStart": ..., "periodEnd": ..., "generatedAt": ..., "recordCount": n }`(없으면 `text` null) |
| `POST /api/reports/weekly` | 최근 7일 기록으로 리포트를 만들어 저장하고 돌려준다. 기록이 3건 미만이면 호출하지 않고 422 |

- 다른 사용자의 Check-in id면 404(존재를 드러내지 않는다).
- 체험 계정이나 기능이 꺼진 상태에서 POST하면 403(`ErrorResponse`, 고정 Code). GET은 `available` false로 200.
- 하루 한도를 넘으면 429(`ErrorResponse`). 한도는 **시도 횟수** 기준으로 센다(실패도 센다, 비용 방어).
- 기존 Check-in 응답(생성 / 최신 / 이력)의 형식은 **바꾸지 않는다.**
- POST는 CSRF Token이 필요하다(기존 설정 그대로).

### Data

- Migration `V5`: 코멘트 Table(Check-in id unique + Foreign Key, 본문, 모델 ID, 생성 시각), 주간 리포트 Table(사용자 id, 기간 시작 / 끝, 본문, 기록 수, 모델 ID, 생성 시각), 사용 기록 Table(사용자 id, 종류, 시각 — 하루 한도 계산용, 조회용 Index). 새 Table만 추가하므로 Rolling 배포에 안전하다. H2와 MySQL Testcontainers 양쪽에서 통과해야 한다.
- 같은 Check-in에 동시에 두 요청이 와도 코멘트가 하나만 남게 한다(unique 제약 + 충돌 시 저장된 것 반환).

### LLM 호출

- Interface(예: `InsightGenerator`)를 두고 Bedrock 구현과 Test용 가짜 구현을 분리한다. Test에서 실제 Bedrock을 호출하지 않는다.
- 보내는 것(코멘트): 심박수, 호흡수, 수면 점수, 스트레스, 에너지, 기온, 날씨 종류, 규칙이 정한 Score / 상태 / 요약 문장 / 추천 음식·음악 이름. **보내지 않는 것**: 사용자 번호, 표시 이름, 지역 이름, 기록 id.
- 보내는 것(주간 리포트): 최근 7일 각 기록의 날짜(일 단위), Score, 상태, 수면 / 스트레스 / 에너지, 날씨 종류와 기온. 기록이 많으면 최근 30건까지만.
- System Prompt(한국어): 역할(웰니스 코치), 규칙 — 주어진 Score와 상태를 바꾸거나 다시 계산하지 않는다 / 진단, 치료, 약을 말하지 않는다 / 코멘트는 2 ~ 3문장에 실천 제안 1 ~ 2개, 리포트는 4 ~ 6문장 / 목록 기호나 Markdown 없이 문장으로만 쓴다 / 존댓말 / 입력에 없는 사실을 지어내지 않는다 / 수치가 걱정스러워도 전문가 상담을 가볍게 권하는 정도만 쓴다.
- 입력 수치는 JSON 문자열로 User Message에 넣는다(사용자가 쓴 자유 문장은 없다).
- 응답 처리: 첫 Text Block만 쓴다. 앞뒤 공백 제거, 제어 문자 제거, 코멘트 600자 / 리포트 1200자에서 자른다. 빈 응답 / 거절 / 길이 초과 종료 / 예외는 모두 실패(저장하지 않음)다.
- 제한: 요청 시간 제한 20초, SDK 재시도 1회. 예외 Message에 응답 원문을 넣어 로그에 남기지 않는다. 로그에는 종류와 상태 Code만 남긴다.

### Frontend

- Check-in 결과 화면과 Dashboard: "AI 코멘트" 영역.
  - 소셜 로그인 사용자: 결과 화면에 들어오면 자동으로 생성 요청(POST)한다. Dashboard는 조회(GET)만 하고, 저장된 것이 없으면 "AI 코멘트 받기" 버튼을 보여 준다.
  - 생성 중 표시, 실패하면 "지금은 AI 코멘트를 만들 수 없습니다" 한 줄(기존 규칙 문장은 그대로 보인다).
  - 체험 계정: "소셜 로그인 후 이용할 수 있습니다" 안내(버튼 없음). 기능이 꺼져 있으면 영역을 아예 보여 주지 않는다 — 이를 구분할 수 있게 `available`과 로그인 수단(`provider`)으로 판단한다.
  - 본문 아래에 작은 글씨로 "AI가 생성한 참고용 문장이며 의학적 조언이 아닙니다."
- History: "주간 리포트" Card. 저장된 리포트를 보여 주고 "주간 리포트 만들기 / 다시 만들기" 버튼을 둔다. 기록 부족(422)과 한도 초과(429)는 안내 문구로 보여 준다.
- 본문은 React 기본 escaping으로 출력한다. 줄바꿈은 CSS로 처리한다(HTML 삽입 금지).
- 새 npm Dependency 없음. 390px에서 배치가 깨지지 않게 한다.

### Test

- Backend: 기능 꺼짐(기본) 상태에서 GET은 `available` false, POST는 403 / 가짜 Generator로 생성 → 저장 → 재요청 시 재호출 없음 / 체험 계정 403 / 다른 사용자 기록 404 / 하루 한도 429 / Generator 실패 시 `text` null이고 저장 안 됨 / 주간 리포트 기록 부족 422 / 보내는 입력에 표시 이름, 지역, 사용자 번호가 없음(가짜 Generator가 받은 입력 검사) / 응답 정리(길이 자르기, 제어 문자) / Migration(H2, MySQL).
- 계약 Test: 새 예시 추가. 기존 예시는 그대로 통과.
- Frontend: 소셜 사용자 자동 요청, 체험 계정 안내, 꺼짐 상태 미표시, 실패 문구, 주간 리포트 버튼과 오류 안내.

### 문서

- `docs/05-API_SPEC.md`와 `contracts/`: 새 API 예시.
- `docs/23-LLM-INSIGHT.md`(새 문서): 기능, 역할 분리, 보내는 Data와 보내지 않는 Data, Prompt 규칙, 실패 처리, 한도, 환경 값, 계정 구조(AssumeRole), 비용 참고(확인한 값만, 확인하지 못한 요금은 "확인 필요"), 한계.
- `docs/09-DECISIONS.md`: 새 Decision(최신 번호 다음, Human Approved 2026-10-04).
- `docs/07-TASKS.md`: TASK-045 행과 절 추가, DONE(Milestone 45). TASK-046(Infra: LLM 환경 값 / Task Role 권한, READY)도 등록한다. 번호 순서, Task 표가 빈 줄로 끊기지 않게. 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, README 기능 소개 한 단락, `prompts/`.

### 금지

- Infra / Workflow / Smoke Script 변경, API Key 사용, 실제 Bedrock 호출을 하는 Test
- Score / 상태 / 추천을 LLM 결과로 바꾸는 것
- 응답 원문이나 입력 수치를 로그에 남기는 것

## Verification

- `bash scripts/verify.sh`
- `bash scripts/container-smoke.sh`
- `git diff --check`

## Claude Review 기준

- 설정이 없을 때 기존 동작이 그대로인가(App 시작, Smoke)
- 체험 계정 차단, 본인 기록 제한, 하루 한도가 Server에서 강제되는가
- 보내는 Data에 식별 정보 / 지역이 없는가, 로그에 본문이 없는가
- 실패 / 거절 / 빈 응답이 저장되지 않고 화면이 규칙 문장으로 돌아가는가
- 저장된 코멘트를 재호출 없이 돌려주는가, 동시 요청에 안전한가
- SDK 사용이 확인된 API와 맞는가(추측한 Method가 없는가)

## 완료 조건

검증과 Review를 통과하면 REVIEW. 실제 Bedrock 호출은 TASK-046(환경 값 주입, 다른 계정의 Role 생성) 뒤 Staging에서 확인한다.
