# Prompt 19 — TASK-008 Daily Check-in

## 목적

사용자가 신체 리듬과 날씨 상태를 입력하고
Backend 분석(`POST /api/check-ins`)을 요청할 수 있는 Daily Check-in 화면을 구현한다.

## 실행 단계

TASK-008 READY
→ Human 실행 지시
→ TASK-008 IN_PROGRESS
→ Daily Check-in 구현
→ Test / Build / Local Verification
→ Commit / Push / Remote CI
→ REVIEW
→ Human Review

## 사용 Context

AGENTS.md

docs/03-UX_UI_SPEC.md (4절 CHECK-001, 7절 Interaction, 9절 Accessibility)
docs/05-API_SPEC.md (4절 Check-in 생성, 8절 Error Response)
docs/07-TASKS.md (TASK-008)
docs/09-DECISIONS.md (DEC-014, DEC-019)

frontend/src/services/api.ts
frontend/src/components/

## 실제 Prompt

```text
TASK-008 작업 수행!
```

## 실행 범위

- Daily Check-in 화면과 입력 Form (관련 입력값 그룹화, 숫자 범위 안내)
- Client-side Validation 보조 (API Spec Validation 기준과 동일)
- API 제출 흐름과 Submitting / Success / API Error 상태
- 저장 / 분석 중 중복 제출 방지
- 완료 후 결과 요약과 Dashboard 이동
- Check-in 관련 Frontend Test

## 제약

- API Contract, Backend, DB Schema를 변경하지 않는다. (변경이 필요하면 Gate C)
- 새로운 Dependency를 추가하지 않는다.
- Wellness 분석 Rule을 Frontend에 구현하지 않는다. 결과는 Backend 응답만 표시한다.
- Dashboard(TASK-009), History(TASK-010) 기능은 구현하지 않는다.

## Human Approval

TASK-008 실행 승인 완료.

TASK-008 완료 후 Human 실행 확인 및 Human Review 승인 완료.

## Human Review 보완

Human Review에서 Retry Validation UX 문제와 README 동기화 누락이 발견되어 보완했다.

- 제출과 재시도가 같은 `validateAndSubmit()` Validation 경로를 사용하도록 통합
- API 오류 후 입력을 잘못 고치고 `다시 시도` / `분석 요청`을 누르는 Test 2건 추가
- README Prompt History `01 ~ 19`, Frontend 설명 동기화

## Remote CI Verification 결과

- Commit: `0887711`
- Workflow run: https://github.com/youneedpython/today-v3/actions/runs/36693834801
- `frontend` Job: success
- `backend` Job: success

## 상태

실행 완료 / Human Approved

## Related Commit

0887711
