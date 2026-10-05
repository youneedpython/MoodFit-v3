# 84. TASK-057 Account Menu

## 목적 / 실행 단계

소셜 사용자가 찾는 “탈퇴” 메뉴를 명확히 표시하고 사용자 메뉴와 확인 창을 정리한다. 승인된 TASK-057의 Executor 구현 단계다.

## 사용 Context

AGENTS.md, 프로젝트 / UI / Architecture / API / 계획 / 상태 문서, 승인 Decision(DEC-041 / DEC-042), COMMON.md, TASK-057 Contract, Multi-Agent 정책과 실행 설계를 확인한다.

## 실제 Prompt

Human: “소셜 계정으로 '탈퇴' 메뉴 없음(안 보임)”. 승인 Contract에 따라 메뉴 / 확인 창의 이름을 회원 탈퇴로 맞추고 메뉴 순서와 간격, 공통 버튼, 진행 중 취소 / Esc 차단을 구현한다. 관련 Test와 안내 문서를 갱신한다. TASK-057 allowed_paths 안에서만 작업하며 Backend / API / 삭제 대상 / Dependency와 TASK-058 추천 영역은 변경하지 않는다. Git 작업은 수행하지 않고 Executor JSON으로 보고한다.

## 기대 산출물 / 승인

- 회원 탈퇴 메뉴 / 확인 창, 진행 중 닫기 차단 및 실패 뒤 복원, 접근성 회귀 Test.
- 인증 / 개인정보 안내와 TASKS / WORK_LOG 갱신.
- Human 명시 실행 승인: 2026-10-05, TASK-057 Contract.
- Executor DONE은 구현 완료이며 검증과 Human 완료 승인을 대신하지 않는다.

## 결과 / Related Commit

구현 완료. 자체 Verify는 npm 캐시 stat EPERM으로 중단되어 Sandbox 밖 Orchestrator Verify와 Claude 화면 캡처가 남는다. Related Commit: Pending.
