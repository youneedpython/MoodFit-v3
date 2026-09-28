# Prompt 07 — Pre-Bootstrap Sync

## 목적

TASK-001 Project Bootstrap 실행 전에
AGENTS.md, README.md, 관련 명세 문서와
Task 관리 문서의 현재 상태를 동기화한다.

## 실행 단계

Gate C Approval
→ Pre-Bootstrap Documentation Sync
→ TASK-001 Ready

## 사용 Context

AGENTS.md
README.md

docs/01-PROJECT.md
docs/03-UX_UI_SPEC.md
docs/04-ARCHITECTURE.md
docs/06-PLAN.md
docs/07-TASKS.md
docs/09-DECISIONS.md

## 실제 Prompt

아래 내용을 이번 작업의 전체 지시사항으로 기록한다.

---
AGENTS.md와 다음 문서를 먼저 읽어.

- README.md
- docs/01-PROJECT.md
- docs/03-UX_UI_SPEC.md
- docs/04-ARCHITECTURE.md
- docs/06-PLAN.md
- docs/07-TASKS.md
- docs/09-DECISIONS.md
- prompts/README.md
- prompts/06-TASK-001-BOOTSTRAP-DEPENDENCY-REVIEW.md

현재 상태:

- docs/06-PLAN.md Human Approved
- Gate A Human Approved
- DEC-015 Human Approved
- DEC-016 Human Approved
- TASK-001 Project Bootstrap READY
- DEC-014 Wellness Analysis Rule Pending
- 아직 TASK-001 실제 실행은 하지 않음

이번 작업의 목적은 TASK-001 실행 전에 현재 프로젝트 단계와 문서 상태를 동기화하는 것이다.

실제 Project Bootstrap은 아직 수행하지 않는다.

수행 내용:

- prompts/07-PRE-BOOTSTRAP-SYNC.md 생성
- AGENTS.md 현재 단계 규칙 갱신
- README.md 현재 상태, 초기 구조, 기술 스택, 다음 단계 갱신
- docs/01-PROJECT.md Version 표현 동기화
- docs/03-UX_UI_SPEC.md React Router 표현 동기화
- docs/04-ARCHITECTURE.md 현재 단계와 Test 도구 표현 동기화
- docs/07-TASKS.md TASK-001 Work Log 생성 규칙 보완
- prompts/README.md Prompt Index에 07 항목 추가

변경하지 않을 사항:

- docs/05-API_SPEC.md
- docs/06-PLAN.md
- docs/09-DECISIONS.md의 기존 Decision
- DEC-014
- DEC-015
- DEC-016의 내용
- TASK-002 ~ TASK-012 상태

수행하지 않을 작업:

- frontend/ 생성
- backend/ 생성
- docs/08-WORK_LOG.md 생성
- npm init
- npm create
- npm install
- npx 실행
- Gradle Project 생성
- Gradle Wrapper 생성
- Spring Boot Project 생성
- Dependency 설치
- package.json 생성
- build.gradle 생성
- scripts 생성
- GitHub Actions 생성 또는 수정
- TASK-001 IN_PROGRESS 변경
- TASK-001 실행
- git commit
- git push

작업 완료 후 보고 항목:

1. 생성한 파일
2. 수정한 파일
3. AGENTS.md 현재 단계 변경 내용
4. README.md 현재 단계 변경 내용
5. 01-PROJECT.md 동기화 내용
6. 03-UX_UI_SPEC.md 동기화 내용
7. 04-ARCHITECTURE.md 동기화 내용
8. TASK-001 Work Log 규칙 보완 내용
9. TASK-001 현재 Status
10. 아직 Pending인 Decision
11. git diff --stat 결과
12. git status --short 결과

보고 후 작업을 멈추고 TASK-001을 실행하지 말고 Human Review를 기다린다.
---

## 기대 산출물

- AGENTS.md 현재 단계 규칙 갱신
- README.md 현재 상태 갱신
- Version 관련 과거 표현 동기화
- TASK-001 Work Log 생성 규칙 보완

Project Bootstrap은 실행하지 않는다.

## Human Approval

필수.

문서 동기화 결과를 Human Review한 이후
TASK-001 실행 단계로 이동한다.

## 상태

실행 완료 / Human Review 중

## Related Commit

Pending
