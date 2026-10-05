# TASK-068 — Guest Feedback (체험 계정의 추천 평가)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

체험 계정("로그인 없이 둘러보기")에서도 추천에 좋아요 / 별로예요를 남길 수 있게 한다. 지금은 소셜 로그인 사용자만 평가할 수 있어, 로그인 없이 둘러보는 방문자는 이 기능을 써 볼 수 없다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-055(추천 평가), TASK-058(평가 아이콘)
- 실행: `node scripts/orchestrator/run.mjs TASK-068`

## Human 결정 (2026-10-05, Gate B — 제품 규칙 변경)

"체험계정도 '좋아요 / 별루예요' 추가 → 개선 후 영상 촬영". TASK-055(DEC-042)에서 체험 계정의 평가를 막았던 결정을 바꾼다.

Claude 세션이 정한 세부(Human에게 알림):

- 체험 계정은 하나의 공유 계정이다. 평가도 기록과 마찬가지로 **모든 방문자가 함께 쓴다.** 누군가 남긴 평가가 다른 방문자의 화면과 다음 추천에 그대로 반영된다. 화면에 이 사실을 안내한다.
- 평가를 반영하는 규칙(별로예요는 건너뜀, 모자라면 채움, 좋아요는 묶음마다 하나씩 앞자리)은 바꾸지 않는다. 소셜 사용자와 같은 규칙이다.

## 현재 구조 (Claude 세션 확인)

- `backend/src/main/java/com/moodfit/service/RecommendationFeedbackService.java`
  - `enabled(identity)`: 사용자 번호가 1(체험 계정)이거나 Provider가 `guest`이면 `false`.
  - `get`: 사용할 수 없으면 `{ enabled: false, items: [] }`.
  - `put`: 사용자 행을 잠그고(`FOR UPDATE`), 체험 계정이면 `AccessDeniedException`(403).
- Check-in 생성 때 추천을 고르는 쪽도 `enabled`를 보고 체험 계정의 평가를 쓰지 않는다(Check-in 처리 코드에서 `RecommendationFeedbackService`를 쓰는 곳을 확인한다).
- `frontend/src/features/dashboard/RecommendationCards.tsx`: `feedback.data.enabled`가 거짓이면 평가 묶음을 그리지 않고 "소셜 로그인 후 추천을 평가하면 다음 추천에 반영됩니다"를 보여 준다.
- 계정 삭제(`AccountDeletionService`)는 체험 계정을 막는다. 체험 계정의 평가를 지우는 경로는 없다.
- 개인정보 처리 안내(`PrivacyPage.tsx`, `docs/25-PRIVACY.md`)의 "체험 계정 주의"는 기록이 공유된다는 점만 말한다.

## 설계 (실행 기준)

### 1. Backend

- 체험 계정도 평가를 **읽고 쓸 수 있게** 한다: `GET /api/recommendations/feedback`이 `enabled: true`와 체험 계정에 저장된 평가를 돌려주고, `PUT`이 저장 / 변경 / 삭제를 처리한다.
- 응답에 **`shared`(boolean)** Field를 더한다: 체험 계정이면 `true`, 그 밖에는 `false`. Frontend가 안내 문구를 고르는 데 쓴다. 기존 Field(`enabled`, `items`)는 그대로 둔다.
- Check-in 생성 때 체험 계정의 평가도 추천에 반영한다(소셜 사용자와 같은 규칙, 같은 코드 경로).
- 저장할 수 있는 항목의 제한(현재 추천 후보에 있는 항목만), 요청 검증, CSRF, 로그인 요구는 그대로다.
- 사용자 행 잠금(`FOR UPDATE`)은 유지한다. 여러 방문자가 동시에 같은 항목을 평가해도 오류 없이 마지막 요청이 남아야 한다.
- 계정 삭제는 지금처럼 체험 계정을 막는다. 체험 계정의 평가는 방문자가 반대 버튼이나 같은 버튼을 다시 눌러 바꾸거나 지울 수 있을 뿐이다.
- DB Schema는 바꾸지 않는다(Migration 없음). `recommendation_feedback`은 사용자 번호별로 저장하므로 체험 계정(사용자 번호 1)의 행이 생길 뿐이다.

### 2. Frontend

- 체험 계정에서도 추천 항목마다 평가 아이콘 묶음(TASK-058의 모양)이 보인다. 동작(저장, 지우기, 바꾸기, 저장 중 비활성화, 실패 시 되돌림)은 소셜 사용자와 같다.
- 목록 아래 안내 문구
  - `shared`가 `true`: **"체험 계정의 평가는 모든 방문자가 함께 씁니다. 다음 Check-in의 추천부터 반영됩니다."**
  - `shared`가 `false`: 지금 문구("평가는 다음 Check-in의 추천부터 반영됩니다. 지금 보이는 목록은 유지됩니다.")
  - `enabled`가 `false`(기능을 쓸 수 없는 그 밖의 경우): 지금의 소셜 로그인 안내 문구를 남긴다. 체험 계정에는 더 이상 이 문구가 나오지 않는다.
- Type(`frontend/src/types/api.ts`)에 `shared`를 더한다. 응답에 `shared`가 없으면 `false`로 본다.

### 3. 계약과 Smoke

- `contracts/`의 평가 조회 예시에 `shared`를 더하고, 체험 계정 예시(`enabled: true`, `shared: true`)를 하나 더한다. API 문서(`docs/05-API_SPEC.md`)의 평가 절을 고친다.
- `scripts/container-smoke.sh`, `scripts/staging-smoke.sh`: 체험 계정으로 평가 조회가 `enabled: true`, `shared: true`인지 **형식만** 확인하는 검사를 더한다(값 목록은 방문자에 따라 달라지므로 비교하지 않는다). **Smoke에서 평가를 쓰지 않는다**(공유 계정의 실제 평가를 바꾸지 않기 위해서다). 기존 검사는 그대로 둔다.

### 4. 문서

- `docs/09-DECISIONS.md`: 새 Decision(다음 번호) — 체험 계정 평가 허용, 공유된다는 점, DEC-042의 "체험 계정은 평가할 수 없다"를 대체한다는 점.
- `docs/25-PRIVACY.md`와 개인정보 처리 안내 화면(`PrivacyPage.tsx`)의 "체험 계정 주의": 평가도 모든 방문자가 함께 쓴다는 문장을 더한다.
- 추천 평가를 설명하는 기존 문서(`docs/20-RECOMMENDATION-MUSIC-PLAYBACK.md` 또는 평가 규칙을 적은 문서)와 `README.md`의 추천 평가 문장을 고친다("소셜 로그인 사용자가" → 체험 계정도 가능, 공유됨).
- `docs/07-TASKS.md`: TASK-068 행과 절을 `docs/tasks/COMMON.md` "9. `docs/07-TASKS.md` 작성 형식"대로 추가한다(DONE, Milestone 68).
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### Test

- Backend
  - 체험 계정: 조회가 `enabled: true`, `shared: true`. 저장 / 변경 / 삭제가 된다(이전의 403 Test를 새 동작으로 고친다).
  - 소셜 사용자: `shared: false`, 동작은 그대로. 소셜 사용자의 평가와 체험 계정의 평가가 서로 섞이지 않는다.
  - 체험 계정의 별로예요 / 좋아요가 다음 Check-in 추천에 반영된다(소셜 사용자와 같은 규칙).
  - 평가가 없으면 추천이 지금과 완전히 같다(기존 Test 유지).
  - 로그인하지 않으면 401, CSRF 값이 없으면 거부(기존 Test 유지).
  - 체험 계정의 계정 삭제는 여전히 막힌다.
  - 계약 Test: 응답이 `contracts/` 예시와 같은 형식이다.
- Frontend
  - `enabled: true, shared: true`: 평가 묶음이 보이고 공유 안내 문구가 나온다. 누르면 저장 요청이 나간다.
  - `enabled: true, shared: false`: 지금 문구.
  - `shared`가 없는 응답: `false`로 처리.
  - 기존에 "체험 계정에는 버튼이 없다"를 검사하던 Test는 새 동작으로 고친다.
- jest-dom Matcher를 쓰지 않는다. `getByRole` Option에 `exact`를 쓰지 않는다. 파일 경로는 `resolve(process.cwd(), …)`로 만든다. Test의 타입 오류에 주의한다(`tsc --noEmit`).
- Sandbox에서 Gradle / npm Test / Docker를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

### 금지

- 평가 반영 규칙, 추천 개수, Score / 기분 판정 변경
- DB Migration 추가, Dependency 변경
- 체험 계정의 AI 코멘트 / 주간 리포트 / 계정 삭제 허용(이번 범위가 아니다)
- Smoke에서 평가를 쓰는 요청 추가
- `infra/`, `.github/`, `frontend/public/` 변경

## Verification

- `bash scripts/verify.sh`
- `bash scripts/container-smoke.sh`
- `bash -n scripts/staging-smoke.sh`
- `git diff --check`

## Claude Review 기준

- 체험 계정이 평가를 읽고 쓸 수 있고 `shared`가 맞게 나오는가, 소셜 사용자의 동작과 격리가 그대로인가
- 체험 계정의 평가가 Check-in 추천에 같은 규칙으로 반영되는가, 평가가 없을 때 결과가 바뀌지 않는가
- 계정 삭제 / AI 기능 등 다른 체험 계정 제한을 풀지 않았는가
- Smoke가 평가를 쓰지 않고 형식만 보는가
- 화면과 개인정보 안내가 "모든 방문자가 함께 쓴다"를 알리는가
- `docs/07-TASKS.md`의 TASK-068 절이 공통 형식을 따르는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 체험 계정 화면을 390 / 1280px로 캡처해 확인하고, Merge 뒤 Staging에서 체험 계정으로 평가를 남겨 다음 Check-in에 반영되는지 확인한다.
