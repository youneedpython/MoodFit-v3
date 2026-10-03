# TASK-032 실행 지시 기록

- 목적: 승인된 Orchestrator 개선 구현.
- Human Approval: 2026-10-03 등록 / TASK-032 → TASK-033 → TASK-026 실행 순서 승인과 이번 명시적 Executor 실행 지시.
- Context: AGENTS.md, Task Contract, COMMON, 승인 Decision, docs/01~07 및 docs/11~12.
- 실제 Prompt 요지: TASK-032만 허용 경로에서 구현하고 Git 작업 / Human Gate 우회를 하지 않는다. 필수 Context를 읽고 누적 변경 목록과 검증을 Executor JSON으로 반환한다. 한글 UTF-8 및 구 Version Guard 호환을 확인한다.
- 산출물: PR 서술 Schema / Template / 본문, Secret 정밀 검사, Gate Rework, 짧은 Workspace / 성공 Run 정리, AWS Preflight 보강, Fake CLI 회귀 Test와 문서.
- 상태: 구현 및 Executor 참고 검증. Orchestrator Verify / Claude Review / Human Squash Merge 전 완료 승인을 주장하지 않는다.
- Related Commit: Executor는 Commit하지 않는다.
## Review Rework 지시 (2026-10-03)

- 목적: 공급된 F-001~F-008 Finding만 TASK-032 허용 경로 안에서 수정한다.
- Context: Task Contract, 실제 누적 Diff, Secret Guard / Resume / PR 길이 제한 / 설계 문서.
- Human 실행 지시: Secret 할당 경계 및 직렬화 / YAML 주석 / Placeholder 회귀, pending_gate Resume, AWS 한계 문서화, Unicode 및 빈 배열, Git 범위 결정 필요 사항 기록, Test 이름과 Decide 표를 수정한다. Git 권한 확대와 Commit / Push / PR 실행은 금지한다.
- 결과: Rework 구현과 Fake CLI 회귀 Test 완료. TASK-033 Git 범위는 별도 Human 결정 대상으로 기록했으며 자동 Git 조건은 보존했다. Executor DONE은 Verify / Review / Merge 승인을 대신하지 않는다.

## Run 2 WIP 검증 지시 (2026-10-03)

- 실제 Prompt 요지: WIP 기준선에서 F-001~F-008 해결을 확인하고 미해결 부분만 수정한다. 구 Version Guard에 걸리는 지역 변수 이름을 변경하고 추가 줄을 검사한다. F-007의 Git 권한 범위는 확대하지 않는다.
- 결과: 기존 회귀 구현 / 문서 / Test를 확인하고 첫 단어를 받는 지역 변수 이름을 firstPart로 수정했다. TASK-032 DONE / TASK-033 READY 완료 반영은 유지한다.
