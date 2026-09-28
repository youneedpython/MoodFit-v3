# Prompt 06 — TASK-001 Bootstrap Dependency Review

## 목적

Project Bootstrap 전에
Frontend와 Backend Skeleton에 실제로 필요한
최소 Dependency와 Plugin을 조사하고
Gate C Human Review 대상으로 제안한다.

## 실행 단계

Task Definition
→ TASK-001 Preflight
→ Gate C Dependency Review

## 사용 Context

AGENTS.md

docs/04-ARCHITECTURE.md
docs/06-PLAN.md
docs/07-TASKS.md
docs/09-DECISIONS.md

## 실제 Prompt

아래 내용을 이번 작업의 전체 지시사항으로 기록한다.

---
AGENTS.md와 다음 문서를 먼저 읽어.

- docs/04-ARCHITECTURE.md
- docs/06-PLAN.md
- docs/07-TASKS.md
- docs/09-DECISIONS.md
- prompts/README.md
- prompts/05-TASKS-CREATE.md

현재 TASK-001 Project Bootstrap 실행 직전이다.

Human Review 결과, TASK-001을 실제로 수행하려면 DEC-015에서 명시적으로 승인되지 않은 Bootstrap 지원 Dependency가 추가로 필요할 수 있다는 점을 확인했다.

이번 작업의 목적은 TASK-001에 필요한 최소 Bootstrap Dependency Set을 조사하여 Gate C Human Review 대상으로 제안하는 것이다.

아직 TASK-001을 실행하지 않는다.

수행 내용:

- prompts/06-TASK-001-BOOTSTRAP-DEPENDENCY-REVIEW.md 생성
- docs/07-TASKS.md에서 TASK-001 상태를 BLOCKED로 변경
- BLOCKED 이유를 Gate C — Bootstrap Dependency Set Human Approval 대기로 기록
- Gate C 승인 후에만 TASK-001을 READY로 변경한다고 명시
- Frontend Bootstrap Dependency 후보 조사
  - @vitejs/plugin-react
  - @types/react
  - @types/react-dom
  - @types/node
- 불필요한 Frontend Tooling 제외 검토
  - oxlint
  - ESLint
  - Prettier
  - 추가 Testing Utility
  - 추가 UI Library
- Backend Bootstrap Dependency 후보 조사
  - spring-boot-starter-web
  - spring-boot-starter-validation
  - spring-boot-starter-test
- Gradle Dependency Management 방식 검토
  - Spring Boot Gradle Plugin
  - io.spring.dependency-management Plugin
  - Gradle native BOM 방식
- TASK-001에서 제외할 Backend Dependency 기록
  - Spring Data JPA
  - MySQL Connector
  - Database Migration Tool
  - Lombok
  - Security
  - OAuth
  - Actuator
- TASK-001 Frontend Verification의 test script 정책 보완
  - test → vitest run
- TASK-001 Frontend 범위의 /api Proxy 정책 보완
  - /api → http://localhost:8080
- docs/09-DECISIONS.md는 수정하지 않음
- prompts/05-TASKS-CREATE.md 상태를 실행 완료 / Human Approved로 변경
- prompts/README.md의 05 상태를 완료로 변경
- prompts/README.md에 06 항목 추가

작업 범위 제한:

- Frontend Project 생성 금지
- Backend Project 생성 금지
- npm init 금지
- npm create 금지
- npm install 금지
- npx 실행 금지
- Dependency 설치 금지
- package.json 생성 또는 수정 금지
- package-lock.json 생성 금지
- vite.config.ts 생성 금지
- Spring Boot Project 생성 금지
- Gradle Project 생성 금지
- Gradle Wrapper 생성 금지
- build.gradle 생성 금지
- application.properties/yml 생성 금지
- scripts 생성 금지
- GitHub Actions 생성/수정 금지
- docs/09-DECISIONS.md 수정 금지
- Wellness Analysis Rule 결정 금지
- TASK-001 실행 금지
- git commit 금지
- git push 금지

작업 완료 후 보고 항목:

1. 생성한 파일
2. 수정한 파일
3. Frontend 추가 Dependency 후보
4. Backend 추가 Dependency 후보
5. Gradle Dependency Management 추천 방식
6. TASK-001에서 제외한 Tooling/Dependency
7. TASK-001 상태
8. Test Script 정책
9. /api Proxy 정책
10. Gate C Human Approval이 필요한 항목
11. git status --short 결과

보고 후 작업을 멈추고 TASK-001을 실행하지 말고 Human Review를 기다린다.
---

## 기대 산출물

- Frontend Bootstrap Dependency 후보
- Backend Bootstrap Dependency 후보
- 필요한 Plugin 후보
- Version 또는 Version 관리 방식
- 제외할 Dependency
- Human Approval 요청

Project Bootstrap은 실행하지 않는다.

## Human Approval

필수.

Gate C 승인 전에는
새로운 Dependency를 설치하지 않는다.

## 상태

실행 완료 / Human Approved

## Human Approval 결과

Gate C Human Review가 완료되었고 TASK-001 Project Bootstrap에서 사용할 Bootstrap Dependency Set이 승인되었다.

승인 결과는 docs/09-DECISIONS.md의 DEC-016 Bootstrap Dependency Set에 반영되었다.

### 승인된 Frontend Bootstrap Support Dependency

다음 Dependency는 `devDependency`로 사용한다.

- `@vitejs/plugin-react` `6.1.1`
- `@types/react` `19.3.0`
- `@types/react-dom` `19.3.0`
- `@types/node` `24.13.6`

### 승인된 Backend Bootstrap Plugin / Dependency

다음 Gradle Plugin을 사용한다.

- `org.springframework.boot` Gradle Plugin `3.5.16`
- `io.spring.dependency-management` Plugin `1.1.7`

다음 Spring Boot Starter를 사용한다.

- `spring-boot-starter-web`
  - `implementation`
  - Version은 Spring Boot `3.5.16` dependency management 사용
- `spring-boot-starter-validation`
  - `implementation`
  - Version은 Spring Boot `3.5.16` dependency management 사용
- `spring-boot-starter-test`
  - `testImplementation`
  - Version은 Spring Boot `3.5.16` dependency management 사용

### 승인된 Gradle Dependency Management 정책

- Spring Boot Gradle Plugin `3.5.16`을 사용한다.
- `io.spring.dependency-management` Plugin `1.1.7`을 사용한다.
- Spring Boot가 제공하는 dependency management를 사용한다.
- 위 Spring Boot Starter에는 개별 Version을 직접 작성하지 않는다.
- 별도의 Gradle native BOM 방식은 이번 Project Bootstrap에서 사용하지 않는다.

### 승인된 Frontend Test Script 정책

```text
test → vitest run
```

### 승인된 Vite Development Proxy 정책

```text
/api
  ↓
http://localhost:8080
```

### TASK-001 제외 Dependency

Frontend:

- `oxlint`
- ESLint
- Prettier
- 추가 Testing Utility
- 추가 UI Library

Backend:

- Spring Data JPA
- MySQL Connector
- Database Migration Tool
- Lombok
- Security
- OAuth
- Actuator

필요성이 발생하면 후속 Task에서 Gate C를 통해 별도로 검토한다.

## Related Commit

Pending
