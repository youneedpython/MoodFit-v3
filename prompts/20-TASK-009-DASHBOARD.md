# Prompt 20 — TASK-009 Dashboard

## 목적

사용자가 최신 Check-in 결과와 추천 정보를
Dashboard 한 화면에서 확인할 수 있게 한다.

## 실행 단계

TASK-009 READY
→ Human 실행 지시
→ TASK-009 IN_PROGRESS
→ Dashboard 구현
→ Test / Build / Local Verification
→ Commit / Push / Remote CI
→ REVIEW
→ Human Review

## 사용 Context

AGENTS.md

docs/02-V1-REFERENCE.md (Hero, Metric Card, Recommendation Card)
docs/03-UX_UI_SPEC.md (3절 DASH-001, 8절 Responsive, 9절 Accessibility)
docs/05-API_SPEC.md (5절 최신 Check-in 조회)
docs/07-TASKS.md (TASK-009)
docs/09-DECISIONS.md (DEC-003, DEC-010, DEC-014)

frontend/src/services/api.ts (`checkinApi.getLatest`)
frontend/src/components/

## 실제 Prompt

```text
TASK-009 실행!
```

## 실행 범위

- Dashboard 화면
- Wellness Hero (Mood, Wellness Score, 상태 요약, 날씨 / 기온, `오늘 상태 입력` CTA)
- 5개 Body Metric Card
- Food / Music Recommendation Card
- Latest 없음 Empty State (`404 CHECKIN_NOT_FOUND`)
- Loading / API Error / Retry 상태
- Dashboard 관련 Frontend Test

## 범위 밖

- 최근 7일 Wellness Trend는 UX Spec Dashboard 영역에 포함되지만 TASK-009 산출물 목록에 없고
  TASK-010 History / Trend 범위이므로 이번에 구현하지 않는다.

## 제약

- API Contract, Backend, DB Schema를 변경하지 않는다. (변경이 필요하면 Gate C)
- 새로운 Dependency, 외부 Chart / 시각화 Library를 추가하지 않는다. (DEC-010)
- Wellness 분석 Rule을 Frontend에 구현하지 않는다. Backend 응답만 표시한다.
- Hard-coded 결과를 표시하지 않는다.

## Human Approval

TASK-009 실행 승인 완료.

## 상태

구현 완료 / Local Verification PASS / Remote CI Verification 대기

## Related Commit

Pending
