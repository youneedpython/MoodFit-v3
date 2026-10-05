# 05. MoodFit v3 API Specification

## 1. 목적

Frontend와 Backend가 동일한 Contract를 기준으로 개발하도록 초기 REST API를 정의한다.

이 문서는 구현 전 계약 초안으로 시작했다.
API Contract 변경은 Human Approval 대상이다.

실행 가능한 계약은 Repository Root `contracts/`의 계약 파일이다. (DEC-024)
Backend 실제 응답, Frontend Type, 이 문서의 Response 예시가 계약 파일과 같은지 자동 Test로 확인한다.

| 계약 파일 | 대상 |
|---|---|
| `contracts/checkin-create-201.json` | 4절 Check-in 생성 Response |
| `contracts/checkin-latest-200.json` | 5절 최신 조회 Response (4절과 동일) |
| `contracts/checkin-latest-404.json` | 5절 기록 없음 |
| `contracts/checkin-history-200.json` | 6절 History 조회 Response |
| `contracts/checkin-create-400.json` | 8절 Error Response |

`id`는 DB가 정하므로 계약 비교에서 숫자인지만 확인한다.

---

## 2. 공통 규칙

- Base Path: `/api`
- Content-Type: `application/json`
- 날짜/시간: Backend 기준 타입은 `Instant`, API 전달 형식은 ISO-8601
- Validation Error는 4xx 응답
- Server Error는 5xx 응답
- Frontend는 HTTP Status를 무시하지 않는다.

---

## 3. Enum 초안

### Weather

```text
CLEAR
CLOUDY
RAIN
SNOW
```

### Mood

| code | label |
|---|---|
| TIRED | 피곤함 |
| ENERGETIC | 활기 있음 |
| CALM | 차분함 |
| BALANCED | 균형 있음 |

Mood 판정 규칙은 `docs/09-DECISIONS.md` DEC-014를 따른다.

TASK-056 / DEC-043부터 신체 긴장도 `HIGH`일 때 ENERGETIC은 BALANCED로 조정한다. Score 공식은 그대로다. 긴장도 Code는 HIGH / NORMAL / STABLE이며 기존 기록이나 표본 부족이면 null이다.

---

## 4. Check-in 생성

### Endpoint

```http
POST /api/check-ins
```

### Request

```json
{
  "heartRate": 68,
  "respiratoryRate": 18,
  "sleepScore": 86,
  "stressLevel": 31,
  "energyLevel": 74,
  "temperature": 19.0,
  "weather": "RAIN"
}
```

### Validation 초안

| Field | 기준 |
|---|---|
| heartRate | 40 ~ 180 |
| respiratoryRate | 8 ~ 40 |
| sleepScore | 0 ~ 100 |
| stressLevel | 0 ~ 100 |
| energyLevel | 0 ~ 100 |
| temperature | -30.0 ~ 50.0, 소수 첫째 자리까지 허용 |
| weather | 필수 Enum |
| region | 선택 문자열 / null / 생략 가능. 앞뒤 공백 제거 후 1 ~ 80자, 빈 값은 null, 제어 문자(줄바꿈 포함) 또는 80자 초과는 400 |

Temperature 범위와 정밀도는 TASK-006 Persistence Gate C Human Approval에 따라 확정되었으며,
`temperature`는 API에서 소수 첫째 자리까지만 허용한다.

### Response — 201 Created

```json
{
  "id": 101,
  "recordedAt": "2026-09-28T03:00:00Z",
  "mood": {
    "code": "ENERGETIC",
    "label": "활기 있음"
  },
  "wellnessScore": 76,
  "summary": "현재 입력 기준으로 에너지 수준은 비교적 높고, 스트레스 부담은 크지 않은 편입니다. 비가 오는 날씨에는 차분한 실내 활동과 부담이 적은 식사가 어울립니다.",
  "metrics": {
    "heartRate": 68,
    "respiratoryRate": 18,
    "sleepScore": 86,
    "stressLevel": 31,
    "energyLevel": 74
  },
  "weather": {
    "temperature": 19.0,
    "condition": "RAIN",
    "region": null
  },
  "foods": [
    {
      "name": "새우 볶음밥",
      "tag": "일상 메뉴",
      "reason": "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."
    },
    {
      "name": "불고기 정식",
      "tag": "일상 메뉴",
      "reason": "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."
    },
    {
      "name": "콩나물 비빔밥",
      "tag": "일상 메뉴",
      "reason": "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."
    },
    {
      "name": "따뜻한 채소 스튜",
      "tag": "따뜻한 메뉴",
      "reason": "비 오는 날씨에 어울리는 따뜻한 메뉴입니다."
    },
    {
      "name": "버섯 칼국수",
      "tag": "날씨 맞춤",
      "reason": "오늘의 날씨에 어울리는 식사로 제안합니다."
    }
  ],
  "music": [
    {
      "title": "Dynamite",
      "artist": "BTS",
      "tag": "가벼운 활력",
      "reason": "높은 에너지에 어울리는 밝은 흐름입니다.",
      "videoId": "gdZLi9oWNZg"
    },
    {
      "title": "Viva La Vida",
      "artist": "Coldplay",
      "tag": "가벼운 활력",
      "reason": "높은 에너지에 어울리는 밝은 흐름입니다.",
      "videoId": "dvgZkm1xWPE"
    },
    {
      "title": "Shape of You",
      "artist": "Ed Sheeran",
      "tag": "가벼운 활력",
      "reason": "높은 에너지에 어울리는 밝은 흐름입니다.",
      "videoId": "JGwWNGJdvx8"
    },
    {
      "title": "Someone You Loved",
      "artist": "Lewis Capaldi",
      "tag": "잔잔한 감성",
      "reason": "비 오는 날의 실내 분위기에 어울립니다.",
      "videoId": "zABLecsR5UE"
    },
    {
      "title": "밤편지",
      "artist": "IU",
      "tag": "잔잔한 감성",
      "reason": "비 오는 날의 실내 분위기에 어울립니다.",
      "videoId": "BzYnNdJhZQw"
    }
  ],
  "baseline": {
    "available": false,
    "sampleCount": 0,
    "tension": null,
    "averages": null,
    "deltas": null
  }
}
```

- `wellnessScore`, `mood`, `summary`, `foods`, `music`은 DEC-014 Rule로 생성한다.
- `baseline`은 저장 시점의 비교 결과다. `available`은 boolean, `sampleCount`는 0 이상 정수, `tension`은 HIGH / NORMAL / STABLE 또는 null이다. `averages` / `deltas`는 없으면 null, 있으면 heartRate / respiratoryRate / sleepScore / stressLevel / energyLevel 다섯 숫자다. 평균과 차이는 소수 첫째 자리이며 표본 부족이면 available false / sampleCount 0 / 나머지 null이다. [Baseline 있음 계약 예시](../contracts/checkin-baseline-201.json)를 Backend Test로 확인한다. 계산 / 조정 기준은 [개인별 Baseline](26-PERSONAL-BASELINE.md)을 따른다.
- 생성 / 최신 응답의 `weather.region`과 이력 항목의 `region`은 저장 당시 지역 이름 또는 null이다. 좌표는 요청에 포함하거나 저장하지 않는다. 지역 없는 기존 요청과 기록을 지원한다.
- `foods`, `music`은 새 기록에서 각각 5개이며, Mood 기반 3개 다음에 Weather / Temperature Context 기반 2개가 온다. 기존 2개짜리 기록은 그대로 반환한다.
- 음악의 `videoId`는 선택적 문자열(기존 기록은 null 또는 생략 가능)이며 새 추천에서는 승인된 YouTube 영상 ID 11자를 반환한다. History는 기존 이름 / 제목 목록 형식을 유지한다.

---

## 5. 최신 Check-in 조회

### Endpoint

```http
GET /api/check-ins/latest
```

### Response — 200 OK

`POST /api/check-ins`의 Response와 동일한 상세 구조를 사용한다.

### 기록 없음

저장된 Check-in이 존재하지 않는 경우 다음을 반환한다.

```http
404 Not Found
```

Error Code:

```text
CHECKIN_NOT_FOUND
```

Response 예시:

```json
{
  "code": "CHECKIN_NOT_FOUND",
  "message": "Latest check-in was not found.",
  "fieldErrors": {}
}
```

Frontend는 이를 일반 Error 화면이 아니라 Dashboard Empty State로 처리한다.

---

## 6. History 조회

### Endpoint

```http
GET /api/check-ins/history?days=7
```

### Query Parameter

| 이름 | 설명 | 기본값 | 허용 범위 |
|---|---|---|---|
| days | 조회 기간(일) | 7 | 1 ~ 30 (정수) |

조회 기간은 최소 1일, 최대 30일로 제한한다.
다음 값은 `400 Bad Request` / `VALIDATION_ERROR`로 처리한다.

- 1 미만의 값 (예: `0`, `-5`)
- 30을 초과하는 값 (예: `31`)
- 정수가 아닌 값 (예: `abc`)

### Response — 200 OK

```json
{
  "days": 7,
  "items": [
    {
      "id": 101,
      "recordedAt": "2026-09-28T03:00:00Z",
      "mood": {
        "code": "ENERGETIC",
        "label": "활기 있음"
      },
      "wellnessScore": 76,
      "heartRate": 68,
      "respiratoryRate": 18,
      "sleepScore": 86,
      "stressLevel": 31,
      "energyLevel": 74,
      "temperature": 19.0,
      "weather": "RAIN",
      "region": null,
      "foodNames": [
        "새우 볶음밥",
        "불고기 정식",
        "콩나물 비빔밥",
        "따뜻한 채소 스튜",
        "버섯 칼국수"
      ],
      "musicTitles": [
        "Dynamite",
        "Viva La Vida",
        "Shape of You",
        "Someone You Loved",
        "밤편지"
      ],
      "tension": null
    }
  ]
}
```

History 화면에 필요한 최소 정보만 반환하는 것을 우선한다.
각 항목의 `tension`은 저장된 HIGH / NORMAL / STABLE 또는 null이며 이후 평균 변화로 바뀌지 않는다.
추천 이력 요약을 위해 각 항목은 추천 이름만 포함한다. (DEC-020)

- `foodNames`: 추천 음식 이름 목록 (Mood 3개, Context 2개 순서; 기존 기록은 저장된 순서)
- `musicTitles`: 추천 음악 제목 목록 (Mood 3개, Context 2개 순서; 기존 기록은 저장된 순서)

추천의 Tag / 이유 / Artist 등 상세 정보는 최신 조회(`GET /api/check-ins/latest`)에서 제공한다.
History 응답은 최근 `days × 24시간` Rolling Window를 기준으로 하며,
`recordedAt` 오름차순으로 오래된 기록에서 최신 기록 순서로 반환한다.

---

## 7. 추천 새로고침

Recommendation Refresh 기능은 Core MVP에서 제외한다.
초기 MVP에서는 Check-in 생성 시 분석 결과와 Recommendation을 함께 생성하고 저장한다.

다음 API는 Core MVP에서 구현하지 않는다.

```http
POST /api/check-ins/{id}/recommendations/refresh
```

Recommendation Refresh는 Core MVP 완료 이후 Post-MVP Task에서 다시 검토한다.

---

## 8. Error Response

형식 (예: `heartRate`가 `200`인 Check-in 생성 요청):

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "fieldErrors": {
    "heartRate": "must be less than or equal to 180"
  }
}
```

- `message`와 `fieldErrors`의 값은 Backend 기본 메시지(영어)이다.
- Frontend는 `fieldErrors`의 필드 이름을 기준으로 화면의 한국어 안내를 표시하며, 메시지 문구에 의존하지 않는다.
- TASK-017 이전 초안의 한국어 메시지 예시는 실제 동작과 달라 계약 파일 기준으로 정정했다. (DEC-024)

Error Response 형식은 Frontend Error UX와 함께 유지한다.

요청 형식 오류(JSON 문법 오류, 없는 enum 값, 타입 오류)도 `VALIDATION_ERROR` 형식으로 응답한다.

---

## 9. API 구현 원칙

### TASK-042 인증 Contract (Human Approved 2026-10-04)

Check-in 저장 / 최신 / 이력은 인증된 사용자만 접근하며 본인 기록만 응답한다. 기존 성공 응답 형식은 유지한다. 미인증 조회는 401 `UNAUTHENTICATED`, CSRF / 권한 실패는 403 `FORBIDDEN`이며 기존 `ErrorResponse` JSON 형식이다.

| Method | 경로 | 응답 |
|---|---|---|
| GET | `/api/auth/me` | 200: `authenticated`, `user`(미인증 null), `providers`(설정된 제공자만), `guestEnabled`; CSRF Cookie 발급 |
| GET | `/api/auth/login/{provider}` | 제공자 화면으로 302, 미설정 404 |
| GET | `/api/auth/callback/{provider}` | 공개 주소 `/`로 302, 실패는 `/login?error=oauth`로 302 |
| POST | `/api/auth/guest` | 공유 체험 Session 시작 204, 비활성 404 |
| POST | `/api/auth/logout` | Session 종료 204 |

사용자 필드는 `id`, `displayName`, `provider`이며 제공자는 `google`, `kakao`, `guest`다. 상태 변경 요청은 `XSRF-TOKEN` Cookie 값을 `X-XSRF-TOKEN` Header로 전달한다. Session Cookie는 HttpOnly / SameSite Lax이며 HTTPS에서 Secure다.

예시는 [익명](../contracts/auth-me-anonymous-200.json), [체험](../contracts/auth-me-guest-200.json), [401](../contracts/checkin-401.json), [403](../contracts/auth-403.json), [Endpoint](../contracts/auth-api.json)을 따른다. 상세 설정은 [22-AUTH.md](22-AUTH.md)를 참고한다.

- Controller에 분석 규칙을 직접 작성하지 않는다.
- Request / Response DTO를 Entity와 분리한다.
- Validation을 명시한다.
- Frontend가 DB Entity 구조에 의존하지 않게 한다.
- API Contract 변경 시 `03-UX_UI_SPEC.md`와 Frontend Type도 함께 검토한다.
- 실제 의료 진단으로 오해될 수 있는 표현을 API 문구에 사용하지 않는다.


---

## 10. Wellness Rule 결정 상태

다음 항목은 TASK-005 Gate B Human Review를 통해 승인되었으며,
현재 Source of Truth는 `docs/09-DECISIONS.md`의 DEC-014이다.

- Wellness Score 계산식
- Mood 판정 기준
- 입력 Metric의 가중치
- Weather 영향 규칙
- Food Recommendation Rule
- Music Recommendation Rule

TASK-006 Backend Domain / API Core 구현 시 위 결정은 DEC-014를 따른다.
추가 API Contract 또는 DB Schema 변경이 필요하면 별도 Human Approval을 받는다.

## 11. LLM Insight API (TASK-045, DEC-037)

모든 경로는 기존 세션 로그인을 요구한다. POST는 기존 CSRF 정책을 적용한다. Check-in의 생성 / 최신 / 이력 응답은 변경하지 않는다.

| Method / 경로 | 동작 | 응답 |
|---|---|---|
| GET /api/check-ins/{id}/insight | 본인 기록의 저장된 코멘트 조회 | 200 Insight |
| POST /api/check-ins/{id}/insight | 없으면 생성·저장, 있으면 재호출 없이 반환 | 200 Insight, 생성 실패의 text는 null |
| GET /api/reports/weekly | 본인의 가장 최근 저장된 리포트 | 200 WeeklyReport |
| POST /api/reports/weekly | 오늘 포함 최근 7일의 최신 30건으로 생성·저장 | 200 WeeklyReport, 기록 부족 422 |

Insight 필드는 enabled(boolean), available(boolean), text(string 또는 null), generatedAt(ISO 8601 UTC 또는 null)이다. WeeklyReport에는 periodStart / periodEnd(서울 달력 날짜 YYYY-MM-DD 또는 null), recordCount(정수)를 추가한다. 저장된 리포트가 없으면 기간과 생성 시각은 null, 기록 수는 0이다. 생성 실패 리포트의 기간과 기록 수는 시도한 자료를 나타내며 이전 리포트는 DB에 유지한다.

enabled는 기능 설정 값이며 available은 기능 켜짐 + Google/Kakao 사용자 여부다. 한도 잔여량은 available에 반영하지 않고 POST에서 429로 판정한다. GET은 체험 계정과 꺼진 기능에도 200이며 available false다. 소유권은 꺼진 기능에서도 먼저 검사하고 다른 사용자 기록은 404 CHECKIN_NOT_FOUND다. 모델 ID / Region / Role은 응답에 넣지 않는다.

| 오류 | 고정 Code | 의미 |
|---|---|---|
| 403 | LLM_UNAVAILABLE | 기능 꺼짐 또는 체험 계정의 생성 요청 |
| 422 | LLM_INSUFFICIENT_RECORDS | 주간 기록 3건 미만, 외부 호출과 한도 소비 없음 |
| 429 | LLM_DAILY_LIMIT | 서울 날짜 기준 사용자당 시도 한도 초과 |

ErrorResponse는 기존 code / message / fieldErrors 형식을 사용한다. 인증 없음과 CSRF 실패는 기존 UNAUTHENTICATED / FORBIDDEN을 유지한다.

공유 예시: [꺼진 코멘트](../contracts/insight-disabled-200.json), [생성 코멘트](../contracts/insight-generated-200.json), [꺼진 주간 리포트](../contracts/weekly-disabled-200.json), [생성 리포트](../contracts/weekly-generated-200.json), [사용 불가](../contracts/insight-unavailable-403.json), [한도](../contracts/insight-limit-429.json), [기록 부족](../contracts/weekly-insufficient-422.json). 보내는 자료와 실패·비용 정책은 [23-LLM-INSIGHT.md](23-LLM-INSIGHT.md)를 따른다.

## 12. 계정과 기록 삭제 (TASK-054, DEC-041)

`DELETE /api/auth/account` — 로그인과 CSRF 필요, Request Body 없음.

소셜 사용자의 체크인 / 음식·음악 추천 / AI 코멘트 / 주간 리포트 / 생성 시도 / 사용자 행을 자식 → 부모 순서로 한 트랜잭션에서 삭제하고 해당 계정 세션을 종료한다. 다른 사용자와 공유 체험 계정의 데이터는 삭제하지 않는다. 다시 같은 제공자 계정으로 로그인하면 새 사용자 번호로 만들어진다.

### Response — 204 No Content

응답 본문 없음. 다음은 전송 본문이 아닌 [204 계약 예시](../contracts/account-delete-204.json)의 검증 메타데이터다.

```json
{"method":"DELETE","path":"/api/auth/account","status":204,"body":null}
```

### 체험 계정 — 403 Forbidden

```json
{"code":"GUEST_ACCOUNT_DELETION_FORBIDDEN","message":"체험 계정은 삭제할 수 없습니다.","fieldErrors":{}}
```

미로그인은 401 UNAUTHENTICATED, CSRF 누락 / 불일치는 403 FORBIDDEN으로 기존 ErrorResponse 계약을 유지한다. CSRF 필터가 인증보다 먼저 실행되므로 미로그인 요청이라도 CSRF가 없으면 403을 반환한다. 삭제 확인 화면과 [개인정보 처리 안내](25-PRIVACY.md)는 되돌릴 수 없으며 백업에 최대 14일 데이터가 남을 수 있다는 점을 안내한다. [체험 오류 예시](../contracts/account-delete-guest-403.json).

## 추천 평가 (TASK-055 / TASK-068, DEC-042 / DEC-046)

로그인 사용자 본인의 항목별 평가를 읽고 쓴다. 체험 계정의 평가는 모든 방문자가 함께 쓰며 다음 Check-in에 같은 규칙으로 반영된다. 기존 Check-in 응답과 저장된 추천은 바꾸지 않는다.

| Method / 경로 | 응답 |
|---|---|
| GET `/api/recommendations/feedback` | 200, 평가 가능 여부(enabled), 공유 여부(shared)와 본인 목록(items) |
| PUT `/api/recommendations/feedback` | 저장 / 교체 / 삭제 성공 204, 본문 없음 |

GET 예시([계약](../contracts/recommendation-feedback-200.json)):

```json
{"enabled":true,"shared":false,"items":[{"kind":"FOOD","item":"연어 샐러드","rating":"LIKE"}]}
```

PUT 요청([계약](../contracts/recommendation-feedback-put-204.json)):

```json
{"kind":"FOOD","item":"연어 샐러드","rating":"LIKE"}
```

kind는 FOOD / MUSIC, rating은 LIKE / DISLIKE / null이다. null이면 해당 평가를 삭제한다. item은 앞뒤 공백 제거 후 1~120자, 제어 문자 없이 현재 해당 종류의 추천 Pool에 존재해야 한다. 음식은 이름, 음악은 videoId를 보낸다. 검증 실패는 400 VALIDATION_ERROR다. 목록은 종류 / 항목 순으로 반환한다.

체험 GET은 `enabled: true`, `shared: true`와 공유 계정에 저장된 목록을 반환한다. 평가가 없는 예시는 `{"enabled":true,"shared":true,"items":[]}`이다([GET 계약](../contracts/recommendation-feedback-guest-200.json)). 소셜 사용자는 `shared: false`이며 Frontend는 shared가 없는 이전 응답도 false로 처리한다. 체험 PUT도 저장 / 변경 / 삭제 성공 시 204다. 사용자 행 잠금과 사용자별 격리를 유지한다. 체험 계정 삭제는 여전히 403이며 방문자는 평가 버튼으로 개별 평가만 변경 / 삭제할 수 있다. 미로그인 GET / 유효 CSRF의 PUT은 401, CSRF 누락 / 불일치 PUT은 403이다. 기존 Session / CSRF 설정을 유지한다.
