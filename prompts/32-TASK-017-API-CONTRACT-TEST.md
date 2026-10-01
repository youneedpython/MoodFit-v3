# Prompt 32 — TASK-017 API 계약 테스트 (Frontend / Backend)

## 목적

DEC-024(Gate C 승인)에 따라 공유 계약 예시 JSON(`contracts/`)을 기준으로
Backend 실제 응답, Frontend Type / 화면 Test, API 명세 문서 예시가 같은 API 형식을 지키는지 자동 검증한다. (FU-1, GAP-2)

## 실행 단계

TASK-017 Gate C Review (Prompt 31)
→ DEC-024 Human Approved
→ Implementation / Verification

## 사용 Context

AGENTS.md
README.md

docs/05-API_SPEC.md
docs/07-TASKS.md (TASK-017)
docs/09-DECISIONS.md (DEC-014, DEC-020, DEC-024)
prompts/31-TASK-017-API-CONTRACT-TEST-GATE-C-REVIEW.md

frontend/src/types/api.ts
frontend/src/features/*/*.test.tsx
backend/src/test/java/com/moodfit/

## 실제 Prompt

```text
1. A
2. Root contracts/
3. 05-API_SPEC.md 예시 동기화 테스트: 포함
4. Frontend 화면 테스트의 가짜 응답: 계약 파일로 교체

승인! 진행해!
```

## 작업 범위

- `contracts/` 계약 파일 5개 작성 (현재 Backend 동작 기준)
- Backend 계약 테스트 (`CheckinContractTests`)
- Frontend 계약 모듈(Type 검사) / API 명세 동기화 Test
- Frontend 화면 Test 가짜 응답을 계약 파일로 교체
- `docs/05-API_SPEC.md` 예시를 계약 파일에 맞춤 (404 예시 추가, Error 예시 정정)

## 제약

- API 형식 변경 없음
- 새로운 Dependency 없음
- `ci.yml`, `scripts/verify.ps1`, `scripts/verify.sh` 변경 없음
- git commit / push는 Human 확인 후 진행

## 상태

완료 (Human Review 승인)

## Related Commit

- `19f985c` test: TASK-017 API 계약 테스트 (contracts/) 추가
- `ebef142` docs: TASK-017 Remote CI 검증 및 REVIEW 반영
