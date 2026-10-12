# 화면 구성과 실제 캡처

설계 와이어는 아래 영역표로 표현하며, 이미지는 이번 P1을 Chromium에서 실제로 연 캡처다. 타사 화면을 합성하지 않았다.

|폭|상단|탐색|중앙|상세|
|---|---|---|---|---|
|1440|데모 안내·팀·프로젝트·상태/역할|184px 사이드바|936px, 전체 폭65%, 맵 우선|320px Inspector|
|1920|동일|208px 사이드바|1372px, 전체 폭71.46%|340px Inspector|
|768|팀·공유·상태|접힌 메뉴|768px 목록 우선|선택 시 하단 상세, 독립 스크롤|
|390|줄바꿈 가능한 상단|접힌 메뉴|390px 목록·검색|선택 시 하단 상세, 닫기와 포커스 복귀|

- [1440px 맵](../../screenshots/p1-1440.png)
- [1920px 맵](../../screenshots/p1-1920.png)
- [768px 목록](../../screenshots/p1-768.png), [768px 상세](../../screenshots/p1-768-detail.png)
- [390px 목록](../../screenshots/p1-390.png), [390px 상세](../../screenshots/p1-390-detail.png)
- [409 충돌 비교](../../screenshots/p1-conflict.png)
- [공개 스냅샷 미리보기](../../screenshots/p1-public-snapshot.png)
- [200% 동등 리플로: 720×500 CSS px](../../screenshots/p1-200-percent-equivalent.png)

마지막 캡처는 1440×1000 화면의 200% 확대에 해당하는 CSS 가용 폭/높이를 재현한 것이다. 실제 브라우저 메뉴의 배율을 200%로 바꾼 캡처가 아니다. 별도 확대 검수는 UNVERIFIED다.
