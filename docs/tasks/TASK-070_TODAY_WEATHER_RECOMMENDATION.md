# TASK-070 — Today Weather Recommendation (오늘 날씨에 맞는 추천)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

오늘 상태를 아직 입력하지 않은 날에도 Dashboard가 쓸모 있게 한다. 현재 위치의 **오늘 날씨만으로** 어울리는 음식 2개와 음악 2곡을 추천한다. TASK-069(1단계)에 이은 2단계다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 승인, 2026-10-05)
- 선행: TASK-069(오늘 기록 여부에 따른 Dashboard), TASK-040(날씨 자동 조회), TASK-048(추천 다양화), TASK-055 / TASK-068(추천 평가)
- 실행: `node scripts/orchestrator/run.mjs TASK-070`

## Human 결정 (2026-10-05, Gate B / Gate C — 제품 규칙과 API 추가)

Human: "전날 접속 후 오늘 접속하면 … 기존 정보나 오늘 날씨로 음식이나 활동을 추천한다든지 했으면 해." Claude 세션이 1단계(화면 나누기)와 2단계(오늘 날씨 추천)를 제안했고 Human이 "1단계 → 2단계 모두 진행"을 승인했다.

승인된 범위(Claude 세션 제안):

- 오늘 기록이 없을 때 Dashboard에 "오늘 날씨에 맞는 추천" 영역을 둔다.
- Dashboard를 열자마자 위치 권한을 묻지 않는다. **사용자가 버튼을 눌렀을 때만** 위치와 날씨를 조회한다.
- 기분 정보가 없으므로 **날씨(상황) 기준 추천만** 한다: 음식 2개, 음악 2곡.
- 조회한 날씨와 추천은 **저장하지 않는다**(Check-in 기록이 아니다). Score와 기분은 계산하지 않는다.

## 현재 구조 (Claude 세션 확인)

- `backend/src/main/java/com/moodfit/service/WellnessRulePolicy.java`
  - `determineContext(temperature, weather)`: 5°C 이하는 `COLD`, 30°C 이상은 `HOT`, 그 밖에는 날씨 상태(`CLEAR` / `CLOUDY` / `RAIN` / `SNOW`).
  - `CONTEXT_FOODS` / `CONTEXT_MUSIC`: 상황별 후보 Pool. `MOOD_FOODS` / `MOOD_MUSIC`: 기분별 후보 Pool.
  - `select(mood, context, epochDay, …)`: 기분 3개 + 상황 2개를 Asia/Seoul 날짜(`epochDay`)로 순환해 고르고, 평가(별로예요 건너뜀, 좋아요 앞자리)를 반영한다.
- Check-in 요청의 날씨 검증(`CreateCheckinRequest`): 기온 `-30.0 ~ 50.0`(소수 첫째 자리), 날씨는 `WeatherCondition` Enum.
- `RecommendationFeedbackService`: 사용자별 평가. 체험 계정은 공유(`shared`).
- Frontend
  - `frontend/src/services/weather.ts`의 `fetchLocalWeather(signal)`: 위치 권한 → 좌표를 소수 둘째 자리로 반올림 → Open-Meteo(날씨), BigDataCloud(지역 이름). 실패 시 `WeatherError` / `LocationDeniedError`. 좌표는 저장하지 않고 Backend로 보내지 않는다.
  - `DashboardPage.tsx`(TASK-069 이후): 오늘 기록이 없으면 안내 영역 → 최근 14일 평균 → "마지막 기록 …" 구역.
  - `RecommendationCards.tsx`: 음식 / 음악 Card, 평가 아이콘, 재생 버튼.

## 설계 (실행 기준)

### 1. API

`GET /api/recommendations/today?temperature={기온}&weather={날씨}`

- 로그인 필요(다른 API와 같다. 로그인하지 않으면 401). 읽기 요청이라 CSRF 값은 요구하지 않는다.
- 검증: `temperature`는 `-30.0 ~ 50.0`, 소수 첫째 자리까지. `weather`는 `CLEAR` / `CLOUDY` / `RAIN` / `SNOW`. 둘 다 필수. 틀리면 기존 오류 형식(`400`, `fieldErrors`)으로 답한다.
- 응답(`200`)
  ```json
  {
    "context": { "code": "RAIN", "label": "비" },
    "foods": [ { "name": "…", "tag": "…", "reason": "…" }, { … } ],
    "music": [ { "title": "…", "artist": "…", "tag": "…", "reason": "…", "videoId": "…" }, { … } ]
  }
  ```
  - `context.code`는 `determineContext`의 결과(`COLD` / `HOT` / `CLEAR` / `CLOUDY` / `RAIN` / `SNOW`). `label`은 한국어("추위", "더위", "맑음", "흐림", "비", "눈").
  - `foods` / `music`은 Check-in 응답의 항목과 **같은 형식**이다. 각각 정확히 2개.
- 고르는 규칙: **Check-in이 상황 기준 2개를 고르는 것과 같은 규칙과 같은 코드**를 쓴다(같은 Pool, 같은 날짜 순환, 같은 평가 반영). 같은 날 같은 날씨로 Check-in을 하면 그 Check-in의 상황 기준 2개와 같은 항목이 나와야 한다(평가가 같을 때). 새 규칙을 만들지 않는다.
- 평가 반영: 요청한 사용자의 평가를 쓴다(체험 계정은 공유 평가).
- 난수를 쓰지 않는다. 같은 날 같은 입력, 같은 평가면 같은 결과다.
- **아무것도 저장하지 않는다.** DB 쓰기 없음, Migration 없음.
- 평가 저장(`PUT /api/recommendations/feedback`)의 "현재 추천 후보에 있는 항목만" 검증은 상황 Pool의 항목도 이미 후보에 포함하므로 그대로 동작해야 한다(확인만 한다).
- 계약: `contracts/`에 성공 예시와 검증 오류 예시를 더한다. `docs/05-API_SPEC.md`에 절을 더한다.

### 2. Dashboard

오늘 기록이 **없을 때만**, 안내 영역과 "최근 14일 평균" 아래 · "마지막 기록" 구역 **위**에 **"오늘 날씨에 맞는 추천"** 영역을 둔다. 오늘 기록이 있으면 이 영역을 그리지 않는다(오늘 Check-in의 추천이 이미 날씨를 반영한다).

- 처음 상태: 제목 "오늘 날씨에 맞는 추천", 설명 "현재 위치의 날씨로 어울리는 음식과 음악을 추천합니다. 위치는 날씨 조회에만 쓰고 저장하지 않습니다.", 버튼 **"오늘 날씨로 추천 받기"**. 이때는 위치 권한을 묻지 않고 외부 요청도 하지 않는다.
- 버튼을 누르면
  1. `fetchLocalWeather`로 날씨와 지역을 조회한다(진행 중 "날씨를 조회하고 있습니다…", 버튼 비활성화).
  2. 새 API를 호출한다.
  3. 결과를 보여 준다: 한 줄 요약 "**{지역} · {날씨} · {기온}°C** 기준 추천"(지역이 없으면 "현재 위치"), 그 아래 음식 2개와 음악 2곡. 항목 모양은 `RecommendationCards`의 항목과 같다(Tag, 이유, 평가 아이콘, 음악 재생 버튼, YouTube Link). **Component를 재사용한다.** 복사해서 따로 만들지 않는다.
  4. 결과 아래 보조 글자: "날씨만으로 고른 추천입니다. 오늘 상태를 입력하면 기분까지 반영한 추천 5개를 볼 수 있습니다."
  5. "다시 조회" 버튼(덜 강조).
- 실패
  - 위치 권한 거부 / 위치 조회 실패 / 날씨 조회 실패: `WeatherError`의 문구를 `role="alert"`로 보여 주고, "Check-in 화면에서는 날씨를 직접 입력할 수 있습니다." 안내와 `/check-in` Link를 함께 둔다. 버튼은 다시 누를 수 있다.
  - API 실패: "추천을 불러오지 못했습니다. 다시 시도해 주세요."
- 화면을 벗어나면 진행 중인 조회를 취소한다(`AbortController`).
- 결과는 화면 State에만 둔다(저장소 / Storage에 쓰지 않는다). 새로 고치면 처음 상태로 돌아간다.
- 평가(좋아요 / 별로예요)는 Dashboard의 기존 평가 State를 함께 쓴다(같은 항목이 "마지막 기록"의 추천에도 있으면 눌림 표시가 양쪽에 같이 바뀐다).
- 이 영역의 버튼은 공통 `Button`의 기존 Variant를 쓴다. 화면의 주된 동작은 여전히 안내 영역의 "오늘 상태 입력"이므로 "오늘 날씨로 추천 받기"는 덜 강조되는 Variant로 한다.
- 접근성: 영역은 `section` + `aria-labelledby`. 진행 / 결과 요약은 `aria-live="polite"`. 결과가 나오면 초점을 강제로 옮기지 않는다.
- 390 / 768 / 1280px에서 가로 넘침이 없다. 새 색 / 크기 값을 만들지 않는다.

### 3. 개인정보 / 외부 요청

- 좌표는 지금처럼 Browser에서 Open-Meteo / BigDataCloud로만 간다. Backend로는 **기온과 날씨 상태만** 보낸다(좌표, 지역 이름을 보내지 않는다).
- `docs/25-PRIVACY.md`와 개인정보 처리 안내 화면의 위치 항목에 "Dashboard의 '오늘 날씨로 추천 받기'를 눌렀을 때도 같은 방식으로 조회합니다"를 더한다.

### 4. Smoke

- `scripts/container-smoke.sh`, `scripts/staging-smoke.sh`: 체험 계정으로 새 API를 한 번 호출해 `200`, `foods` 2개 / `music` 2개, `context.code`가 허용된 값인지 **형식만** 확인한다(항목은 날짜와 평가에 따라 달라지므로 값을 비교하지 않는다). 로그인하지 않은 요청이 401인지도 확인한다.

### Test

- Backend
  - 날씨 / 기온별 `context`: 5°C 이하 `COLD`, 30°C 이상 `HOT`, 그 밖은 날씨 상태. 경계값(5.0, 5.1, 29.9, 30.0).
  - 항목 수(각 2개)와 형식. 같은 날 같은 입력이면 같은 결과.
  - **같은 날 같은 날씨의 Check-in이 고른 상황 기준 2개와 같은 항목**이다(평가 없음 / 같은 평가).
  - 평가 반영: 별로예요 항목이 빠지고 좋아요 항목이 앞자리에 온다. 다른 사용자의 평가는 영향을 주지 않는다.
  - 검증 오류(범위 밖 기온, 소수 둘째 자리, 틀린 날씨, 누락) → 400과 `fieldErrors`. 로그인하지 않으면 401.
  - 호출해도 DB에 행이 생기지 않는다.
  - 계약 Test: 응답이 `contracts/` 예시와 같은 형식이다.
- Frontend
  - 오늘 기록이 없을 때 영역과 버튼이 보이고, **버튼을 누르기 전에는 위치 조회와 API 요청이 없다.**
  - 누르면 날씨 조회 → API 호출(`temperature`, `weather`만 Query로) → 요약 줄과 음식 2개 / 음악 2곡. 좌표나 지역 이름이 요청에 없다.
  - 위치 거부 / 날씨 실패 / API 실패 각각의 문구와 다시 시도.
  - 오늘 기록이 있으면 영역이 없다.
  - 평가 버튼을 누르면 저장 요청이 나간다.
  - 날씨 조회는 `fetchLocalWeather`를 Mock한다(`vi.mock`). `fetch` 호출은 주소별로 센다(전체 횟수를 단언하지 않는다).
- jest-dom Matcher를 쓰지 않는다. `getByRole` Option에 `exact`를 쓰지 않는다. 파일 경로는 `resolve(process.cwd(), …)`로 만든다. Test의 타입 오류에 주의한다(`tsc --noEmit`).
- Sandbox에서 Gradle / npm Test / Docker를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

### 문서

- `docs/05-API_SPEC.md`, `contracts/`, `docs/25-PRIVACY.md`, `docs/19-LOCATION-WEATHER.md`(Dashboard에서의 조회), `docs/03-UX_UI_SPEC.md`(Dashboard), `README.md`(Dashboard 설명과 API 표).
- `docs/09-DECISIONS.md`: 새 Decision(다음 번호) — 날씨만으로 추천, 저장하지 않음, 버튼을 눌렀을 때만 조회, Check-in의 상황 추천과 같은 규칙.
- `docs/07-TASKS.md`: TASK-070 행과 절을 `docs/tasks/COMMON.md` "9. `docs/07-TASKS.md` 작성 형식"대로, **`## 5. Human Approval 필요 Task` 앞 번호 순서 자리에** 추가한다(DONE, Milestone 70). Decision은 `docs/09-DECISIONS.md`의 **맨 끝**에 추가한다(문서 앞쪽에 넣지 않는다).
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### 금지

- 오늘 상태(Score, 기분)를 추정하거나 계산해 보여 주는 것
- 조회한 날씨 / 추천을 저장하는 것, DB Migration, Dependency 변경
- 좌표나 지역 이름을 Backend로 보내는 것, Backend가 외부 날씨 API를 호출하는 것
- Dashboard를 열 때 자동으로 위치 권한을 묻는 것
- 추천 규칙 / Pool / 평가 반영 규칙 변경, Check-in 응답 형식 변경
- `infra/`, `.github/`, `frontend/public/` 변경

## Verification

- `bash scripts/verify.sh`
- `bash scripts/container-smoke.sh`
- `bash -n scripts/staging-smoke.sh`
- `git diff --check`

## Claude Review 기준

- API가 Check-in의 상황 추천과 같은 코드 / 규칙을 쓰고 아무것도 저장하지 않는가, 검증과 로그인 요구가 맞는가
- 버튼을 누르기 전에 위치 조회나 외부 요청이 없는가, 좌표 / 지역 이름이 Backend로 가지 않는가
- 오늘 기록이 있을 때 영역이 없는가, 실패 경우마다 다시 시도할 수 있는가
- 추천 항목이 기존 Component를 재사용하고 평가 / 재생이 동작하는가
- Score / 기분을 추정하지 않는가
- Smoke가 형식만 보는가, `docs/07-TASKS.md`와 `docs/09-DECISIONS.md`의 추가 위치와 형식이 맞는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 처음 상태 / 결과 / 위치 거부 / API 실패를 390 / 768 / 1280px로 캡처해 확인하고, Merge 뒤 Staging에서 체험 계정으로 실제 위치의 날씨 추천이 나오는지 확인한다.
