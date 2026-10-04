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
      "name": "연어 샐러드",
      "tag": "에너지 균형",
      "reason": "가볍게 에너지를 유지하기 좋은 메뉴입니다."
    },
    {
      "name": "소고기 채소 비빔밥",
      "tag": "균형 식사",
      "reason": "현재 컨디션에 맞춰 천천히 즐기기 좋은 식사입니다."
    },
    {
      "name": "통밀 닭고기 샌드위치",
      "tag": "일상 메뉴",
      "reason": "일상 식사로 편하게 선택할 수 있는 메뉴입니다."
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
      "title": "Uptown Funk",
      "artist": "Mark Ronson ft. Bruno Mars",
      "tag": "가벼운 활력",
      "reason": "높은 에너지에 어울리는 밝은 흐름입니다.",
      "videoId": "OPf0YbXqDm0"
    },
    {
      "title": "Can't Stop the Feeling!",
      "artist": "Justin Timberlake",
      "tag": "가벼운 활력",
      "reason": "높은 에너지에 어울리는 밝은 흐름입니다.",
      "videoId": "ru0K8uYEZWw"
    },
    {
      "title": "Dynamite",
      "artist": "BTS",
      "tag": "가벼운 활력",
      "reason": "높은 에너지에 어울리는 밝은 흐름입니다.",
      "videoId": "gdZLi9oWNZg"
    },
    {
      "title": "Someone Like You",
      "artist": "Adele",
      "tag": "잔잔한 감성",
      "reason": "비 오는 날의 실내 분위기에 어울립니다.",
      "videoId": "hLQl3WQQoQ0"
    },
    {
      "title": "Wonderwall",
      "artist": "Oasis",
      "tag": "잔잔한 감성",
      "reason": "비 오는 날의 실내 분위기에 어울립니다.",
      "videoId": "bx1Bh8ZvH84"
    }
  ]
}
```

- `wellnessScore`, `mood`, `summary`, `foods`, `music`은 DEC-014 Rule로 생성한다.
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
        "연어 샐러드",
        "소고기 채소 비빔밥",
        "통밀 닭고기 샌드위치",
        "따뜻한 채소 스튜",
        "버섯 칼국수"
      ],
      "musicTitles": [
        "Uptown Funk",
        "Can't Stop the Feeling!",
        "Dynamite",
        "Someone Like You",
        "Wonderwall"
      ]
    }
  ]
}
```

History 화면에 필요한 최소 정보만 반환하는 것을 우선한다.
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
