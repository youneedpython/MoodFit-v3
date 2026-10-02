# TASK-022 Git 내용 검증 수정

- 목적: core.autocrlf=true 환경에서 검토된 LF와 Source CRLF의 바이트 차이로 Commit이 BLOCKED되는 결함 수정.
- Human 실행 지시: Commit 직전 검증을 Git이 실제 Commit할 내용 기준으로 변경하고 실제 문자 / binary 바이트 변경은 BLOCKED로 유지한다. 임시 Git Repository 회귀 Test, 설계 / WORK_LOG 갱신, 전체 Orchestrator Test / 치환 흔적 / diff 공백 검증을 수행한다.
- 승인 범위: TASK-022 Contract 허용 경로. 자기 Contract / Dependency / Repository Git 변경 / Secret 작업 금지.
- Context: Review 3회차 PASS 후 Git 단계 BLOCKED, Human 제공 수동 Commit 근거 6b63751.
- 산출물: Git clean filter 적용 blob hash와 index blob 대조, 회귀 Test, 문서 기록.
- Related Commit: Pending.
