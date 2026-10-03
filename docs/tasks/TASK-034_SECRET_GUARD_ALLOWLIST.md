# TASK-034 — Secret Guard Allowlist (Human 승인 허용 문구)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Orchestrator Secret 검사의 오탐을 **검사 기준을 낮추지 않고** 줄인다. TASK-032에서 추측 규칙(자연어 / ARN / Placeholder 예외)으로 완화를 시도했으나 Claude Review에서 5회 연속 새 우회 경로가 지적되어 Human이 2026-10-03 분리를 결정했다. 이 Task는 설계를 바꿔, Human이 승인한 **정확한 문자열 목록**만 검사에서 제외한다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- 선행: TASK-033 DONE
- TASK-026 전에 실행한다(IaC / IAM 정책 파일에서 오탐이 가장 많이 예상된다).
- 실행: `node scripts/orchestrator/run.mjs TASK-034`

## 설계 방향 (Human 승인, 2026-10-03)

- 기본 검사(`redact` / `assertNoSecrets`)의 차단 규칙은 바꾸지 않는다.
- Task Contract에 선택 필드(예: `secret_scan_allow`)를 두고, Human이 승인한 **literal 문자열**만 넣는다. 정규식 / wildcard는 허용하지 않는다.
- 검사 전에 입력에서 허용 문자열과 정확히 일치하는 부분만 중립 표기로 바꾼 뒤 기존 검사를 그대로 적용한다. 허용 문자열 앞뒤의 다른 내용은 계속 검사된다.
- 허용 문자열 자체가 자격 증명 형태(기존 Token / Key 형식 규칙에 걸리는 값, 긴 무작위 문자열 등)이면 Contract 검증에서 거부한다.
- 허용 목록은 Contract에 있으므로 Executor가 바꿀 수 없다(자기 Contract 수정 금지 Guard).
- 오탐이 새로 나오면 Human이 Contract에 문구를 추가 승인한다.

## Human Gate

- 허용 문자열의 형식 제한, 최대 개수 / 길이, 자격 증명 형태 거부 기준은 Gate에서 확정한다.
- 기본 차단 규칙을 바꾸는 제안은 구현하지 않고 `HUMAN_REQUIRED`로 정지한다.

## Codex 작업 범위

1. Contract Schema 필드와 검증, 검사 전 치환 적용(Preflight / Guard / PR 본문 / Run 기록 Redaction 경로 모두 일관되게), Test
2. TASK-023 / TASK-025 / TASK-032에서 실제로 난 오탐 형태를 허용 목록으로 해결하는 예시와 Test
3. `docs/11`, `docs/12` 갱신, Task 문서의 "오탐 회피 작성 규칙"이 불필요해지는 범위를 기록

## Verification

- `node --test "scripts/orchestrator/*.test.mjs"`
- `git diff --check`

## Claude Review 기준

- 허용 목록이 실제 Secret을 통과시키는 경로가 되지 않는가 (literal 일치만, 자격 증명 형태 거부)
- 허용 문자열 주변의 내용이 계속 검사되는가
- 기본 차단 규칙이 main과 같은가

## 완료 조건

Fake CLI Test로 검증되고 설계 문서가 구현과 일치하면 REVIEW. 완료 후 TASK-026을 READY로 전환한다.
