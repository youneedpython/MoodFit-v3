# PWA 설치

TASK-064 / DEC-044는 설치만 지원한다. Footer의 개인정보 처리 안내 앞과 사용자 메뉴의 개인정보 처리 안내 / 로그아웃 사이에 **앱 설치**가 나타난다. 설치 상태는 메모리에서만 관리한다.

| 환경 | 동작 |
|---|---|
| Chromium 설치 이벤트 수신 | 앱 설치 → Browser 설치 창. 처리 중 중복 요청 차단 |
| iOS / iPadOS | 앱 설치 → 공유 → 홈 화면에 추가 → 추가 안내 |
| 그 밖 / 이벤트 수신 전 | 버튼 없음 |
| 독립 창 실행 / 설치 완료 | 버튼 없음 |

Service Worker, Offline Cache, 푸시 알림, 알림 권한 요청과 설치 유도 Banner는 승인 범위 밖이므로 넣지 않았다. 설치 후에도 네트워크 연결이 필요하다. 설치 가능 여부와 Browser 설치 창은 Browser가 결정한다.

## Manifest와 Cache

`index.html`은 `/app.webmanifest`를 참조한다. 기존 값에 앱 식별자 / 범위 / 한국어 / 설명 / 분류와 기존 Maskable 아이콘을 추가했다. 아이콘 파일은 수정하지 않았다. iOS 독립 창용 Meta Tag도 추가했다.

배포는 index.html을 제외한 파일에 1년 immutable Cache를 적용한다. 기존 site.webmanifest를 같은 이름으로 수정하면 이전 Browser에 반영되지 않을 수 있어 삭제하고 새 이름으로 옮겼다. 앞으로 Manifest를 수정할 때도 새 파일 이름으로 바꾸고 HTML 참조를 함께 변경해야 한다. 배포 정책 자체는 변경하지 않는다.

## 확인 방법

- 자동 Test로 초기 / 지연 이벤트, 수락 / 거절 / 재수신, 설치 완료, 독립 창, iOS 안내 / 초점 / 닫기, 메뉴 순서와 Manifest를 확인한다.
- Claude 세션은 390 / 768 / 1280px에서 Footer / 메뉴 / iOS 안내 / 미지원 환경을 캡처하고 가로 넘침과 44px 터치 영역을 확인한다. Chrome 개발자 도구에서 Manifest와 아이콘을 확인한다.
- Merge 후 Staging에서 Human이 실제 휴대폰 홈 화면 설치 및 PC 설치와 독립 창 실행을 확인한다. Executor DONE은 검증 / Review / 최종 완료 승인을 대신하지 않는다.
