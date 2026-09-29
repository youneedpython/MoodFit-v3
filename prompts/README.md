# MoodFit v3 Prompt History

## 목적

`prompts` 디렉터리는 사람이 Codex에게 내린 주요 작업 지시를 기록한다.

모든 대화를 저장하는 것이 아니라 프로젝트 상태 또는 개발 방향을 변경하는 의미 있는 Prompt만 기록한다.

다음과 같은 Prompt를 기록 대상으로 한다.

- Requirements Review
- Human Decision 반영
- Plan 생성 또는 변경
- Task 생성
- Project Bootstrap
- 주요 Feature 구현
- Architecture 변경
- API Contract 변경
- Verification 구성
- GitHub Actions CI 구성
- GitHub Actions Bot 구성
- 중요한 오류 수정

다음과 같은 단순 대화는 기록하지 않는다.

- 개념 질문
- 간단한 설명 요청
- 일회성 확인 질문
- 프로젝트 상태에 영향을 주지 않는 대화

---

## Prompt 파일 기본 구조

각 Prompt 파일은 가능한 경우 다음 항목을 포함한다.

- 목적
- 실행 단계
- 사용 Context
- 실제 Prompt
- 기대 산출물
- Human Approval 여부
- 결과 또는 상태
- 관련 문서
- Related Commit

아직 Commit이 없는 경우 Related Commit은 다음처럼 작성한다.

```text
Pending
```

---

## 파일명 규칙

Prompt는 실행 순서를 확인할 수 있도록 번호를 사용한다.

예:

```text
01-REQUIREMENTS_REVIEW.md
02-DECISION_SYNC.md
03-PLAN_CREATE.md
```

---

## Prompt Index

| No | Prompt | 단계 | 상태 |
|---|---|---|---|
| 01 | Requirements Review | Harness Review | 완료 |
| 02 | Decision Sync | Human Decision 반영 | 완료 |
| 03 | Plan Create | Planning | 완료 |
| 04 | Gate A Tech Versions | Technology Version Review | 완료 |
| 05 | Tasks Create | Task Definition | 완료 |
| 06 | TASK-001 Bootstrap Dependency Review | Gate C Dependency Review | 완료 |
| 07 | Pre-Bootstrap Sync | Documentation Sync | 완료 |
| 08 | Spring Boot Version Re-review | Technology Re-review | 완료 |
| 09 | TASK-001 Project Bootstrap | Implementation | 완료 |
| 10 | TASK-002 Local Verification Harness | Verification 구성 | 완료 |
| 11 | TASK-003 GitHub Actions CI Gate C Review | Gate C Review | 완료 |
| 12 | TASK-003 GitHub Actions CI | Implementation | 완료 |
| 13 | TASK-004 Backend Domain / API Skeleton | Implementation | Remote CI Verification 대기 |
