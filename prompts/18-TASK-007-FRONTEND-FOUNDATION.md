# Prompt 18 — TASK-007 Frontend Foundation / Design System

## 목적

v1의 Dark Wellness Dashboard 방향성을 유지하면서
TASK-008 ~ TASK-010 화면 구현에 사용할 Frontend 공통 기반을 만든다.

## 실행 단계

TASK-007 READY
→ Human 실행 지시
→ TASK-007 IN_PROGRESS
→ Frontend Foundation 구현
→ Test / Build / Local Verification
→ Commit / Push / Remote CI
→ REVIEW
→ Human Review

## 사용 Context

AGENTS.md

docs/02-V1-REFERENCE.md
docs/03-UX_UI_SPEC.md
docs/04-ARCHITECTURE.md (Frontend 목표 구조)
docs/05-API_SPEC.md
docs/07-TASKS.md (TASK-007)
docs/09-DECISIONS.md (DEC-010, DEC-011, DEC-012, DEC-014, DEC-015, DEC-016)

frontend/package.json
frontend/vite.config.ts

## 실제 Prompt

```text
TASK-007 실행해!
```

## 실행 범위

TASK-007 주요 산출물을 기준으로 다음을 구현한다.

- React Router 기반 Route 구조: `/`, `/check-in`, `/history`
- 공통 Layout (Header, Navigation)
- Button / Card / Badge / MetricCard 등 최소 공통 Component
- `styles/tokens.css`, `styles/global.css`
- API Client 기본 구조
- Loading / Error / Empty 표현 패턴
- 공통 Component 렌더링 Test

## 제약

- 새로운 UI Library / Dependency를 추가하지 않는다. (추가가 필요하면 Gate C)
- 외부 Chart Library를 추가하지 않는다. (DEC-010)
- Dashboard / Check-in / History 실제 기능은 TASK-008 ~ TASK-010 범위이며 이번에 구현하지 않는다.
- Hard-coded 결과를 실제 기능처럼 표시하지 않는다.
- Wellness 분석 Rule을 Frontend에 중복 구현하지 않는다.
- Backend, API Contract, DB Schema는 변경하지 않는다.

## Human Approval

TASK-007 실행 승인 완료.

TASK-007 완료 후 Human Review 승인 완료.

## Remote CI Verification 결과

- Commit: `552ce70`
- Workflow run: https://github.com/youneedpython/today-v3/actions/runs/36683691350
- `frontend` Job: success
- `backend` Job: success

## 상태

실행 완료 / Human Approved

## Related Commit

552ce70
