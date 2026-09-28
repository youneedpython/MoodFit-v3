# Prompt 03 — Plan Create

## 목적

승인된 프로젝트 요구사항과 Decision을 기준으로
MoodFit v3의 구현 계획인 docs/06-PLAN.md를 작성한다.

## 실행 단계

Decision Sync
→ Planning

## 사용 Context

AGENTS.md

docs/01-PROJECT.md
docs/02-V1-REFERENCE.md
docs/03-UX_UI_SPEC.md
docs/04-ARCHITECTURE.md
docs/05-API_SPEC.md
docs/09-DECISIONS.md

## 실제 Prompt

아래 내용을 그대로 기록한다.

---
AGENTS.md와 docs 디렉터리의 다음 문서를 다시 읽어.

- 01-PROJECT.md
- 02-V1-REFERENCE.md
- 03-UX_UI_SPEC.md
- 04-ARCHITECTURE.md
- 05-API_SPEC.md
- 09-DECISIONS.md

이제 docs/06-PLAN.md를 작성해.

아직 Frontend나 Backend 코드를 생성하지 마.
npm 또는 Gradle 프로젝트를 초기화하지 마.
07-TASKS.md도 아직 생성하지 마.
git commit 또는 push도 수행하지 마.

06-PLAN.md는 구현 코드가 아니라
MoodFit v3의 실행 계획을 정의하는 문서다.

다음 내용을 반드시 포함해.

1. 전체 Milestone
2. 각 Milestone의 목적
3. 선행 의존성
4. 주요 산출물
5. 검증 방법
6. Human Approval Gate
7. 완료 조건

계획은 다음 순서를 기본으로 검토해.

Milestone 1
Project Bootstrap

Milestone 2
Backend Domain / API Core

Milestone 3
Frontend Foundation / Design System

Milestone 4
Daily Check-in

Milestone 5
Dashboard

Milestone 6
History / Trend

Milestone 7
Local Verification Harness

Milestone 8
GitHub Actions CI

Milestone 9
GitHub Actions Bot

단, 위 순서를 그대로 복사하지 말고
현재 문서의 의존성을 분석해서 필요한 경우 조정해.

특히 다음 Approval Gate를 명확히 포함해.

[Gate A]
Project Bootstrap 전에
React, Vite, Node.js, Spring Boot, Gradle,
React Router, Vitest, React Testing Library의
정확한 버전 후보와 선택 이유를 제안한다.
Human Approval 전에는 프로젝트를 초기화하지 않는다.

[Gate B]
Wellness Analysis Service 구현 전에
Wellness Score 계산식,
Mood 판정 기준,
Metric 가중치,
Weather 영향,
Food Recommendation Rule,
Music Recommendation Rule을 제안한다.
Human Approval 전에는 해당 분석 로직을 구현하지 않는다.

[Gate C]
새로운 외부 Dependency,
API Contract,
DB Schema의 주요 변경이 필요하면
구현 전에 Human Approval을 받는다.

Recommendation Refresh는 Core MVP 계획에 포함하지 않는다.

GitHub Actions Bot은
Local Verification과 CI가 정상 동작한 이후에 배치한다.

계획 작성이 끝나면 다음을 보고해.

1. 생성한 파일
2. Milestone 구성
3. 각 Approval Gate의 위치
4. 구현 순서를 그렇게 정한 이유
5. 아직 해결되지 않은 Risk

그 후 작업을 멈추고
내 승인을 기다려.
---

## 기대 산출물

docs/06-PLAN.md

단, 이 Prompt 기록 파일을 생성하는 현재 작업에서는
실제 docs/06-PLAN.md를 생성하지 않는다.

## Human Approval

필수.

06-PLAN.md 생성 후 구현으로 넘어가기 전에
Human Review와 Approval을 받아야 한다.

## 상태

실행 완료 / Human Approved

## Related Commit

Pending
