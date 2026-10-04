# TASK-050 실행 지시 기록

- 목적: 문서만 변경한 main Commit의 불필요한 Staging Build / 배포를 생략한다.
- 실행 단계: 승인된 TASK-050 Executor 구현.
- Context: AGENTS.md, COMMON.md, TASK-050 Contract, DEC-032, 기존 Staging CD Workflow와 운영 문서.
- Human Approval: 2026-10-04 직접 지시로 Gate C 승인.

## 실제 Prompt

"문서를 github에 push할 때는 cd는 진행되지 않도록 해."

TASK-050 허용 경로만 구현한다. 자동 실행에서는 첫 번째 부모와 대상 Commit의 파일 차이로 문서 전용 여부를 판정한다. 수동 실행은 항상 배포하고 판정 실패 / 파일 0개는 배포한다. CI, Trigger, concurrency와 기존 배포 Step은 유지한다. Git 후속 작업은 Executor가 수행하지 않는다.

## 기대 산출물 / 결과

contents read만 사용하는 판정 Job, 조건부 배포 Job, 판정 예시와 운영 한계 및 승인 / 작업 기록을 구현한다. Executor DONE은 구현 완료이며 Orchestrator Verify / Claude Review / Human Squash Merge를 대신하지 않는다.

Related Commit: Executor는 Commit하지 않음. 승인된 후속 Git 단계에서 연결한다.
