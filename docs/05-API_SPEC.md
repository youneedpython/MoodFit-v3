# 05. MoodFit v3 API Specification

## 1. 목적

Frontend와 Backend가 동일한 Contract를 기준으로 개발하도록 초기 REST API를 정의한다.

이 문서는 구현 전 계약 초안이다.
API Contract 변경은 Human Approval 대상이다.

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
| temperature | -30 ~ 50 |
| weather | 필수 Enum |

범위 값은 교육용 초기 기준이며 구현 계획 단계에서 최종 검토한다.

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
    "condition": "RAIN"
  },
  "foods": [
    {
      "name": "연어 샐러드",
      "tag": "에너지 균형",
      "reason": "가볍게 에너지를 유지하기 좋은 메뉴입니다."
    },
    {
      "name": "따뜻한 채소 스튜",
      "tag": "따뜻한 메뉴",
      "reason": "비 오는 날씨에 어울리는 따뜻한 메뉴입니다."
    }
  ],
  "music": [
    {
      "title": "Light Motion Playlist",
      "artist": "MoodFit Curated",
      "tag": "가벼운 활력",
      "reason": "높은 에너지에 어울리는 밝은 흐름입니다."
    },
    {
      "title": "Rainy Indoor Playlist",
      "artist": "MoodFit Curated",
      "tag": "잔잔한 감성",
      "reason": "비 오는 날의 실내 분위기에 어울립니다."
    }
  ]
}
```

- `wellnessScore`, `mood`, `summary`, `foods`, `music`은 DEC-014 Rule로 생성한다.
- `foods`, `music`은 각각 항상 2개이며, 첫 번째는 Mood 기반 Item, 두 번째는 Weather / Temperature Context 기반 Item이다.

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

예상 Error Code:

```text
CHECKIN_NOT_FOUND
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
      "weather": "RAIN"
    }
  ]
}
```

History 화면에 필요한 최소 정보만 반환하는 것을 우선한다.
상세 Recommendation은 최신 또는 상세 조회에서 처리한다.

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

## 8. Error Response 초안

예상 형식:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "입력값을 확인해 주세요.",
  "fieldErrors": {
    "heartRate": "40 이상 180 이하로 입력해 주세요."
  }
}
```

Error Response 형식은 Frontend Error UX와 함께 유지한다.

요청 형식 오류(JSON 문법 오류, 없는 enum 값, 타입 오류)도 `VALIDATION_ERROR` 형식으로 응답한다.

---

## 9. API 구현 원칙

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
