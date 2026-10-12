# 검사 재현 환경

Playwright API와 로컬 headless Chromium을 사용했다. verify.cjs/targeted.cjs의 require 경로·Chromium 경로·프로토타입 루트를 재현 환경에 맞게 바꿔 실행한다. 이 검사 의존성은 prototype 배포물에 필요하지 않아 포함하지 않는다. 스크립트는 file://와 일시적인 로컬 정적 HTTP 서버로만 확인한다. 원격 서버·API는 만들지 않는다.

browser-results.json: 최종 주요 실행59건. targeted-results.json: 추가 회귀/모달/역할/대비39건. before-focus-fix는 수정 전 증거이며 최종 결과와 혼동하지 않는다. 네이티브 브라우저200%와 사용자4인 참여는 수행하지 않았다.
