# 100. TASK-070 오늘 날씨 추천 — Run 2

- 목적: 오늘 기록이 없는 Dashboard에 사용자가 요청한 날씨만으로 음식 2개와 음악 2곡을 추천한다.
- 실행 단계: 승인 Contract의 허용 경로 구현 / Test / 문서화. Git 작업은 Executor가 수행하지 않는다.
- Context: TASK-070 원문과 COMMON, AGENTS, 프로젝트 / UX / API / 아키텍처 / 계획 / 상태 / 결정 / Orchestration 정책, TASK-069 / TASK-040 / TASK-048 / TASK-055 / TASK-068 기존 코드.
- 실제 지시: 승인된 Run 2 설계대로 전체를 구현한다. 기존 Check-in 규칙을 유지하고 같은 상황 Pool / 날짜 순환 / 평가 반영 코드를 기분 선택 없이 쓴다. Check-in의 상황 추천과 항목이 다를 수 있음을 받아들인다. 버튼을 누르기 전 위치 조회 금지, 날씨 / 추천 저장 금지, 좌표 / 지역의 Backend 전송 금지, 새 Dependency / Migration 금지. 허용 경로만 수정하고 승인 Gate와 Git 실행 경계를 지킨다.
- Human Approval: 2026-10-05 “1단계 → 2단계 모두 진행”, Gate B / Gate C, 명시 실행 지시. 설계 충돌은 TASK-070 Run 2로 해소됐다.
- 기대 산출물: 읽기 API / 공유 추천 경로 / Dashboard 상태와 평가·재생 / 계약 / Smoke / Test / 개인정보·API·UX 문서 / 실행 기록.
- 결과: Executor 구현, 검증 참고 증거는 docs/08-WORK_LOG.md에 기록한다. 최종 검증과 완료 승인은 Orchestrator / Reviewer / Human 절차를 따른다.
- Related Commit: Executor는 Commit하지 않는다.
