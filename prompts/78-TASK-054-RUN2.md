# TASK-054 Run 2 — Dialog 초점과 인증 Test 실패 수정

- 날짜: 2026-10-05
- 목적: Run 1의 삭제 Dialog 초점 실패와 기존 raw Cookie CSRF 인증 Test 실패를 수정한다.
- 실행 단계: 승인된 TASK-054 Run 2 Executor Rework.
- Context: AGENTS.md, TASK-054 / COMMON, 승인 DEC-041, 프로젝트 필수 문서, 기존 Dialog / 인증 / 삭제 Test.
- Human Approval: 명시 Run 2 실행 지시. API / Dependency / Infra / 다른 기능 변경은 포함하지 않는다.

## 실제 지시와 기대 산출물

삭제 Dialog는 열릴 때 취소에 초점, Tab 가두기, 취소 / Esc로 닫힌 뒤 화면에 남아 있는 아바타에 초점 복귀를 제공한다. 실제 동작을 검사하며 단언을 약하게 만들지 않는다. 새 삭제 Test의 공유 Spring Context / DB / Session 영향을 확인해 기존 AuthTests 실패를 고치고, 새 Test의 Data만 정리하며 체험 사용자와 다른 Test의 Data는 유지한다. WORK_LOG와 Prompt에 Run 2를 기록한다. 그 밖의 구현은 변경하지 않으며 Git 작업 / Human Gate 우회 / Secret 기록을 금지한다.

## 결과와 검증 한계

- Dialog 이벤트 정리 뒤 아바타에 초점을 복귀하고 외부 초점 가두기 / Esc 복귀 검사를 강화했다.
- 삭제 Test는 실제 Cookie / Header CSRF 흐름과 클래스 전후 Context 격리를 사용한다. H2와 MySQL에 같은 기준을 적용하며 기존 사용자별 Fixture 정리 범위를 유지한다.
- 전체 Verify는 npm 캐시 EPERM, 대상 Backend Test는 Gradle lock 경로 권한 제약으로 실행하지 못했다. Container Smoke도 app.jar 미생성과 Docker 접근 제한으로 중단됐다. Staging Smoke 문법과 Diff 공백 검사는 통과했다. 판정 기준은 Sandbox 밖 Orchestrator Verify다.
- Executor 구현 완료이며 Test 성공 / Review / Human 완료 승인을 주장하지 않는다. 기존 Merge 이후 Frontend Stack 적용과 Staging 확인이 남는다.
- Related Commit: Executor는 Commit하지 않음.
