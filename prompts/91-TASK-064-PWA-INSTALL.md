# TASK-064 PWA 설치 실행 지시

- 목적: 홈 화면 / PC 설치와 앱 설치 버튼 제공.
- 승인: Human 2026-10-05 “PWA (화면에 앱 설치 버튼 추가) 승인!” 및 명시 Executor 실행 지시.
- Context: AGENTS.md, 프로젝트 / UI / Architecture / API / 계획 / 결정 / 정책, COMMON과 TASK-064 Contract.
- 실제 Prompt: “Implement only this explicitly requested Task within allowed_paths. Never commit, push, create branches, or bypass Human Gates.” TASK-064 설계대로 설치만 구현하고 Manifest 이름 변경, Footer / 메뉴 버튼과 iOS 안내, Test와 문서를 추가한다.
- 제외: Service Worker / Offline / 알림, Backend / API / DB / Dependency / 아이콘 변경.
- 결과: Executor 구현 완료. Sandbox 밖 Orchestrator Verify / Claude Review / Human Squash Merge 대기.
- Related Commit: Executor는 Git 작업을 수행하지 않는다.
