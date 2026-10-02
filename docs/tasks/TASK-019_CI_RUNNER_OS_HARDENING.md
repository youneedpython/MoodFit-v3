# TASK-019 — CI Runner OS Transition Hardening (FU-6)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

TASK-014 Human Review에서 기록한 FU-6에 대응한다.
GitHub Actions의 `ubuntu-latest`가 **2026-10-19부터 Ubuntu 26으로 전환**된다는 안내(Runner Annotation)에 맞춰, CI가 Runner Image 변경에도 안정적으로 동작하도록 검토하고 보완한다.

이 Task는 **Orchestrator로 실행하는 첫 Task**(시범 운영)다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- 선행: TASK-018(Harness Bootstrap) DONE
- 실행: `node scripts/orchestrator/run.mjs TASK-019` (Codex 실행 → Claude 자동 Review → Gate에서 Human 승인)
- 시작 시 GitHub 공식 Runner Image / Actions 문서를 최신으로 확인한다. (Annotation 링크: `actions/runner-images` Issue #14748)

## 일정 위험 대응

- 목표는 2026-10-19 전 완료다.
- TASK-018이 늦어져도 Human이 "`ubuntu-latest` 유지 후 전환 결과 확인" 전략을 선택하면 10/19 전에 Workflow를 바꿀 필요가 없다. 이 경우 전환 이후 CI 결과를 확인해 DONE 여부를 판단한다.
- `ubuntu-24.04` 고정이 필요하다고 판단되면 Human이 TASK-018 완료를 기다리지 않고 별도 지시로 먼저 적용할 수 있다.

## Human Gate

Runner를 특정 OS Version으로 고정할지, `ubuntu-latest`를 유지할지, Tool 설치 / Cache / Container 전략을 바꿀지는 CI 동작 변경이므로 Human Approval을 받는다. Orchestrator는 전략 제시 후 `HUMAN_REQUIRED`로 정지한다.

## Codex 작업 범위

1. 현재 CI가 Runner OS에 암묵적으로 의존하는 항목을 조사한다: Docker / Testcontainers(DEC-023), Shell, Java, Node, Gradle, File Permission, Line Ending, 기본 설치 도구(`gh` 등).
2. 현재 Annotation과 실제 전환 영향을 공식 문서로 확인한다.
3. 최소 2개 전략을 제시한다. 예) `ubuntu-24.04` 고정 vs `ubuntu-latest` 유지 + 호환성 보완
4. Human 승인 전 Workflow를 변경하지 않는다.
5. 승인 후 최소 변경으로 CI를 보완하고 Testcontainers MySQL, Frontend / Backend Build를 검증한다.
6. 대상 Workflow: `.github/workflows/ci.yml`(`frontend` / `backend`), `.github/workflows/milestones.yml`

## Claude Review 기준

- 최신 공식 근거 사용 여부
- 불필요한 OS 고정 / Dependency 추가 여부
- Docker / Testcontainers 실행 가능성
- 기존 Cache 비활성(DEC-017) / CI 정책 유지 여부
- 롤백이 쉬운가

## 완료 조건

승인된 Runner 전략이 Remote CI에서 검증되고 FU-6이 DONE으로 기록되면 REVIEW / DONE 절차를 따른다.
Release는 DEC-025에 따라 PATCH(`v3.0.1`) 후보로 둔다.
Orchestrator 시범 운영에서 발견한 문제는 TASK-020(Orchestrator Hardening)에 반영한다.
