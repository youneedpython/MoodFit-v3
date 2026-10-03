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
| 13 | TASK-004 Backend Domain / API Skeleton | Implementation | 완료 |
| 14 | Milestone Sync Workflow | CI/CD 구성 (Gate C) | 완료 |
| 15 | TASK-005 Wellness Rule Gate B Review | Gate B | 완료 |
| 16 | TASK-006 Persistence Gate C Review | Gate C Review | 완료 |
| 17 | TASK-006 Post-completion Cleanup | Cleanup | 완료 |
| 18 | TASK-007 Frontend Foundation / Design System | Implementation | 완료 |
| 19 | TASK-008 Daily Check-in | Implementation | 완료 |
| 20 | TASK-009 Dashboard | Implementation | 완료 |
| 21 | TASK-010 History / Trend | Implementation (Gate C 포함) | 완료 |
| 22 | TASK-011 Verification Hardening | Verification Hardening | 완료 |
| 23 | TASK-012 GitHub Actions Bot Gate C Review | Gate C Review | 완료 |
| 24 | TASK-012 GitHub Actions Bot | Implementation (CI / Bot) | 완료 |
| 25 | Post-MVP 보완 Task 등록 (TASK-013 ~ TASK-017) | Task 생성 | 완료 |
| 26 | TASK-013 Local Verification Environment Alignment | Verification 구성 | 완료 |
| 27 | TASK-014 Gradle Wrapper Version Review | Technology Version Review | 완료 |
| 28 | TASK-015 Timezone-fixed Date Display Test | Verification 구성 | 완료 |
| 29 | TASK-016 DB 연동 테스트 Gate C Review | Gate C Review | 완료 |
| 30 | TASK-016 DB 연동 테스트 (실제 MySQL) | Implementation (Gate C 포함) | 완료 |
| 31 | TASK-017 API 계약 테스트 Gate C Review | Gate C Review | 완료 |
| 32 | TASK-017 API 계약 테스트 (Frontend / Backend) | Implementation (Gate C 포함) | 완료 |
| 33 | README 프로젝트 소개 개편 | Documentation | 완료 |
| 34 | v3.0.0 Tag / Release | Release | 완료 |
| 35 | Agent 자동화 / AWS 배포 Roadmap 검토와 등록 | Task 생성 | 완료 |
| 36 | TASK-018 Multi-Agent Harness Bootstrap | A ~ D단계 정책 / 구현 / 검증 / 반영 | 완료 |
| 37 | TASK-019 CI Runner OS 조사 / Human Gate | 조사 / 전략 제안 | HUMAN_REQUIRED |
| 38 | TASK-019 승인 C→B 실행 | C 단계 적용 / Remote 검증 대기 | HUMAN_REQUIRED |
| 39 | TASK-019 Remote 검증 후 B 단계 복귀 | B 단계 / 완료 기록 | 구현 완료, Human Squash Merge 대기 |
| 40 | TASK-020 Orchestrator Hardening | 구현 / Finding 수정 / 검증 / 완료 정리 | 완료, PR Squash Merge 승인으로 DONE 확정 |
| 41 | TASK-021 Git Automation / Branch / PR Harness | 승인된 Git 계층 / Guard / Test / 정책 기록 | 완료, Rework 1 / 2회차 Claude PASS / Human 승인 (PR Squash Merge로 확정) |
| 42 | TASK-022 CI / PR Gate | 실행 지시 / Gate | 후속 실행 완료 |
| 43 | TASK-022 Git Content Check | Git 단계 오류 수정 | 완료 |
| 44 | TASK-022 Merge Evidence | 완료 기록 | 완료 |
| 45 | TASK-023 AWS Architecture Gate | Architecture / Cost 제안 | 후속 Human 승인 완료 |
| 46 | TASK-023 Human Gate B | 승인 B안 반영 | 완료 |
| 47 | TASK-023 Domain Decision | Domain / HTTPS 반영 | 완료 |
| 48 | TASK-024 Deployment Artifact / Container / Health | Gate C 제안 | Human 승인 후 Run 2 구현 |
| 49 | TASK-024 Approved Container / Health | Gate C 승인 구현 | Verify 성공, Review PASS, Orchestrator 자동 Draft PR #11 |
| 50 | TASK-025 AWS Access Policy Gate | A단계 설계 / 정책 JSON 제안 | HUMAN_REQUIRED, DEC-029 Pending Human Approval |
| 51 | TASK-025 Approved Preflight | 승인 B단계 Profile 검사 / Fake CLI / 완료 반영 | Executor 구현 완료, DEC-029 Human Approved |
| 52 | TASK-032 Execution | Orchestrator 개선 구현 (PR 본문 / Secret Guard / 자동 Rework / 작업 폴더 / Preflight) | Review CHANGES_REQUIRED 후 Rework |
| 53 | TASK-032 Run 3 Rework | R2 Finding 반영, 자동 Git 범위 확대 | Review CHANGES_REQUIRED |
| 54 | TASK-032 R4 Rework | R3 / R4 Finding 반영 | Review 한도 도달, Human 결정 A |
| 55 | TASK-032 Run 4 Secret Restore | Secret 검사 main 상태 복원, 나머지 개선 유지 | Review PASS, PR #10 Merge |
| 56 | TASK-033 Approved MySQL 8.4 | DEC-030 사전 승인 Image / 문서 / 완료 반영 | Executor 구현 완료, Orchestrator 검증 / Review 대기 |
| 57 | TASK-034 Approved Allowlist | 승인 literal 목록 / Resume / 위치 기록 / 차단 강화 | Executor 구현 완료, 최종 완료 승인은 Human Squash Merge |
| 58 | TASK-026 Approved IaC | Foundation Template / 정적 검증 | 구현 완료, 실제 적용은 별도 승인 |
| 59 | TASK-027 Approved Application Infra | ECS / ALB / Data 연결 / API Routing | Executor 구현 완료, TASK-028 비용·권한 승인 대기 |
| 60 | TASK-028 Staging Preparation | 승인 A단계 배포 절차 / Script / Budget / 조회 초안 | IN_PROGRESS, B단계 배포 검증 전 Merge 금지 |
