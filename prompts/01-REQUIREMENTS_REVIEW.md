# Prompt 01 — Requirements Review


## 목적

MoodFit v3 초기 Harness 문서를 읽고
구현 전에 문서 간 충돌, 누락, 미확정 사항,
기술적 위험과 Human Approval이 필요한 항목을 검토한다.

## 실행 단계

Harness Definition
→ Requirements Review

## 사용 Context

AGENTS.md  

docs/01-PROJECT.md  
docs/02-V1-REFERENCE.md  
docs/03-UX_UI_SPEC.md  
docs/04-ARCHITECTURE.md  
docs/05-API_SPEC.md  

## 실제 Prompt
아래 내용을 그대로 기록한다.

---

```plaintext
AGENTS.md와 docs 디렉터리의
01-PROJECT.md  
02-V1-REFERENCE.md  
03-UX_UI_SPEC.md  
04-ARCHITECTURE.md  
05-API_SPEC.md  
를 모두 읽어.

아직 Frontend나 Backend 코드를 생성하지 마.
npm, Gradle 프로젝트도 초기화하지 마.
06-PLAN.md도 아직 생성하지 마.

먼저 다음 내용을 검토해서 보고해.

1. 문서 간 충돌하는 요구사항
2. 구현 전에 결정해야 하는 사항
3. 누락된 요구사항
4. 기술적으로 불명확한 사항
5. 과도하게 복잡한 요구사항
6. 구현 순서에 영향을 주는 의존성
7. Human Approval이 필요한 사항

각 항목에 대해
- 문제
- 영향
- 가능한 대안
- 추천안
을 설명해.

검토가 끝나면 작업을 멈추고
내 승인을 기다려.
```
---

## 기대 산출물

코드가 아니라 Requirements Review 결과 보고서.

## Human Approval

필수.

Codex는 Review 결과를 보고한 후
다음 작업으로 넘어가지 않고 Human Approval을 기다린다.


## 결과

Requirements Review를 통해 다음과 같은 주요 사항을 발견했다.

- v1 4개 Metric과 v3 5개 Metric 차이
- Recommendation Refresh의 MVP 범위 문제
- Latest Check-in 404 / 204 정책
- History 조회 최대 기간
- Recommendation 저장 범위
- 시간 타입
- 단일 사용자 여부
- Routing / Chart / Frontend Test 도구
- Local 실행 환경
- CI Database 전략
- Wellness Analysis Rule 미정
- 정확한 기술 버전 미정

이후 Human Review를 통해
docs/09-DECISIONS.md에 주요 결정을 기록했다.

## Related Commit

426de78
