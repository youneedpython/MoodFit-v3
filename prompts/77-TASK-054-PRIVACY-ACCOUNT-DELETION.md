# 77. TASK-054 개인정보 처리 안내 / 계정 삭제 / SPA 경로

- 목적: Production 공개 전 처리 안내, 본인 계정·기록 삭제, 직접 경로 접근을 구현한다.
- 실행 단계: 승인 Contract의 allowed_paths 안에서 Working Tree 구현 / 테스트 / 문서화. Git / AWS 실행은 수행하지 않는다.
- Context: AGENTS.md, 공통 실행 규칙, TASK-054 Contract, DEC-026 / DEC-029 / DEC-034 / DEC-037, 로그인·LLM·배포 문서와 실제 코드.
- Human Approval: 2026-10-04 Task Contract 사전 승인과 명시 실행 지시. 신규 Dependency / 다른 Template / Workflow 변경 금지.

## 실제 지시

“Implement only this explicitly requested Task within allowed_paths. Never commit, push, create branches, or bypass Human Gates. Read the Task source and its required context before editing. Rework only the supplied findings; do not expand scope.”

TASK-054 설계대로 공개 `/privacy`, 로그인·CSRF가 필요한 소셜 계정 삭제와 체험 계정 거부, 접근 가능한 확인 Dialog, 안내 Link와 Footer, CloudFront `/login` / `/privacy` 배열 rewrite, 엄격한 Staging Smoke를 구현한다. H2 / MySQL과 Frontend / 계약 Test를 추가하고 처리 근거와 Merge 직후 Human Frontend Stack 갱신 순서를 기록한다. Executor 결과는 지정 JSON으로 반환한다.

## 결과 / 상태

Executor 구현 완료. npm 캐시 / Gradle lock / Docker 접근 제한으로 Test / Build / Container Smoke를 완료하지 못했으며 Sandbox 밖 Orchestrator Verify가 기준이다. AWS 실행과 Git 후속 작업을 수행하지 않았다. 화면 캡처와 실환경 삭제 확인은 후속 검토에 남긴다.

Related Commit: Pending.
