# Prompt 15 — TASK-005 Wellness Rule Gate B Review

## 목적

MoodFit v3의 Rule-based Wellness Analysis와
Food / Music Recommendation 정책 후보를 정의하고
Gate B Human Review를 받는다.

## 실행 단계

TASK-005 READY
→ Human 실행 승인
→ IN_PROGRESS
→ Wellness Rule Proposal 작성
→ Gate B Human Review 대기

## 사용 Context

AGENTS.md
README.md

docs/01-PROJECT.md
docs/03-UX_UI_SPEC.md
docs/04-ARCHITECTURE.md
docs/05-API_SPEC.md
docs/06-PLAN.md
docs/07-TASKS.md
docs/08-WORK_LOG.md
docs/09-DECISIONS.md

prompts/13-TASK-004-BACKEND-DOMAIN-API-SKELETON.md
prompts/14-MILESTONE-SYNC-WORKFLOW.md

backend/src/main/java/com/moodfit/controller/
backend/src/main/java/com/moodfit/service/
backend/src/main/java/com/moodfit/dto/
backend/src/main/java/com/moodfit/exception/

## 실제 Prompt

Human은 TASK-005 Wellness Analysis / Recommendation Rule Approval 작업을 시작하도록 지시했다.

이번 작업은 Gate B Human Review를 위한 Rule 제안 작업이다.

다음은 수행하지 않는다.

- Backend Java Source 수정
- Frontend Source 수정
- Test 코드 수정
- build.gradle 수정
- package.json 수정
- Dependency 추가
- CI Workflow 수정
- Milestone Workflow 수정
- Entity 구현
- JPA 구현
- MySQL 구현
- Wellness Analysis 구현
- Recommendation 구현
- DEC-014 승인 처리
- TASK-006 실행
- git commit
- git push

`docs/10-WELLNESS-RULE-PROPOSAL.md`를 생성하고,
Wellness Score, Mood, Weather, Temperature, Summary, Food Recommendation,
Music Recommendation, Boundary / Edge Case, Decision Matrix를 Human Review용으로 제안한다.

## Human Approval

Gate B Human Approval 완료 (2026-09-30).

- Human은 Codex 추천 조합을 그대로 승인했다.
- Human Review에서 발견된 Rule 정의 누락 6건은 Human 지시에 따라 Claude가 `docs/10-WELLNESS-RULE-PROPOSAL.md` 16절로 보완했다.
- Human이 16절 확정 Rule을 승인했고, 해당 내용을 `docs/09-DECISIONS.md` DEC-014에 반영했다.
- Human Approval을 받아 `docs/05-API_SPEC.md`의 Mood label과 Response 예시를 DEC-014 기준으로 맞췄다.

## 상태

실행 완료 / Human Approved

## Related Commit

Pending
