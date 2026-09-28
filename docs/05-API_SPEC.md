# 05. MoodFit v3 API Specification

## 1. 목적

Frontend와 Backend가 동일한 Contract를 기준으로 개발하도록 초기 REST API를 정의한다.

이 문서는 구현 전 계약 초안이다.
API Contract 변경은 Human Approval 대상이다.

---

## 2. 공통 규칙

- Base Path: `/api`
- Content-Type: `application/json`
- 날짜/시간: ISO-8601 형식
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
  "recordedAt": "2026-09-28T12:00:00+09:00",
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

초기 정책은 다음 중 하나로 구현 계획에서 확정한다.

- `404 Not Found`
- `204 No Content`

Codex가 임의로 확정하지 않고 PLAN 단계에서 제안한다.

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

초기 MVP에서는 최대 조회 범위를 제한한다.
정확한 최대값은 구현 계획에서 확정한다.

### Response — 200 OK

```json
{
  "days": 7,
  "items": [
    {
      "id": 101,
      "recordedAt": "2026-09-28T12:00:00+09:00",
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

v1에서 시각적으로만 존재했던 `추천 새로고침` 동작을 v3에서는 실제 기능으로 연결한다.

초기 API 초안:

```http
POST /api/check-ins/{id}/recommendations/refresh
```

### 목적

기존 Check-in 입력값은 유지하면서 추천 후보를 다시 생성한다.

### Response

최신 Recommendation과 함께 상세 Check-in Response를 반환하는 방식을 우선 검토한다.

정확한 구현 방식은 `06-PLAN.md`에서 복잡도와 필요성을 검토한 뒤 확정한다.

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

- 최신 Check-in이 없을 때 `404`와 `204` 중 어떤 응답을 사용할지
- History `days`의 최대 허용값
- Recommendation을 별도 Entity/Table로 분리할지 여부
- 추천 새로고침 시 기존 추천을 교체할지, 이력을 남길지
- 날짜/시간 저장 기준을 `Instant`, `OffsetDateTime` 등 어떤 방식으로 통일할지

위 결정이 API Contract 또는 DB Schema에 영향을 주면 Human Approval 후 `09-DECISIONS.md`에 기록한다.
