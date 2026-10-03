# 59. TASK-027 승인 Application Infrastructure 실행

- 목적: Foundation 위 ECS / ALB / RDS 연동과 CloudFront API routing의 Template 구현.
- 실행 단계: TASK-027만 실행. 2026-10-03 Contract의 Gate 1 ~ 8은 Human Approved.
- Context: AGENTS.md, 프로젝트 명세·계획·상태, DEC-027 ~ DEC-031, 공통 규칙, TASK-027 Contract, Foundation Template와 13 / 14 / 15 / 17번 문서.
- 실제 지시 요지: 허용 경로에서 Data 자격 증명 방식 변경, App 신규 Template, Frontend API·IPv6 연결, IAM 입력·예시, 정적 검증과 관련 문서를 구현한다. 설정 문구는 활성 Contract의 승인 literal 4개를 그대로 사용하되 기록 문서에는 원문이나 실제 값을 쓰지 않는다.
- 기대 산출물: Template와 정적 검증, 의존 순서·비용·교체·Flyway 위험 기록, 한글 PR 설명과 Executor JSON.
- 제한: 실제 AWS 조회·생성·변경과 Git 후속 작업을 수행하지 않는다. forbidden_paths와 Human Gate를 유지한다.
- 상태: Executor 구현 완료 반영. TASK-027 DONE은 PR 안의 구현 완료 표시이며 최종 완료는 Human Squash Merge다. TASK-028은 BLOCKED, 비용 승인과 Stack 생성 권한 결정 후 READY.
- 검증 기준: Sandbox 밖 Orchestrator Verify. Executor 참고 검사 결과는 WORK_LOG에 기록한다.
- Related Commit: Pending.
