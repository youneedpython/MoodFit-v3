# TASK-036 — 추천 5개 확대와 추천 음악 바로 듣기 (YouTube 영상 연동)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Check-in 결과의 추천 음식과 추천 음악을 각각 2개에서 **5개**로 늘리고, 추천 음악을 가상의 Playlist 이름이 아닌 **실제 곡**으로 바꿔 화면에서 **바로 재생**할 수 있게 한다.

Human이 2026-10-04 Staging 화면을 확인한 뒤 지시했다. TASK-028 / TASK-029와 병행해 별도 저장소 사본에서 개발하고, Merge 후 Staging CD로 재배포한다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 승인, 2026-10-04)
- 선행: 없음(main 기준). Merge 순서는 TASK-028 → TASK-029 → TASK-035 → TASK-036이다.
- 실행: `node scripts/orchestrator/run.mjs TASK-036` (병행 개발용 저장소 사본)

## Human 결정 (2026-10-04, Gate B / C 사전 승인)

1. **추천 개수**: 음식 5개, 음악 5개. 구성은 상태(Mood) 기준 3개 + 날씨 / 기온 상황(Context) 기준 2개다. 기존 판정 규칙(Wellness Score, Mood, Context 결정)은 바꾸지 않는다. DEC-014의 추천 규칙 중 "항목 수와 항목 내용"만 바꾼다.
2. **추천 음악**: 가상의 Playlist 대신 실제 곡을 쓴다. 곡마다 YouTube 영상 ID를 가진다. 아래 "승인된 곡 목록"만 사용한다(Claude 세션이 2026-10-04 YouTube oEmbed로 영상 존재와 외부 재생 허용을 확인했다). 다른 영상 ID를 만들어 넣지 않는다.
3. **재생 방식**: 추천 음악 카드에서 재생 동작을 실행하면 그 자리에 YouTube 내장 Player(iframe)를 불러와 재생한다.
   - 사용자가 재생을 누르기 전에는 iframe을 만들지 않는다(초기 화면에서 YouTube로 요청이 나가지 않는다). 재생 전에는 곡 제목 / 가수 / 재생 버튼만 보여 준다.
   - iframe 주소는 `https://www.youtube-nocookie.com/embed/<videoId>` 형식이며, videoId는 API 응답 값을 정해진 형식(영문 / 숫자 / `_` / `-` 11자)으로 검증한 뒤에만 쓴다. 형식이 맞지 않으면 재생 버튼을 보여 주지 않는다.
   - 보조 수단으로 "YouTube에서 열기" 링크(해당 영상 주소, 새 탭, `rel="noopener noreferrer"`)를 함께 둔다. 영상이 삭제되거나 재생이 막힌 경우에도 사용자가 이동할 수 있다.
4. **API 계약 변경** (DEC-024): 추천 음악 항목에 영상 ID 필드 `videoId`(문자열, 없을 수 있음)를 추가한다. `foods` / `music` 배열 길이가 5가 된다. `contracts/`의 예시 파일, `docs/05-API_SPEC.md`, Frontend / Backend 계약 Test를 함께 갱신한다. 다른 필드는 바꾸지 않는다.
5. **DB Schema 변경** (DEC-019): 추천 음악 Table에 영상 ID 열을 추가하는 Flyway Migration `V2`를 만든다. **기존 `V1` 파일은 고치지 않는다.** 새 열은 NULL 허용이다(기존 기록 호환). 파괴적 변경(열 삭제 / 형식 변경 / 데이터 삭제)은 하지 않는다. 기존 기록(영상 ID 없음, 추천 2개)은 그대로 조회되어야 하고 화면은 영상 ID가 없으면 재생 버튼 없이 표시한다.
6. **새 Dependency 없음**: `backend/build.gradle`, `frontend/package.json` / `package-lock.json`은 바꾸지 않는다. YouTube Player는 iframe만 쓰고 외부 Script를 불러오지 않는다.
7. **저작권 / 이용 조건**: YouTube 공식 내장 Player를 통해서만 재생한다. 음원 파일을 내려받거나 저장소에 넣지 않는다.

### 승인된 곡 목록 (YouTube 영상 ID, 2026-10-04 oEmbed 확인)

상태(Mood) 기준 — 각 3곡:

| Mood | 곡 | 가수 | videoId |
|---|---|---|---|
| TIRED | Weightless | Marconi Union | `UfcAVejslrU` |
| TIRED | Clair de Lune | Claude Debussy | `CvFH_6DNRCY` |
| TIRED | River Flows in You | Yiruma | `7maJOI3QMu0` |
| ENERGETIC | Uptown Funk | Mark Ronson ft. Bruno Mars | `OPf0YbXqDm0` |
| ENERGETIC | Can't Stop the Feeling! | Justin Timberlake | `ru0K8uYEZWw` |
| ENERGETIC | Dynamite | BTS | `gdZLi9oWNZg` |
| CALM | Canon in D Major | Johann Pachelbel | `NlprozGcs80` |
| CALM | Perfect | Ed Sheeran | `2Vv-BfVoq4g` |
| CALM | All of Me | John Legend | `450p7goxZqg` |
| BALANCED | Counting Stars | OneRepublic | `hT_nvWreIhg` |
| BALANCED | Sugar | Maroon 5 | `09R8_2nJtjg` |
| BALANCED | Memories | Maroon 5 | `SlPhMPnQ58k` |

상황(Context) 기준 — 각 2곡:

| Context | 곡 | 가수 | videoId |
|---|---|---|---|
| COLD, SNOW | Let It Go | Idina Menzel | `L0MK7qz13bU` |
| COLD, SNOW | Thinking Out Loud | Ed Sheeran | `lp-EO5I60KA` |
| HOT | Despacito | Luis Fonsi ft. Daddy Yankee | `kJQP7kiw5Fk` |
| HOT | Waka Waka (This Time for Africa) | Shakira | `pRpeEdMmmQ0` |
| RAIN | Someone Like You | Adele | `hLQl3WQQoQ0` |
| RAIN | Wonderwall | Oasis | `bx1Bh8ZvH84` |
| CLEAR | Happy | Pharrell Williams | `ZbZSe6N_BXs` |
| CLEAR | Shake It Off | Taylor Swift | `nfWlot6h_JM` |
| CLOUDY | Paradise | Coldplay | `1G4isv_Fylg` |
| CLOUDY | Hymn for the Weekend | Coldplay | `YykjpeuMNEk` |

곡마다 기존 형식에 맞춰 Tag(분위기)와 추천 이유(한글 한 문장)를 붙인다. 한 응답 안에서 같은 곡이 중복되지 않는다(위 목록은 Mood와 Context 사이에 겹치는 곡이 없다).

### 추천 음식

상태 기준 3개 + 상황 기준 2개로 늘린다. 기존 항목을 유지하고 같은 형식(이름, Tag, 이유)으로 새 항목을 추가한다. 내용은 일반적인 식사 제안 수준으로 쓰고 의학적 효능 / 치료 표현을 쓰지 않는다(기존 문서의 건강 정보 표현 원칙 유지). 한 응답 안에서 같은 음식이 중복되지 않게 한다.

## Codex 작업 범위

1. Backend: `WellnessRulePolicy`의 추천 생성(5개), 추천 음악 값 / Entity / 응답 DTO에 영상 ID 추가, Flyway `V2` Migration, 저장 / 조회(최신, History) 반영. 기존 Test 갱신과 추가(Mood × Context 조합별 개수 5, 중복 없음, 영상 ID 형식, 기존 2개짜리 기록 조회 호환, MySQL 통합 Test에서 V2 Migration 적용).
2. API 계약: `contracts/` 예시(생성 201, 최신 200, History 200), `docs/05-API_SPEC.md`, 계약 Test(Frontend `apiSpecSync` 포함) 갱신.
3. Frontend: 추천 카드 5개 표시(Dashboard, Check-in 결과, History에서 추천을 보여 주는 곳), 음악 카드의 재생 동작과 보조 링크(결정 3), 타입 갱신, 반응형 배치, 접근성(버튼 이름, iframe `title`), Test(재생 전 iframe 없음, 재생 시 올바른 주소, 잘못된 videoId 차단, 영상 ID 없는 기록 표시, 5개 표시).
4. 문서: `docs/20-RECOMMENDATION-MUSIC-PLAYBACK.md`(규칙 변경, 곡 목록 관리 방법, 영상이 삭제될 때의 대응, 개인정보 / 외부 요청 시점), README 기능 소개, `docs/08-WORK_LOG.md`.
5. **수정하지 않는 것**: `docs/07-TASKS.md`, `AGENTS.md`, `docs/09-DECISIONS.md`. 병행 개발 중이므로 Task 등록, Decision 기록(DEC-014 / DEC-019 / DEC-024 변경 이력), 완료 반영은 Claude 세션이 Merge 시점에 정리한다. 필요한 Decision 문안은 `docs/20`에 "Decision 기록 초안"으로 적어 둔다.
6. `scripts/container-smoke.sh`와 `scripts/staging-smoke.sh`는 이 저장소 사본의 금지 경로다. API 응답 형식 변경으로 Smoke Script 수정이 필요하면 구현하지 않고 `handoff_actions`가 아닌 문서(`docs/20`)에 필요한 변경을 적는다.
7. 새로 Human 결정이 필요한 사항만 `human_decisions_needed`로 보고한다(예: 판정 규칙 자체를 바꿔야 하는 경우, 파괴적 Migration이 필요한 경우, 새 Dependency가 필요한 경우).

## Run 1 결과와 Run 2 작업 범위 (2026-10-04, Claude 세션 기록)

Run 1: Codex가 Backend(추천 5개, 영상 ID, `V2` Migration), API 계약, Frontend(카드 5개, 재생), 문서를 작성했다. Verify의 `scripts/verify.sh`가 Backend Test 1건 실패로 **BLOCKED** 했다(74개 중 1개 실패, 1개는 CI 전용 Test로 건너뜀). 작업 폴더 상태는 검토 미완료 WIP로 Commit했다.

- 실패 Test: `WellnessRulePolicyTests`의 Parameter 사례 `COLD`. 추천 이유 문구의 기대값과 실제 값이 다르다. 기대값에는 같은 구절이 두 번 반복되어 있고("…낮거나 …낮거나 눈 오는 날에…" 형태), 실제 값은 한 번이다. 구현과 Test 중 어느 쪽이 승인된 문구인지 확인해 맞춘다. COLD와 SNOW가 같은 곡을 공유하므로 상황별 이유 문구가 어떻게 만들어지는지(조건식) 점검한다.

Run 2 Codex 작업 범위:

1. 위 실패를 고친다. 문구는 자연스러운 한글 한 문장이어야 하고 같은 구절이 반복되지 않아야 한다.
2. Backend Test 전체(`./gradlew test`에 해당하는 범위)가 통과하도록 다른 Test의 기대값도 점검한다. Executor Sandbox에서 Docker가 필요한 통합 Test는 실행할 수 없으므로, Docker 없이 실행되는 Test는 직접 실행해 확인하고 결과를 verification에 적는다.
3. 그 밖의 범위는 WIP 상태를 유지한다.

## 제외 범위

- Wellness Score / Mood / Context 판정 규칙 변경
- YouTube Data API 사용, API Key, 외부 Script 로드
- 음식 사진 / 외부 음식 API
- 로그인 / 사용자 구분 (별도 Task)
- CloudFormation / CI / CD 변경

## Verification

- `bash scripts/verify.sh` (Frontend / Backend Test·Build, MySQL 8.4.11 Testcontainers 통합 Test, 계약 Test)
- `bash scripts/container-smoke.sh` (Container에서 Migration 적용과 Health 확인)
- `git diff --check`

## Claude Review 기준

- 판정 규칙이 바뀌지 않았는가, 추천이 항상 5개이고 중복이 없는가
- 승인된 곡 목록과 영상 ID가 정확히 일치하는가(임의 ID 없음)
- Migration이 비파괴적이고 `V1`을 고치지 않았는가, 기존 기록이 그대로 조회되는가
- API 계약 / 문서 / 예시 / Test가 서로 일치하는가
- videoId를 검증 없이 iframe 주소나 링크에 넣지 않는가, 재생 전에 외부 요청이 나가지 않는가
- 새 Dependency가 없는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 Staging CD로 배포해 화면에서 재생을 확인하고(영상 촬영), Claude 세션이 Task 등록과 Decision 기록, 완료 반영을 정리한다.
