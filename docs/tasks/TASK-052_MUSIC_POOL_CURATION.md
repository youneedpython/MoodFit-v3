# TASK-052 — Music Pool Curation (선곡 조정)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

추천 음악 후보 가운데 분위기와 맞지 않는 묶음(Pool)에 들어간 곡을 옮긴다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 승인 "선곡 조정: 옮겨", 2026-10-04)
- 선행: TASK-048(추천 다양화)
- 실행: `node scripts/orchestrator/run.mjs TASK-052`

## 배경

TASK-048 Review(N-02)가 지적했다: "Hype Boy"가 TIRED("편안한 휴식")와 SNOW("포근한 분위기")에, "양화대교"와 "Just the Way You Are"가 ENERGETIC("높은 에너지에 어울리는 밝은 흐름")에 들어 있다. Claude 세션이 현재 Pool 전체를 다시 읽고 아래 조정안을 정했고 Human이 옮기는 것을 승인했다.

## 조정안 (이대로 적용한다)

`backend/src/main/java/com/moodfit/service/WellnessRulePolicy.java`의 음악 Pool만 바꾼다. 곡의 제목 / 가수 / `videoId`는 그대로 쓰고, 옮겨 간 Pool의 분류(tag)와 이유(reason) 문구는 그 Pool의 다른 곡과 같게 쓴다.

| 곡 | 빼는 Pool | 넣는 Pool |
|---|---|---|
| Hype Boy (NewJeans) | TIRED, CALM, SNOW, CLOUDY | ENERGETIC(맨 끝), HOT |
| 양화대교 (Zion.T) | ENERGETIC, HOT | CALM, CLOUDY (BALANCED는 유지) |
| Just the Way You Are (Bruno Mars) | ENERGETIC | CALM (BALANCED는 유지) |
| Hello (Adele) | TIRED | (RAIN은 유지) |
| Someone You Loved (Lewis Capaldi) | TIRED | (RAIN은 유지) |
| 어떻게 이별까지 사랑하겠어, 널 사랑하는 거지 (AKMU) | TIRED, CLOUDY | (CALM, RAIN은 유지) |
| As It Was (Harry Styles) | — | ENERGETIC(맨 끝, Hype Boy 다음. BALANCED / CLOUDY는 유지) |

### 반드시 지킬 조건 (계약 예시를 바꾸지 않기 위해)

계약 예시(`contracts/`)는 고정 시각(Asia/Seoul 2026-09-28, `epochDay` 20724)에서 기분 ENERGETIC + 상황 RAIN의 결과다. 이 Task는 **`contracts/`와 `docs/05-API_SPEC.md`를 바꾸지 않는다.** 그러려면:

1. **ENERGETIC Pool의 크기는 26으로 유지한다.** 두 곡(Just the Way You Are, 양화대교)을 빼고 두 곡(Hype Boy, As It Was)을 **맨 끝에 순서대로** 더한다. 그 밖의 곡의 **순서를 바꾸지 않는다.** 특히 맨 앞 5곡(Uptown Funk, Can't Stop the Feeling!, Dynamite, Viva La Vida, Shape of You)의 위치는 그대로여야 한다(20724를 26으로 나눈 나머지가 2라서 3 ~ 5번째 곡이 예시에 들어 있다).
2. **RAIN Pool은 바꾸지 않는다**(크기 9, 순서 그대로).
3. 음식 Pool은 바꾸지 않는다.
4. 다른 Pool에서 곡을 뺄 때는 그 자리만 없애고 나머지 순서를 유지한다. 넣을 때는 맨 끝에 더한다.

조정 뒤 크기: TIRED 9, ENERGETIC 26, CALM 14, BALANCED 14(변화 없음), COLD 7(변화 없음), SNOW 5, HOT 8, RAIN 9(변화 없음), CLEAR 10(변화 없음), CLOUDY 8. 기분 Pool 8 이상 / 상황 Pool 4 이상 조건을 계속 만족한다.

## 함께 고칠 것

- `scripts/container-smoke.sh`의 성공 문구 "PASS: create/latest/history and 400 contract preserved"에서 실제로 검사하지 않는 "400"을 뺀다(TASK-048 Review N-01). 이 한 줄의 문구만 바꾼다. Script의 다른 부분은 건드리지 않는다.

## Test

- 기존 `RecommendationMatrixTests`(Pool 크기, 승인된 영상 ID, 중복 없음, 날짜별 순환)와 계약 Test가 **수정 없이 통과**해야 한다. 위 조건을 지키면 계약 예시는 그대로다.
- 추가: 위 표의 곡이 "빼는 Pool"에 없고 "넣는 Pool"에 있는지 검사하는 Test(Pool을 읽을 수 있는 기존 방식이 있으면 그것을 쓰고, 없으면 여러 날짜의 추천 결과로 간접 확인한다). ENERGETIC의 크기가 26이고 맨 앞 5곡이 그대로인지 검사한다.
- 새 영상 ID를 추가하지 않는다.

## 문서

- `docs/20-RECOMMENDATION-MUSIC-PLAYBACK.md`: Pool 구성 변경(옮긴 곡과 이유 한 줄씩).
- `docs/07-TASKS.md`: TASK-052 행과 절 추가, DONE(Milestone 52, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `prompts/`.

## 금지

- 판정 규칙, 추천 개수, 고르는 규칙, API 형식, 계약 예시, 음식 Pool 변경
- 새 곡 / 새 영상 ID 추가, Frontend 변경

## 참고 (Executor Sandbox)

- Sandbox에서 Gradle을 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Verification

- `bash scripts/verify.sh`
- `bash scripts/container-smoke.sh`
- `git diff --check`

## Claude Review 기준

- 조정안 표와 실제 Pool이 일치하는가
- ENERGETIC 크기 26과 맨 앞 5곡, RAIN Pool이 그대로인가(계약 예시 불변)
- 새 영상 ID가 없는가
- Smoke Script는 문구 한 줄만 바뀌었는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 자동 배포의 Smoke 통과를 확인한다.
