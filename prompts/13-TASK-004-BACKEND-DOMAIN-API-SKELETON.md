# Prompt 13 — TASK-004 Backend Domain / API Skeleton

## 목적

MoodFit v3의 API Contract와 Backend Domain 경계를 먼저 고정하고,
Wellness Rule 구현 전에 검증 가능한 Backend API Skeleton을 구성한다.

## 실행 흐름

TASK-004 READY
→ Human 실행 승인
→ IN_PROGRESS
→ Backend Domain / API Skeleton
→ Backend Verification
→ Local Verification
→ Remote CI Verification 대기
→ Human Review

## 사용 Context

AGENTS.md
README.md

docs/01-PROJECT.md
docs/03-UX_UI_SPEC.md
docs/04-ARCHITECTURE.md
docs/05-API_SPEC.md
docs/06-PLAN.md
docs/07-TASKS.md
docs/08-WORK_LOG.md
docs/09-DECISIONS.md

prompts/12-TASK-003-GITHUB-ACTIONS-CI.md

backend/build.gradle
backend/settings.gradle
backend/src/main/
backend/src/test/

scripts/verify.ps1
scripts/verify.sh
.github/workflows/ci.yml

## 실제 Prompt

Human은 TASK-004 Backend Domain / API Skeleton 실행을 승인했다.

이번 작업에서는 TASK-004만 수행한다.

- API Contract는 docs/05-API_SPEC.md를 따른다.
- 결정 사항은 docs/09-DECISIONS.md를 Source of Truth로 사용한다.
- DEC-014 Wellness Analysis Rule은 Pending 상태로 유지한다.
- Wellness Score 계산, Mood 판정, Weather/Temperature 영향, Food/Music Recommendation Rule은 구현하지 않는다.
- Spring Data JPA, MySQL Connector, Entity, DB Schema, Database Integration Test는 추가하지 않는다.
- Auth/User/JWT/OAuth는 추가하지 않는다.
- Frontend Feature, scripts, GitHub Actions Workflow, Dependency는 변경하지 않는다.
- TASK-005 이후 작업은 시작하지 않는다.

Backend에는 다음 Skeleton만 구성한다.

- Controller
- Service boundary
- Repository boundary
- Request DTO
- Response DTO
- Error Response
- Validation Error handling
- Latest empty `404 CHECKIN_NOT_FOUND`
- History `days` default `7`, max `30`

Verification은 Backend Test/Build와 Local Verification Harness로 수행한다.

Remote CI Verification은 commit/push 이후 확인한다.

## Human Approval

TASK-004 실행 승인 완료.

TASK-004 완료 후 Human Review 승인 완료.

## Human Review 보완

Human Review에서 발견된 API 입력 Validation 누락 2건을 보완했다.

- History `days` 최소값 `1` Validation 추가
- 요청 형식 오류(JSON 문법 오류, 없는 enum 값, 타입 오류)를 `VALIDATION_ERROR` 형식으로 통일
- 관련 Controller Test 6건 추가
- Human Approval을 받아 `docs/05-API_SPEC.md`와 DEC-004에 `days` 허용 범위 `1 ~ 30`과 요청 형식 오류 정책을 추가

## Remote CI Verification 결과

- Commit: `3f12803`
- Workflow run: https://github.com/youneedpython/today-v3/actions/runs/36540515429
- `frontend` Job: success
- `backend` Job: success

## 상태

실행 완료 / Human Approved

## Related Commit

3f12803
