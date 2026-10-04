# 23. LLM Insight — AI 맞춤 코멘트와 주간 리포트

TASK-045의 Human Approved 결정(2026-10-04)을 구현한다. 실제 Bedrock 호출과 Staging 확인은 TASK-046 이후다.

## 기능과 역할

Check-in 저장 이후 별도 요청으로 2 ~ 3문장의 코멘트와 실천 제안 1 ~ 2개를 생성한다. 주간 리포트는 최근 7일 기록의 추세를 4 ~ 6문장으로 설명한다. Score, 상태, 요약, 음식과 음악 추천은 기존 DEC-014 규칙이 결정하며 LLM 결과는 이 값을 변경하지 않는다.

결과 화면과 Dashboard는 조회 후 저장된 코멘트가 없고 enabled와 available이 모두 true인 소셜 사용자에게 자동 생성한다. 화면 진입 시 기록별 자동 요청은 한 번만 하며 StrictMode / 재Render와 실패 뒤에도 반복하지 않는다. 생성 중에는 진행 문구를 표시하고, 빈 본문 / 403 / 429 / Network 실패 뒤에는 기존 실패 안내와 수동 "다시 시도" 버튼을 제공한다. 저장된 코멘트는 다시 생성하지 않는다. History에서는 저장된 주간 리포트 조회와 다시 만들기를 제공한다. 꺼진 기능은 숨기며 켜진 기능의 체험 사용자에게는 소셜 로그인 안내만 표시한다. 본문은 React escaping으로 출력하고 의학적 조언이 아니라는 안내를 표시한다.

## 전송 데이터와 개인정보

코멘트에는 심박수, 호흡수, 수면 점수, 스트레스, 에너지, 기온, 날씨 종류와 규칙이 정한 Score, 상태, 요약, 음식 이름, 음악 제목만 보낸다. 주간 리포트에는 날짜(일 단위), Score, 상태, 수면 점수, 스트레스, 에너지, 날씨 종류, 기온만 보낸다. Entity를 직렬화하지 않고 허용 필드만 JSON으로 투영한다.

사용자 번호, Check-in 번호, 표시 이름, 이메일, 좌표, 지역 이름은 보내지 않는다. 사용자 자유 문장을 받지 않는다. 입력 수치, 요청 본문, 모델 응답, 예외 응답 본문과 Stack trace를 로그에 남기지 않는다. HTTP 오류는 예외 Class, 상태 Code, 제공자 오류 종류와 getMessage()의 정리본만 WARN으로 남긴다. 12자리 연속 숫자는 `<acct>`, `arn:`으로 시작하는 공백 구분 단위는 `<arn>`으로 가리고 줄바꿈 / 제어 문자를 공백으로 바꾼 뒤 300자로 자른다. Network / 시간 초과 등은 Class 이름만, 거절 / 길이 초과는 고정 종류만 한 시도에 한 번 기록한다. 기존 `LLM generation failure kind=...` 검색 형식을 유지한다. Bedrock global endpoint의 추론이 해외 Region에서 처리될 수 있다는 점은 Human이 수용했다.

## Prompt와 응답 처리

한국어 웰니스 코치 역할, Score와 상태 변경·재계산 금지, 진단·치료·약 권유 금지, 입력에 없는 사실 금지, 존댓말, Markdown과 목록 없이 문장만 작성하도록 지시한다. 수치가 걱정스러울 때는 전문가 상담을 가볍게 권하는 정도로 제한한다.

첫 Text Block만 사용하며 제어 문자 제거와 앞뒤 공백 정리를 수행한다. 코멘트는 600자, 리포트는 1200자로 Unicode code point 기준 자른다. 빈 응답, refusal, max_tokens 종료와 예외는 저장하지 않는다. 모델 출력의 안전성을 Prompt만으로 완전히 보장할 수 없으며 참고 문장이라는 한계가 있다.

TASK-051부터 코멘트는 한 문장에 한 줄, 주간 리포트는 2 ~ 3개 문단(문단당 1 ~ 3문장, 문단 사이 빈 줄 하나)을 요청한다. 제목도 쓰지 않으며 영문 Code / 내부 이름 / 입력 필드 이름을 본문에 옮기지 않도록 지시한다. 상태와 날씨는 기존 화면의 한국어 이름으로 투영하며 전송 필드 범위는 유지한다. 허용 경로 밖의 표시 이름 구현은 변경하지 않고 WellnessRulePolicy와 Frontend WEATHER_LABELS의 기존 이름을 그대로 사용한다.

줄바꿈이 없는 응답은 Server에서 마침표 / 느낌표 / 물음표 뒤 공백을 기준으로 나눈다. 코멘트는 문장마다 줄을 바꾸고 리포트는 두 문장씩 묶어 빈 줄로 나눈다. 소수점과 공백 없이 이어지는 약어의 점은 나누지 않는다. 공백이 뒤따르는 약어의 마침표는 문장 끝과 구분하지 않는 단순 규칙이다. 기존 줄바꿈은 유지하면서 줄 앞뒤 공백과 여러 빈 줄을 정리하고 마지막에 기존 길이 제한을 적용한다. 줄바꿈을 제외한 제어 문자 제거는 유지한다.

React 본문 Class는 줄바꿈과 빈 줄을 보존하며 기존 본문 줄 간격 Token을 쓴다. Check-in 결과는 요약 → 날씨 / 지역 → 추천 → AI 코멘트 → 버튼 순서이고 Dashboard 위치는 유지한다. 이미 저장된 코멘트 / 리포트는 재정리하지 않는다. 새로 생성한 응답부터 적용하며 리포트를 다시 만들면 새 형식으로 저장한다.

## 설정과 계정 구조

| 환경 값 | 기본값 | 용도 |
|---|---|---|
| LLM_ENABLED | false | true일 때 생성 허용 |
| LLM_MODEL_ID | anthropic.claude-sonnet-5-5 | Claude Sonnet 5.5 |
| LLM_REGION | ap-northeast-2 | Bedrock Region |
| LLM_ENDPOINT | runtime | runtime은 BedrockBackend / InvokeModel, mantle은 BedrockMantleBackend; 빈 값 / 알 수 없는 값은 runtime |
| LLM_ROLE_ARN | 없음 | 다른 계정의 호출 전용 Role |
| LLM_DAILY_INSIGHT_LIMIT | 10 | 사용자당 하루 코멘트 시도 |
| LLM_DAILY_REPORT_LIMIT | 2 | 사용자당 하루 리포트 시도 |

Java에서 선택 환경 값을 읽는다. 꺼져 있으면 Client나 AWS 자격 증명 공급자를 생성하지 않는다. 켜진 경우 첫 호출 시 App 전체에 하나의 Anthropic Client를 만들고 종료 시 Client, STS 및 자격 증명 공급자를 닫는다.

MoodFit 계정의 ECS Task Role이 Human 관리 계정의 Bedrock 전용 Role을 AssumeRole하는 A안을 적용한다. Role 환경 값이 없으면 DefaultCredentialsProvider를 사용한다. API Key와 장기 Access Key를 저장하지 않는다. Role 생성, Trust, Task Role 권한과 환경 값 주입은 TASK-046 범위이며 여기서 Infra를 변경하지 않는다.

승인된 Dependency는 anthropic-java와 anthropic-java-bedrock 2.67.0, 버전을 생략한 AWS SDK sts다. 요청 제한은 20초, SDK 재시도는 1회다. 출력 상한은 SDK Builder에서 2048로 지정하고 thinking과 temperature는 보내지 않는다. 선택 Parameter와 Structured outputs를 추가하지 않는다.

## 저장, 한도와 동시성

V5는 checkin_insight, weekly_report, llm_usage 새 Table만 만든다. 코멘트는 Check-in unique 및 Foreign Key, 리포트와 사용 기록은 사용자 Foreign Key를 갖는다. 모델 ID와 생성 시각은 DB에만 저장하며 응답에는 모델·Role·Region 설정을 노출하지 않는다.

모든 API는 로그인 및 본인 기록을 요구한다. Google/Kakao 사용자만 생성할 수 있고 체험 계정은 Server에서 차단한다. 저장된 코멘트는 한도를 소비하거나 재호출하지 않는다. 동시 생성의 저장 충돌은 unique 제약으로 막고 이미 저장된 문장을 반환한다. 같은 기록의 동시 요청은 생성 시도를 각각 소비할 수 있다.

하루 한도는 Asia/Seoul의 달력 날짜 기준이다. 사용자 행을 DB에서 잠근 뒤 조회와 시도 기록 INSERT를 하나의 독립 Transaction으로 Commit해 다중 ECS 인스턴스에서도 한도를 강제한다. 외부 호출 실패도 시도로 남는다. SDK 내부 재시도는 한 번의 생성 요청에 포함되므로 실제 네트워크 호출 수와 요청 시도 수는 다를 수 있다.

주간 기간은 오늘을 포함한 7일(서울 날짜)이며 미래 날짜는 제외한다. 최근 30건을 사용하며 같은 시각은 기록 번호로 정렬한다. 기록이 3건 미만이면 생성과 한도 소비 없이 422다. recordCount는 실제 모델에 전달한 기록 수다. 실패한 리포트는 저장하지 않으며 이전에 저장된 리포트는 이후 GET으로 다시 조회할 수 있다.

## 실패, 비용과 검증 한계

생성 실패는 200의 text null로 응답하며 기존 규칙 문장은 계속 표시한다. 꺼짐/체험 계정의 POST는 LLM_UNAVAILABLE(403), 기록 부족은 LLM_INSUFFICIENT_RECORDS(422), 하루 한도는 LLM_DAILY_LIMIT(429)다. 다른 사용자의 기록은 CHECKIN_NOT_FOUND(404)다. 기존 Check-in API 형식과 CSRF 정책은 유지한다.

모델 요금은 확인 필요다. 한도와 출력 길이는 비용을 제한하지만 계정 전체 비용 상한이나 정확한 청구액을 보장하지 않는다. 실제 Role 접근, 모델 사용 가능 여부, 응답 지연, 해외 처리 및 요금은 TASK-046 이후 확인한다.

가짜 Generator 기반 API/권한/저장/한도/개인정보 Test, SDK 응답 거절·길이 초과 Test, H2/MySQL V4 → V5 Migration Test와 Frontend Test를 추가했다. 실제 Bedrock을 호출하는 Test는 없다. Sandbox 자체 실행 결과와 화면 캡처 한계는 WORK_LOG에 기록하며 검증 기준은 Orchestrator Verify다.
