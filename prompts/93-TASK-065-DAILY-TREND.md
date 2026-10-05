# TASK-065 Run 2 — 날짜별 평균과 확대 전환

- 목적: 모바일의 조밀한 기록은 날짜별 평균으로 시작하고 확대하면 개별 기록을 표시한다.
- 승인: 2026-10-05 Human 추가 지시와 TASK-065 Run 2 Contract.
- 실제 Prompt: “모바일은 기본 '날짜별 평균'으로 보여주고, 손으로 확대/축소하면 원래 데이터 그대로 보이도록 가능해?”
- Context: TASK-065 / COMMON, 프로젝트 명세, 승인 결정, 계획 및 Orchestrator 정책. Footer는 Run 1 구현을 유지한다.
- 산출물: 서울 날짜별 평균 순수 함수 / Test, 초기 배율 1, 버튼 / Pinch 전환, 전체 기록 요약과 접근성 안내, 관련 문서.
- 상태: Executor 구현 완료. Sandbox 밖 Verify / Review 및 Human 최종 승인은 별도다.
- Related Commit: Executor는 Git 작업을 수행하지 않는다.
