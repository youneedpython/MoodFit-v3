# TASK-064 — PWA Install (홈 화면 설치 / 앱 설치 버튼)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

MoodFit을 휴대폰 홈 화면이나 PC에 앱처럼 설치해, 주소창 없는 독립 창으로 열 수 있게 한다. 화면에 "앱 설치" 버튼을 두어 사용자가 Browser 메뉴를 찾지 않아도 설치할 수 있게 한다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 승인, 2026-10-05)
- 선행: TASK-037(로고 / 파비콘), TASK-062(Footer)
- 실행: `node scripts/orchestrator/run.mjs TASK-064`

## Human 결정 (2026-10-05)

- "PWA (화면에 앱 설치 버튼 추가) 승인!"
- 승인된 범위(Claude 세션 제안): **설치만** 지원한다. 푸시 알림, Offline 동작, Service Worker는 넣지 않는다. Backend / API / DB 변경은 없다.

## 현재 구조 (Claude 세션 확인)

- `frontend/public/site.webmanifest`(TASK-037): `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color` / `background_color`(`#0c1120`), 아이콘 192 / 512px. `frontend/index.html`이 `<link rel="manifest" href="/site.webmanifest">`로 연결한다. Staging에서 `application/manifest+json`으로 제공되는 것을 확인했다. 즉 Browser 메뉴로는 이미 설치할 수 있다.
- 배포는 `index.html`을 뺀 모든 파일을 `Cache-Control: public,max-age=31536000,immutable`로 올린다. 이름에 Hash가 없는 `site.webmanifest`는 **내용을 바꿔도 이미 받은 Browser에는 1년 동안 반영되지 않는다.** 그래서 Manifest를 바꿀 때는 파일 이름을 바꿔야 한다.
- `frontend/public/icon-maskable-512.png`: Claude 세션이 이 Task를 위해 만들어 이 Branch에 넣어 두었다(512 × 512px, 배경이 가장자리까지 채워지고 맥박선이 가운데 안전 영역 안에 있는 Maskable 아이콘). **이 파일은 고치거나 새로 만들지 않는다.**
- `frontend/src/app/AppLayout.tsx`: 모든 화면 아래에 Footer(고지 문구 + "개인정보 처리 안내" Link)가 있다. 로그인한 화면에는 상단에 `UserMenu`(아바타 메뉴: 닉네임 / 제공자 → 개인정보 처리 안내 → 로그아웃 → 구분선 → 회원 탈퇴)가 있다.
- Service Worker는 없다.

## 설계 (실행 기준)

### 1. Manifest

- 새 파일 `frontend/public/app.webmanifest`를 만들고 `frontend/index.html`의 `<link rel="manifest">`가 이것을 가리키게 한다. 기존 `frontend/public/site.webmanifest`는 지운다(위의 Cache 이유).
- 내용: 기존 값에 다음을 더한다.
  - `id: "/"`, `scope: "/"`, `lang: "ko"`, `dir: "ltr"`
  - `description`: `index.html`의 `meta description`과 같은 문장
  - `categories: ["health", "lifestyle"]`
  - `icons`: 기존 192 / 512px 항목에 `"purpose": "any"`를 명시하고, `{ "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }`를 더한다.
- `name` / `short_name` / `start_url` / `display` / 색은 바꾸지 않는다.
- `frontend/index.html`: iOS에서 홈 화면에 추가했을 때 독립 창으로 열리도록 `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-title" content="MoodFit">`, `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`를 더한다. 기존 Tag는 지우지 않는다.

### 2. 설치 가능 상태를 다루는 Module

`frontend/src/features/install/`에 둔다.

- Chromium 계열 Browser는 설치할 수 있을 때 `window`에 `beforeinstallprompt` Event를 **한 번** 보낸다. React 화면이 그려지기 전에 올 수 있으므로, **`main.tsx`에서 React를 그리기 전에** Listener를 등록하는 초기화 함수를 호출한다. Listener는 `event.preventDefault()`로 Browser 기본 안내를 막고 Event를 보관한다.
- 상태는 다음 중 하나다.
  | 상태 | 조건 | 버튼 |
  |---|---|---|
  | `installed` | 독립 창으로 실행 중(`matchMedia("(display-mode: standalone)")`가 참이거나 iOS의 `navigator.standalone`이 참), 또는 `appinstalled` Event를 받음 | 숨김 |
  | `prompt` | 보관한 `beforeinstallprompt` Event가 있음 | 보임(누르면 Browser 설치 창) |
  | `ios` | iOS / iPadOS의 Browser이고 독립 창이 아님. iOS는 설치 Event가 없다 | 보임(누르면 설치 방법 안내) |
  | `unavailable` | 그 밖(지원하지 않는 Browser, 아직 Event가 오지 않음) | 숨김 |
- iOS 판별: User Agent에 `iPhone` / `iPad` / `iPod`가 있거나, `Macintosh`이면서 `navigator.maxTouchPoints > 1`(iPadOS).
- 상태를 구독하는 Hook을 둔다(`useSyncExternalStore` 권장). Event가 나중에 와도 버튼이 나타나야 한다.
- `prompt` 상태에서 설치를 요청하면 보관한 Event의 `prompt()`를 부르고 `userChoice`를 기다린다. Event는 한 번만 쓸 수 있으므로 결과와 관계없이 보관한 Event를 비운다. 수락이면 `installed`, 거절이면 `unavailable`로 둔다(Browser가 Event를 다시 보내면 다시 `prompt`가 된다).
- `beforeinstallprompt`와 `navigator.standalone`은 표준 Type에 없다. `any`를 쓰지 말고 필요한 Field만 가진 Type을 선언한다.
- `window` / `navigator`가 없는 환경이나 `matchMedia`가 없는 Test 환경에서 오류가 나지 않게 방어한다.

### 3. "앱 설치" 버튼

- Component 하나(`InstallAppButton`)를 만들어 두 곳에 둔다. 상태가 `installed` / `unavailable`이면 **아무것도 그리지 않는다**(빈 자리도 남기지 않는다).
  1. **Footer**: "개인정보 처리 안내" Link 앞. 로그인 화면을 포함해 모든 화면에서 보인다.
  2. **아바타 메뉴**: "개인정보 처리 안내"와 "로그아웃" 사이의 `menuitem`. 구분선 아래의 "회원 탈퇴"와 섞이지 않게 한다.
- 문구: **"앱 설치"**. Footer에서는 공통 `Button`의 덜 강조되는 기존 Variant를 작게 쓰거나 Footer Link와 어울리는 글자 버튼으로 한다. 아바타 메뉴에서는 다른 메뉴 항목과 같은 모양이다. 새 색 / 새 Variant를 만들지 않는다.
- 터치 영역 44px 이상, 초점 테두리 유지.
- `prompt` 상태에서 누르면 Browser 설치 창이 뜬다. 처리 중에는 버튼을 비활성화한다. 아바타 메뉴에서 눌렀으면 메뉴를 닫는다.
- `ios` 상태에서 누르면 **설치 방법 안내 창**을 연다.
  - 제목 "홈 화면에 추가"
  - 본문(순서 목록): ① Safari 아래쪽(iPad는 위쪽)의 **공유** 버튼을 누릅니다. ② **"홈 화면에 추가"**를 누릅니다. ③ 오른쪽 위의 **"추가"**를 누릅니다.
  - 보조 문장: "Safari가 아닌 Browser에서는 공유 메뉴의 위치가 다를 수 있습니다."
  - "닫기" 버튼(공통 `Button`). Esc와 바깥 영역 클릭으로도 닫힌다.
  - `role="dialog"`, `aria-modal="true"`, 제목과 연결(`aria-labelledby`). 열리면 "닫기"로 초점이 가고, 닫히면 "앱 설치" 버튼으로 초점이 돌아온다. 회원 탈퇴 확인 창(`DeleteAccountDialog`)의 배경 / Card Style Class를 재사용해도 된다.
- 설치가 끝나면(`appinstalled`) 버튼이 사라진다. 별도의 완료 알림은 넣지 않는다.

### 4. 하지 않는 것

- Service Worker 등록, Offline Cache, 푸시 알림, 알림 권한 요청
- 화면을 가리는 설치 유도 Banner / Popup(사용자가 버튼을 누를 때만 동작한다)
- 설치 여부를 Server나 Storage에 저장

### Test

- 초기화 뒤 `beforeinstallprompt`를 보내면(`new Event("beforeinstallprompt")`에 `prompt` / `userChoice`를 붙여 `window.dispatchEvent`) 상태가 `prompt`가 되고 `preventDefault`가 불린다.
- `prompt` 상태: Footer에 "앱 설치" 버튼이 보이고, 누르면 `prompt()`가 1회 불린다. 수락하면 버튼이 사라진다. 거절하면 버튼이 사라지고, Event를 다시 보내면 다시 나타난다.
- Event가 화면이 그려진 **뒤에** 와도 버튼이 나타난다.
- `appinstalled`를 받으면 버튼이 사라진다.
- 독립 창(`matchMedia` Mock이 참)에서는 버튼이 없다.
- iOS User Agent(Mock)에서는 버튼이 보이고, 누르면 안내 창이 열리며 `prompt()`는 불리지 않는다. Esc와 "닫기"로 닫히고 초점이 버튼으로 돌아온다.
- 지원하지 않는 환경(Event 없음, iOS 아님)에서는 Footer와 아바타 메뉴 어디에도 버튼이 없다. **기존 Footer / 아바타 메뉴 Test는 고치지 않고 통과해야 한다**(기본 Test 환경은 `unavailable`이다).
- 아바타 메뉴: `prompt` 상태에서 "앱 설치" `menuitem`이 "개인정보 처리 안내"와 "로그아웃" 사이에 있다.
- `app.webmanifest`를 JSON으로 읽어 필수 Field(`name`, `start_url`, `display`, `id`, `scope`)와 Maskable 아이콘 항목이 있는지 검사한다. `index.html`이 `/app.webmanifest`를 가리키는지도 검사한다(파일을 `node:fs`로 읽는다. `?raw` import를 쓰지 않는다).
- Test마다 Module의 상태(보관한 Event, Listener)를 초기화할 수 있어야 한다. Test용 초기화 함수를 내보내도 된다.
- jest-dom Matcher(`toBeVisible`, `toHaveTextContent`, `toBeDisabled` 등)를 쓰지 않는다. 이 저장소에는 설치되어 있지 않다. `toBeTruthy()`, `textContent`, `(el as HTMLButtonElement).disabled`를 쓴다.
- 이름으로 요소를 찾을 때 다른 요소와 겹치지 않게 Role과 정확한 이름을 쓴다(예: `getByRole("button", { name: "앱 설치" })`).
- Test의 타입 오류에 주의한다(`tsc --noEmit`).

### 문서

- `docs/27-PWA-INSTALL.md`(새 문서): 지원 범위(설치만), Browser별 동작(Chromium: 버튼 → 설치 창, iOS: 안내 창, 그 밖: 버튼 없음), 넣지 않은 것과 이유, Manifest 파일 이름을 바꾼 이유(Cache)와 앞으로 Manifest를 바꿀 때의 주의점, 확인 방법.
- `docs/README.md`: 새 문서 행. `README.md`: 주요 기능에 "홈 화면에 설치" 한두 문장.
- `docs/09-DECISIONS.md`: 새 Decision(다음 번호) — 설치만 지원, Service Worker 없음, 버튼 위치.
- `docs/07-TASKS.md`: TASK-064 행과 절 추가, DONE(Milestone 64, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### 금지

- Backend / API / 계약 / Dependency 변경, 배포 Script와 Workflow 변경
- Service Worker 추가
- `frontend/public/`에서 `app.webmanifest` 추가와 `site.webmanifest` 삭제 이외의 변경(아이콘 파일을 고치거나 새로 만들지 않는다)
- 새 색 / 새 Variant 추가

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Run 2 범위 (검토 중심)

Run 1에서 구현은 끝났고, Orchestrator Verify가 Frontend Test 1건에서 멈췄다(260건 중 259건 통과).

- 실패: `install.test.tsx`의 Manifest / HTML 검사가 `new URL("…", import.meta.url)`로 파일 경로를 만들었는데, Test 환경(jsdom)에서는 `import.meta.url`이 `file:` 주소가 아니어서 `readFileSync`가 거부했다.
- 조치(Claude 세션, Sandbox 밖): 경로를 `resolve(process.cwd(), "public/app.webmanifest")`, `resolve(process.cwd(), "index.html")`로 바꿨다(Test는 `frontend/`에서 실행된다). 검사 내용과 구현은 그대로다.
- Sandbox 밖 결과: Frontend Test 260건 통과, `tsc --noEmit` / Build 통과. Build 결과물에 `app.webmanifest`와 `icon-maskable-512.png`가 있고 `site.webmanifest`는 없다.
- Claude 세션의 화면 확인: 설치 Event가 오면 Footer와 아바타 메뉴에 "앱 설치"가 나타나고, 누르면 `prompt()`가 1회 불린 뒤 버튼이 사라진다. 지원하지 않는 환경에서는 Footer와 메뉴 어디에도 없다. iOS User Agent에서는 안내 창이 열리고 "닫기"로 초점이 가며 Esc로 닫히면 초점이 버튼으로 돌아온다. Chrome의 Manifest 해석 오류는 없고 설치 조건 검사에서 남은 항목은 검사 환경(시크릿 창)뿐이다. 390 / 768 / 1280px 가로 넘침 없음.

이번 Run에서 할 일:

1. 구현이 위 설계와 맞는지 다시 확인하고, 어긋난 곳만 고친다. 통과한 Test를 다시 쓰지 않는다. `import.meta.url`로 파일 경로를 만들지 않는다.
2. `docs/08-WORK_LOG.md`에 Run 2 경과를 한 단락 더한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 설치만 지원하고 Service Worker / 알림 / 유도 Banner가 없는가
- `beforeinstallprompt`를 React가 그려지기 전에 잡고, 나중에 와도 버튼이 나타나는가, Event를 한 번만 쓰는가
- 지원하지 않는 환경과 이미 설치된 환경에서 버튼이 없고 빈 자리가 남지 않는가, 기존 Footer / 메뉴 Test가 그대로 통과하는가
- iOS 안내 창의 접근성(role, 초점, Esc)이 맞는가
- Manifest 파일 이름이 바뀌었고 `index.html`이 새 파일을 가리키는가, 아이콘 파일을 건드리지 않았는가
- 새 Dependency / 새 색을 만들지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처(버튼이 보이는 Footer / 아바타 메뉴, iOS 안내 창, 지원하지 않는 환경)로 확인하고, Chrome에서 Manifest가 설치 조건을 만족하는지 확인한다. 실제 기기 설치는 Merge 뒤 Staging에서 Human이 확인한다.
