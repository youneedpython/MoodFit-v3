# TASK-060 History Record Compact 실행 지시

- 목적: History 기록 추천 이력 접기와 주간 리포트 기간 표기 개선.
- 실행 단계: 승인 Contract 범위 구현 / Test 보완 / 문서 기록.
- Context: AGENTS.md, COMMON.md, TASK-060 Contract, 승인 결정과 프로젝트 필수 문서.
- 실제 Prompt: "Implement only this explicitly requested Task within allowed_paths. Never commit, push, create branches, or bypass Human Gates." TASK-060의 details / summary, 실제 추천 개수, 문자열 기반 기간 변환과 time 요소, 단위 Test 및 문서 요구를 따른다.
- Human Approval: 2026-10-05 후보 H2 / H3 승인과 명시 실행 지시.
- 기대 산출물: 기본 접힌 추천 이력, 한국어 기간 표시, 회귀 Test와 기록.
- 결과: Executor 구현 완료. Sandbox 밖 Verify / Review와 화면 캡처는 후속 확인.
- Related Commit: Executor는 Commit하지 않음.
