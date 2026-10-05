# 86. TASK-059 Check-in 날씨 영역 배치

- 목적: 조회 결과를 버튼과 안내보다 먼저 읽을 수 있도록 배치를 개선한다.
- 실행 단계: 승인된 TASK-059 Executor 구현.
- Context: AGENTS.md, 공통 규칙, TASK-059 Contract, 승인 Decision, 위치 / 날씨 문서와 기존 Check-in 날씨 구현 / Test.
- Human Approval: 2026-10-05 명시 실행 지시.

## 실제 Prompt

"check-in 페이지에서 '날씨' 카드에서 배치를 가독성 있게 변경했으면 해."

제목 → 날씨 모드 → 상태 문구 → 조회 결과 또는 직접 입력 → 버튼 → 좌표 안내 → 출처 순서로 배치한다. 기존 덜 강조되는 Button Variant와 간격 / 글자 Token을 사용하고 동작, 문구, 링크, 접근성을 유지한다. 자동 모드 설명 문장만 승인된 문장으로 바꾼다. 다른 영역과 Dependency는 변경하지 않는다.

## 결과 / 기대 산출물

- 자동 / 직접 입력 DOM 순서, 모드별 설명, 실패 상태와 기존 접근성 검사를 추가했다.
- Executor 구현 완료. 자체 Verify는 npm 캐시 / 정리 EPERM으로 설치 단계에서 중단되어 Test / Build를 실행하지 못했다. 판정 기준은 Sandbox 밖 Orchestrator Verify다.
- Claude 세션의 390 / 768 / 1280px 자동 / 직접 입력 / 실패 화면 확인과 캡처, Remote CI와 Human Squash Merge가 남는다.
- Related Commit: Executor는 Git 후속 작업을 수행하지 않았다.
