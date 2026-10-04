# 60. TASK-028 A단계 배포 준비

- 목적: 최초 Staging 배포를 Human이 직접 실행하고 Agent가 조회·Smoke로 확인할 수 있도록 준비한다.
- Context: AGENTS.md, COMMON, TASK-028 승인 Contract, DEC-027~031, docs/17, 기존 Template와 API 계약.
- 실제 지시 요약: 승인 A단계의 절차·Script·로컬 Parameter 형식·Budget·조회 정책 초안을 구현한다. 실제 AWS 변경 / Git 작업은 금지한다. Task 상태는 IN_PROGRESS이며 B단계 검증 전 DONE / Merge하지 않는다.
- Human Approval: 2026-10-03 비용·검증 기간 운영·Human 직접 Change Set 실행·Header/Image 입력 주체·적용 순서 사전 승인과 명시 실행 지시.
- 기대 산출물: docs/18, Human 배포 Script 3개 / 조회 Script / 공개 Smoke, Budget, 배포 Tag 정합성과 누적 기록.
- 결과: A단계 구현. 최종 정적 검증과 Review는 Orchestrator, 실배포는 B단계 절차에 따른다.
- Related Commit: Executor는 Commit하지 않음.
