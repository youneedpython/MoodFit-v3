# 65 — TASK-040 날씨 자동 기본 / 지역 표시

- 목적: Check-in 날씨를 자동 기본으로 전환하고 조회 지역을 표시한다.
- 실행 단계: Human 사전 승인(2026-10-04)에 따른 Executor 구현.
- Context: AGENTS.md, 공통 규칙, TASK-040 Contract, TASK-035의 기존 날씨 구현과 위치 안내, 승인 Decision / UX / Architecture / API 문서.
- 실제 지시: MoodFit Executor로 TASK-040만 allowed_paths 안에서 구현한다. 저장값이 없으면 자동, 기존 false는 직접 입력을 유지한다. BigDataCloud로 지역을 표시하고 두 API에 소수 둘째 자리 좌표를 보낸다. 실패 시 직접 입력을 제공하고 좌표 / 지역을 저장하거나 Backend로 보내지 않는다. Dependency / Backend / 계약 / Infra는 변경하지 않는다. Git handoff는 수행하지 않는다.
- 기대 산출물: 모드별 날씨 화면, 지역 문자열 검증, 실패 / 중단 / 늦은 응답 보호, 관련 Test와 문서 / Decision / Task / 작업 기록.
- Human Approval: Contract의 Gate 사전 승인과 명시 실행 지시. 새 결정 없음.
- 결과: Executor 구현 완료. Sandbox에서 설치 / Test 실행 제약을 기록하고 Orchestrator Verify / Review를 기다린다.
- Related Commit: Executor는 Commit하지 않았다.
