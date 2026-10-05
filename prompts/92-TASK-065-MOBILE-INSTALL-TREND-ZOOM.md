# TASK-065 실행 지시

- 목적: 모바일 Footer 설치 버튼을 누르기 쉽게 만들고 밀집된 History 기록을 확대 / 축소 / 가로 스크롤로 볼 수 있게 한다.
- 승인: Human 명시 실행 지시 2026-10-05, TASK-065 Contract.
- Context: AGENTS.md, 승인 Decision, COMMON.md, TASK-064 설치와 TASK-060 History 및 TASK-065 설계.
- 실제 Prompt: TASK-065만 allowed_paths에서 구현한다. Footer secondary / 480px 첫 줄 전체 너비, History ResizeObserver 측정 / 자동 초기 확대 / 최신 위치 / Pinch / 버튼 / Keyboard / 너비 기반 Label을 구현하고 Test와 문서를 기록한다. Git 작업과 Gate 우회, Dependency 추가는 금지한다.
- 기대 산출물: Frontend 구현 / Test, UX / PWA / Task / 작업 기록. 화면 캡처는 Claude 세션, 실제 휴대폰은 Merge 후 Human 확인.
- 결과: Executor 구현 완료. 자체 Verify는 npm 캐시 stat EPERM으로 설치 단계에서 중단됐다. 판정은 Sandbox 밖 Orchestrator Verify다.
- Related Commit: 없음 (Executor는 Commit하지 않음).
