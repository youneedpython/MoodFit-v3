# 10. Wellness Rule Proposal

Status:

```text
Gate B Human Approved (2026-09-30) — 16절 확정 Rule을 DEC-014에 반영
```

이 문서는 Source of Truth가 아니다.
Human Review를 위한 Proposal이며, 승인된 최종 Rule은 `docs/09-DECISIONS.md` DEC-014를 Source of Truth로 사용한다.

> **Gate B Human Review 결과 (2026-09-30)**
>
> - §15 Codex 추천 조합은 Human이 그대로 승인했다.
> - Human Review에서 발견된 Rule 정의 누락 6건을 Claude가 보완했다. 보완 결과는 **§16 확정 Rule**에 정리했다.
> - §3 ~ §13은 후보 검토 이력이다. §16과 다른 부분은 §16이 우선한다.

MoodFit v3는 의료 진단 서비스가 아니라 일상적인 Wellness 상태 확인과 추천 경험을 제공하는 교육용 서비스이다.
따라서 아래 threshold와 rule은 의학적 정상/비정상 기준이 아니라 **MoodFit 교육용 Product Heuristic**이다.

---

## 1. 목적

TASK-006 Backend Domain / API Core 구현 전에 다음 항목의 후보를 제안한다.

- Wellness Score 계산식
- Mood 판정 기준
- Metric 가중치
- Heart Rate / Respiratory Rate 처리
- Weather 영향
- Temperature 영향
- Summary Rule
- Food Recommendation Rule
- Music Recommendation Rule
- Deterministic Recommendation 정책
- Boundary / Edge Case 처리

Human Decision 결과는 각 절과 §14, §16에 기록했다.

---

## 2. 입력과 출력

### 입력

```text
heartRate          40 ~ 180
respiratoryRate    8 ~ 40
sleepScore         0 ~ 100
stressLevel        0 ~ 100
energyLevel        0 ~ 100
temperature       -30 ~ 50
weather            CLEAR / CLOUDY / RAIN / SNOW
```

### 출력

- `wellnessScore`: 0 ~ 100
- `mood`: `CALM`, `ENERGETIC`, `TIRED`, `BALANCED`
- `summary`
- `foods`
- `music`

---

## 3. Wellness Score Option

### 공통 전처리

`stressLevel`은 값이 높을수록 부담이 큰 입력이므로 Score 계산에는 다음 변환값을 사용한다.

```text
stressScore = 100 - stressLevel
```

최종 Score는 반올림한 정수로 제안한다.

### Option A — Self-reported Metric 중심

계산식:

```text
wellnessScore =
  sleepScore   * 0.35
+ stressScore  * 0.35
+ energyLevel  * 0.30
```

Weight:

| Metric | Weight | 역할 |
|---|---:|---|
| sleepScore | 35% | 회복감 |
| stressScore | 35% | 부담 완화 정도 |
| energyLevel | 30% | 활동 여력 |
| heartRate | 0% | Summary / Dashboard 보조 정보 |
| respiratoryRate | 0% | Summary / Dashboard 보조 정보 |
| weather | 0% | Recommendation / Summary Context |
| temperature | 0% | Recommendation / Summary Context |

장점:

- 의료적 오해 가능성이 가장 낮다.
- 사용자가 직접 평가한 컨디션 중심이라 교육용 제품에 적합하다.
- 구현과 테스트가 단순하다.
- Heart Rate / Respiratory Rate의 의학적 해석을 피할 수 있다.

단점:

- 신체 리듬 입력이 Score에 직접 반영되지 않아 사용자가 덜 풍부하게 느낄 수 있다.
- Dashboard의 5개 Metric 중 2개가 Score 계산에서는 보조 정보가 된다.

테스트 용이성:

- 매우 높음.
- 세 입력의 가중합만 검증하면 된다.

의료 오해 가능성:

- 낮음.
- Score가 사용자의 자기 보고 기반 컨디션 점수임을 명확히 표현할 수 있다.

구현 복잡도:

- 낮음.

### Option B — 모든 Metric 사용, Heart / Respiratory는 낮은 Weight

계산식:

```text
heartComfortScore =
  clamp(100 - abs(heartRate - 70) * 2, 0, 100)

respiratoryComfortScore =
  clamp(100 - abs(respiratoryRate - 16) * 5, 0, 100)

wellnessScore =
  sleepScore              * 0.30
+ stressScore             * 0.30
+ energyLevel             * 0.25
+ heartComfortScore       * 0.075
+ respiratoryComfortScore * 0.075
```

`70`, `16`, 배율 `2`, `5`는 의료 기준이 아니라 MoodFit 교육용 Product Heuristic이다.

Weight:

| Metric | Weight | 역할 |
|---|---:|---|
| sleepScore | 30% | 회복감 |
| stressScore | 30% | 부담 완화 정도 |
| energyLevel | 25% | 활동 여력 |
| heartComfortScore | 7.5% | 신체 리듬 보조 |
| respiratoryComfortScore | 7.5% | 신체 리듬 보조 |
| weather | 0% | Recommendation / Summary Context |
| temperature | 0% | Recommendation / Summary Context |

장점:

- 5개 Dashboard Metric이 모두 Score에 반영된다.
- Body rhythm 기반 제품이라는 느낌이 더 분명하다.
- Heart / Respiratory 영향이 낮아 과도한 판정을 피한다.

단점:

- Heart / Respiratory 기준점이 의료 기준으로 오해될 수 있다.
- 설명과 문구 관리가 더 중요하다.
- Option A보다 테스트 케이스가 많다.

테스트 용이성:

- 높음.
- `heartComfortScore`, `respiratoryComfortScore`, 최종 가중합을 분리 테스트할 수 있다.

의료 오해 가능성:

- 중간.
- 반드시 "교육용 컨디션 heuristic"으로 명시해야 한다.

구현 복잡도:

- 중간.

### Codex 추천안

Option A를 추천한다.

이유:

- MoodFit v3가 의료 진단 서비스가 아니기 때문이다.
- DEC-014 승인 전 Rule을 단순하고 테스트 가능하게 유지할 수 있다.
- Heart Rate / Respiratory Rate는 Dashboard와 Summary에서 보조 Context로 활용해도 제품 경험이 충분하다.

Human Decision:

```text
Approved (2026-09-30) — 확정 내용은 §16을 따른다.
```

---

## 4. Mood Rule Option

API Spec의 Mood 후보만 사용한다.

```text
CALM
ENERGETIC
TIRED
BALANCED
```

새 Mood Code는 추가하지 않는다.

### Option M1 — Score 중심 판정

| Mood | 조건 |
|---|---|
| ENERGETIC | `wellnessScore >= 80` |
| CALM | `65 <= wellnessScore < 80` |
| BALANCED | `45 <= wellnessScore < 65` |
| TIRED | `wellnessScore < 45` |

장점:

- 단순하다.
- 테스트가 쉽다.

단점:

- 같은 Score라도 Metric 조합이 다르면 상태 해석이 달라질 수 있는데 이를 반영하지 못한다.
- 높은 Energy와 높은 Stress처럼 혼합된 상태를 표현하기 어렵다.

### Option M2 — Energy / Stress / Sleep 조합 판정

우선순위:

1. `TIRED`
2. `ENERGETIC`
3. `CALM`
4. `BALANCED`

| Mood | code | label | 판정 조건 |
|---|---|---|---|
| 피곤함 | TIRED | 피곤함 | `energyLevel <= 35` 또는 `sleepScore <= 35` |
| 활기 있음 | ENERGETIC | 활기 있음 | `energyLevel >= 70` 그리고 `stressLevel <= 45` 그리고 `sleepScore >= 60` |
| 차분함 | CALM | 차분함 | `stressLevel <= 35` 그리고 `wellnessScore >= 65` |
| 균형 있음 | BALANCED | 균형 있음 | 위 조건에 해당하지 않는 기본 상태 |

동률 / 충돌 처리:

- 낮은 Energy 또는 낮은 Sleep은 사용자가 즉시 체감하기 쉬우므로 `TIRED`를 최우선으로 둔다.
- Energy가 높지만 Stress도 높은 경우 `ENERGETIC`으로 보지 않고 `BALANCED`로 둔다.
- Stress가 낮고 Score가 높은 경우 `CALM`으로 둔다.
- 어느 쪽도 뚜렷하지 않은 혼합 상태는 `BALANCED`로 둔다.

경계값:

- `energyLevel = 35`는 `TIRED`
- `sleepScore = 35`는 `TIRED`
- `energyLevel = 70`, `stressLevel = 45`, `sleepScore = 60`은 `ENERGETIC`
- `stressLevel = 35`, `wellnessScore = 65`는 `CALM`

장점:

- Score만으로 설명하기 어려운 상태를 더 자연스럽게 표현한다.
- Summary와 Recommendation 이유를 만들기 쉽다.

단점:

- Option M1보다 조건과 테스트가 많다.

Codex 추천안:

Option M2를 추천한다.

Human Decision:

```text
Approved (2026-09-30) — 확정 내용은 §16을 따른다.
```

---

## 5. Weather Rule 후보

Weather는 다음에 직접 반영하지 않는 것을 우선 제안한다.

- Wellness Score
- Mood

Weather는 다음 Context에 사용한다.

- Summary
- Food Recommendation
- Music Recommendation

이유:

- 날씨만으로 사용자의 건강 상태가 좋아지거나 나빠진다고 단정하지 않기 위해서다.
- 교육용 서비스에서 의료적 오해를 줄인다.
- 같은 컨디션이라도 날씨에 맞는 추천 이유를 제공할 수 있다.

| Weather | Summary 방향 | Food 방향 | Music 방향 |
|---|---|---|---|
| CLEAR | 가벼운 활동, 산뜻함 | 균형 식사, 가벼운 메뉴 | 밝은 분위기 |
| CLOUDY | 차분한 페이스 | 따뜻하거나 부담 적은 메뉴 | 집중 / 안정 분위기 |
| RAIN | 실내 휴식, 차분함 | 따뜻한 메뉴 | 잔잔한 분위기 |
| SNOW | 보온, 느린 페이스 | 따뜻하고 든든한 메뉴 | 포근한 분위기 |

Human Decision:

```text
Approved (2026-09-30) — 확정 내용은 §16을 따른다.
```

---

## 6. Temperature Rule 후보

입력 범위:

```text
-30 ~ 50
```

### Option T-A — Score / Mood 미반영, Recommendation Context만 사용

- Score 영향: 없음
- Mood 영향: 없음
- Recommendation 영향: 있음
- Summary 영향: 있음

장점:

- 의료적 오해 가능성이 낮다.
- 날씨와 기온을 생활 맥락으로만 활용할 수 있다.
- 테스트가 단순하다.

단점:

- 극단적 기온이 Score에 반영되지 않는다.

### Option T-B — Score 미반영, Mood Summary에 제한 반영

- Score 영향: 없음
- Mood 영향: 직접 판정에는 사용하지 않음
- Summary 영향: 있음
- Recommendation 영향: 있음

장점:

- "덥다 / 춥다" 맥락을 Summary에 표현할 수 있다.
- Score 왜곡을 피한다.

단점:

- Mood label과 Summary 사이의 관계를 설명해야 한다.

### Option T-C — 낮은 Weight로 Score에 포함

예:

```text
temperatureComfortScore = 100 - extremeTemperaturePenalty
```

장점:

- 극단적 기온이 Score에 반영된다.

단점:

- 기온이 건강 상태를 직접 좌우한다는 오해를 만들 수 있다.
- 추가 threshold가 필요하다.
- TASK-006 테스트 복잡도가 증가한다.

Codex 추천안:

Option T-A를 추천한다.

Human Decision:

```text
Approved (2026-09-30) — 확정 내용은 §16을 따른다.
```

---

## 7. Summary Rule 후보

Rule-based Template 방식을 제안한다.

구성:

```text
Mood 문장
+ 강한 Metric 1~2개
+ Weather / Temperature Context
+ 의료 진단이 아님을 암시하는 생활형 표현
```

문구 원칙:

- "현재 입력 기준"
- "컨디션"
- "상대적으로"
- "어울리는"
- "부담이 적은"
- "페이스를 조절"

금지 표현:

- 정상 / 비정상 진단
- 질환 가능성
- 의학적 위험
- 치료 필요
- 건강 이상 판정

예시:

```text
현재 입력 기준으로 에너지 수준은 비교적 높고, 스트레스 부담은 크지 않은 편입니다.
비가 오는 날씨에는 차분한 실내 활동과 부담이 적은 식사가 어울립니다.
```

Human Decision:

```text
Approved (2026-09-30) — 확정 내용은 §16을 따른다.
```

---

## 8. Food Recommendation Rule 후보

실제 음식 API는 사용하지 않는다.
Deterministic rule 기반으로 같은 입력에는 같은 결과를 반환한다.

입력:

- Mood
- Wellness Score band
- energyLevel
- stressLevel
- weather
- temperature

응답 구조:

```text
name
tag
reason
```

### Score Band

| Band | 조건 | 방향 |
|---|---|---|
| LOW | `wellnessScore < 45` | 부담 적고 편안한 메뉴 |
| MID | `45 <= wellnessScore < 70` | 균형 식사 |
| HIGH | `wellnessScore >= 70` | 가벼운 에너지 유지 |

### 후보 Rule

| 조건 | name | tag | reason 방향 |
|---|---|---|---|
| TIRED 또는 LOW | 따뜻한 수프와 곡물빵 | 편안한 식사 | 부담이 적고 천천히 먹기 좋은 메뉴 |
| ENERGETIC 또는 HIGH | 연어 샐러드 | 에너지 균형 | 가볍게 에너지를 유지하기 좋은 메뉴 |
| CALM | 두부 채소 덮밥 | 균형 식사 | 차분한 컨디션에 어울리는 균형 메뉴 |
| BALANCED | 닭가슴살 라이스볼 | 균형 식사 | 한쪽으로 치우치지 않은 기본 추천 |
| RAIN 또는 SNOW | 따뜻한 채소 스튜 | 따뜻한 메뉴 | 차분한 날씨에 어울리는 따뜻한 메뉴 |
| temperature >= 30 | 그릭 요거트 볼 | 가벼운 메뉴 | 더운 날씨에 부담이 적은 메뉴 |
| temperature <= 5 | 따뜻한 죽 | 따뜻한 메뉴 | 추운 날씨에 어울리는 따뜻한 메뉴 |

우선순위 후보:

1. 극단적 기온 Context
2. Weather Context
3. Mood
4. Score Band

Codex 추천안:

- 실제 음식명은 교육용 예시로 사용한다.
- 효능이나 치료 표현은 사용하지 않는다.
- "스트레스를 치료하는 음식" 같은 표현은 금지한다.

Human Decision:

```text
Approved (2026-09-30) — 확정 내용은 §16을 따른다.
```

---

## 9. Music Recommendation Rule 후보

실제 Spotify / YouTube Music API는 사용하지 않는다.
초기 MVP에서는 가상 Playlist / Track Metadata를 사용한다.

입력:

- Mood
- energyLevel
- stressLevel
- weather
- temperature

응답 구조:

```text
title
artist
tag
reason
```

### 후보 Tag

- 차분한 분위기
- 가벼운 활력
- 편안한 휴식
- 밝은 분위기
- 집중하기 좋은 분위기

### 후보 Rule

| 조건 | title | artist | tag | reason 방향 |
|---|---|---|---|---|
| TIRED | Soft Reset Playlist | MoodFit Curated | 편안한 휴식 | 느린 페이스에 어울리는 분위기 |
| ENERGETIC | Light Motion Playlist | MoodFit Curated | 가벼운 활력 | 높은 에너지에 어울리는 밝은 흐름 |
| CALM | Calm Focus Playlist | MoodFit Curated | 차분한 분위기 | 차분한 컨디션을 유지하기 좋은 분위기 |
| BALANCED | Daily Balance Playlist | MoodFit Curated | 균형 있는 분위기 | 과하지 않은 기본 추천 |
| RAIN | Rainy Indoor Playlist | MoodFit Curated | 잔잔한 감성 | 비 오는 날의 실내 분위기에 어울림 |
| SNOW | Warm Evening Playlist | MoodFit Curated | 포근한 분위기 | 추운 날씨에 어울리는 따뜻한 분위기 |

실제 곡명 사용 여부:

- 초기 MVP에서는 실제 외부 곡을 사용하지 않는 것을 추천한다.
- 저작권, 외부 API 의존, 지역별 접근성 차이를 피하기 위해 가상 Playlist 명을 우선한다.

Human Decision:

```text
Approved (2026-09-30) — 확정 내용은 §16을 따른다.
```

---

## 10. Example Input 계산

API Spec 예시 입력:

```text
heartRate = 68
respiratoryRate = 18
sleepScore = 86
stressLevel = 31
energyLevel = 74
temperature = 19.0
weather = RAIN
```

공통:

```text
stressScore = 100 - 31 = 69
```

### Option A 계산

```text
sleepScore   86 * 0.35 = 30.10
stressScore  69 * 0.35 = 24.15
energyLevel  74 * 0.30 = 22.20

total = 76.45
wellnessScore = 76
```

예상 Mood:

```text
ENERGETIC
```

이유:

- `energyLevel >= 70`
- `stressLevel <= 45`
- `sleepScore >= 60`

예상 Summary:

```text
현재 입력 기준으로 에너지 수준은 비교적 높고, 스트레스 부담은 크지 않은 편입니다.
비가 오는 날씨에는 차분한 실내 활동과 부담이 적은 식사가 어울립니다.
```

Food Recommendation 예시:

```json
{
  "name": "따뜻한 채소 스튜",
  "tag": "따뜻한 메뉴",
  "reason": "비 오는 날씨와 현재의 안정적인 컨디션에 어울리는 부담이 적은 메뉴입니다."
}
```

Music Recommendation 예시:

```json
{
  "title": "Rainy Indoor Playlist",
  "artist": "MoodFit Curated",
  "tag": "잔잔한 감성",
  "reason": "비 오는 날의 실내 분위기와 현재의 에너지 수준에 어울리는 플레이리스트입니다."
}
```

### Option B 계산

```text
heartComfortScore = 100 - abs(68 - 70) * 2
                  = 96

respiratoryComfortScore = 100 - abs(18 - 16) * 5
                        = 90

sleepScore              86 * 0.30  = 25.80
stressScore             69 * 0.30  = 20.70
energyLevel             74 * 0.25  = 18.50
heartComfortScore       96 * 0.075 = 7.20
respiratoryComfortScore 90 * 0.075 = 6.75

total = 78.95
wellnessScore = 79
```

예상 Mood:

```text
ENERGETIC
```

Option B에서도 Mood 판정은 Energy / Stress / Sleep 조합 기준을 적용하는 것을 추천한다.

---

## 11. Boundary / Edge Case 검토

| Case | 예상 Score 방향 | 예상 Mood | Summary 방향 | Food 방향 | Music 방향 |
|---|---|---|---|---|---|
| 모든 Score 입력 0 | 매우 낮음 | TIRED | 회복과 부담 완화 중심 | 따뜻한 수프와 곡물빵 | Soft Reset Playlist |
| 모든 Score 입력 100 | 높음. 단 stressLevel 100이면 stressScore 0 | 조건에 따라 BALANCED 또는 TIRED 아님 | 높은 에너지와 높은 부담의 혼합 상태 | 균형 식사 | Daily Balance Playlist |
| sleep 100 / stress 100 / energy 100 | 중간 | BALANCED | 에너지는 높지만 부담도 큰 상태 | 균형 식사 | Daily Balance Playlist |
| sleep 0 / stress 0 / energy 0 | 낮음 | TIRED | 회복 페이스 제안 | 편안한 식사 | Soft Reset Playlist |
| 높은 Energy + 높은 Stress | 중간 이상 가능 | BALANCED | 활력과 부담이 동시에 있는 상태 | 균형 식사 | Daily Balance Playlist |
| 낮은 Energy + 낮은 Stress | 낮거나 중간 | TIRED | 부담은 낮지만 에너지가 낮은 상태 | 편안한 식사 | Soft Reset Playlist |
| Score가 Mood 경계값과 정확히 같음 | 포함 경계 적용 | 해당 조건 포함 | 경계 조건 명시 | 해당 Mood Rule | 해당 Mood Rule |
| heartRate 최소값 / 최대값 | Option A 영향 없음, Option B 보조 영향 | 직접 영향 없음 | 신체 리듬 보조 문구 | 직접 영향 없음 | 직접 영향 없음 |
| respiratoryRate 최소값 / 최대값 | Option A 영향 없음, Option B 보조 영향 | 직접 영향 없음 | 신체 리듬 보조 문구 | 직접 영향 없음 | 직접 영향 없음 |
| temperature -30 | Score 직접 영향 없음 추천 | 직접 영향 없음 | 추운 날씨 Context | 따뜻한 메뉴 | Warm Evening Playlist |
| temperature 50 | Score 직접 영향 없음 추천 | 직접 영향 없음 | 더운 날씨 Context | 가벼운 메뉴 | 차분하거나 가벼운 Playlist |
| CLEAR | Score 직접 영향 없음 | 직접 영향 없음 | 산뜻한 Context | 균형 식사 | 밝은 분위기 |
| CLOUDY | Score 직접 영향 없음 | 직접 영향 없음 | 차분한 Context | 부담 적은 메뉴 | 집중 / 안정 분위기 |
| RAIN | Score 직접 영향 없음 | 직접 영향 없음 | 실내 / 차분한 Context | 따뜻한 메뉴 | 잔잔한 분위기 |
| SNOW | Score 직접 영향 없음 | 직접 영향 없음 | 보온 / 느린 페이스 Context | 따뜻하고 든든한 메뉴 | 포근한 분위기 |
| 같은 Score지만 Metric 조합이 다른 경우 | Score 동일 가능 | Option M2가 조합 차이를 반영 | Metric별 강점/부담 표현 | Mood / Context 기반 | Mood / Context 기반 |

---

## 12. Testability 검토

TASK-006 구현 시 다음 Service 구조를 권장한다.

```text
WellnessAnalysisService
Input:
  Wellness Metrics
Output:
  wellnessScore
  mood
  summary

RecommendationService
Input:
  analysis result
  weather
  temperature
Output:
  Food Recommendations
  Music Recommendations
```

이번 TASK-005에서는 Java Class를 생성하거나 수정하지 않는다.

### Unit Test 후보

- Stress reverse mapping
- Option A score calculation
- Option B score calculation
- Mood priority
- Weather context mapping
- Temperature context mapping
- Food deterministic selection
- Music deterministic selection
- Summary template selection
- Boundary value handling

---

## 13. Rule 상수 관리 후보

Controller에는 threshold / weight를 넣지 않는다.

TASK-006 구현 후보:

| 후보 | 설명 | 장점 | 단점 |
|---|---|---|---|
| Service private constant | Service 내부 상수 | 가장 단순 | Rule이 커지면 읽기 어려움 |
| Rule Policy class | Rule 전용 class | 테스트와 관리가 쉬움 | 파일이 늘어남 |
| Configuration object | 설정 객체 | 유연함 | 초기 MVP에는 과함 |

Codex 추천안:

초기 MVP에서는 `Rule Policy class`를 추천한다.
과도한 추상화 없이 threshold와 weight를 한 곳에 모으고, 단위 테스트도 분리하기 쉽다.

Human Decision:

```text
Approved (2026-09-30) — 확정 내용은 §16을 따른다.
```

---

## 14. Decision Matrix

| 결정 항목 | Option | 설명 | 장점 | 단점 | Codex 추천안 | Human Decision |
|---|---|---|---|---|---|---|
| Wellness Score Formula | Option A | Sleep / Stress / Energy 중심 | 단순, 의료 오해 낮음 | Heart / Respiratory 직접 반영 없음 | 추천 | **Approved** |
| Wellness Score Formula | Option B | 5개 Metric 모두 사용 | Dashboard Metric 일관성 | 의료 오해 가능성 증가 | 보조 후보 | 미채택 |
| Mood Rule | M1 | Score 중심 | 단순 | 혼합 상태 표현 약함 | 비추천 | 미채택 |
| Mood Rule | M2 | Energy / Stress / Sleep 조합 | 설명력 높음 | 조건 증가 | 추천 | **Approved** |
| Metric Weight | A | Sleep 35 / Stress 35 / Energy 30 | 자기 보고 컨디션 중심 | 신체 리듬 보조화 | 추천 | **Approved** |
| Heart Rate 처리 | Display only | Score 미반영 | 의료 오해 낮음 | Score 풍부함 감소 | 추천 | **Approved** |
| Respiratory Rate 처리 | Display only | Score 미반영 | 의료 오해 낮음 | Score 풍부함 감소 | 추천 | **Approved** |
| Weather 영향 | Context only | Summary / Recommendation만 사용 | 단정 표현 방지 | Score 영향 없음 | 추천 | **Approved** |
| Temperature 영향 | T-A | Recommendation / Summary만 사용 | 단순, 안전 | 극단 기온 Score 영향 없음 | 추천 | **Approved** |
| Summary Rule | Template | Mood + Metric + Weather Context | deterministic, 테스트 쉬움 | 문구 다양성 제한 | 추천 | **Approved** |
| Food Recommendation Rule | Deterministic table | Mood / Score / Weather / Temperature 기반 | 재현 가능 | 개인화 제한 | 추천 | **Approved** |
| Music Recommendation Rule | Virtual Playlist | 외부 API 없는 가상 Playlist | 저작권/연동 부담 낮음 | 실제 곡 경험 약함 | 추천 | **Approved** |
| Recommendation deterministic 정책 | Required | 같은 입력이면 같은 결과 | 테스트 가능 | 다양성 제한 | 추천 | **Approved** |
| Boundary 처리 | Inclusive threshold | 경계값 포함 기준 명시 | 테스트 명확 | 세부 조정 필요 | 추천 | **Approved** |

---

## 15. Codex 최종 추천 조합

Human Approval 대상으로 다음 조합을 추천한다.

```text
Wellness Score Formula: Option A
Mood Rule: Option M2
Weather Rule: Context only
Temperature Rule: Option T-A
Food Recommendation: Deterministic table
Music Recommendation: Virtual deterministic playlist
Summary: Rule-based template
Rule constants: Rule Policy class
```

추천 이유:

- 의료 진단 오해 가능성을 낮춘다.
- 교육용 MVP에서 구현과 테스트가 쉽다.
- API Contract 변경 없이 TASK-006으로 이어질 수 있다.
- 같은 입력에 같은 결과를 반환해 Local Verification과 CI에 적합하다.

Human Decision:

```text
Approved (2026-09-30) — 확정 내용은 §16을 따른다.
```

---

## 16. 확정 Rule (Gate B Human Review 보완)

§15 추천 조합을 기준으로, Human Review에서 발견된 누락 6건을 보완한 최종 Rule이다.
TASK-006은 이 절만 보고 구현과 Test를 작성할 수 있어야 한다.

| # | Human Review 발견 사항 | 보완 |
|---|---|---|
| 1 | Food 우선순위상 Mood가 항상 결정되어 Score Band Rule에 도달하지 않음 | Score Band 제거. 추천을 Mood Item + Context Item 2개로 분리 (§16.5) |
| 2 | Music Rule에 적용 순서, Temperature, CLEAR / CLOUDY 정의가 없음 | Food와 같은 Mood Item + Context Item 구조로 정의 (§16.6) |
| 3 | 추천 개수 미정 | `foods`, `music` 각각 항상 2개 (§16.4) |
| 4 | Edge Case 표에 중복 행과 모호한 결과("BALANCED 또는 TIRED 아님")가 있음 | 입력값과 결과를 수치로 명시한 표로 교체 (§16.8) |
| 5 | 반올림 방식 미정, 부동소수점 오차 가능 | 정수 연산 공식으로 확정 (§16.1) |
| 6 | Summary의 "강한 Metric 1~2개" 선택 Rule 없음 | Metric 선택을 제거하고 Mood 문장 + Context 문장 Template으로 확정 (§16.7) |

### 16.1 Wellness Score

```text
stressScore   = 100 - stressLevel
wellnessScore = (35 * sleepScore + 35 * stressScore + 30 * energyLevel + 50) / 100   // 정수 나눗셈
```

- Weight: Sleep 35% / Stress 35% / Energy 30% (Option A)
- 정수 연산만 사용하므로 부동소수점 오차가 없다.
- 결과는 가중합을 소수 첫째 자리에서 반올림(HALF_UP)한 값과 같다. 예: 3.50 → 4
- 입력 범위(0 ~ 100) 안에서 결과는 항상 0 ~ 100이다. (0 ~ 100 전체 조합 검증 완료)
- heartRate, respiratoryRate, temperature, weather는 Score에 반영하지 않는다.

### 16.2 Mood

위에서부터 순서대로 판정하고, 처음 만족한 Mood를 사용한다. 모든 경계값은 포함(inclusive)이다.

| 순서 | code | label | 조건 |
|---:|---|---|---|
| 1 | TIRED | 피곤함 | `energyLevel <= 35` 또는 `sleepScore <= 35` |
| 2 | ENERGETIC | 활기 있음 | `energyLevel >= 70` 그리고 `stressLevel <= 45` 그리고 `sleepScore >= 60` |
| 3 | CALM | 차분함 | `stressLevel <= 35` 그리고 `wellnessScore >= 65` |
| 4 | BALANCED | 균형 있음 | 위 조건에 해당하지 않음 |

- `wellnessScore`는 §16.1의 정수 결과를 사용한다.

### 16.3 Weather / Temperature → Context

Weather와 Temperature는 Score와 Mood에 반영하지 않는다.
Summary, Food, Music에서 공통으로 사용하는 Context 하나를 다음 순서로 결정한다.

| 순서 | 조건 | Context |
|---:|---|---|
| 1 | `temperature <= 5` | COLD |
| 2 | `temperature >= 30` | HOT |
| 3 | 그 외 | `weather` 값 그대로 (CLEAR / CLOUDY / RAIN / SNOW) |

- Temperature 경계값은 포함(inclusive)이다.
- 극단 기온이 Weather보다 우선한다. 예: `-30` + `SNOW` → COLD, `30` + `RAIN` → HOT

### 16.4 Recommendation 공통

- 외부 API를 사용하지 않는 Deterministic Rule이다. 같은 입력에는 항상 같은 결과를 반환한다.
- `foods`, `music`은 각각 **항상 2개**를 반환한다.
  - 첫 번째 Item: Mood Item
  - 두 번째 Item: Context Item
- Mood Item과 Context Item의 이름은 서로 겹치지 않는다. (중복 Item 없음)
- 효능, 치료, 질환 관련 표현은 사용하지 않는다.

### 16.5 Food

Mood Item:

| Mood | name | tag | reason |
|---|---|---|---|
| TIRED | 따뜻한 수프와 곡물빵 | 편안한 식사 | 부담이 적고 천천히 먹기 좋은 메뉴입니다. |
| ENERGETIC | 연어 샐러드 | 에너지 균형 | 가볍게 에너지를 유지하기 좋은 메뉴입니다. |
| CALM | 두부 채소 덮밥 | 균형 식사 | 차분한 컨디션에 어울리는 균형 잡힌 메뉴입니다. |
| BALANCED | 닭가슴살 라이스볼 | 균형 식사 | 한쪽으로 치우치지 않은 기본 메뉴입니다. |

Context Item:

| Context | name | tag | reason |
|---|---|---|---|
| COLD | 따뜻한 죽 | 따뜻한 메뉴 | 기온이 낮은 날에 어울리는 따뜻한 메뉴입니다. |
| HOT | 그릭 요거트 볼 | 가벼운 메뉴 | 기온이 높은 날에 부담이 적은 메뉴입니다. |
| RAIN | 따뜻한 채소 스튜 | 따뜻한 메뉴 | 비 오는 날씨에 어울리는 따뜻한 메뉴입니다. |
| SNOW | 따뜻한 채소 스튜 | 따뜻한 메뉴 | 눈 오는 날씨에 어울리는 따뜻한 메뉴입니다. |
| CLEAR | 과일 곁들인 그린 샐러드 | 가벼운 메뉴 | 맑은 날씨에 어울리는 산뜻한 메뉴입니다. |
| CLOUDY | 따뜻한 현미 주먹밥 | 부담 적은 메뉴 | 흐린 날씨에 부담 없이 먹기 좋은 메뉴입니다. |

### 16.6 Music

실제 외부 곡이 아니라 가상 Playlist를 사용한다. `artist`는 모두 `MoodFit Curated`이다.

Mood Item:

| Mood | title | tag | reason |
|---|---|---|---|
| TIRED | Soft Reset Playlist | 편안한 휴식 | 느린 페이스에 어울리는 분위기입니다. |
| ENERGETIC | Light Motion Playlist | 가벼운 활력 | 높은 에너지에 어울리는 밝은 흐름입니다. |
| CALM | Calm Focus Playlist | 차분한 분위기 | 차분한 컨디션을 유지하기 좋은 분위기입니다. |
| BALANCED | Daily Balance Playlist | 균형 있는 분위기 | 과하지 않은 기본 분위기입니다. |

Context Item:

| Context | title | tag | reason |
|---|---|---|---|
| COLD | Warm Evening Playlist | 포근한 분위기 | 기온이 낮은 날에 어울리는 따뜻한 분위기입니다. |
| HOT | Cool Breeze Playlist | 가벼운 분위기 | 기온이 높은 날에 어울리는 산뜻한 분위기입니다. |
| RAIN | Rainy Indoor Playlist | 잔잔한 감성 | 비 오는 날의 실내 분위기에 어울립니다. |
| SNOW | Warm Evening Playlist | 포근한 분위기 | 눈 오는 날에 어울리는 따뜻한 분위기입니다. |
| CLEAR | Bright Morning Playlist | 밝은 분위기 | 맑은 날씨에 어울리는 밝은 분위기입니다. |
| CLOUDY | Cloudy Focus Playlist | 집중하기 좋은 분위기 | 흐린 날씨에 차분히 집중하기 좋은 분위기입니다. |

### 16.7 Summary

```text
summary = Mood 문장 + " " + Context 문장
```

Metric 개별 선택은 하지 않는다. Mood 판정 자체가 주요 Metric 조합을 반영하기 때문이다.

Mood 문장:

| Mood | 문장 |
|---|---|
| TIRED | 현재 입력 기준으로 에너지나 수면 점수가 낮은 편이라 무리하지 않는 페이스가 어울립니다. |
| ENERGETIC | 현재 입력 기준으로 에너지 수준은 비교적 높고, 스트레스 부담은 크지 않은 편입니다. |
| CALM | 현재 입력 기준으로 스트레스 부담이 낮고 전반적인 컨디션이 안정적인 편입니다. |
| BALANCED | 현재 입력 기준으로 컨디션이 한쪽으로 크게 치우치지 않은 편입니다. |

Context 문장:

| Context | 문장 |
|---|---|
| COLD | 기온이 낮은 날에는 따뜻한 식사와 느린 페이스가 어울립니다. |
| HOT | 기온이 높은 날에는 가벼운 식사와 충분한 휴식이 어울립니다. |
| RAIN | 비가 오는 날씨에는 차분한 실내 활동과 부담이 적은 식사가 어울립니다. |
| SNOW | 눈이 오는 날씨에는 보온에 신경 쓰며 느린 페이스로 움직이는 것이 어울립니다. |
| CLEAR | 맑은 날씨에는 가벼운 산책 같은 활동이 어울립니다. |
| CLOUDY | 흐린 날씨에는 차분한 페이스로 하루를 이어 가는 것이 어울립니다. |

- §7의 금지 표현(진단, 질환, 위험, 치료, 이상 판정)을 사용하지 않는다.

### 16.8 Edge Case / Boundary 기대값

아래 값은 §16.1 ~ §16.6 Rule의 Reference 계산 결과이다.
TASK-006 Unit Test의 기대값으로 사용한다. (heartRate / respiratoryRate는 결과에 영향이 없다.)

| Case | sleep / stress / energy | temp / weather | Score | Mood | Context | Food (Mood, Context) | Music (Mood, Context) |
|---|---|---|---:|---|---|---|---|
| E01 API 예시 입력 | 86 / 31 / 74 | 19.0 / RAIN | 76 | ENERGETIC | RAIN | 연어 샐러드, 따뜻한 채소 스튜 | Light Motion, Rainy Indoor |
| E02 모든 입력 최소 | 0 / 0 / 0 | 19.0 / RAIN | 35 | TIRED | RAIN | 따뜻한 수프와 곡물빵, 따뜻한 채소 스튜 | Soft Reset, Rainy Indoor |
| E03 모든 입력 최대 | 100 / 100 / 100 | 19.0 / RAIN | 65 | BALANCED | RAIN | 닭가슴살 라이스볼, 따뜻한 채소 스튜 | Daily Balance, Rainy Indoor |
| E04 높은 Energy + 높은 Stress | 80 / 80 / 90 | 19.0 / RAIN | 62 | BALANCED | RAIN | 닭가슴살 라이스볼, 따뜻한 채소 스튜 | Daily Balance, Rainy Indoor |
| E05 낮은 Energy + 낮은 Stress | 70 / 10 / 30 | 19.0 / RAIN | 65 | TIRED | RAIN | 따뜻한 수프와 곡물빵, 따뜻한 채소 스튜 | Soft Reset, Rainy Indoor |
| E06 energy = 35 (TIRED 경계 포함) | 80 / 20 / 35 | 19.0 / RAIN | 67 | TIRED | RAIN | 따뜻한 수프와 곡물빵, 따뜻한 채소 스튜 | Soft Reset, Rainy Indoor |
| E07 sleep = 35 (TIRED 경계 포함) | 35 / 20 / 80 | 19.0 / RAIN | 64 | TIRED | RAIN | 따뜻한 수프와 곡물빵, 따뜻한 채소 스튜 | Soft Reset, Rainy Indoor |
| E08 ENERGETIC 경계 포함 | 60 / 45 / 70 | 19.0 / RAIN | 61 | ENERGETIC | RAIN | 연어 샐러드, 따뜻한 채소 스튜 | Light Motion, Rainy Indoor |
| E09 energy = 69 (ENERGETIC 미달) | 60 / 45 / 69 | 19.0 / RAIN | 61 | BALANCED | RAIN | 닭가슴살 라이스볼, 따뜻한 채소 스튜 | Daily Balance, Rainy Indoor |
| E10 stress = 46 (ENERGETIC 미달) | 60 / 46 / 70 | 19.0 / RAIN | 61 | BALANCED | RAIN | 닭가슴살 라이스볼, 따뜻한 채소 스튜 | Daily Balance, Rainy Indoor |
| E11 CALM 경계 포함 (stress 35, Score 65) | 70 / 35 / 58 | 19.0 / RAIN | 65 | CALM | RAIN | 두부 채소 덮밥, 따뜻한 채소 스튜 | Calm Focus, Rainy Indoor |
| E12 Score 64 (CALM 미달) | 70 / 35 / 55 | 19.0 / RAIN | 64 | BALANCED | RAIN | 닭가슴살 라이스볼, 따뜻한 채소 스튜 | Daily Balance, Rainy Indoor |
| E13 반올림 경계 (3.50 → 4) | 10 / 100 / 0 | 19.0 / RAIN | 4 | TIRED | RAIN | 따뜻한 수프와 곡물빵, 따뜻한 채소 스튜 | Soft Reset, Rainy Indoor |
| E14 temperature = 5 (COLD 포함) | 70 / 30 / 60 | 5.0 / CLEAR | 67 | CALM | COLD | 두부 채소 덮밥, 따뜻한 죽 | Calm Focus, Warm Evening |
| E15 temperature = 5.1 (COLD 아님) | 70 / 30 / 60 | 5.1 / CLEAR | 67 | CALM | CLEAR | 두부 채소 덮밥, 과일 곁들인 그린 샐러드 | Calm Focus, Bright Morning |
| E16 temperature = 30 (HOT 포함) | 70 / 30 / 60 | 30.0 / RAIN | 67 | CALM | HOT | 두부 채소 덮밥, 그릭 요거트 볼 | Calm Focus, Cool Breeze |
| E17 temperature = 29.9 (HOT 아님) | 70 / 30 / 60 | 29.9 / RAIN | 67 | CALM | RAIN | 두부 채소 덮밥, 따뜻한 채소 스튜 | Calm Focus, Rainy Indoor |
| E18 temperature 최소 -30 + SNOW | 70 / 30 / 60 | -30.0 / SNOW | 67 | CALM | COLD | 두부 채소 덮밥, 따뜻한 죽 | Calm Focus, Warm Evening |
| E19 temperature 최대 50 + CLEAR | 70 / 30 / 60 | 50.0 / CLEAR | 67 | CALM | HOT | 두부 채소 덮밥, 그릭 요거트 볼 | Calm Focus, Cool Breeze |
| E20 CLOUDY 보통 기온 | 70 / 30 / 60 | 18.0 / CLOUDY | 67 | CALM | CLOUDY | 두부 채소 덮밥, 따뜻한 현미 주먹밥 | Calm Focus, Cloudy Focus |

Music 열의 이름은 `Playlist`를 생략해 표기했다.

### 16.9 API Spec 예시와의 차이 (DEC-014 반영 시 함께 수정 필요)

`docs/05-API_SPEC.md` 4절 Response 예시는 같은 입력(E01)에 대해 다음 값을 보여 준다.

| 항목 | 현재 API Spec 예시 | §16 Rule 결과 |
|---|---|---|
| wellnessScore | 78 | 76 |
| mood | CALM / 평온함 | ENERGETIC / 활기 있음 |
| CALM label | 평온함 | 차분함 |
| foods | 1개 (연어 샐러드) | 2개 (연어 샐러드, 따뜻한 채소 스튜) |
| music | 1개 (Rainy Morning / Cloud Echo) | 2개 (Light Motion Playlist, Rainy Indoor Playlist) |

DEC-014 확정과 함께 Human Approval을 받아 API Spec 예시와 Mood label을 16절 기준으로 맞췄다.
