# Prompt 30 — TASK-016 DB 연동 테스트 (실제 MySQL)

## 목적

DEC-023(Gate C 승인)에 따라 Testcontainers MySQL(`mysql:8.0.46`)로
Flyway Schema와 저장 / 조회 동작을 실제 MySQL에서 자동 검증한다. (FU-3, GAP-5)

## 실행 단계

TASK-016 Gate C Review (Prompt 29)
→ DEC-023 Human Approved
→ Docker Desktop 실행 (Human)
→ Implementation / Verification

## 사용 Context

AGENTS.md
README.md

docs/07-TASKS.md (TASK-016)
docs/09-DECISIONS.md (DEC-019, DEC-020, DEC-021, DEC-023)
prompts/29-TASK-016-DB-INTEGRATION-TEST-GATE-C-REVIEW.md

backend/build.gradle
backend/src/test/
.github/workflows/ci.yml

## 실제 Prompt

```text
1. A
2. mysql:8.0.46
3. 건너뛰고 표시
4. 문구 변경 해도 됨!
```

```text
docker 실행했어.
```

## 작업 범위

- Test Dependency 3개 추가 (Spring Boot BOM 관리 Version)
- MySQL 연동 테스트 Class 추가 (`@Testcontainers(disabledWithoutDocker = true)`, `@ServiceConnection`)
- CI 전용 Docker 확인 테스트 추가 (`CI=true`에서만 실행)
- Gradle Test 출력에 Skipped / Failed 표시
- CI Backend Summary MySQL 문구 변경

## 제약

- DB Schema / Flyway Migration / 운영 설정 변경 없음
- 기존 H2 Test 변경 없음
- `ci.yml` Trigger / Permission / Cache / 실행 명령 변경 없음
- git commit / push는 Human 확인 후 진행

## 상태

진행 중

## Related Commit

Pending
