# Prompt 21 — TASK-010 History / Trend

## 목적

사용자가 최근 7일 웰니스 상태 변화와 추천 이력 요약을
History 화면에서 확인할 수 있게 한다.

## 실행 단계

TASK-010 READY
→ Human 실행 지시
→ 문서 충돌 확인 및 보고 (추천 이력 요약 vs History API 최소 응답)
→ Gate C Human Approval (A안, DEC-020)
→ TASK-010 IN_PROGRESS
→ History / Trend 구현 + History 응답 필드 추가
→ Test / Build / Local Verification
→ Commit / Push / Remote CI
→ REVIEW
→ Human Review

## 사용 Context

AGENTS.md (3.1절 문서 충돌 규칙)

docs/03-UX_UI_SPEC.md (5절 HIST-001)
docs/05-API_SPEC.md (6절 History 조회)
docs/06-PLAN.md
docs/07-TASKS.md (TASK-010)
docs/09-DECISIONS.md (DEC-004, DEC-005, DEC-010, DEC-019)

## 실제 Prompt

```text
TAST-010 실행!
```

## 문서 충돌 보고

Claude가 실행 전 다음 충돌을 보고했다.

- `docs/07-TASKS.md`, `docs/06-PLAN.md`, `docs/03-UX_UI_SPEC.md`: History 산출물에 "추천 이력 요약" 포함
- `docs/05-API_SPEC.md` 6절: History 응답은 최소 정보만 반환하며 "상세 Recommendation은 최신 또는 상세 조회에서 처리"
- 실제 History 응답에는 Recommendation 정보가 없고, 상세 조회 API는 명세에 없다.

선택지:

- A: History 응답 항목에 추천 이름만 추가 (`foodNames`, `musicTitles`) — API Contract 변경, Gate C 필요
- B: 추천 이력 요약을 TASK-010 범위에서 제외 — 요구사항 축소, Human Approval 필요
- C: 최신 기록의 추천만 History에 다시 표시 — 이력이 아니므로 비추천

Frontend에서 Mood / 날씨로 추천을 다시 계산하는 방식은 분석 Rule 중복 구현이므로 제외했다.

Human 결정:

```text
A안으로 진행!
```

## 실행 범위

- Backend: `HistoryItemResponse`에 `foodNames`, `musicTitles` 추가, History 조회 시 Recommendation 함께 조회 (N+1 방지)
- API Spec 6절 예시 / 설명 갱신, DEC-020 기록
- Frontend: History 화면, 최근 7일 Wellness Score Trend(SVG), 날짜별 Mood, 주요 Metric 요약, 추천 이력 요약, Empty / Loading / Error 상태
- History / Trend Test

## 제약

- 기존 History 응답 필드는 변경하지 않는다. (필드 추가만)
- DB Schema, Flyway Migration을 변경하지 않는다.
- 새로운 Dependency, 외부 Chart Library를 추가하지 않는다. (DEC-010)
- 분석 Rule을 Frontend에 구현하지 않는다.

## Human Approval

- TASK-010 실행 승인 완료.
- History 응답 추천 이름 필드 추가 Gate C 승인 완료 (A안, DEC-020).

## 상태

구현 완료 / Local Verification PASS / Remote CI Verification 대기

## Related Commit

Pending
