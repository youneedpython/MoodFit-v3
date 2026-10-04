# 71. TASK-047 UI Polish 실행

- 목적: Staging 화면 확인 후 Human이 요청한 Frontend 보완 세 가지 구현.
- 실행 단계: 승인 Contract의 Executor 구현 / 문서화. Git 후속 작업은 수행하지 않는다.
- Context: AGENTS.md, COMMON.md, TASK-047 Contract, DEC-014 / DEC-037, 기존 추천 규칙과 AI / History 화면.
- Human Approval: 2026-10-04 명시 실행 지시. Backend / API / Dependency / Asset 변경은 금지한다.

## 실제 Prompt의 기능 지시

1. "AI 코멘트는 자동으로 생성되었으면 해."
2. "추천 음식에 음식과 관련된 이미지 또는 아이콘이 보였으면 해."
3. "history page의 '기록'은 페이지네이션으로 처리했으면 해. 한 페이지에 5개씩 보이도록."

승인 설계대로 Dashboard / 결과 화면의 자동 생성은 진입당 한 번, 실패 시 수동 다시 시도로 구현한다. 음식은 이름 낱말 기반 장식 Emoji와 기본 아이콘을 사용한다. History는 전체 그래프를 유지하고 기록만 최신순 5개와 접근 가능한 이동 UI로 나눈다.

- 기대 산출물: 허용 경로의 Frontend 구현 / Test, TASKS / WORK_LOG / 기능 문서, Executor JSON.
- 결과: Executor 구현 완료. Sandbox 밖 Orchestrator Verify와 Claude Review 및 Human Squash Merge 대기.
- Related Commit: Executor는 Commit하지 않는다.
