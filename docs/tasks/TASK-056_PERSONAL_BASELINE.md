# TASK-056 — Personal Baseline (개인별 Baseline / 신체 긴장도)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

같은 심박수 / 호흡수라도 사람마다 의미가 다르다. 본인의 평소 값(Baseline)과 비교해 **신체 긴장도**를 판정하고, 기분 판정과 추천에 반영한다(Human이 제시한 개선 항목 2번 "개인별 Baseline").

## 초기 상태 / Dependency

- 초기: `READY` (Human 결정 "B", 2026-10-05)
- 선행: TASK-042(사용자), TASK-045(AI 코멘트), TASK-048(추천 Pool), TASK-055(추천 피드백 — `select`의 형태가 바뀐다)
- 실행: `node scripts/orchestrator/run.mjs TASK-056`

## Human 결정 (2026-10-05, Gate B — 판정 규칙 변경)

Claude 세션이 A(비교 표시만) / B(신체 긴장도 지표 추가) / C(점수 자체를 상대값으로)를 제시했고 Human이 **B**를 골랐다.

1. **Wellness Score 공식은 바꾸지 않는다.** 이전 기록과 점수 비교가 유지되어야 한다.
2. **Baseline**: 본인의 최근 14일 기록 평균(지금 저장하는 기록은 제외). 기록이 **5건 미만이면 Baseline 없음** — 지금과 완전히 같게 동작한다.
3. **신체 긴장도**(새 지표, 3단계)를 심박수 / 호흡수의 Baseline 대비 비율로 정한다.
   - 높음: 심박수가 평균보다 15% 이상 높거나, 호흡수가 20% 이상 높다
   - 안정: 심박수와 호흡수가 모두 평균보다 10% 넘게 높지 않다(평균보다 낮은 값 포함)
   - 보통: 그 사이
4. 긴장도가 "높음"이면 **기분 판정과 추천을 차분한 쪽으로 조정**한다(아래 설계).
5. 이 기준은 의학적 근거가 아닌 서비스용 기준(Product Heuristic)이다. 화면과 문서에 적는다.
6. **체험 계정에도 Baseline을 적용한다**(Human 지시 2026-10-05: "체험계정에도 '평소 값' 있었으면 해"). 채용 담당자 등 로그인 없이 둘러보는 방문자도 이 기능을 볼 수 있어야 한다. 체험 계정은 공유 계정이라 평균이 **모든 방문자 기록의 평균**이 된다는 점을 화면에 적는다. 계산 / 판정 / 조정 규칙은 소셜 로그인 사용자와 같다.

## 현재 구조 (Claude 세션 확인)

- `WellnessRulePolicy`: Score는 수면 / 스트레스 / 에너지로 계산하고(`calculateScore`), 기분(`MoodType`: TIRED / ENERGETIC / CALM / BALANCED)도 그 세 값과 Score로 정한다(`determineMood`). **심박수와 호흡수는 Score와 기분 판정에 쓰이지 않는다.** 상황(`ContextType`)은 기온과 날씨로 정한다.
- 추천은 기분 Pool 3개 + 상황 Pool 2개를 고른다(TASK-048, TASK-055).
- Check-in 응답(생성 / 최신)과 이력 응답의 형식은 `contracts/`에 예시가 있고, Staging Smoke가 **체험 계정**으로 만든 응답을 예시와 비교한다(추천 목록은 형식만, 나머지는 값까지).
- AI 코멘트 입력(`InsightData`)은 수치 / 날씨 / 규칙 결과만 보낸다(식별 정보 제외).

## 설계 (실행 기준)

### Baseline 계산

- 대상: 같은 사용자의 기록 중 `recordedAt`이 "지금 - 14일" 이후이고 지금 저장하는 기록보다 앞선 것. 주입된 `Clock` 기준.
- 5건 이상이면 심박수 / 호흡수 / 수면 / 스트레스 / 에너지의 평균을 구한다(소수 1자리 반올림). 5건 미만이면 "없음". 체험 계정도 같은 규칙이다(그 계정의 기록 전체가 대상).
- 계산은 저장 시점에 한 번 하고 **결과를 그 기록과 함께 저장**한다(나중에 평균이 바뀌어도 그 기록의 긴장도와 비교 값은 그대로 보인다).

### 신체 긴장도

- 비율 = (오늘 값 - 평균) / 평균. 평균이 0이면 Baseline 없음으로 본다.
- 판정 순서: 높음 조건(심박수 비율 ≥ 0.15 또는 호흡수 비율 ≥ 0.20) → 안정 조건(두 비율 모두 ≤ 0.10) → 그 밖은 보통.
- Code 값: `HIGH` / `STABLE` / `NORMAL`. 화면 이름: "높음" / "안정" / "보통". Baseline이 없으면 null(화면에 표시하지 않음).
- 경계값 Test를 둔다(정확히 15%, 20%, 10%).

### 기분과 추천 조정 (긴장도 `HIGH`일 때만)

- 기분: 규칙이 정한 기분이 `ENERGETIC`이면 `BALANCED`로 바꾼다. `TIRED` / `CALM` / `BALANCED`는 그대로 둔다. Score는 바꾸지 않는다.
- 추천: 기분 쪽 Pool을 고를 때, (조정 뒤) 기분이 `BALANCED`이면 `CALM` Pool을 쓴다. `TIRED` / `CALM`은 자기 Pool을 그대로 쓴다. 상황 쪽 Pool과 고르는 규칙(날짜 순환, 피드백 반영)은 그대로다.
- 요약 문장: 기존 문장 뒤에 한 문장을 덧붙인다 — 예: "평소보다 심박수와 호흡수가 높게 나타나 잠시 쉬어 가는 것이 어울립니다." (어느 값이 높은지에 맞게: 심박수만 / 호흡수만 / 둘 다). 진단이나 질병을 말하지 않는다.
- `STABLE` / `NORMAL` / 없음일 때는 기분 / 추천 / 요약 문장이 지금과 같다.

### Data

- Migration(다음 번호): Check-in Table에 nullable Column 추가 — Baseline 표본 수, 심박수 평균, 호흡수 평균, 수면 / 스트레스 / 에너지 평균, 긴장도. 기본값 없는 nullable이라 Rolling 배포에 안전하다. 기존 행은 null. H2와 MySQL Testcontainers 양쪽에서 통과해야 한다.
- 계정 삭제는 Check-in 행과 함께 지워진다(추가 작업 없음을 Test로 확인).

### API 계약

- 생성 / 최신 응답에 `baseline` 객체를 추가한다:
  - `available`(bool), `sampleCount`(정수, 없으면 0), `tension`(`HIGH` / `STABLE` / `NORMAL` 또는 null), `averages`(없으면 null — 있으면 `heartRate`, `respiratoryRate`, `sleepScore`, `stressLevel`, `energyLevel` 평균), `deltas`(없으면 null — 오늘 값에서 평균을 뺀 값, 소수 1자리)
- 이력 응답의 각 항목에 `tension`(null 가능)을 추가한다.
- `contracts/` 예시와 `docs/05-API_SPEC.md`를 갱신한다. 기존 예시(기록 부족 상태)는 `available` false, `sampleCount` 0, 나머지 null이다.
- Baseline이 있는 경우의 예시를 새 파일로 추가하고 Test로 검증한다.
- **Smoke Script 변경(필수)**: Staging Smoke는 체험 계정으로 Check-in을 만들어 예시와 비교한다. 체험 계정에는 기록이 많이 쌓여 있어 Baseline이 "있음"이 되고, 그 평균은 방문자 입력에 따라 달라진다. 그래서 `scripts/staging-smoke.sh`와 `scripts/container-smoke.sh`의 비교 규칙을 다음처럼 바꾼다(두 Script에 같은 규칙).
  - **값까지 비교(그대로)**: Score(`wellnessScore`), 입력 지표(`metrics`), 날씨(`weather`), 이력의 지표 / Score. Baseline은 Score를 바꾸지 않으므로 Score 비교가 계속 유효하다.
  - **형식만 검사**: `baseline`(Key 집합이 예시와 같음, `available`은 bool, `sampleCount`는 0 이상 정수, `tension`은 세 Code 중 하나 또는 null, `averages` / `deltas`는 null이거나 5개 지표 Key를 가진 숫자 객체), 기분(`mood` — Key 집합과 값의 Type, Code는 네 기분 중 하나), 요약 문장(`summary` — 비어 있지 않은 문자열), 이력 항목의 `tension`(Code 또는 null)과 기분 관련 Field. 추천 목록은 TASK-048에서 이미 형식만 검사한다.
  - `latest == created` 비교(같은 요청으로 만든 것이 최신인지)는 유지한다.
  - Token / Cookie 값을 출력하지 않는 기존 동작과 임시 파일 정리를 유지한다. Windows Git Bash 경로 처리(`docker_path`), tmpfs에서 파일을 꺼내는 방식(`docker exec ... cat`)은 건드리지 않는다.

### AI 코멘트 입력

- `InsightData`에 긴장도(화면에 쓰는 한국어 이름)와 심박수 / 호흡수의 평균 대비 차이(숫자)를 추가한다. Baseline이 없으면 넣지 않는다.
- 보내지 않는 것은 그대로다(사용자 번호, 표시 이름, 지역 이름, 기록 번호). 이를 검사하는 기존 Test를 유지한다.
- System Prompt에 한 줄: 긴장도는 서비스가 정한 참고 지표이며 진단처럼 말하지 않는다.

### Frontend

- Body Metrics(Dashboard)와 Check-in 결과: Baseline이 있으면 심박수 / 호흡수 Card에 "평소 대비 +16"(부호 포함, 0이면 "평소와 같음") 한 줄을 보여 준다. 수면 / 스트레스 / 에너지에도 같은 줄을 보여 준다. Baseline이 없으면 표시하지 않는다.
- 신체 긴장도 Badge: Dashboard의 컨디션 Card와 Check-in 결과에 "신체 긴장도 높음 / 보통 / 안정". 색은 기존 Token에서 고르고 색만으로 구분하지 않는다(글자 포함).
- 설명 한 줄: "최근 14일 기록 N건의 평균과 비교했습니다. 의학적 기준이 아닌 참고 지표입니다."
- Baseline이 없으면: "기록이 5건 이상 쌓이면 평소 값과 비교해 드립니다".
- 체험 계정이면 설명 줄에 덧붙인다: "체험 계정은 모든 방문자의 기록 평균과 비교합니다. 내 기록만으로 비교하려면 소셜 로그인을 이용하세요."
- History: 각 기록에 긴장도가 있으면 작은 Badge로 보여 준다. 없으면 표시하지 않는다.
- 390 / 768 / 1280px에서 배치가 깨지지 않게 한다. 새 npm Dependency 없음.

### 개인정보 안내

- `frontend/src/features/privacy/`와 `docs/25-PRIVACY.md`: "본인의 이전 기록 평균으로 평소 값을 계산해 기록과 함께 저장한다"를 "처리하는 정보"에 추가한다.

### Test

- Backend: Baseline 계산(14일 창 경계, 5건 경계, 현재 기록 제외, 다른 사용자 기록 제외, 체험 계정도 같은 규칙으로 계산), 긴장도 경계값, `HIGH`일 때 기분 / 추천 Pool / 요약 문장 조정, 그 밖에는 기존과 같은 결과, 저장 뒤 평균이 바뀌어도 기록의 값이 그대로, 응답 형식, Migration(H2 / MySQL), AI 입력에 식별 정보 없음.
- 기존 판정 경계값 Test와 계약 Test(기존 예시)는 수정 없이 통과해야 한다(새 Field가 추가되는 예시 갱신은 예외).
- Frontend: Baseline 있음 / 없음 표시, 체험 계정 안내 문구, 긴장도 Badge, 차이 부호 표기.

### 문서

- `docs/26-PERSONAL-BASELINE.md`(새 문서): 계산, 기준 수치, 조정 규칙, 예시, 한계(기록이 적으면 평균이 흔들림, 의학적 기준 아님).
- `docs/09-DECISIONS.md`: 새 Decision(최신 번호 다음, Human Approved 2026-10-05, Gate B)과 DEC-014 변경 이력.
- `docs/05-API_SPEC.md`, `docs/23-LLM-INSIGHT.md`(입력 항목), `docs/25-PRIVACY.md`.
- `docs/07-TASKS.md`: TASK-056 행과 절 추가, DONE(Milestone 56, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, README 기능 소개 한 줄, `prompts/`.

### Secret 검사 주의

- `token` / `secret` / `password` / `key`로 끝나는(뒤에 영숫자가 붙어도 포함) 이름 뒤에 콜론이나 등호와 값이 오면 차단된다. 변수 / Field / Column 이름과 문서 표기에 주의한다.

### 금지

- Score 공식 변경, 추천 개수 / Pool 내용 변경, Dependency / Infra 변경, 두 Smoke Script 밖의 Script 변경
- 식별 정보를 AI 입력에 추가
- 질병 / 진단을 암시하는 문구

### 참고 (Executor Sandbox)

- Sandbox에서 Gradle / npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.
- 반복된 실수에 주의한다: Java의 괄호 짝 / Type 불일치, Test의 `tsc --noEmit` 타입 오류, CSS를 `?raw`로 읽는 Test, 같은 Spring Context를 쓰는 다른 Test의 상태를 바꾸는 Test, 여러 fetch에 같은 `Response` 객체를 돌려주는 mock.

## Verification

- `bash scripts/verify.sh`
- `bash scripts/container-smoke.sh`
- `bash -n scripts/staging-smoke.sh`
- `git diff --check`

## Claude Review 기준

- Baseline이 없을 때(기록 부족) 기존과 완전히 같은 결과인가
- Smoke가 Score / 지표 / 날씨는 값까지, Baseline의 영향을 받는 항목은 형식만 검사하는가(체험 계정에 Baseline이 있어도 통과하는가)
- Score가 바뀌지 않는가, 조정이 `HIGH`일 때만 일어나는가
- 본인 기록만으로 평균을 내는가(다른 사용자 제외), 14일 / 5건 / 비율 경계가 맞는가
- 저장된 기록의 긴장도가 나중에 바뀌지 않는가
- AI 입력과 화면 문구가 진단처럼 읽히지 않는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 화면 캡처로 확인하고, Merge 뒤 Staging에서 소셜 계정으로 기록을 5건 넘게 쌓아 긴장도 표시를 확인한다.
