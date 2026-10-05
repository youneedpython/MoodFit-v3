# TASK-067 — CI Path Filter 실행 지시

## 목적 / 실행 단계

바뀐 경로에 따라 필요한 CI Job만 실행해 PR 대기 시간을 줄인다. 승인된 Task Execution 단계다.

## 사용 Context

AGENTS.md, TASK-067 Contract와 COMMON.md, 프로젝트 명세 / 계획 / 승인 Decision, Multi-Agent 정책 / Orchestrator 설계, CI Workflow와 Staging CD 문서.

## 실제 Prompt

Human은 “'작은 후속 후보' 모두 진행해.”라고 지시했고 CI 경로 분류 설계를 Gate C 범위로 승인했다. Executor 실행 지시는 TASK-067만 allowed_paths 안에서 구현하고 필수 Context를 먼저 읽으며 Commit / Push / Branch 생성 / Gate 우회 없이 제공된 Executor JSON으로 보고하라는 것이다. 분류 Script를 Workflow 안에 두고 자체 검사를 먼저 실행하며 배포 Workflow와 Application 코드는 변경하지 않는다.

## 기대 산출물 / Human Approval

- changes Job / frontend·backend 조건, 안전한 기본값과 Summary.
- Decision / Staging CD / README / Task 상태 / 작업 기록.
- Human Approved 2026-10-05, Gate C. 새 Dependency나 권한 확대 없음.

## 결과 또는 상태 / Related Commit

Executor 구현 완료. Sandbox 밖 Orchestrator Verify와 Claude Review, Remote CI / Human Squash Merge가 최종 판단 기준이다. Executor는 Git 작업을 수행하지 않았다. Related Commit은 승인된 후속 Git 작업 뒤 연결한다.
