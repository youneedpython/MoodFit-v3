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

초기 예시:

```text
CALM
ENERGETIC
TIRED
BALANCED
```

최종 Mood 규칙은 Analysis Service 구현 전에 확정한다.

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
    "code": "CALM",
    "label": "평온함"
  },
  "wellnessScore": 78,
  "summary": "현재 신체 리듬은 비교적 안정적이며 차분한 활동이 잘 맞는 상태입니다.",
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
      "reason": "현재의 안정적인 리듬을 유지하기 위한 가벼운 식사로 추천합니다."
    }
  ],
  "music": [
    {
      "title": "Rainy Morning",
      "artist": "Cloud Echo",
      "tag": "잔잔한 감성",
      "reason": "차분한 현재 상태와 비 오는 날의 분위기에 어울리는 음악입니다."
    }
  ]
}
```

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

| 이름 | 설명 | 기본값 |
|---|---|---|
| days | 조회 기간(일) | 7 |

최대 조회 기간은 30일로 제한한다.
30일을 초과하는 값은 Validation Error로 처리한다.

### Response — 200 OK

```json
{
  "days": 7,
  "items": [
    {
      "id": 101,
      "recordedAt": "2026-09-28T03:00:00Z",
      "mood": {
        "code": "CALM",
        "label": "평온함"
      },
      "wellnessScore": 78,
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

---

## 9. API 구현 원칙

- Controller에 분석 규칙을 직접 작성하지 않는다.
- Request / Response DTO를 Entity와 분리한다.
- Validation을 명시한다.
- Frontend가 DB Entity 구조에 의존하지 않게 한다.
- API Contract 변경 시 `03-UX_UI_SPEC.md`와 Frontend Type도 함께 검토한다.
- 실제 의료 진단으로 오해될 수 있는 표현을 API 문구에 사용하지 않는다.


---

## 10. PLAN 단계에서 확정할 API 관련 결정

다음 항목은 아직 승인되지 않았으며 Codex가 구현 전에 대안을 제안해야 한다.

- Wellness Score 계산식
- Mood 판정 기준
- 입력 Metric의 가중치
- Weather 영향 규칙
- Food Recommendation Rule
- Music Recommendation Rule

위 결정이 API Contract 또는 DB Schema에 영향을 주면 Human Approval 후 `09-DECISIONS.md`에 기록한다.
