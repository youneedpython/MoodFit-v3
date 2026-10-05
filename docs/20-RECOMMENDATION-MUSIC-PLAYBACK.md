# TASK-036 — 추천 확대와 음악 재생

## TASK-055 / TASK-068 추천 평가 (DEC-042 / DEC-046)

소셜 사용자와 체험 계정의 음식 이름 / 음악 videoId별 좋아요 / 별로예요는 다음 Check-in의 후보 순서에만 반영한다. 기존 기록은 바꾸지 않으며 평가가 없으면 기존 날짜 순환 결과와 같다. 체험 계정의 평가는 기록과 마찬가지로 모든 방문자가 함께 쓰며 다른 방문자의 화면과 다음 추천에도 반영된다. 소셜 사용자의 평가와는 사용자 번호로 격리한다.

각 Pool에서 서울 날짜의 시작 위치부터 한 바퀴 돌며 DISLIKE를 건너뛰고 기분 3개 / 상황 2개를 고른다. 부족하면 DISLIKE 중 중복되지 않는 항목을 같은 순환 순서로 채운다. 음식 / 음악 각각 항상 5개이며 난수는 쓰지 않는다.

각 Pool에서 순환 순서의 가장 가까운 LIKE 하나를 첫 자리로 옮긴다. 선택 밖이면 그 Pool의 마지막 자리를 교체하고 첫 자리로 옮긴다. 기분 Pool에서 이미 선택한 항목은 상황 Pool에서 건너뛰고 다음 사용 가능한 LIKE를 찾는다. 나머지 자리의 순환 순서는 유지한다. 음식 평가와 음악 평가는 분리한다.

예시(이름은 규칙 설명용): 기분 Pool `[A,B,C,D,E]`, 상황 Pool `[E,F,G,H,I]`, 시작 위치 0이면 기본 `[A,B,C,E,F]`다. A를 싫어하면 `[B,C,D,E,F]`; E와 H를 좋아하면 기분에서 E를 앞세우고 상황에서 중복 E를 건너뛰어 `[E,A,B,H,F]`다. 모두 싫어해도 순환 보충으로 `[A,B,C,E,F]`를 유지한다. 이미 선택한 C와 F를 좋아하면 `[C,A,B,F,E]`다.

Dashboard / 결과 진입에서 한 번 조회하여 공통 Card에 내려준다. 버튼은 항목 이름과 눌림 상태를 제공하며 요청 중 같은 항목의 추가 변경을 막는다. 화면에는 먼저 반영하고 실패 시 이전 평가를 복구한다. 체험 계정에는 모든 방문자가 평가를 함께 쓰며 다음 Check-in부터 반영된다는 안내, 소셜 사용자에게는 다음 Check-in부터 반영된다는 기존 안내를 보여 준다. videoId 없는 이전 곡과 History에는 평가 버튼이 없다.

2026-10-04 Human이 승인한 Task Contract의 Gate B / C 결정을 구현한다. Executor 구현 완료는 Orchestrator Verify, Claude Review, Remote CI 또는 Human Merge 승인을 대신하지 않는다.

## 추천 규칙

TASK-061: 재생 / 닫기 아이콘은 곡 제목 왼쪽에 둔다. 같은 버튼으로 Player를 펼치거나 제거하며 aria-expanded와 곡 이름을 포함한 접근성 이름 / title을 제공한다. 별도 재생 닫기 글자 버튼은 없다. YouTube Link는 가수와 같은 줄에 “가수 · YouTube에서 열기”로 표시한다. 버튼과 Link는 기존 터치 영역 Token을 사용한다. Player는 추천 이유 아래에서 클릭 후에만 생성하며 기존 iframe 속성 / Link 주소 / 새 탭 / rel / 접근성 이름을 유지한다. 영상 ID가 없으면 재생 버튼과 Link를 표시하지 않는다. 768px 미만에서는 이름과 평가를 첫 줄, Badge를 둘째 줄에 두고 그 이상에서는 한 줄에 배치한다.

새 Check-in은 음식과 음악을 각각 5개 생성한다. 순서는 Mood 3개 → Context 2개다. Wellness Score 계산, Mood 우선순위와 경계값, 기온 우선 Context 선택, Summary 문장은 DEC-014 그대로 유지한다. TASK-048 이후 음식은 확대된 후보 Pool에서 서울 날짜별로 선택한다. 기존 항목은 후보로 유지한다. 한 응답 내 음식 이름 / 곡 / 영상 ID는 중복되지 않는다.

History는 DEC-020의 `foodNames` / `musicTitles` 목록을 유지하고 5개 제목을 모두 표시한다. 영상 메타데이터가 없는 History에는 재생 UI를 추가하지 않는다. Dashboard와 Check-in 결과는 같은 추천 카드로 곡 제목, 가수, Tag, 이유와 재생을 제공한다.

## 승인된 곡 목록

2026-10-04 Claude 세션이 oEmbed로 존재와 외부 재생 허용을 확인한 목록이다. Executor는 외부 조회 없이 Contract의 값만 사용했다.

| 기준 | 곡 | 가수 | videoId |
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

곡 목록은 `WellnessRulePolicy`와 독립 승인 목록 Fixture를 둔 `RecommendationMatrixTests`에서 관리한다. 추가 / 교체는 Human의 승인된 목록 변경 후 코드, 계약 예시, API 문서와 테스트를 함께 갱신한다. 임의 영상 ID 생성, YouTube Data API, 외부 Script와 음원 다운로드는 사용하지 않는다.

## 재생과 개인정보

사용자가 바로 듣기를 누르기 전에는 iframe, 썸네일, 외부 Script, preconnect를 생성하지 않는다. 화면의 보조 링크도 클릭 전에는 요청을 보내지 않는다. 재생 시에만 `https://www.youtube-nocookie.com/embed/<videoId>?autoplay=1` iframe을 생성한다. 브라우저 정책에 따라 자동 재생은 제한될 수 있으며 내장 Player에서 재생할 수 있다. 재생 닫기는 iframe을 제거한다.

API의 `videoId`가 문자열이고 정확히 11자이며 영문 / 숫자 / `_` / `-`만 포함할 때 iframe과 보조 링크에 쓴다. 형식이 잘못됐거나 null / 생략되면 텍스트만 보여 준다. 버튼에는 곡 / 가수 이름, iframe에는 곡 / 가수를 포함한 title이 있다. 보조 링크는 새 탭과 `noopener noreferrer`를 사용한다.

nocookie 도메인 사용이 외부 요청 자체를 없애지는 않는다. 재생하면 브라우저가 YouTube에 연결되며 IP와 재생 관련 정보가 전달될 수 있다. 해당 서비스의 이용 조건이 적용된다. 삭제, 지역 제한, 내장 재생 금지는 앱에서 자동으로 판단하지 않으며 카드의 YouTube에서 열기 링크로 이동할 수 있다. 삭제된 영상은 링크에서도 사용할 수 없으므로 담당자가 새 영상의 존재 / 내장 재생 가능 여부를 확인하고 Human 승인 후 목록을 교체한다. 기존 저장 기록은 임의로 덮어쓰지 않는다.

## 저장과 기존 기록

Flyway `V2__add_music_video_id.sql`은 추천 음악 Table에 nullable `VARCHAR(11)` 열 하나를 추가한다. `V1`은 수정하지 않는다. 기존 2개 추천과 null 영상 ID를 그대로 저장 / 조회하며 새 추천만 승인된 ID를 저장한다. 최신 응답의 `videoId`는 기존 기록에서 null 또는 생략될 수 있다. 스키마를 자동으로 되돌리거나 열을 삭제하지 않는다.

## 검증과 후속 확인

- 기존 판정 경계값 회귀 테스트, Mood × Context 24개 조합의 5개 / 중복 / 승인 곡 일치 테스트를 추가했다.
- H2에서 V1 기록을 넣은 뒤 V2를 적용해 기존 제목과 null ID 보존을 검증하는 테스트를 추가했다.
- MySQL 8.4.11 통합 테스트는 V1 / V2 적용, nullable 열, 새 ID 저장 / 최신 조회, 기존 2개 기록의 최신 / History API 호환을 확인한다.
- Frontend 테스트는 5개 표시, 클릭 전 iframe 없음, 클릭 후 주소, 링크 속성, 잘못된 ID / 기존 기록, Player 닫기 / 추천 변경을 확인한다. 문서 예시와 계약 파일도 함께 비교한다.
- Executor 참고 실행에서 `scripts/verify.sh`는 npm 캐시 접근 EPERM으로 설치 단계가 중단됐다. Backend 단독 Test도 Gradle Wrapper의 Sandbox 밖 lock 디렉터리 생성 제한으로 실행되지 못했다. Container Smoke는 JAR 미생성과 Docker 접근 제한으로 수행되지 않았다. 통과를 주장하지 않으며 최종 기준은 Sandbox 밖 Orchestrator Verify다.
- TASK-048에서 두 Smoke Script에 추천 형식 검사를 반영했다. Container Smoke는 Health / 이미지 / DB 장애 검사를 유지하며 생성 / 최신 / History 본문 계약도 검사한다. 기존 저장 기록의 두 항목 추천은 기존 호환 Test에서 검증하며 Smoke는 새 합성 기록의 5개를 검사한다.
- Merge 순서는 TASK-028 → TASK-029 → TASK-035 → TASK-036이다. Merge 후 Staging CD와 실제 영상 재생 / 촬영을 확인한다. 화면 캡처 기본 위치 `docs/images/task-036/`는 이 Contract의 allowed_paths 밖이므로 Executor는 캡처 파일을 작성하지 않았다. 승인된 Claude 세션 / Human이 390 / 768 / 1280px 화면 검토와 기록을 수행한다.

## Decision 기록 초안

Claude 세션이 Merge 시점에 다음 변경 이력을 정리한다. 이 문안은 새 승인이나 Decision 원본 변경을 대신하지 않는다.

- DEC-014: 2026-10-04 Human 승인으로 추천 항목 수 / 내용만 변경. 음식·음악 각각 Mood 3개 + Context 2개, 음악은 TASK-036 승인 실제 곡 목록 사용. 기존 판정과 Summary 유지.
- DEC-019: nullable 음악 영상 ID 열을 비파괴적 V2로 추가. V1 불변, 기존 2개 추천과 영상 ID 없는 기록 보존.
- DEC-024: 음악 항목에 선택적 `videoId` 추가, 새 생성 / 최신 추천 예시는 5개, History 이름 / 제목 목록은 동일 필드로 5개 제공. 계약 예시 / 문서 / Frontend / Backend 테스트 동기화.

`docs/07-TASKS.md`, `AGENTS.md`, `docs/09-DECISIONS.md`의 Task 등록 / 완료 반영은 병행 개발 Merge 시점에 Claude 세션이 정리한다.


## TASK-048 날짜별 추천 다양화

Human Approved 2026-10-04 / DEC-040. 음식 기분 Pool은 각각 8개, 상황 Pool은 각각 6개다. 음악 기분 Pool은 TIRED 13곡 / ENERGETIC 26곡 / CALM 13곡 / BALANCED 14곡, 상황 Pool은 COLD 7곡 / HOT 8곡 / RAIN 9곡 / SNOW 6곡 / CLEAR 10곡 / CLOUDY 9곡이다. Pool은 Code의 상수이며 DB / 설정 파일로 옮기지 않는다.

주입된 Clock의 시각을 Asia/Seoul 날짜로 변환한 epochDay가 기준이다. 음식과 음악은 각자 Pool 크기로 나눈 나머지부터 기분 3개, 상황 2개를 순서대로 고른다. 끝에서는 처음으로 돌아가고 상황에서 이미 고른 항목이면 다음으로 넘어간다. 음식 이름과 음악 videoId로 중복을 제거한다. 같은 서울 날짜 / 기분 / 상황이면 결과가 같고 날짜가 바뀌면 시작 위치가 한 칸 옮겨 간다. UTC 15시가 서울 날짜 경계다.

추천은 생성 시 저장하며 이후 최신 / History 조회에서 다시 고르지 않는다. Score / 상태 / 상황 판정과 요약은 그대로이며 음식 / 음악 각각 5개와 기존 API 응답 형식을 유지한다. 계약 예시는 2026-09-28T03:00:00Z (서울 2026-09-28, epochDay 20724)의 결과로 동기화했다.

### 추가 승인 곡

Claude 세션이 YouTube oEmbed로 영상 존재 / embed 가능 / 제목 일치를 확인했다(2026-10-04). Executor는 Contract의 제목 / 가수 / ID를 그대로 반영했으며 외부 재조회는 수행하지 않았다. 기존 곡도 후보에 유지한다.

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

### Smoke / 아이콘 / 화면 검증

두 Smoke는 foods / music / foodNames / musicTitles의 5개, 예시와 같은 키 집합과 값 타입을 검사한다. videoId는 11자 문자열 또는 null이다. Score / 기분 / 요약 / 지표 / 날씨 등은 기존 예시와 값까지 비교한다. 요약은 추천 후보와 무관하므로 값 비교를 유지한다. 최신 본문은 생성 본문과 동일해야 한다. Cookie / Token은 출력하지 않는다.

Backend Test는 후보 크기, 승인된 제목 / 가수 / ID 전체 집합, 24조합 × 366일의 결정성 / 하루 이동 / 중복 없음, 끝에서 처음으로 순환과 상황 중복 건너뛰기, 서울 날짜 경계를 검사한다. DEC-014 판정 경계 Test는 epochDay 0의 고정 Clock으로 기존 기준을 유지한다. Frontend는 Backend 후보 전체 51개 메뉴의 기대 Emoji를 이름별로 고정하고, 짧은 낱말의 부분 일치를 피한다. History는 주간 리포트와 기존 Card를 동일한 .history / --space-4 레이아웃에 두며 꺼진 리포트가 null이면 빈 간격이 없다.

자체 Test / Build는 Sandbox 제약으로 실행되지 않았으며 Orchestrator Verify가 기준이다. 390 / 768 / 1280px 화면 캡처는 실행 가능한 Frontend 환경에서 승인된 Claude 세션 / Human이 확인하고 docs/images/task-048/에 기록한다. Merge 후 Staging에서 날짜별 추천과 Smoke를 확인한다.

### TASK-052 선곡 조정 (2026-10-04 Human 승인)

- Hype Boy: TIRED / CALM / SNOW / CLOUDY에서 빼고 ENERGETIC / HOT 끝에 추가해 밝은 활력에 맞췄다.
- 양화대교: ENERGETIC / HOT에서 빼고 CALM / CLOUDY 끝에 추가해 차분한 분위기에 맞췄다. BALANCED는 유지한다.
- Just the Way You Are: ENERGETIC에서 빼고 CALM 끝에 추가해 차분한 흐름에 맞췄다. BALANCED는 유지한다.
- Hello: TIRED에서 빼고 RAIN에 유지해 비 오는 날의 감성에 집중한다.
- Someone You Loved: TIRED에서 빼고 RAIN에 유지해 비 오는 날의 감성에 집중한다.
- 어떻게 이별까지 사랑하겠어, 널 사랑하는 거지: TIRED / CLOUDY에서 빼고 CALM / RAIN에 유지해 차분한 감성에 맞췄다.
- As It Was: ENERGETIC 끝에 Hype Boy 다음으로 추가해 밝은 흐름을 보완한다. BALANCED / CLOUDY는 유지한다.

곡 제목 / 가수 / videoId는 유지하고 목적지의 기존 tag / reason을 사용한다. 크기는 TIRED 9, ENERGETIC 26, CALM 14, BALANCED 14, COLD 7, SNOW 5, HOT 8, RAIN 9, CLEAR 10, CLOUDY 8이다. ENERGETIC 앞 5곡과 RAIN 전체 순서 / 내용, 음식과 선택 규칙을 유지하므로 epochDay 20724 계약 예시는 바뀌지 않는다. Container Smoke의 성공 문구에서 검사하지 않는 400 표기만 제거했다.
