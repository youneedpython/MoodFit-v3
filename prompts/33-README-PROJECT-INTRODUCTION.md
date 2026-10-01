# Prompt 33 — README 프로젝트 소개 개편

## 목적

Root `README.md`를 진행 기록이 아닌 프로젝트 소개 중심으로 다시 작성하고,
기능과 실제 화면 캡처를 추가한다. GitHub Repository About 설명도 함께 다듬는다.

## 실행 단계

TASK-001 ~ TASK-017 DONE
→ README 개편 요청 (Human)
→ 범위 확인 / Harness 설명 포함 여부, 예시 기록 추가 허용 (Human)
→ 화면 캡처 / README 작성

## 사용 Context

README.md
AGENTS.md
docs/01-PROJECT.md
docs/05-API_SPEC.md
docs/09-DECISIONS.md (DEC-014, DEC-015)
frontend/, backend/ (실행 / 캡처)

## 실제 Prompt

```text
root의 README.md 파일의 내용을 "프로젝트 소개"에 포인트를 두고 수정했으면 해.
진행사항 말고.
기능과 실제 화면도 몇 개 이미지 캡처해서 추가했으면 해.
그리고 github repo의 프로젝트 소개에 글도 보고 수정했으면 해.
이해했어?
```

```text
좋아! 진행해!
-Harness 개발 과정 설명 작성해.
-Local MySQL moodfit_v3 DB에 예시 기록이 추가해도 돼
```

## 작업 범위

- `README.md` 전면 개편 (프로젝트 소개 중심, Harness 개발 방식 섹션 포함)
- `docs/images/readme/` 화면 캡처 6장
- GitHub Repository About 설명 / Topics 초안 (Human이 GitHub 화면에서 적용)

## 제약

- Source Code / Test / CI 변경 없음
- 기존 DB 기록 변경 없음 (예시 기록만 추가)
- git commit / push는 Human 확인 후 진행

## 상태

완료 / Commit · Push 대기

## Related Commit

Pending
