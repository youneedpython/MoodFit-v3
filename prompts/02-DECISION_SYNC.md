# Prompt 02 — Decision Sync

## 목적

Requirements Review 이후 Human이 승인한 결정을
09-DECISIONS.md와 기존 프로젝트 문서에 일관되게 반영한다.

## 실행 단계

Requirements Review
→ Human Decision
→ Decision Sync

## 사용 Context

AGENTS.md

docs/01-PROJECT.md
docs/02-V1-REFERENCE.md
docs/03-UX_UI_SPEC.md
docs/04-ARCHITECTURE.md
docs/05-API_SPEC.md
docs/09-DECISIONS.md

## 실제 Prompt

아래 내용을 그대로 기록한다.

---
```plaintext
Requirements Review 결과를 Human Review했다.

다음 작업만 수행해.

1. docs/09-DECISIONS.md를 생성해.
2. 승인된 결정과 기존 문서가 일치하도록 필요한 문서만 수정해.
3. AGENTS.md의 문서 읽기 순서와 Source of Truth 규칙에
   docs/09-DECISIONS.md를 반영해.

반드시 다음 원칙을 지켜.

- Frontend/Backend 코드를 생성하지 마.
- npm 또는 Gradle 프로젝트를 초기화하지 마.
- 06-PLAN.md를 아직 생성하지 마.
- Git commit 또는 push를 수행하지 마.
- 승인되지 않은 새로운 기술 결정을 추가하지 마.
- Recommendation Refresh는 Core MVP에서 제외해.
- Dashboard Metric은 5개로 확정해.
- Latest Check-in 없음은 404로 확정해.
- History days는 기본 7, 최대 30으로 확정해.
- MVP는 단일 사용자로 확정해.
- Trend는 외부 Chart Library 없이 시작해.
- React Router 사용을 승인된 결정으로 기록해.
- Frontend Test는 Vitest + React Testing Library로 기록해.
- 기술의 정확한 Version과 Wellness 분석 Rule은 아직 확정하지 마.

작업이 끝나면 다음을 보고해.

1. 생성한 파일
2. 수정한 파일
3. 각 수정 이유
4. 아직 Pending 상태인 결정

그 후 작업을 멈추고 내 검토를 기다려.
```
---

## 기대 산출물

- 승인된 Human Decision 기록
- AGENTS.md와 docs 문서의 Decision 동기화
- 미확정 사항은 Pending 상태 유지

## Human Approval

필수.

## 결과

Human Decision에 따라 다음 사항이 문서에 반영되었다.

- Dashboard Metric 5개
- Recommendation Refresh Core MVP 제외
- Latest Check-in 없음 → 404
- History 기본 7일 / 최대 30일
- 단일 사용자 MVP
- Recommendation은 Check-in 종속 데이터
- Backend 시간 기준 Instant
- React Router 사용
- Vitest + React Testing Library 사용
- Chart Library 없이 Trend 구현
- 초기 CI에서 MySQL Service Container 미사용
- GitHub Actions Bot 후순위 배치

다음 결정은 Pending 상태로 유지한다.

- Wellness Analysis Rule
- 정확한 기술 버전

## Related Commit

e8ca540
