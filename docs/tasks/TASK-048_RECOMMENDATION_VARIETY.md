# TASK-048 — Recommendation Variety (추천 다양화) + History 여백

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

추천 음식과 추천 음악이 기분 / 날씨가 같으면 매번 같은 5개로 나온다. 후보를 늘리고 날짜에 따라 돌아가며 고르게 해서 다양하게 만든다. 함께 History 화면의 Card 간격을 고친다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 승인, 2026-10-04)
- 선행: TASK-036(추천 5개 / 영상 ID), TASK-042(사용자), TASK-047(음식 아이콘)
- 실행: `node scripts/orchestrator/run.mjs TASK-048`

## Human 결정 (2026-10-04)

1. "추천 음식과 음악이 더 다양했으면 한다" → Claude 세션 제안 승인: **기분 / 상황별 후보를 늘리고 날짜를 기준으로 돌아가며 고른다.** 같은 날 같은 입력이면 같은 결과가 나온다(Test 가능).
2. 추천은 계속 **규칙이 결정**한다. LLM이 추천을 고르지 않는다. Score / 기분 / 상황을 정하는 규칙(DEC-014)은 바꾸지 않는다.
3. 추천 개수(음식 5, 음악 5 = 기분 기준 3 + 상황 기준 2)와 API 응답 형식은 바꾸지 않는다.
4. Staging Smoke는 추천 목록을 "개수와 형식"만 검사하도록 바꾼다(날마다 내용이 달라지므로).
5. History 화면: "주간 리포트" Card와 "최근 7일 Wellness Score" Card가 너무 붙어 있다. 간격을 다른 Card들과 같게 맞춘다(Human이 화면 캡처로 지적).

## 확인된 사실 (Claude 세션)

### 추가할 곡 (YouTube oEmbed로 확인: 영상 존재, embed 가능, 제목 일치 — 2026-10-04)

아래 40곡을 추가한다. `videoId`는 **그대로** 쓴다(바꾸거나 새로 만들지 않는다). 이 목록에 없는 곡을 새로 추가하지 않는다(Executor는 영상 ID를 확인할 수 없다). 기존 곡은 그대로 둔다.

| 제목 | 가수 | videoId |
|---|---|---|
| Viva La Vida | Coldplay | `dvgZkm1xWPE` |
| Yellow | Coldplay | `yKNxeF4KMsY` |
| Fix You | Coldplay | `k4V3Mo61fJM` |
| Hello | Adele | `YQHsXMglC9A` |
| Shape of You | Ed Sheeran | `JGwWNGJdvx8` |
| Just the Way You Are | Bruno Mars | `LjhCEhWiKXk` |
| Roar | Katy Perry | `CevxZvSJLk8` |
| Firework | Katy Perry | `QGJuMBdaqIw` |
| Believer | Imagine Dragons | `7wtfhZwyrcc` |
| Thunder | Imagine Dragons | `fKopy74weus` |
| Wake Me Up | Avicii | `IcrbM1l_BoI` |
| Get Lucky | Daft Punk | `5NV6Rdv1a3I` |
| Don't Stop Me Now | Queen | `HgzGwKwLmgM` |
| Don't Stop Believin' | Journey | `1k8craCGpgs` |
| Take On Me | a-ha | `djV11Xbc914` |
| Don't Know Why | Norah Jones | `tO4dxvguQDk` |
| Stay With Me | Sam Smith | `pB-5XG-DbAA` |
| ocean eyes | Billie Eilish | `viimfQi_pUw` |
| Someone You Loved | Lewis Capaldi | `zABLecsR5UE` |
| Butter | BTS | `WMweEpGlu_U` |
| 봄날 (Spring Day) | BTS | `xEeFrLSkMm8` |
| 밤편지 | IU | `BzYnNdJhZQw` |
| Blueming | IU | `D1PvIWdJ8xo` |
| Hype Boy | NewJeans | `11cta61wi0g` |
| 양화대교 | Zion.T | `uLUvHUzd4UA` |
| 여행 | 볼빨간사춘기 | `xRbPAVnqtcs` |
| 어떻게 이별까지 사랑하겠어, 널 사랑하는 거지 | AKMU | `m3DZsBw5bnE` |
| Nuvole Bianche | Ludovico Einaudi | `4VR-6AS0-l4` |
| Riptide | Vance Joy | `uJ_1HMAGb4k` |
| I'm Yours | Jason Mraz | `EkHTsc9PU2A` |
| Lovely Day | Bill Withers | `bEeaS6fuUoA` |
| September | Earth, Wind & Fire | `Gs069dndIYk` |
| Good as Hell | Lizzo | `SmbmeOgWsqE` |
| Levitating | Dua Lipa | `TUVcZfQe-Kw` |
| Don't Start Now | Dua Lipa | `oygrmJFKYZY` |
| Blinding Lights | The Weeknd | `4NRXx6U8ABQ` |
| As It Was | Harry Styles | `H5v3kku4y6Q` |
| Watermelon Sugar | Harry Styles | `E07s5ZYygMg` |
| Circles | Post Malone | `wXhTHyIgQ_U` |
| Sunflower | Post Malone, Swae Lee | `ApXoWvfEYVU` |

### 현재 구조

- `backend/src/main/java/com/moodfit/service/WellnessRulePolicy.java`: 기분(`MoodType`: TIRED / ENERGETIC / CALM / BALANCED)과 상황(`ContextType`: COLD / HOT / RAIN / SNOW / CLEAR / CLOUDY)마다 고정된 음식 3 + 2개, 음악 3 + 2개를 돌려준다.
- 시각은 주입된 `Clock`(`ClockConfig`, UTC)에서 얻는다. 계약 Test는 `Clock`을 `2026-09-28T03:00:00Z`로 고정한다.
- `scripts/staging-smoke.sh`, `scripts/container-smoke.sh`: 응답을 `contracts/` 예시와 **글자 그대로** 비교한다.
- Frontend `frontend/src/features/dashboard/foodEmoji.ts`: 음식 이름에 들어 있는 낱말로 Emoji를 고른다. Test가 현재 음식 이름 전체를 나열해 기본 아이콘이 아닌지 검사한다.

## 설계 (실행 기준)

### 후보 Pool

- 음악: 기분 4종마다 **8곡 이상**, 상황 6종마다 **4곡 이상**. 기존 곡과 위 40곡을 분위기에 맞게 나눈다(예: ENERGETIC에는 빠르고 밝은 곡, TIRED에는 잔잔한 곡, RAIN에는 차분한 곡). 한 곡을 여러 Pool에 넣어도 되지만 **한 응답 안에서 같은 곡이 두 번 나오지 않게** 한다.
- 음식: 기분 4종마다 **8개 이상**, 상황 6종마다 **4개 이상**. 한국에서 흔히 먹는 식사 / 간식 중에서 고르고, 상황에 맞게 둔다(COLD / SNOW에는 따뜻한 국물, HOT에는 시원한 음식 등). 건강 효능을 단정하는 문구(치료, 예방, 효과 보장)를 쓰지 않는다. 한 응답 안에서 같은 음식이 두 번 나오지 않게 한다.
- 각 항목의 분류(tag)와 이유(reason) 문구는 지금의 말투와 길이를 따른다.
- Pool은 Code 안의 상수로 둔다(DB / 설정 파일로 옮기지 않는다, Migration 금지).

### 고르는 규칙 (결정적)

- 기준 값: **Asia/Seoul 기준 날짜**(주입된 `Clock`의 시각을 Asia/Seoul로 바꾼 날짜의 `epochDay`).
- 기분 Pool에서 3개, 상황 Pool에서 2개를 고른다. 시작 위치는 `epochDay`를 Pool 크기로 나눈 나머지, 거기서부터 순서대로(끝에 닿으면 처음으로) 고른다. 음식과 음악은 각자 자기 Pool에 같은 방식을 쓴다.
- 기분 쪽과 상황 쪽에서 같은 항목이 겹치면 상황 쪽에서 다음 항목으로 넘어가 **5개가 모두 다르게** 한다.
- 난수(`Random`)를 쓰지 않는다. 같은 날짜 + 같은 기분 + 같은 상황이면 항상 같은 5개다. 날짜가 하루 바뀌면 시작 위치가 한 칸 옮겨 간다.
- 이미 저장된 기록의 추천은 바뀌지 않는다(저장 시점에 정해져 DB에 들어 있다).

### 계약 / Smoke

- `contracts/`의 Check-in 예시(생성 / 최신 / 이력)는 계약 Test의 고정 시각(`2026-09-28T03:00:00Z`)에서 실제로 나오는 값으로 갱신한다. `docs/05-API_SPEC.md`의 예시도 같게 맞춘다(동기화 Test가 있다).
- `scripts/staging-smoke.sh`와 `scripts/container-smoke.sh`: 추천 목록(`foods`, `music`, 이력의 `foodNames` / `musicTitles` 등)은 **개수와 형식만** 검사한다 — 음식 5개 / 음악 5개, 각 항목의 Key 집합이 예시와 같음, 값의 Type이 같음, `videoId`는 11자 문자열 또는 null. 그 밖의 항목(Score, 상태, 요약, 지표, 날씨 등)은 지금처럼 예시와 같은지 비교한다. 요약 문장이 추천에 따라 달라지지 않는지 확인하고, 달라진다면 그 항목도 형식 검사로 바꾼다.
- 두 Script가 Token / Cookie 값을 출력하지 않는 기존 동작을 유지한다.

### Frontend

- `foodEmoji.ts`: 새 음식 이름 전부에 기본 아이콘이 아닌 Emoji가 대응하게 대응표를 늘린다. Test의 음식 이름 목록을 Backend Pool 전체와 같게 갱신한다.
  - 한 글자 낱말(차, 죽, 콩 등)로 고르는 규칙은 다른 이름에 잘못 걸릴 수 있다(TASK-047 Review 지적). 더 긴 낱말을 먼저 검사하거나 낱말 경계를 고려해 **새 Pool의 모든 이름이 의도한 아이콘**이 되게 하고, 이름별 기대 아이콘을 Test로 고정한다.
- **History 여백**: `frontend/src/features/history/`에서 "주간 리포트" Card와 그 아래 "최근 7일 Wellness Score" Card 사이 간격이 다른 Card 사이 간격과 같게 한다. 기존 간격 Token을 쓴다. 주간 리포트 영역이 보이지 않는 경우(기능 꺼짐)에 빈 간격이 남지 않게 한다. 390 / 768 / 1280px에서 같은 간격이 되게 한다.

### Test

- Backend: Pool 크기 조건(기분 8 이상, 상황 4 이상), 모든 곡의 `videoId`가 11자이고 위 표 또는 기존 곡과 일치(새로 만든 ID가 없음을 검사), 같은 날짜 + 같은 입력 → 같은 결과, 날짜가 바뀌면 결과가 달라짐, 한 응답에 중복 없음(모든 기분 × 상황 × 여러 날짜 조합), Pool 끝에서 처음으로 돌아감, Asia/Seoul 날짜 경계(UTC 15시 전후).
- 기존 판정 경계값 Test(Score / 기분 / 상황)는 그대로 통과해야 한다. 추천 내용을 글자 그대로 검사하던 Test는 새 규칙에 맞게 고친다.
- 계약 Test: 갱신한 예시와 일치.
- Frontend: 아이콘 대응(이름별), History 간격은 구조 / Class 수준에서 확인.

### 문서

- `docs/20-RECOMMENDATION-MUSIC-PLAYBACK.md`: Pool, 고르는 규칙, 곡 목록과 확인 방법(oEmbed, 확인 날짜), Smoke 변경.
- `docs/09-DECISIONS.md`: 새 Decision(최신 번호 다음, Human Approved 2026-10-04)과 DEC-014 변경 이력.
- `docs/07-TASKS.md`: TASK-048 행과 절 추가, DONE(Milestone 48, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `docs/21-STAGING-CD.md`(Smoke 검사 방식), README(필요하면 한 줄), `prompts/`.

### 금지

- Score / 기분 / 상황 판정 규칙, 추천 개수, API 응답 형식 변경
- 위 표와 기존 곡 밖의 영상 ID, 난수 사용, DB Migration, 새 Dependency
- LLM 관련 Code 변경

### 참고 (Executor Sandbox)

- Sandbox에서 Gradle / npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.
- 계약 예시는 실행 없이 손으로 계산해야 할 수 있다. 고정 시각 `2026-09-28T03:00:00Z`는 Asia/Seoul로 2026-09-28이며 `epochDay`는 20724다(1970-01-01부터 날수). Pool 크기로 나눈 나머지를 계산해 예시를 맞춘다. Verify에서 어긋나면 다음 Run에서 고친다.
- Test의 타입 오류에 주의한다(`tsc --noEmit`가 Build에 포함된다).

## Verification

- `bash scripts/verify.sh`
- `bash scripts/container-smoke.sh`
- `bash -n scripts/staging-smoke.sh`
- `git diff --check`

## Claude Review 기준

- 판정 규칙과 응답 형식이 그대로인가, 추천이 결정적인가(난수 없음)
- 모든 영상 ID가 승인 목록 안인가, 한 응답에 중복이 없는가
- Smoke가 추천은 형식만, 나머지는 값까지 검사하는가
- 새 음식 이름 전부에 의도한 아이콘이 대응하는가
- History 간격이 고쳐졌고 주간 리포트가 없을 때 빈 간격이 없는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 Staging에서 추천이 날짜에 따라 달라지는지와 Smoke 통과를 확인한다.
