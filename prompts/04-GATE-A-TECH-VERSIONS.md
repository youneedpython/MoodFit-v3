# Prompt 04 — Gate A Tech Versions

## 목적

MoodFit v3 Project Bootstrap 전에
Frontend와 Backend에서 사용할 정확한 기술 Version 후보를 조사하고
서로 호환 가능한 Version 조합을 Human Review 대상으로 제안한다.

## 실행 단계

Planning Approval
→ Gate A
→ Technology Version Review

## 사용 Context

AGENTS.md

docs/01-PROJECT.md
docs/03-UX_UI_SPEC.md
docs/04-ARCHITECTURE.md
docs/05-API_SPEC.md
docs/06-PLAN.md
docs/09-DECISIONS.md

## 실제 Prompt

아래 내용을 이번 작업의 전체 지시사항으로 기록한다.

---
AGENTS.md와 다음 문서를 먼저 읽어.

- docs/01-PROJECT.md
- docs/03-UX_UI_SPEC.md
- docs/04-ARCHITECTURE.md
- docs/05-API_SPEC.md
- docs/06-PLAN.md
- docs/09-DECISIONS.md
- prompts/README.md
- prompts/03-PLAN_CREATE.md

현재 단계는 docs/06-PLAN.md의
Gate A — Project Bootstrap 승인 단계다.

이번 작업의 목적은
Project Bootstrap에 사용할 정확한 기술 Version 후보를 조사하고
Human Review를 위한 제안서를 만드는 것이다.

아직 프로젝트를 생성하거나 초기화하지 마.

조사 대상:

- Node.js
- React
- Vite
- React Router
- Vitest
- React Testing Library
- Java 21은 이미 확정되어 있으므로 변경하지 않는다.
- Spring Boot
- Gradle
- TypeScript가 Version 승인 대상에 포함되어야 하는지 검토한다.

Version 조사 원칙:

- 단순히 가장 최신 Version을 선택하지 않는다.
- Stable / LTS 여부, 공식 지원 상태, Java 21 호환성, Node.js 지원 범위, React/Router/Vite/Vitest/Testing Library/Spring Boot/Gradle Compatibility, 교육 환경 재현성, GitHub Actions, Windows 개발 환경 적합성을 함께 검토한다.
- 공식 Release 정보, 공식 Documentation, 공식 Package Metadata를 우선 기준으로 확인한다.
- 조사 기준 날짜를 명시한다.

작업 범위 제한:

- Frontend 프로젝트를 생성하지 않는다.
- Backend 프로젝트를 생성하지 않는다.
- npm init, npm create vite, npm install을 실행하지 않는다.
- Gradle 또는 Spring Boot 프로젝트를 생성하지 않는다.
- Dependency를 설치하지 않는다.
- package.json, build.gradle, GitHub Actions Workflow, docs/06-PLAN.md, docs/09-DECISIONS.md를 생성하거나 수정하지 않는다.
- docs/07-TASKS.md를 생성하지 않는다.
- git commit 또는 git push를 수행하지 않는다.

작업 완료 후 다음을 보고한다.

1. 조사 기준 날짜
2. 조사한 공식 Source
3. Version 후보 표
4. 최종 추천 Version 조합
5. 각 Version의 선택 이유
6. Compatibility 검토 결과
7. TypeScript를 Gate A에 추가해야 하는지 여부
8. Version 고정 전략
9. 남아 있는 Risk
10. Human Approval이 필요한 항목
11. 생성/수정한 파일
12. git status --short 결과

결과를 보고한 후 작업을 멈춘다.
Project Bootstrap으로 넘어가지 않고 Human Review와 Approval을 기다린다.
---

## 기대 산출물

- 정확한 기술 Version 후보
- Version 선택 이유
- 기술 간 Compatibility 검토
- 잠재적 Risk
- Human Approval 요청

실제 프로젝트 코드는 생성하지 않는다.

## Human Approval

필수.

Human Approval 전에는 Project Bootstrap을 수행하지 않는다.

## 상태

실행 완료 / Human Approved

## Human Review 반영 결과

Gate A Human Review 결과에 따라 다음 사항을 반영한다.

- TypeScript 추천 Version은 `7.0.2`가 아니라 `6.0.2`로 변경한다.
- TypeScript `7.0.2`는 현재 stable 참고 사항으로만 남기고, MoodFit v3 추천 Version으로 사용하지 않는다.
- React DOM을 Gate A 승인 대상에 추가한다.
- React Router 8에서는 `react-router-dom`을 설치하지 않고 `react-router` `8.4.0`을 사용한다.
- React Testing Library 사용을 위해 `@testing-library/dom` `10.4.2`를 승인 대상에 추가한다.
- React Component Test를 위해 Vitest DOM Test Environment가 필요하며, `jsdom`을 우선 후보로 제안한다.

## 수정된 Version 제안

### Frontend Runtime

| 기술 | 추천 Version | 상태 | 비고 |
|---|---:|---|---|
| Node.js | 24.21.0 | Human Approved | LTS 기준, Frontend Toolchain과 GitHub Actions 재현성 우선 |

### Frontend Core

| 기술 | 추천 Version | 상태 | 비고 |
|---|---:|---|---|
| React | 19.3.0 | Human Approved | React Router 8 요구 범위 충족 |
| React DOM | 19.3.0 | Human Approved | React와 동일 Version으로 고정 |
| Vite | 8.3.1 | Human Approved | 공식 React + TypeScript Template 기준 |
| TypeScript | 6.0.2 | Human Approved | Vite 8.3.1 React + TypeScript Template의 `~6.0.2` 기준에 맞춤 |
| React Router | 8.4.0 | Human Approved | React Router 8에서는 `react-router-dom`을 설치하지 않음 |

### Frontend Test

| 기술 | 추천 Version | 상태 | 비고 |
|---|---:|---|---|
| Vitest | 5.0.2 | Human Approved | Vite 기반 테스트 러너 |
| React Testing Library | 16.3.3 | Human Approved | React Component Test Library |
| @testing-library/dom | 10.4.2 | Human Approved | React Testing Library의 필수 Peer Dependency |
| jsdom | 30.1.1 | Human Approved | Vitest DOM Test Environment 우선 후보, Node.js 24.21.0 호환 |

### Backend

| 기술 | 추천 Version | 상태 | 비고 |
|---|---:|---|---|
| Java | 21 | Human Approved | 기존 결정 유지 |
| Spring Boot | 3.5.16 | Human Approved | Java 21과 Gradle 8.x 기반의 안정적 조합 |
| Gradle Wrapper | 8.14.5 | Human Approved | Spring Boot 3.5.x와 호환되는 Gradle 8.x 고정 |

## Compatibility 보완

- TypeScript `6.0.2`는 Vite `8.3.1`의 공식 React + TypeScript Template 기준과 맞아 교육 환경의 재현성을 높인다.
- TypeScript `7.0.2`는 stable로 확인되었으나, 이번 프로젝트에서는 최신 기능 실험보다 Template 기준 안정성을 우선한다.
- React DOM은 React와 동일한 `19.3.0`으로 고정해 렌더링 패키지 간 Version 불일치를 피한다.
- React Router 8에서는 `react-router-dom`이 제거되었으므로 Project Bootstrap에서 `react-router-dom`을 설치하지 않는다.
- React Testing Library `16.3.3` 사용 시 `@testing-library/dom` `10.4.2`를 함께 승인 대상으로 둔다.
- jsdom `30.1.1`은 Node.js 최소 요구가 `^22.22.2 || ^24.15.0 || >=26.0.0`이므로 Node.js `24.21.0`과 호환된다.

## Human Approval 결과

Gate A Human Review가 완료되었고 다음 Version 조합이 최종 승인되었다.

- Node.js `24.21.0`
- React `19.3.0`
- React DOM `19.3.0`
- Vite `8.3.1`
- TypeScript `6.0.2`
- React Router `8.4.0`
- Vitest `5.0.2`
- React Testing Library `16.3.3`
- `@testing-library/dom` `10.4.2`
- jsdom `30.1.1`
- Spring Boot `3.5.16`
- Gradle Wrapper `8.14.5`

승인된 Version과 Version 고정 정책은 `docs/09-DECISIONS.md`의 DEC-015에 반영되었다.

## Related Commit

- 819ef5f — Gate A 기술 버전 승인 반영 (docs/06-PLAN.md, docs/09-DECISIONS.md)
- 7260af3 — Prompt 04 기록 파일 추가
