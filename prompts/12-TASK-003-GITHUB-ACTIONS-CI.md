# Prompt 12 — TASK-003 GitHub Actions CI

## 목적

DEC-017에서 Human Approved 된 GitHub Actions CI 구성을
실제 Workflow로 구현하고,
Local Verification 후 Remote GitHub Actions 검증을 준비한다.

## 실행 흐름

TASK-003 READY
→ Human 실행 승인
→ IN_PROGRESS
→ Workflow 구현
→ Local Verification
→ Remote CI Verification 대기
→ Human Review

## 사용 Context

AGENTS.md
README.md

docs/04-ARCHITECTURE.md
docs/06-PLAN.md
docs/07-TASKS.md
docs/08-WORK_LOG.md
docs/09-DECISIONS.md

prompts/README.md
prompts/11-TASK-003-CI-GATE-C-REVIEW.md

scripts/verify.ps1
scripts/verify.sh

frontend/package.json
frontend/package-lock.json

backend/build.gradle
backend/gradle/wrapper/gradle-wrapper.properties

## 실제 Prompt

Human은 TASK-003 Initial GitHub Actions CI 실행을 승인했다.

이번 작업에서는 DEC-017을 Source of Truth로 사용해 다음만 수행한다.

- `.github/workflows/ci.yml` 생성
- Workflow name `CI` 사용
- `push` to `main`, `pull_request` to `main` trigger 구성
- `permissions: contents: read` 설정
- `frontend`, `backend` job 분리
- `actions/checkout@v7` 사용
- `actions/setup-node@v7`와 Node.js `24.21.0` 사용
- Frontend job에서 `npm ci`, `npm test`, `npm run build` 실행
- `actions/setup-java@v6`와 Temurin Java `21` 사용
- `gradle/actions/setup-gradle@v6`와 `cache-disabled: true` 사용
- Backend job에서 repository Gradle Wrapper로 `./gradlew test`, `./gradlew build` 실행
- npm cache와 Gradle cache 미사용
- MySQL Service Container 미사용
- `continue-on-error` 미사용
- `chmod +x` step 미사용
- Local Verification Harness 실행
- Workflow 정적 확인과 `git diff --check` 실행
- Remote CI Verification은 commit/push 이후 Pending으로 기록

이번 작업에서는 다음을 수행하지 않는다.

- git commit
- git push
- TASK-003 REVIEW 또는 DONE 변경
- TASK-004 실행
- Frontend Feature 구현
- Backend Feature 구현
- Dependency 추가
- package.json 수정
- package-lock.json 수정
- build.gradle 수정
- scripts 수정
- MySQL 추가
- Docker 추가
- Deploy 추가
- AWS 추가
- Bot 추가

## Human Approval

TASK-003 실행 승인 완료.

## 상태

구현 완료 / Remote CI Verification 대기

## Related Commit

Pending
