# MoodFit v3 — Codex 작업 규칙

## 1. 문서 목적

이 파일은 MoodFit v3 Repository에서 Codex가 작업할 때 따라야 하는 최상위 작업 규칙을 정의한다.

MoodFit v3의 핵심 목표는 단순히 코드를 빠르게 생성하는 것이 아니라, **명세 → 계획 → 사람 승인 → Task 단위 구현 → 검증 → 기록**의 흐름을 지키는 Harness 기반 개발을 실습하는 것이다.

---

## 2. 작업 시작 전 반드시 읽을 문서

Codex는 구현 또는 수정 작업을 시작하기 전에 작업 목적에 맞는 문서를 확인한다.

기본 읽기 순서는 다음과 같다.

1. `AGENTS.md`
2. `docs/01-PROJECT.md`
3. `docs/02-V1-REFERENCE.md`
4. `docs/03-UX_UI_SPEC.md`
5. `docs/04-ARCHITECTURE.md`
6. `docs/05-API_SPEC.md`
7. `docs/09-DECISIONS.md`

`docs/06-PLAN.md`, `docs/07-TASKS.md`가 생성된 이후에는 해당 문서도 반드시 확인한다.

---

## 3. 현재 단계 규칙

현재 단계는 **TASK Execution 단계**이다.

TASK-001 ~ TASK-012는 모두 DONE 상태이다.
Wellness Analysis / Recommendation Rule은 DEC-014, Persistence Dependency와 DB Schema는 DEC-019, GitHub Actions Bot은 DEC-021을 Source of Truth로 사용한다.

Current Task:

```text
없음 (계획된 Task 모두 완료)
```

Status:

```text
ALL DONE
```

TASK-011 / TASK-012에서 정리한 후속 보완 작업 후보(FU-1 ~ FU-5)는 `docs/08-WORK_LOG.md` TASK-011 섹션을 따르며, 진행 시 각 후보에 필요한 승인을 받는다.
새로운 작업은 Human 지시에 따라 Task를 정의하고 필요한 Gate(A / B / C)와 Human Approval을 거친 뒤 시작한다.

단, Codex는 사용자의 명시적인 TASK 실행 지시 없이 READY Task를 임의로 실행하지 않는다.

Task 실행 시에는 다음 규칙을 따른다.

- `docs/07-TASKS.md`의 Current Task를 확인한다.
- READY 상태의 Current Task만 실행할 수 있다.
- 필요한 Human Approval / Gate가 완료되었는지 확인한다.
- 사용자의 명시적인 실행 지시가 있어야 Task를 시작한다.
- Task 시작 시 해당 Task만 IN_PROGRESS로 변경한다.
- BLOCKED Task는 실행하지 않는다.
- Task 범위를 벗어난 작업은 수행하지 않는다.
- 새로운 승인되지 않은 Dependency가 필요하면 Gate C를 적용한다.
- DEC-014 Wellness Analysis Rule은 승인된 내용 그대로 구현하며, 변경이 필요하면 Gate B를 다시 거친다.

---

## 3.1 문서 충돌 및 Source of Truth 규칙

문서마다 책임이 다르므로 Codex는 다음 원칙으로 해석한다.

- `AGENTS.md`: 작업 절차, 승인, 검증, 기록 규칙
- `docs/01-PROJECT.md`: 제품 목표, 범위, 완료 기준
- `docs/02-V1-REFERENCE.md`: v1에서 참고할 UI/UX 방향
- `docs/03-UX_UI_SPEC.md`: 화면, 상태, 상호작용 요구사항
- `docs/04-ARCHITECTURE.md`: 기술 책임과 목표 구조
- `docs/05-API_SPEC.md`: Frontend/Backend 간 API Contract
- `docs/09-DECISIONS.md`: Human Review를 통해 승인된 제품·기술·아키텍처 결정의 최종 기록

세부 문서가 상위 개념 문서보다 구체적인 내용을 정의할 수 있지만, `docs/09-DECISIONS.md`에 승인된 결정이 있는 경우 해당 결정을 우선한다.
서로 모순되는 요구사항을 임의로 선택해서 구현하지 않는다.
구현 결과에 영향을 주는 충돌이 발견되면 작업을 중단하고 충돌 항목, 가능한 대안, 추천안을 보고한 뒤 Human Approval을 기다린다.

---

## 4. 구현 전 계획 규칙

초기 명세 문서 검토가 완료되면 Codex는 바로 코드를 작성하지 않는다.

먼저 다음 파일을 작성한다.

```text
docs/06-PLAN.md
```

`06-PLAN.md`에는 최소한 다음을 포함한다.

- Milestone
- 작업 순서
- 선행 의존성
- 검증 방법
- Human Approval Gate

계획 작성 후에는 구현을 멈추고 사람의 승인을 기다린다.

---

## 5. Human Approval이 필요한 변경

다음 변경은 Codex가 임의로 수행하지 않는다.

- 기술 스택 또는 주요 버전 변경
- API Contract 변경
- DB Schema의 주요 구조 변경
- 새로운 외부 라이브러리 또는 프레임워크 추가
- 최상위 디렉터리 구조 변경
- 기존 기능 삭제 또는 요구사항 축소
- 인증/인가 방식 추가 또는 변경
- CI/CD Workflow의 동작 방식 변경
- 외부 API 또는 외부 서비스 연동 추가

필요한 경우 변경 이유와 대안을 먼저 제시하고 승인을 요청한다.

---

## 6. Task 단위 작업 규칙

`docs/07-TASKS.md`가 생성된 이후에는 다음 원칙을 따른다.

- 한 번에 하나의 Task만 수행한다.
- Task 범위를 임의로 확장하지 않는다.
- 관련 없는 파일을 수정하지 않는다.
- Task 완료 조건을 충족하기 전에는 완료 처리하지 않는다.
- 실패한 Test 또는 Build를 숨기거나 강제로 성공 처리하지 않는다.

---

## 7. 검증 규칙

구현 단계에서 모든 Task는 가능한 범위에서 검증되어야 한다.

검증 순서는 다음 원칙을 따른다.

```text
코드 변경
  ↓
정적 검사 / Test
  ↓
Build
  ↓
통합 검증
  ↓
Task 완료
```

향후 `scripts/verify.ps1`, `scripts/verify.sh`가 생성되면 작업 완료 전 해당 검증 스크립트를 실행한다.

검증 실패 시 Task를 완료 처리하지 않는다.

---

## 8. 기록 규칙

구현 단계에서는 작업 상태와 이력을 분리해서 관리한다.

- `docs/07-TASKS.md`: 현재 작업 상태
- `docs/08-WORK_LOG.md`: 완료된 작업, 오류, 해결 과정의 누적 기록
- `docs/09-DECISIONS.md`: 중요한 기술적·제품적 결정 기록

Task를 완료할 때 관련 상태와 작업 기록을 함께 갱신한다.

### 8.1 화면 검토 캡처 기록

화면(UI)이 바뀌는 Task는 화면 검토 캡처를 Repository에 남긴다.

- 저장 위치: `docs/images/task-XXX/` (예: `docs/images/task-010/`)
- 기본 캡처 폭: Mobile 390px, Tablet 768px, Desktop 1280px
- 화면 검토에서 문제를 발견해 수정했다면 수정 전 / 수정 후 캡처를 함께 남긴다.
- `docs/08-WORK_LOG.md`의 해당 Task Verification에 Markdown 이미지로 연결한다.
  - 예: `![TASK-010 History](images/task-010/history-records-390-768-1280.png)`
- Repository 용량을 위해 PNG를 압축한다. (가로 최대 1600px, 1장당 약 300KB 이하 권장)
- 캡처에 실제 Secret, Password, 개인 인증 정보가 보이지 않는지 확인한다.

---

## 9. Prompt 기록 규칙

프로젝트의 주요 작업 지시는 `prompts/` 디렉터리에 기록한다.

다음 유형은 Prompt 기록 대상이다.

- Requirements Review
- Human Decision 반영
- Plan 생성 또는 변경
- Task 생성
- 주요 Feature 구현
- Architecture 변경
- API Contract 변경
- Verification 구성
- CI/CD 구성
- GitHub Actions Bot 구성
- 중요한 오류 수정

일상적인 질문이나 단순 설명 요청은 기록하지 않는다.

Prompt 파일은 실행 순서를 확인할 수 있도록 번호를 사용한다.

Prompt 기록에는 가능한 경우 다음 내용을 포함한다.

- 목적
- 실행 단계
- 사용 Context
- 실제 Prompt
- 기대 산출물
- Human Approval 여부
- 결과 또는 상태
- Related Commit

Prompt 기록은 프로젝트의 요구사항 Source of Truth를 대체하지 않는다.

역할은 다음과 같이 구분한다.

```text
AGENTS.md
→ Agent 작업 규칙

docs/
→ 프로젝트 요구사항, 계획, 상태, 결정

prompts/
→ Human이 Agent에게 내린 주요 실행 지시
```

---

## 10. UI/UX 규칙

MoodFit v3는 단순 입력 Form 형태의 데모 UI를 목표로 하지 않는다.

반드시 `docs/02-V1-REFERENCE.md`와 `docs/03-UX_UI_SPEC.md`를 기준으로 한다.

특히 다음 원칙을 지킨다.

- Dashboard 중심 정보 구조
- 명확한 시각적 계층
- Dark Wellness UI의 장점 유지
- Loading / Error / Empty 상태 고려
- Desktop / Tablet / Mobile 반응형 고려
- 접근성을 해치지 않는 대비와 상호작용 상태 제공
- Hard-coded UI Data를 최종 구현으로 남기지 않음

---

## 11. 보안 및 설정 규칙

다음 정보는 Repository에 직접 Commit하지 않는다.

- 실제 DB Password
- API Key
- Access Token
- Secret Key
- 개인 인증 정보

민감 정보는 환경변수 또는 GitHub Secrets를 사용한다.

---

## 12. Git / Commit 규칙

Codex는 사용자의 명시적인 지시 없이 `git commit`, `git push`, 강제 Push, History Rewrite를 수행하지 않는다.

기능 구현 단계의 기본 Checkpoint는 다음과 같다.

```text
Task 구현
  ↓
Test / Build / Verify
  ↓
TASKS / WORK_LOG 갱신
  ↓
Human Review
  ↓
Commit
```

Commit은 의미 있는 작업 단위가 완료되고 검증된 시점에 수행한다.
검증 실패 상태를 정상 Checkpoint로 Commit하지 않는다.

---

## 13. 완료 보고 규칙

Codex는 작업을 마친 후 최소한 다음을 보고한다.

1. 수행한 Task
2. 생성/수정한 파일
3. 주요 구현 내용
4. 실행한 검증
5. 검증 결과
6. 남은 이슈 또는 다음 Task

요구사항에 없는 다음 단계 작업을 임의로 미리 수행하지 않는다.
