# Prompt 17 — TASK-006 Post-completion Cleanup

## 목적

TASK-006 완료 후 남아 있는
Skeleton Dead Code,
오래된 Repository 설명,
README 구조,
WORK_LOG 제어문자,
Secret / 배포 파일 상태를 정리한다.

## 실행 단계

TASK-006 DONE
→ Cleanup Prompt 검토 (Claude, 수정 없이 검토만)
→ Human이 검토 보완 사항 포함 실행 지시
→ Cleanup 실행
→ Test / Build / Local Verification
→ Human Review 대기

이 작업은 별도 Feature Task가 아니라 TASK-006 완료 후 Cleanup Checkpoint이다.
TASK-006은 DONE, TASK-007은 READY 상태를 유지한다.

## 사용 Context

AGENTS.md
README.md

docs/05-API_SPEC.md
docs/07-TASKS.md
docs/08-WORK_LOG.md
docs/09-DECISIONS.md

prompts/README.md
prompts/16-TASK-006-PERSISTENCE-GATE-C-REVIEW.md

backend/src/main/java/com/moodfit/ (config, controller, dto, entity, exception, repository, service)
backend/src/main/resources/
backend/build.gradle

## 실제 Prompt

Human이 작성한 Cleanup Prompt의 요지는 다음과 같다. (원문 22개 항목)

- 중요 제약
  - TASK-006 DONE 유지, TASK-007 시작 / IN_PROGRESS 변경 금지
  - 새로운 Feature / Dependency 추가 금지
  - DB Schema / API Contract / DEC-014 / DEC-019 변경 금지
  - git commit / git push 금지
- 수행 항목
  1. Source of Truth 문서와 Backend 구현 확인
  2. Preflight: `git status --short`, `git log -5 --oneline`, TASK 상태 확인. 예상하지 못한 변경이 있으면 작업 중단 후 보고
  3. 이 Prompt History 파일 생성
  4. TASK 상태 변경 금지
  5. `repository/package-info.java`의 TASK-004 시절 설명을 현재 설명으로 교체
  6. `PendingImplementationException` 사용 여부 검색 후, 사용하지 않으면 삭제하고 `GlobalExceptionHandler`의 501 Handler도 삭제
  7. `NOT_IMPLEMENTED` / `PendingImplementation` / `501` 잔여 흔적 확인. Production Dead Code는 제거, 과거 Work Log / Prompt 기록은 유지
  8. README Backend 구조에 `config/`, `entity/` 반영
  9. README Prompt History를 `01 ~ 17`로 동기화, `prompts/README.md`에 17번 추가
  10. `docs/08-WORK_LOG.md`의 `scripts<0x0B>erify.ps1` 등 의도하지 않은 제어문자 수정
  11. `.env.local`의 Git ignore / tracked 상태 확인. Secret 값은 출력하지 않음
  12. `.env.local`을 공유용 ZIP / 배포본에서 제외하라는 짧은 안내를 README에 추가 (중복이면 생략)
  13. Production Source 변경은 Dead Code 삭제와 `package-info.java` 설명 갱신으로 제한
  14. Backend Test / Build 실행
  15. `scripts/verify.ps1` Local Verification 실행 (`verify.ps1`, `verify.sh`, `ci.yml` 수정 금지)
  16. Cleanup 후 재검색
  17. `git diff --check`, `git diff --stat`, `git status --short` 검토
  18. `docs/08-WORK_LOG.md`에 Cleanup Checkpoint 기록
  19. AGENTS.md의 Task 상태 변경 금지 (필요할 때만 한 줄 추가)
  20. 종료 상태는 `실행 완료 / Human Review 대기`, Related Commit은 `Pending`
  21. 작업 금지 목록 (TASK-007, Dependency, API / DB / DEC, Workflow, commit / push)
  22. 25개 항목 순서의 완료 보고 후 Human Review 대기

### Claude 검토 후 추가된 보완 사항

Human은 Claude의 사전 검토 결과를 반영해 다음 보완을 함께 수행하도록 지시했다.

- `rg`(ripgrep)가 Local Git Bash에 없으므로 검색은 `git grep`을 사용한다.
- README Backend 트리의 `Spring Boot + Gradle Wrapper Skeleton` 설명도 TASK-006 이후 상태에 맞게 수정한다.
- `501` 검색 범위는 `backend/src/main`으로 한정한다.
- ZIP 공유 안내에 `.env.local`뿐 아니라 `.git/` 폴더 제외도 포함한다.
- `docs/08-WORK_LOG.md`의 0x0B 제어문자는 TASK-006 Human Review 보완 기록 작성 시 Claude가 Python 문자열의 `\v` escape로 만든 것임을 기록한다.

## 기대 산출물

- `backend/src/main/java/com/moodfit/repository/package-info.java` 설명 갱신
- `PendingImplementationException.java` 삭제, `GlobalExceptionHandler` 501 Handler 삭제
- README Backend 구조, Prompt History, ZIP 공유 안내 갱신
- `prompts/README.md` 17번 추가
- `docs/08-WORK_LOG.md` 제어문자 수정 및 Cleanup Checkpoint 기록

## Human Approval

Cleanup 실행 승인 완료

Cleanup 결과 Human Review 승인 완료 (2026-09-30)

## 상태

실행 완료 / Human Approved

## Related Commit

Pending
