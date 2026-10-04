# TASK-055 — Recommendation Feedback (추천 피드백)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

사용자가 추천 음식 / 음악에 "좋아요 / 별로예요"를 남기고, 그 평가가 **다음 추천에 반영**되게 한다(Human이 제시한 개선 항목 3번 "추천 피드백 루프").

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-04 — 개선 항목 우선순위 2번째)
- 선행: TASK-042(사용자), TASK-048(추천 다양화, 날짜별 순환), TASK-054(계정 삭제)
- 실행: `node scripts/orchestrator/run.mjs TASK-055`

## Human 지시 (2026-10-04)

"추천 피드백 루프 — 사용자가 추천이 맞았는지 평가하는 UI 추가, 평가 결과를 다음 추천 품질 개선에 반영."

- 추천은 계속 **규칙이 결정**한다(LLM이 고르지 않는다). 피드백은 규칙 안에서 후보를 고르는 순서에만 영향을 준다.
- Score / 기분 / 상황 판정 규칙, 추천 개수(음식 5, 음악 5), Check-in API 응답 형식은 바꾸지 않는다.

## 현재 구조 (Claude 세션 확인)

- `WellnessRulePolicy.select(mood Pool, context Pool, epochDay, key)`: 기분 Pool에서 3개, 상황 Pool에서 2개를 날짜 기준 시작 위치부터 순서대로 고르고, 겹치면 건너뛴다. Key는 음식은 이름, 음악은 `videoId`.
- 추천은 Check-in을 저장할 때 정해져 DB에 들어간다. 이미 저장된 기록의 추천은 바뀌지 않는다.
- 사용자는 Session의 `UserIdentity`로 구분한다. 체험 계정은 id 1 / provider `guest`의 공유 계정이다.
- 계정 삭제(`AccountDeletionService`)는 사용자 소유 Table을 자식 → 부모 순서로 지운다.
- Staging Smoke와 계약 Test는 체험 계정 / 피드백 없는 사용자로 Check-in을 만든다.

## 설계 (실행 기준)

### Data

- 새 Table(다음 번호 Migration): 사용자 id, 종류(`FOOD` / `MUSIC`), 항목 Key(음식 이름 또는 `videoId`, 최대 120자), 평가(`LIKE` / `DISLIKE`), 갱신 시각. `(사용자, 종류, 항목 Key)` unique. 사용자 Foreign Key. 새 Table만 추가하므로 Rolling 배포에 안전하다. H2와 MySQL Testcontainers 양쪽에서 통과해야 한다.
- 평가는 **항목 단위**로 저장한다(기록 단위가 아니다). 같은 항목이 다른 날 다시 추천되어도 같은 평가가 보인다.

### API (로그인 필요, 본인 것만)

| Method / 경로 | 동작 |
|---|---|
| `GET /api/recommendations/feedback` | 본인의 평가 목록. 200 `{ "enabled": bool, "items": [ { "kind": "FOOD" 또는 "MUSIC", "item": string, "rating": "LIKE" 또는 "DISLIKE" } ] }`. `enabled`는 이 사용자가 평가할 수 있는가(체험 계정이면 false) |
| `PUT /api/recommendations/feedback` | 요청 `{ "kind", "item", "rating" }`. `rating`이 `LIKE` / `DISLIKE`면 저장(있으면 교체), null이면 삭제. 204 |

- 검증: `kind`는 두 값만, `item`(항목 Key 문자열)은 앞뒤 공백 제거 뒤 1 ~ 120자이고 제어 문자가 없어야 한다. **현재 추천 Pool에 있는 항목 Key만 받는다**(임의 문자열 저장 방지, 없는 Key는 400).
- 체험 계정: PUT은 403(`ErrorResponse`, 고정 Code). GET은 `enabled` false와 빈 목록. 공유 계정이라 한 방문자의 평가가 다른 방문자의 추천을 바꾸면 안 된다.
- 사용자당 저장 개수는 Pool 크기를 넘을 수 없으므로 별도 한도는 두지 않는다.
- CSRF는 기존 설정 그대로다.

### 다음 추천에 반영하는 규칙 (결정적)

`select`에 사용자의 평가를 넘긴다. 평가가 없으면 **지금과 완전히 같은 결과**여야 한다(계약 예시, Smoke, 기존 Test 불변).

1. **별로예요(DISLIKE)는 건너뛴다**: Pool을 시작 위치부터 돌 때 DISLIKE 항목은 고르지 않고 다음 항목으로 넘어간다.
2. **부족하면 채운다**: DISLIKE를 빼고 필요한 개수를 채울 수 없으면(예: Pool 대부분을 싫어함), 남은 자리는 DISLIKE 항목 중에서 순환 순서대로 채운다. 추천이 5개보다 적어지지 않는다.
3. **좋아요(LIKE)는 하나를 앞세운다**: 기분 Pool에 LIKE 항목이 있으면, 순환 순서상 시작 위치에서 가장 가까운 LIKE 항목 **하나**를 기분 쪽 첫 자리에 둔다(이미 고른 3개 안에 있으면 그것을 첫 자리로 옮기고, 없으면 세 번째 자리를 그 항목으로 바꾼 뒤 첫 자리로 옮긴다). 상황 Pool도 같은 방식으로 하나를 상황 쪽 첫 자리에 둔다. LIKE만 계속 나오지 않도록 Pool마다 하나로 제한한다.
4. 한 응답 안에서 같은 항목이 두 번 나오지 않는 기존 조건을 유지한다. 난수를 쓰지 않는다.
5. 음식과 음악은 각자의 평가만 쓴다.

- 이 규칙을 문서(`docs/20-RECOMMENDATION-MUSIC-PLAYBACK.md`)에 예시와 함께 적는다.

### 계정 삭제 / 개인정보 안내

- `AccountDeletionService`가 이 Table의 본인 행도 지운다(삭제 Test에 포함).
- 개인정보 처리 안내 화면(`frontend/src/features/privacy/`)과 `docs/25-PRIVACY.md`의 "처리하는 정보"에 "추천 평가(좋아요 / 별로예요)"를 추가한다. 삭제 확인 창의 설명에도 포함한다.

### Frontend

- 공통 추천 Card(`RecommendationCards`): 음식 / 음악 각 항목에 **"좋아요" / "별로예요" 버튼 2개**(Toggle). Dashboard와 Check-in 결과 화면 모두 적용된다.
  - 상태 표시는 `aria-pressed`, 버튼 이름은 항목을 포함한다(예: "연어 샐러드 좋아요"). 아이콘(👍 / 👎)은 장식(`aria-hidden`)이고 글자 이름을 함께 둔다.
  - 누르면 바로 화면에 반영하고(낙관적 갱신) 요청이 실패하면 되돌리며 짧은 오류 문구를 보여 준다. 같은 버튼을 다시 누르면 평가를 지운다. 반대 버튼을 누르면 평가가 바뀐다.
  - `enabled`가 false(체험 계정)면 버튼을 보여 주지 않고, 추천 영역 아래에 "소셜 로그인 후 추천을 평가하면 다음 추천에 반영됩니다" 한 줄을 보여 준다.
  - 평가가 **다음 Check-in의 추천부터** 반영된다는 안내 한 줄을 버튼 근처(영역 아래)에 둔다. 지금 보이는 목록은 바뀌지 않는다.
- 평가 목록은 화면 진입 때 한 번 조회해 추천 Card에 내려 준다(Card마다 요청하지 않는다).
- 음악의 Key는 `videoId`다. `videoId`가 없는 이전 기록의 곡에는 버튼을 보여 주지 않는다.
- 390px에서 버튼이 항목 이름 / 분류 Tag와 겹치지 않게 한다. 기존 Token을 쓴다. 새 npm Dependency 없음.
- History의 추천 이름 나열에는 버튼을 넣지 않는다.

### Test

- Backend 규칙: 평가 없음 → 기존 결과와 같음(여러 기분 × 상황 × 날짜), DISLIKE 건너뜀, DISLIKE가 많아도 5개 유지, LIKE 하나가 각 Pool 첫 자리, 중복 없음, 결정적(같은 입력 같은 결과).
- Backend API: 저장 / 교체 / 삭제(null), 다른 사용자에게 보이지 않음, Pool에 없는 Key 400, 잘못된 kind / rating 400, 체험 계정 PUT 403과 GET `enabled` false, 미로그인 401, CSRF 없으면 403, 평가한 뒤 새 Check-in의 추천에 반영됨, 계정 삭제 시 함께 삭제. H2와 MySQL.
- 계약 Test: 새 API 예시. **기존 Check-in 예시는 그대로 통과**해야 한다.
- Frontend: 버튼 Toggle과 `aria-pressed`, 실패 시 되돌림, 체험 계정에서 버튼 없음과 안내, `videoId` 없는 곡에 버튼 없음.

### 문서

- `docs/05-API_SPEC.md`와 `contracts/`: 새 API 예시.
- `docs/20-RECOMMENDATION-MUSIC-PLAYBACK.md`: 피드백 반영 규칙.
- `docs/25-PRIVACY.md`, `docs/22-AUTH.md`(삭제 대상 추가).
- `docs/09-DECISIONS.md`: 새 Decision(최신 번호 다음, Human Approved 2026-10-04)과 DEC-014 변경 이력.
- `docs/07-TASKS.md`: TASK-055 행과 절 추가, DONE(Milestone 55, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, README 기능 소개 한 줄, `prompts/`.

### Secret 검사 주의

- `token` / `secret` / `password` / `key`로 끝나는(뒤에 영숫자가 붙어도 포함) 이름 뒤에 콜론이나 등호와 값이 오면 차단된다. 대소문자를 가리지 않는다.
  - 그래서 API의 Field 이름은 **`item`**이다(`Key`로 끝나는 이름을 쓰지 않는다). DB Column은 `item_name`처럼, 변수는 `item`, `itemId`, `name`처럼 짓는다. Java / TypeScript의 대입문과 JSON 예시에서 위 단어로 끝나는 이름을 쓰지 않는다.
  - 그래도 걸리는 표기가 꼭 필요하면 구현하지 말고 정확한 문구를 `human_decisions_needed`로 보고한다.

### 금지

- Dependency / Infra / Smoke Script 변경
- 판정 규칙, 추천 개수, Check-in 응답 형식, 기존 계약 예시 변경
- 체험 계정의 평가 저장, LLM 관련 Code 변경, 난수 사용

### 참고 (Executor Sandbox)

- Sandbox에서 Gradle / npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.
- 지난 Task들에서 반복된 실수에 주의한다: Java의 괄호 짝 / Type 불일치(`Optional`에 다른 Type 기본값), Test의 `tsc --noEmit` 타입 오류, CSS를 `?raw`로 읽는 Test(빈 문자열), 같은 Spring Context를 쓰는 다른 Test의 상태를 바꾸는 Test(`csrf()` 대신 기존 Test가 쓰는 방식 확인, 만든 Data 정리), 여러 fetch에 같은 `Response` 객체를 돌려주는 mock.

## Run 2 범위 (2026-10-05, Claude 세션 기록)

Run 1 구현은 Branch에 "검토 미완료 WIP"로 Commit되어 있다. Run 1은 Orchestrator Verify의 Backend Test 단계에서 멈췄다(Review 전). **구현 문제가 아니라 환경 문제**였다: Gradle Cache 잠금을 다른 Process가 쥐고 있어 "Timeout waiting to lock jars"로 Build가 시작되지 못했다(남아 있던 Gradle Daemon). Frontend Test 220건과 Build는 통과했다.

- Claude 세션이 Gradle Daemon을 정리한 뒤 WIP 상태에서 `backend`의 `gradlew test bootJar`를 Sandbox 밖에서 실행했고 통과했다. `scripts/container-smoke.sh`는 아직 실행하지 않았다.
- Run 2에서 할 일: 구현을 다시 읽어 Task 설계(특히 평가가 없을 때 결과 불변, 체험 계정 차단, Pool에 있는 항목만 저장, 계정 삭제 포함)와 맞는지 확인하고, 고칠 것이 있으면 고친다. `docs/08-WORK_LOG.md`와 `prompts/`에 Run 2 기록을 추가한다. Sandbox에서 Gradle을 실행하려고 시도하지 않는다(Daemon이 남아 다음 검증을 막는다).

## Verification

- `bash scripts/verify.sh`
- `bash scripts/container-smoke.sh`
- `git diff --check`

## Claude Review 기준

- 평가가 없을 때 추천 결과가 기존과 같은가(계약 / Smoke 불변)
- 반영 규칙이 결정적이고 항상 5개이며 중복이 없는가
- 본인 평가만 읽고 쓰는가, 체험 계정이 막혀 있는가, 임의 Key를 저장할 수 없는가
- 계정 삭제와 개인정보 안내에 반영됐는가
- 버튼의 접근성(이름, `aria-pressed`)과 실패 시 되돌림

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 화면 캡처로 확인하고, Merge 뒤 Staging에서 평가 → 새 Check-in의 추천 변화를 확인한다.
