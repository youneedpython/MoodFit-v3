# Prompt 09 — TASK-001 Project Bootstrap

## 목적

승인된 DEC-015와 DEC-016을 기준으로
MoodFit v3의 Frontend와 Backend 최소 실행 Skeleton을 생성하고
Test / Build 가능한 상태를 만든다.

## 실행 단계

TASK-001 READY
→ Human Execution Approval
→ IN_PROGRESS
→ Project Bootstrap
→ Verification
→ Work Log
→ REVIEW
→ Human Review
→ DONE

## 사용 Context

AGENTS.md
README.md

docs/01-PROJECT.md
docs/03-UX_UI_SPEC.md
docs/04-ARCHITECTURE.md
docs/05-API_SPEC.md
docs/06-PLAN.md
docs/07-TASKS.md
docs/09-DECISIONS.md

prompts/08-SPRING-BOOT-VERSION-REREVIEW.md

## 실제 Prompt

이번 작업에서는 Human이 승인한 TASK-001 Project Bootstrap 실행 지시를 사용했다.

주요 지시사항은 다음과 같다.

- 실행 전 `node --version`, `npm --version`, `java --version`, `git status --short`를 확인한다.
- Node.js 24.21.0, Java 21, clean working tree 조건이 충족될 때만 TASK-001을 시작한다.
- TASK-001만 실행하고 TASK-002 이후 작업은 시작하지 않는다.
- docs/07-TASKS.md의 TASK-001 상태를 READY에서 IN_PROGRESS로 변경한다.
- 승인된 DEC-015와 DEC-016에 따라 Frontend와 Backend 최소 Skeleton을 생성한다.
- Frontend는 React 19.3.0, React DOM 19.3.0, Vite 8.3.1, TypeScript 6.0.2, React Router 8.4.0을 사용한다.
- Frontend Test는 Vitest 5.0.2, React Testing Library 16.3.3, @testing-library/dom 10.4.2, jsdom 30.1.1을 사용한다.
- `react-router-dom`, oxlint, ESLint, Prettier, 추가 Testing Utility, UI Library는 추가하지 않는다.
- Backend는 Java 21, Spring Boot 4.1.1, Gradle Wrapper 8.14.5를 사용한다.
- Backend Dependency는 `spring-boot-starter-webmvc`, `spring-boot-starter-validation`, `spring-boot-starter-webmvc-test`만 사용한다.
- `spring-boot-starter-web`, `spring-boot-starter-test`, JPA, MySQL, Lombok, Security, OAuth, Actuator는 추가하지 않는다.
- Frontend `npm test`, `npm run build`, Backend `gradlew test`, `gradlew build`를 검증한다.
- Verification 성공 후 docs/08-WORK_LOG.md를 생성하고 TASK-001 상태를 REVIEW로 변경한다.
- 실패 시 실패 지점을 docs/08-WORK_LOG.md에 기록하고 TASK-001을 REVIEW 또는 DONE으로 변경하지 않는다.
- git commit 또는 git push는 수행하지 않는다.

## Human Approval

TASK-001 실행 승인 완료.

TASK-001 완료 후 Human Review 승인 완료.

## 상태

실행 완료 / Human Approved

## Related Commit

1d34f77
