# Prompt 31 — TASK-017 API 계약 테스트 Gate C Review

## 목적

TASK-017 API 계약 테스트(Frontend / Backend) 구현 전에
계약 정의 방식, Frontend / Backend 검증 방법, 추가 Dependency, Local Verification / CI 반영 방식을 검토하고
Gate C Human Approval을 받는다.

## 실행 단계

TASK-016 DONE
→ TASK-017 BLOCKED (Gate C 대기)
→ Gate C Review
→ Human Approval 대기

## 사용 Context

AGENTS.md
README.md

docs/05-API_SPEC.md
docs/07-TASKS.md (TASK-017)
docs/08-WORK_LOG.md (TASK-011 GAP-2 / FU-1)
docs/09-DECISIONS.md (DEC-014, DEC-020, DEC-023)

frontend/src/types/api.ts
frontend/src/services/api.ts
frontend/src/features/*/*.test.tsx
backend/src/main/java/com/moodfit/dto/
backend/src/test/java/com/moodfit/controller/CheckinControllerTests.java

## 실제 Prompt

```text
TASK-017 (API 계약 테스트) - 검토 자료 만들어!
```

## 조사 기준 날짜

2026-10-01

## 조사한 Source

- Maven Central
  - `org.springdoc:springdoc-openapi-starter-webmvc-api` `3.1.1` (Parent: Spring Boot `4.1.0`)
  - `com.networknt:json-schema-validator` `3.0.8`
  - `au.com.dius.pact.provider:junit5spring` `4.7.5` (POM 기준 Spring `5.3.39`로 빌드)
- npm Registry
  - `ajv` `8.20.0`
  - `openapi-typescript` `7.13.0`
  - `@pact-foundation/pact` `17.1.4` (Node.js `>=22`, Express / Axios 등 다수 하위 Dependency)

## 현재 상태 (GAP-2)

- 계약 문서: `docs/05-API_SPEC.md` (사람이 작성한 Markdown, Response 예시 JSON 포함)
- Frontend: `frontend/src/types/api.ts`에 Type을 직접 작성했다. "Backend DTO와 필드 이름을 맞춘다"는 주석만 있다.
- Frontend 화면 Test(`CheckinPage` / `DashboardPage` / `HistoryPage`)는 각 Test 파일 안에서 가짜 응답(`RESULT` 등)을 따로 만든다.
- Backend: `CheckinControllerTests`가 일부 필드를 `jsonPath`로 확인한다. 전체 응답 형식과 필드 누락 / 추가는 확인하지 않는다.

→ Backend 응답 필드 이름이 바뀌거나 필드가 추가 / 삭제되어도 Frontend Test는 각자의 가짜 응답으로 계속 통과한다. 두 쪽이 서로 다른 형식을 가정해도 자동으로 발견되지 않는다.

계약 대상 (5개 응답):

| 계약 | Endpoint | 상태 |
|---|---|---|
| Check-in 생성 | `POST /api/check-ins` | 201 |
| 최신 조회 | `GET /api/check-ins/latest` | 200 |
| 기록 없음 | `GET /api/check-ins/latest` | 404 `CHECKIN_NOT_FOUND` |
| History 조회 | `GET /api/check-ins/history?days=7` | 200 |
| 입력 오류 | `POST /api/check-ins` | 400 `VALIDATION_ERROR` |

## 후보 비교

| Option | 방식 | 장점 | 단점 | 새 Dependency |
|---|---|---|---|---|
| A | 공유 계약 예시 JSON (Contract Fixture) | 새 Dependency 없음. DEC-014 Rule이 결정적이라 Backend 실제 응답과 예시를 전체 비교할 수 있다. 사람이 읽기 쉽다 | 예시 기반이라 "필수 / 선택", 값 범위 같은 규칙은 표현하지 못한다. 계약 상황마다 예시 파일이 필요하다 | 없음 |
| B | JSON Schema | 필수 필드, Enum, 배열 길이(추천 2개) 등 규칙까지 표현 | Frontend `ajv`, Backend `networknt` 2개 추가. Schema 작성 / 유지 부담. Frontend TypeScript Type과의 일치는 별도 확인 필요 | `ajv` 8.20.0, `json-schema-validator` 3.0.8 |
| C | OpenAPI (springdoc + openapi-typescript) | Backend Code에서 명세를 생성하고 Frontend Type을 생성해 비교 | 명세가 Backend Code에서 나오므로 "Backend가 계약을 어겼는지"가 아니라 "바뀌었는지"만 발견한다. Record / String 필드는 Enum 정보가 약해 Annotation 추가 필요. 양쪽 Dependency 추가 | `springdoc-openapi` 3.1.1, `openapi-typescript` 7.13.0 |
| D | Pact (Consumer-Driven) | 업계 표준 계약 테스트 | Spring Provider 모듈이 Spring 5.3 기준으로 빌드되어 Spring 7 호환 미확인. Frontend 하위 Dependency 다수. 교육용 Repository 규모에 비해 무거움 | `@pact-foundation/pact`, `pact junit5spring` |
| E | E2E (Browser + 실제 Backend) | 실제 사용 흐름 검증 | 계약 위반 위치를 찾기 어렵다. MySQL / Browser 실행 환경 필요, CI 시간 크게 증가. TASK-017 범위(계약 검증)보다 넓음 | Playwright 등 |

## 추천안

### 추천: Option A (공유 계약 예시 JSON)

1. 계약 파일 위치: Repository Root `contracts/` (Frontend / Backend 어느 쪽에도 속하지 않는 공유 위치)

```text
contracts/
├── checkin-create-201.json
├── checkin-latest-200.json
├── checkin-latest-404.json
├── checkin-history-200.json
└── checkin-create-400.json
```

2. Backend 계약 테스트 (`CheckinContractTests`)
   - 고정 시계 / 고정 입력으로 실제 API를 호출하고 응답 전체를 계약 파일과 **엄격 비교**한다. (필드 누락 / 추가 / 이름 / 값 형식 모두 실패)
   - DB가 정하는 `id`처럼 실행마다 달라지는 값은 "숫자인지"만 확인한다.
   - Spring Boot Test에 포함된 JSON 비교 기능(JSONassert)을 사용한다. (새 Dependency 없음)
3. Frontend 계약 테스트
   - Type 검사: 계약 파일을 import해 `api.ts` Type과 필드 구성이 정확히 같은지 TypeScript로 검사한다. 다르면 `npm run build`(`tsc --noEmit`)가 실패한다.
   - 화면 Test: `CheckinPage` / `DashboardPage` / `HistoryPage` Test의 가짜 응답을 계약 파일로 교체한다. 계약이 바뀌면 화면 Test도 함께 영향을 받는다.
4. 계약 문서 동기화 (선택)
   - `docs/05-API_SPEC.md`의 Response 예시와 계약 파일이 같은지 확인하는 Test를 추가한다. 문서만 바뀌고 계약 파일이 그대로인 경우를 발견한다.
5. 실행 위치
   - Backend는 `./gradlew test`, Frontend는 `npm test` / `npm run build`에 포함한다. `verify.ps1` / `verify.sh`, CI 명령 변경 없음
   - CI `frontend` / `backend` Job 모두 Repository 전체를 Checkout하므로 `contracts/`를 읽을 수 있다.

이유:

- TASK-017 명세가 첫 후보로 든 방식이며, 새 Dependency 없이 "양쪽이 같은 계약 파일을 기준으로 검증"하는 구조를 만들 수 있다.
- DEC-014 Rule이 결정적이어서 예시 기반 비교의 약점(값을 비교할 수 없음)이 작다.
- 교육용 Harness에서 계약 테스트의 개념을 가장 단순하게 보여준다.
- 규칙 표현이 더 필요해지면 같은 `contracts/`에 JSON Schema(Option B)를 추가하는 방식으로 확장할 수 있다.

## 확인이 필요한 구현 세부 (구현 시 검증)

- Frontend(Vite / Vitest)가 `frontend/` 밖의 `contracts/` 파일을 import할 수 있는지 확인한다. 막히면 Vitest 설정에서 허용 경로를 추가한다. (Dependency 변경 없음)
- `docs/05-API_SPEC.md` 예시의 `id`(101), `recordedAt`이 Backend Test의 고정 값과 다르므로, 계약 파일은 Backend Test 고정 값 기준으로 만들고 문서 예시를 계약 파일에 맞춘다.

## 예상 영향

| 항목 | 예상 |
|---|---|
| Dependency | 없음 |
| `package.json` / `build.gradle` | 변경 없음 (Vitest 허용 경로 설정이 필요하면 `vite.config.ts`만 변경) |
| CI | `ci.yml` 변경 없음, 실행 시간 증가 미미 |
| 기존 Test | Frontend 화면 Test의 가짜 응답을 계약 파일로 교체 (검증 내용은 유지) |
| 문서 | `docs/05-API_SPEC.md` 예시를 계약 파일과 일치하도록 수정 가능 |

## 제외 범위

- API 형식 변경 (계약은 현재 동작 그대로 고정)
- E2E / Browser Test
- Recommendation Refresh API (Core MVP 제외 항목)
- JSON Schema / OpenAPI / Pact 도입 (필요 시 별도 Gate C)

## Human 결정 필요 사항

1. 계약 테스트 방식: Option A (추천) / B / C / D / E
2. 계약 파일 위치: Repository Root `contracts/` (추천) / 다른 위치
3. `docs/05-API_SPEC.md` 예시 동기화 Test 포함 여부: 포함 (추천) / 제외
4. Frontend 화면 Test의 가짜 응답을 계약 파일로 교체: 교체 (추천) / 유지

## Human Approval

```text
1. A
2. Root contracts/
3. 05-API_SPEC.md 예시 동기화 테스트: 포함
4. Frontend 화면 테스트의 가짜 응답: 계약 파일로 교체

승인! 진행해!
```

| 항목 | 결정 |
|---|---|
| 계약 테스트 방식 | Option A — 공유 계약 예시 JSON |
| 계약 파일 위치 | Repository Root `contracts/` |
| `05-API_SPEC.md` 예시 동기화 Test | 포함 |
| Frontend 화면 Test 가짜 응답 | 계약 파일로 교체 |

승인 결과는 DEC-024로 기록했다.

## 상태

Gate C Human Approved

## Related Commit

- `fcb7b80` docs: TASK-017 Gate C 검토 및 승인 반영 (DEC-024)
