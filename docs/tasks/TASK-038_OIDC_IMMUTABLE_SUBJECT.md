# TASK-038 — GitHub OIDC Immutable Subject Trust

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Staging 자동 배포(TASK-029)의 첫 실행이 OIDC 단계에서 실패했다. 배포 Role의 신뢰 조건을 GitHub가 실제로 발급하는 subject 형식에 맞춘다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 승인, 2026-10-04)
- 선행: TASK-029 Merge(PR #18)
- 실행: `node scripts/orchestrator/run.mjs TASK-038`

## 확인된 사실 (2026-10-04, Claude 세션)

- 실패 Step: 배포 Workflow의 OIDC 자격 증명 단계. 오류는 "Not authorized to perform sts:AssumeRoleWithWebIdentity"다.
- 이 Repository의 OIDC subject 설정은 `use_default: true`, `use_immutable_subject: true`다(GitHub API `actions/oidc/customization/sub` 조회). subject 앞부분이 `repo:<owner>@<owner 숫자 ID>/<repository>@<repository 숫자 ID>` 형식이다.
- `iam.yaml`의 신뢰 조건은 `repo:<owner>/<repository>:environment:<환경>` 형식을 `StringEquals`로 비교한다. 그래서 일치하지 않는다.
- Human 승인으로 Repository 설정을 이름 형식으로 되돌리려 했으나 API가 값을 바꾸지 않았다(응답은 성공, 재조회 시 그대로). 따라서 IAM 쪽을 맞춘다.
- Environment 값 4개, Repository 이름, Workflow에는 문제가 없다.

## Human 결정 (2026-10-04) / 실행 기준

1. 신뢰 조건의 subject를 immutable 형식으로 바꾼다: `repo:${RepositoryOwner}@${RepositoryOwnerId}/${RepositoryName}@${RepositoryId}:environment:staging` (Production Role은 끝이 `production`).
2. `iam.yaml`에 Parameter 두 개를 추가한다: `RepositoryOwnerId`, `RepositoryId`. 숫자만 허용한다(`AllowedPattern`, 빈 값 불가). 기존 `RepositoryOwner` / `RepositoryName`과 그 Pattern은 유지한다.
3. `StringEquals`와 audience 조건, 환경별 Role 분리, wildcard 금지(DEC-029)는 그대로다. `StringLike`나 wildcard로 풀지 않는다. 이름 형식 subject를 함께 허용하지 않는다(하나의 정확한 값만).
4. 실제 숫자 ID는 추적 파일에 쓰지 않는다. 예시 Parameter 파일에는 Placeholder를 쓴다. 실제 값은 Claude 세션이 로컬 Parameter 파일(추적 제외)에 넣고 Human이 Change Set으로 IAM Stack을 갱신한다.
5. 배포 Role의 권한 정책과 Workflow는 바꾸지 않는다.

## Codex 작업 범위

1. `infra/cloudformation/iam.yaml`: Parameter 2개 추가, Staging / Production 배포 Role 두 곳의 subject 변경.
2. `infra/cloudformation/iam.parameters.example.json`: Placeholder 2개 추가.
3. `infra/iam/staging-oidc-trust.json`, `infra/iam/production-oidc-trust.json`: 같은 형식으로 갱신.
4. `scripts/iac-validate.sh`: subject 형식이나 Parameter 목록을 검사하는 부분이 있으면 맞춘다. 없으면 바꾸지 않는다.
5. 문서: `docs/15-AWS-ACCESS-POLICY.md`(subject 형식과 숫자 ID Parameter, ID 확인 방법 `gh api repos/<owner>/<repository>`의 `id` / `owner.id`), `docs/21-STAGING-CD.md`(첫 배포 실패 원인과 조치, Repository를 새로 만들거나 이전하면 ID가 바뀌어 Stack 갱신이 필요하다는 점), `docs/18` Runbook의 IAM Stack Parameter 설명, `docs/09-DECISIONS.md`의 DEC-029 변경 이력, `docs/08-WORK_LOG.md`.
6. 완료 반영: `docs/07-TASKS.md`에 TASK-038 행과 절을 추가하고 DONE으로 둔다(Milestone 38). TASK-030은 BLOCKED 유지, AGENTS.md 3절 Current Task는 바꾸지 않는다. 다른 미등록 Task는 등록하지 않는다.
7. 자격 증명 단어 뒤에 콜론 / 등호와 값이 오는 표기를 새로 쓰지 않는다. 계정 ID, ARN, 실제 숫자 ID를 쓰지 않는다.

## 제외 범위

- Workflow 변경, 배포 Role 권한 변경, 다른 Stack 변경
- Stack 갱신 실행(Human)

## Verification

- `bash scripts/iac-validate.sh`
- `git diff --check`

## Claude Review 기준

- subject가 정확히 하나의 값으로 비교되는가(`StringEquals`, wildcard 없음)
- 두 Role 모두 바뀌었고 환경 이름이 서로 섞이지 않았는가
- 숫자 ID Parameter가 숫자만 허용하는가, 실제 ID가 추적 파일에 없는가
- Template 검증이 통과하는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 Human이 IAM Stack Change Set을 실행하고, 실패한 배포를 다시 실행해 OIDC 단계 통과를 확인한다.
