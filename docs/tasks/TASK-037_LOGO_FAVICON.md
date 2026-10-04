# TASK-037 — Logo / Favicon

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

MoodFit의 로고와 파비콘을 추가한다. 브라우저 탭, 홈 화면 아이콘, 상단 메뉴, README에 같은 로고를 쓴다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 승인, 2026-10-04)
- 선행: 없음(main 기준). 병행 개발용 저장소 사본에서 실행한다.
- 실행: `node scripts/orchestrator/run.mjs TASK-037`

## Human 결정 (2026-10-04)

Claude 세션이 시안 3개(A 맥박선 M, B 미소 링, C 하트 + 맥박)를 제시했고 Human이 **시안 A**를 선택했다.

- 모양: 모서리가 둥근 사각형(파란색 `#2563eb` → 보라색 `#6d28d9` 대각선 gradient) 안에 흰색 맥박선이 M 모양을 이룬다. 서비스 이름의 첫 글자와 생체 신호를 함께 나타낸다.
- 색은 기존 Design Token(`--color-primary-start`, `--color-primary-end`)과 같다.

### 제공된 Asset (Claude 세션이 만들어 Commit, 수정하지 않는다)

`frontend/public/`에 있다. Vite는 이 폴더의 파일을 사이트 Root 경로로 그대로 내보낸다.

| 파일 | 용도 |
|---|---|
| `favicon.svg` | 원본 로고(SVG). 최신 브라우저의 탭 아이콘 |
| `icon-32.png` | 탭 아이콘 대체(PNG 32px) |
| `apple-touch-icon.png` | iOS 홈 화면 아이콘(180px) |
| `icon-192.png`, `icon-512.png` | Android 홈 화면 / 설치 아이콘 |

PNG는 `favicon.svg`를 Chrome으로 렌더링해 만들었다(투명 배경). 이 파일들의 내용은 바꾸지 않는다. 모양을 바꿔야 하면 구현하지 않고 `human_decisions_needed`로 보고한다.

## Codex 작업 범위

1. `frontend/index.html`: 아이콘 연결(`rel="icon"` SVG와 PNG 32, `rel="apple-touch-icon"`, `rel="manifest"`), `theme-color`(배경색 `#0c1120`), 한 줄 설명 `meta description`을 추가한다. 경로는 Root 절대 경로(`/favicon.svg` 등)를 쓴다.
2. `frontend/public/site.webmanifest`: 이름 `MoodFit`, 아이콘 192 / 512, `theme_color` / `background_color`, `display: standalone`, `start_url: /`.
3. 상단 메뉴(`AppLayout`): "MoodFit" 글자 왼쪽에 로고를 둔다. 로고는 장식이므로 보조 기술이 이름을 두 번 읽지 않게 한다(글자가 이름을 제공하고 그림은 `alt=""` 또는 `aria-hidden`). 크기와 간격은 기존 Token을 쓰고 좁은 화면에서도 메뉴가 줄바꿈되지 않게 한다.
4. README 상단에 로고를 넣는다(`frontend/public/favicon.svg`를 상대 경로로 참조, 크기 지정).
5. Test: 상단 메뉴에 로고가 렌더링되는지, 접근 가능한 이름이 중복되지 않는지 확인하는 Test를 추가 / 갱신한다. 기존 Test를 깨지 않는다.
6. 문서: `docs/08-WORK_LOG.md`에 기록한다. `docs/07-TASKS.md`, `AGENTS.md`, `docs/09-DECISIONS.md`는 수정하지 않는다(병행 개발 중이라 Claude 세션이 Merge 때 정리한다).
7. 새 Dependency를 추가하지 않는다. `package.json` / `package-lock.json`은 바꾸지 않는다.
8. 배포 관련 확인(구현 없이 문서에만 기록): 정적 파일은 `dist/` 전체가 Bucket에 올라가므로 Root의 아이콘 파일도 배포된다. CloudFront의 SPA 경로 처리는 `/check-in`, `/history`만 바꾸므로 아이콘 경로에 영향이 없다. Root 파일은 긴 cache로 올라가므로 로고를 바꿀 때는 파일 이름을 바꾸거나 invalidation이 필요하다는 점을 적는다.

## 제외 범위

- 로고 모양 / 색 변경, 새 글꼴, 애니메이션
- Backend, API 계약, Infra, CI / CD 변경
- PWA 오프라인 기능(Service Worker)

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 제공된 Asset을 바꾸지 않았는가
- 아이콘 / manifest 경로가 실제 파일과 일치하는가(Build 결과에 포함되는가)
- 상단 메뉴의 접근 가능한 이름이 중복되지 않는가, 좁은 화면에서 배치가 깨지지 않는가
- 새 Dependency가 없는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 Staging에서 탭 아이콘과 상단 로고를 확인한다.
