# TASK-051 실행 지시 기록

- 목적: AI 코멘트와 주간 리포트의 줄바꿈, 한국어 상태 이름, 결과 화면 배치 개선.
- 실행 단계: 승인된 TASK-051 Contract에 따른 Executor 구현.
- Context: AGENTS.md, 기본 명세 / 계획 / 승인 결정, COMMON.md, TASK-051, LLM Insight 문서와 기존 구현.
- 실제 지시: TASK-051만 allowed_paths 안에서 구현한다. 코멘트는 문장마다 줄바꿈, 리포트는 문단을 요청하고 Server에서 결정적으로 보정한다. 기존 한국어 이름을 모델에 보내며 데이터 범위를 유지한다. 결과 화면의 날씨 / 지역은 AI 코멘트 앞에 놓고 간격 Token을 맞춘다. Test와 문서를 갱신하며 Git 쓰기와 Gate 우회를 금지한다.
- Human Approval: 2026-10-04 명시 실행 지시와 제공된 Contract.
- 산출물: 응답 정리 / 입력 투영 / Prompt, 결과 배치와 Test, Task 상태와 실행 기록.
- 결과: Executor 구현 완료. Sandbox 밖 검증 / Review / 화면 확인 대기.
- Related Commit: Pending.
