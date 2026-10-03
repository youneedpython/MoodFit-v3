# TASK-033 승인된 MySQL 8.4 전환 실행

- 목적: DEC-027 RDS 기준에 Testcontainers / CI / Container Smoke의 MySQL major를 맞춘다.
- 실행 단계: TASK-032 이후 TASK-033만 구현한다.
- Context: AGENTS.md 3절, TASK-033 Contract, COMMON, DEC-019 / DEC-023 / DEC-027 / DEC-028 / DEC-030 및 프로젝트 필수 문서.
- Human Approval: 2026-10-03 Gate C 사전 승인. 고정 Tag는 `mysql:8.4.11`이다.

## 실제 실행 지시

승인된 TASK-033을 allowed_paths 안에서 구현한다. Test Image / Version 확인 / Smoke Image와 CI Summary 한 줄을 갱신한다. DEC-023 변경 이력과 DEC-030, 8.4 영향 조사, Local MySQL 안내를 기록한다. 과거 기록과 금지 경로는 변경하지 않는다. Dependency / 운영 Code / Migration 변경이 필요하면 HUMAN_REQUIRED로 정지한다. Local 설치 서비스는 변경하지 않는다. TASK-033 DONE / TASK-034 READY와 TASK-026 선행 조건 충족을 PR에 반영하되 완료 승인을 주장하지 않는다. Git 작업은 수행하지 않으며 Executor JSON으로 누적 변경 경로와 검증 한계를 보고한다.

## 결과

Image / 문서 / 상태 반영을 구현했다. Executor Sandbox에는 Docker 접근이 없어 전체 Test / Smoke의 실제 호환성은 Orchestrator Verify가 판정한다. 최종 완료 승인은 Remote CI와 Human Squash Merge를 따른다. Related Commit은 Executor가 생성하지 않는다.
