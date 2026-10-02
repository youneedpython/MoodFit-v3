# TASK-018 — CI Runner OS Transition Hardening (FU-6)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

TASK-014 Human Review에서 기록한 FU-6에 대응한다.
GitHub Actions의 `ubuntu-latest`가 **2026-10-19부터 Ubuntu 26으로 전환**된다는 안내(Runner Annotation)에 맞춰, CI가 Runner Image 변경에도 안정적으로 동작하도록 검토하고 보완한다.

## 초기 상태 / Dependency

- 초기: `READY` (Roadmap 등록 후)
- 선행 Task 없음. 전환 시작일(2026-10-19) 전에 완료하는 것을 목표로 Multi-Agent Harness(TASK-019 ~ TASK-022)보다 먼저 진행한다.
- 실행 방식: 수동 단계 (VS Code Codex 실행 → VS Code Claude 검토 → Human 승인)
- 시작 시 GitHub 공식 Runner Image / Actions 문서를 최신으로 확인한다. (Annotation 링크: `actions/runner-images` Issue #14748)

## Human Gate

Runner를 특정 OS Version으로 고정할지, `ubuntu-latest`를 유지할지, Tool 설치 / Cache / Container 전략을 바꿀지는 CI 동작 변경이므로 Human Approval을 받는다.

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
