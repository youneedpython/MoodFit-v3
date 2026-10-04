# 65. TASK-041 Header Logo Link / Alignment

- 목적: 상단 로고를 홈 이동 링크로 만들고 날짜와 세로 정렬을 맞춘다.
- 실행 단계: 승인 Contract의 Executor 구현 / 테스트 작성 / 기록.
- Context: AGENTS.md, 승인 Decision, 공통 실행 규칙, TASK-041 Contract와 TASK-037 구현.
- Human Approval: 2026-10-04 명시 실행 지시. 새 Dependency와 Gate 변경 없음.

## 실제 Prompt

"페이지의 좌측 상단 로고를 클릭하면, index(main) page 이동"

"로고와 날짜의 위치 맞추기"

승인된 TASK-041만 allowed_paths 안에서 구현한다. 로고와 MoodFit 이름을 Link(`/`)로 묶고 날짜는 밖에 둔다. 기존 Token과 모바일 배치를 유지하며 링크 경로, 접근 가능한 이름과 Dashboard 이동을 테스트한다. Git 작업은 수행하지 않는다.

## 산출물 / 상태

- SPA 홈 링크와 가운데 정렬, AppLayout 회귀 테스트 확장.
- Milestone 41 / DONE 구현 완료 반영, 작업 기록과 Prompt 색인.
- verify.sh는 Sandbox 밖 npm 캐시 접근 EPERM으로 설치 단계에서 중단됐다. 최종 검증은 Orchestrator Verify 기준이며 Claude 화면 확인과 Human Squash Merge가 남아 있다.
- Related Commit: Executor는 Commit을 수행하지 않았다.
