# Prompt 11 — TASK-003 GitHub Actions CI Gate C Review

## 목적

TASK-003 Initial GitHub Actions CI 구현 전에
CI Workflow의 Trigger, Action Version, Runtime,
Job 구조, Cache, Permissions, Verification 범위를 검토하고
Human Approval을 받는다.

## 실행 단계

TASK-002 DONE
→ TASK-003 BLOCKED
→ Gate C Technology / Automation Review
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
prompts/10-TASK-002-LOCAL-VERIFICATION-HARNESS.md

scripts/verify.ps1
scripts/verify.sh

frontend/package.json
frontend/package-lock.json

backend/build.gradle
backend/gradle/wrapper/gradle-wrapper.properties

## 실제 Prompt

Human은 TASK-003 Initial GitHub Actions CI 구현 전에
Gate C Technology / Automation Review만 수행하도록 지시했다.

이번 작업에서는 다음을 수행한다.

- GitHub 공식 문서와 공식 GitHub Action Repository를 기준으로 Action Version 후보를 조사한다.
- CI Runtime, Trigger, Job 구조, Cache, Permissions, Verification 범위를 검토한다.
- Local Verification Harness와 GitHub Actions CI의 대응 관계를 정리한다.
- MySQL Service Container를 초기 CI에 포함하지 않는 정책을 재검토한다.
- Human Approval이 필요한 Gate C 결정 항목을 정리한다.

이번 작업에서는 다음을 수행하지 않는다.

- `.github/` 생성
- Workflow YAML 생성
- GitHub Actions 실행
- TASK-003 구현
- TASK-003 READY 또는 IN_PROGRESS 변경
- Frontend Source 수정
- Backend Source 수정
- Dependency 추가
- scripts 수정
- git commit
- git push

## 공식 Source

- GitHub Actions workflow syntax: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- GitHub-hosted runners reference: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- actions/checkout official repository: https://github.com/actions/checkout
- actions/setup-node official repository: https://github.com/actions/setup-node
- actions/setup-java official repository: https://github.com/actions/setup-java
- Gradle on GitHub Actions official documentation: https://docs.gradle.org/current/userguide/github-actions.html
- gradle/actions official repository: https://github.com/gradle/actions

## 조사 기준 날짜

2026-09-29

## 공식 GitHub Actions 후보

| Action | 현재 Stable Major Version 후보 | 공식 Repository | TASK-003 필요 이유 |
|---|---:|---|---|
| `actions/checkout` | `v7` | https://github.com/actions/checkout | Workflow runner가 repository source를 checkout해야 Frontend/Backend 검증을 수행할 수 있음 |
| `actions/setup-node` | `v7` | https://github.com/actions/setup-node | 승인된 Node.js `24.21.0`을 CI runner에 설정하기 위해 필요 |
| `actions/setup-java` | `v6` | https://github.com/actions/setup-java | 승인된 Java `21`을 CI runner에 설정하기 위해 필요 |
| `gradle/actions/setup-gradle` | `v6` | https://github.com/gradle/actions | Gradle Wrapper 검증, Gradle User Home 관리, Gradle build summary/caching 지원 후보 |

비공식 GitHub Action은 TASK-003 후보로 제안하지 않는다.

## CI Runtime 검토

Frontend:

- Node.js는 DEC-015에 따라 `24.21.0` exact version을 사용하는 방안을 제안한다.
- `actions/setup-node`의 `node-version`은 `24`가 아니라 `24.21.0`으로 지정하는 편이 재현성에 유리하다.
- `package-lock.json`이 존재하므로 `npm install`보다 `npm ci`를 사용하는 방안을 제안한다.
- Frontend CI 범위는 `npm ci`, `npm test`, `npm run build`로 제한한다.

Backend:

- Java는 DEC-015에 따라 `21`을 사용한다.
- `actions/setup-java`는 `distribution: temurin`, `java-version: '21'` 후보가 단순하다.
- Backend build는 repository의 Gradle Wrapper를 사용한다.
- System Gradle 별도 설치는 필요하지 않다.
- `gradle/actions/setup-gradle`은 Gradle 자체 설치가 아니라 Gradle Wrapper 기반 build를 보조하는 후보로 검토한다.

## Runner 후보

| Runner | 장점 | 단점 | 판단 |
|---|---|---|---|
| `ubuntu-latest` | 빠르고 일반적인 CI 기본값, GitHub-hosted runner 문서의 표준 Linux label, 교육용 예제가 많음 | `ubuntu-latest`가 시간이 지나며 새 Ubuntu 버전으로 이동할 수 있음 | 추천 후보 |
| `ubuntu-24.04` 또는 `ubuntu-26.04` | OS 재현성이 더 높음 | 교육용 초기 CI에서는 버전 선택 설명이 추가로 필요함 | 대안 |
| `windows-latest` | 로컬 Windows 환경과 유사 | 실행 시간이 길고 Shell/Gradle/Node 예제가 복잡해질 수 있음 | 초기 CI에서는 비추천 |

추천안:

- 초기 TASK-003은 `ubuntu-latest`를 우선 후보로 제안한다.
- 더 강한 OS 재현성이 필요하면 Human Review에서 `ubuntu-24.04` 또는 `ubuntu-26.04` 고정을 선택한다.

## Workflow Trigger 비교

### Option A

```yaml
push:
  branches:
    - main

pull_request:
  branches:
    - main
```

장점:

- `main`에 직접 push된 변경과 PR 변경을 모두 검증한다.
- merge 후 main branch 상태도 자동 확인된다.
- 교육용 Harness에서 “PR 전 검증 + main 보호” 흐름을 보여주기 좋다.

단점:

- 같은 변경이 PR과 merge push에서 두 번 실행될 수 있다.
- 초기 학습자에게 trigger 중복 개념을 설명해야 한다.

### Option B

```yaml
pull_request:
  branches:
    - main
```

장점:

- 단순하다.
- PR 중심 개발 흐름만 검증하면 실행 횟수가 줄어든다.

단점:

- main에 직접 push되는 경우 CI가 실행되지 않는다.
- merge 후 main branch 상태 검증이 빠질 수 있다.

추천안:

- MoodFit v3는 Harness 교육 프로젝트이므로 Option A를 추천한다.
- 다만 최종 Trigger는 Gate C Human Approval 대상으로 남긴다.

## Job 구조 비교

### Option A — 단일 `verify` Job

Frontend와 Backend 검증을 하나의 Job에서 순차 실행한다.

장점:

- Local Verification Harness와 구조가 가장 비슷하다.
- Workflow YAML이 짧고 이해하기 쉽다.
- 초기 교육용 CI로 단순하다.

단점:

- Frontend 실패 시 Backend 검증까지 도달하지 않을 수 있다.
- 실패 영역을 Job 단위로 분리해서 보기 어렵다.
- 병렬 실행 이점이 없다.

### Option B — `frontend` / `backend` Job 분리

Frontend와 Backend 검증을 별도 Job으로 실행한다.

장점:

- 실패 원인을 Job 이름으로 바로 구분할 수 있다.
- 병렬 실행으로 전체 시간이 줄어들 수 있다.
- 이후 Feature별 검증 확장에 유리하다.

단점:

- YAML이 길어진다.
- checkout/setup 단계가 중복된다.
- Local Verification Harness의 순차 구조와는 차이가 생긴다.

추천안:

- 초기 TASK-003은 교육용 가독성과 실패 원인 파악을 균형 있게 고려해 Option B를 추천한다.
- 단, Local Verification과의 1:1 대응을 더 중시하면 Option A도 타당하다.
- 최종 Job 구조는 Gate C Human Approval 대상으로 남긴다.

## Frontend CI 범위

TASK-002 Local Verification과 동일하거나 동등하게 다음만 포함한다.

```text
npm ci
npm test
npm run build
```

포함하지 않는다.

- Deploy
- E2E Test
- Browser Automation
- Lint Tool 추가
- 새로운 Testing Dependency

## Backend CI 범위

TASK-002 Local Verification과 동일하거나 동등하게 다음만 포함한다.

```text
./gradlew test
./gradlew build
```

검토 사항:

- Java 21은 `actions/setup-java`로 설정한다.
- Gradle은 repository의 Gradle Wrapper를 사용한다.
- System Gradle 별도 설치는 필요하지 않다.
- 현재 Git index에서 `backend/gradlew`는 executable bit `100755`로 추적되고 있다.
- 그래도 Linux runner에서 실행 권한 이슈가 발생할 가능성을 줄이려면 `chmod +x backend/gradlew` step을 명시하는 방안을 Gate C 후보로 둘 수 있다.

포함하지 않는다.

- MySQL Service Container
- Database Integration Test
- Docker
- Deployment
- AWS
- JPA 관련 추가 설정

## Database 정책

초기 CI에서는 MySQL Service Container를 사용하지 않는 방안을 유지한다.

이유:

- DEC-009에서 초기 CI는 별도의 MySQL Service Container를 실행하지 않기로 승인되어 있다.
- TASK-001과 TASK-002가 외부 MySQL 없이 Test/Build를 성공했다.
- 아직 Database Integration Task가 아니다.
- 초기 CI 목적은 Skeleton Test / Build 검증이다.

MySQL Service Container 도입은 후속 Database Integration 단계의 Gate C 대상으로 유지한다.

## Cache 정책 비교

### Option A — Cache 없이 시작

장점:

- Workflow가 가장 단순하다.
- 학습 난이도가 낮다.
- Cache key, cache miss, stale cache 같은 변수를 배제할 수 있다.
- 초기 Skeleton 검증에서는 실행 시간이 비교적 짧다.

단점:

- 매번 npm package와 Gradle dependency를 새로 내려받아 시간이 늘 수 있다.

### Option B — Frontend npm cache 사용

예상 후보:

```yaml
uses: actions/setup-node@v7
with:
  node-version: '24.21.0'
  cache: npm
  cache-dependency-path: frontend/package-lock.json
```

장점:

- npm install 시간을 줄일 수 있다.

단점:

- 초기 Workflow 복잡도가 증가한다.
- monorepo 하위 경로 cache 설정을 설명해야 한다.

### Option C — Gradle cache 사용

후보:

- `actions/setup-java@v6`의 `cache: gradle`
- 또는 `gradle/actions/setup-gradle@v6`

장점:

- Gradle dependency와 wrapper 관련 반복 다운로드를 줄일 수 있다.
- `gradle/actions/setup-gradle@v6`는 Gradle Wrapper validation과 summary를 제공한다.

단점:

- 초기 교육용 CI에서는 cache 동작과 action 역할 설명이 추가된다.
- Cache write/read 정책을 이해해야 한다.

추천안:

- 초기 TASK-003에서는 Cache 없이 시작하는 Option A를 추천한다.
- CI 실행 시간이 문제로 확인되면 Gate C로 cache를 추가 검토한다.
- 단, Gradle Wrapper validation을 중시하면 `gradle/actions/setup-gradle@v6` 도입도 승인 후보가 될 수 있다.

## Permissions 정책

Initial CI는 Source 수정, Commit, Push, PR 작성, Deployment가 필요하지 않다.

추천 후보:

```yaml
permissions:
  contents: read
```

이유:

- repository checkout과 dependency install/test/build에 필요한 최소 권한이다.
- GitHub 공식 문서도 `permissions`로 `GITHUB_TOKEN` 권한을 최소화할 수 있다고 설명한다.
- `actions/setup-java` 공식 README도 일반적인 setup-java workflow에 `contents: read`를 권장한다.

추가 권한:

- 초기 TASK-003 범위에서는 필요하지 않다.
- PR comment, artifact upload, dependency submission, deployment를 추가하는 경우 별도 Gate C가 필요하다.

## Local Verification과 CI 대응

| Local Verification | GitHub Actions CI | 동일 여부 |
|---|---|---|
| Frontend Test: `npm test` | `npm test` | 동일 |
| Frontend Build: `npm run build` | `npm run build` | 동일 |
| Backend Test: `gradlew test` | `./gradlew test` | 동일 |
| Backend Build: `gradlew build` | `./gradlew build` | 동일 |

CI만의 별도 Feature Test는 추가하지 않는다.

## Failure 정책

CI에서 다음을 보장해야 한다.

- Frontend Test 실패 → Job 실패
- Frontend Build 실패 → Job 실패
- Backend Test 실패 → Job 실패
- Backend Build 실패 → Job 실패
- 실패를 숨기지 않음

다음 설정은 사용하지 않는 방향으로 제안한다.

```yaml
continue-on-error: true
```

## Workflow 파일 후보

구현 시 예상 위치:

```text
.github/
└── workflows/
    └── ci.yml
```

이번 Gate C Review에서는 위 파일을 생성하지 않는다.

## 핵심 구조 예시

아래는 Human Review를 위한 구조 예시이며, 실제 Workflow YAML이 아니다.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: '24.21.0'
          package-manager-cache: false
      - run: npm ci
        working-directory: frontend
      - run: npm test
        working-directory: frontend
      - run: npm run build
        working-directory: frontend

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: '21'
      - run: ./gradlew test
        working-directory: backend
      - run: ./gradlew build
        working-directory: backend
```

`gradle/actions/setup-gradle@v6` 또는 cache 사용 여부는 Gate C Human Approval 대상이다.

## Recommendation

Codex 추천안은 다음과 같다.

- Workflow file: `.github/workflows/ci.yml`
- Runner: `ubuntu-latest`
- Trigger: `push` to `main` + `pull_request` to `main`
- Job 구조: `frontend`, `backend` 분리
- Actions:
  - `actions/checkout@v7`
  - `actions/setup-node@v7`
  - `actions/setup-java@v6`
- Gradle 공식 Action:
  - 초기에는 미사용
  - Gradle Wrapper validation / cache / summary가 필요하다고 Human이 판단하면 `gradle/actions/setup-gradle@v6` 승인
- Node.js: `24.21.0`
- Java: `21`, distribution `temurin`
- Frontend install: `npm ci`
- Backend build: repository Gradle Wrapper 사용
- Cache: 초기에는 미사용
- Permissions: `contents: read`
- MySQL Service Container: 미사용
- Verification 범위: TASK-002 Local Verification과 동일

## Gate C Human Approval 필요 항목

- `actions/checkout` version
- `actions/setup-node` version
- `actions/setup-java` version
- `gradle/actions/setup-gradle` 사용 여부와 version
- Runner OS
- Trigger
- Job 구조
- Node.js version
- Java version / distribution
- `npm ci` 정책
- Gradle Wrapper 사용 정책
- `chmod +x backend/gradlew` step 포함 여부
- Cache 사용 여부
- `permissions: contents: read`
- MySQL Service Container 미사용
- CI Verification 범위
- Workflow file path

## Human Approval 결과

Gate C Human Review 결과, Codex 추천안에 다음 항목을 추가하여 승인했다.

- `gradle/actions/setup-gradle@v6` 사용
  - Gradle Wrapper jar 검증(`validate-wrappers` 기본값 `true`)을 위해 사용한다.
  - `cache-disabled: true`로 Cache 없이 시작하는 정책을 유지한다.

그 외 결정:

- `chmod +x backend/gradlew` step은 추가하지 않는다.
  - `backend/gradlew`가 Git에서 executable bit `100755`로 추적되기 때문이다.
- 나머지 항목은 Codex 추천안대로 승인했다.

승인된 CI 구성은 `docs/09-DECISIONS.md`의 DEC-017에 기록했다.
TASK-003은 READY 상태로 변경했으며, 실행 전 별도 Human 지시가 필요하다.

## 상태

실행 완료 / Human Approved

## Related Commit

Pending
