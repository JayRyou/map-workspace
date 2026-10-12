# P0 QA 및 검증 결과

## 실제 실행

환경: Linux 임시 복사본, Node v24.19.0, npm11.9.0, 기존 Chromium153.0.8010.0 실행 파일. 원본 `p0-input/`은 설치·실행 대상으로 사용하지 않았다. 결과는 이번 실행 증거이며 원본에 포함된 기존 QA 기록과 구분했다.

|대상|실행 명령/방법|결과|증거|
|---|---|---|---|
|Flow 설치|임시 폴더에서 npm ci|47 packages 설치,exit0|evidence/npm-ci.log|
|Flow 정적 빌드|npm run build(tsc --noEmit && vite build)|PASS,exit0|evidence/flow-build.log|
|Flow 단위|npm test|17 통과/0 실패/0 skip|evidence/flow-unit.log|
|Flow 브라우저|CHROMIUM_PATH=<실행파일> npm run test:e2e|29 통과/0 실패,errors/external 빈 배열|evidence/flow-e2e.log,flow-e2e-results.json|
|RWA API 관찰|node p0-verification/rwa-probe.mjs|9/9 예상 동작 관찰,아래 주의|evidence/rwa-api-probe.json,rwa-probe.mjs|
|원본 파일|SHA-256 사전/사후|416개 검사,변경0|evidence/source-sha256.json,source-integrity.json|
|문서/정합성|python p0-verification/validate_p0.py|15 통과/0 실패; evidence/document-validation.json|필수파일·요구ID·로드맵·산식·원본|

RWA 프로브는 임시 복사본의 네트워크 주소 열거 함수만 빈 목록으로 대체하는 preload adapter를 사용했다. 서버의 인증·validation·저장·동시성 코드는 변경하지 않았다. 런타임 환경 적응이 있으므로 실제 운영 배포 검증과 동일하지 않다. 테스트용 임의 키는 출력/산출물에 저장하지 않았다. 임시 테스트 데이터만 생성했다.

RWA 9관찰은 비인증GET200,키없는PUT403,정상PUT200,stale409,경쟁200/409,최상위타입400,잘못된내부원소수용200,디스크version3,백업2개다. **공개읽기와 잘못된 데이터 수용의 관찰 성공은 보안 PASS가 아니다.** RWA 브라우저 전체 시나리오나 XSS 실제 실행을 재현하지 않았다.

npm의 http-proxy 환경설정 경고가 있었으나 명령은 정상 종료했다. 종속성 취약점 감사/라이선스 실사는 이번 실행에 포함하지 않았다.

## 문서 검토

- 필수20개 P0 문서와 루트5개를 확인한다. 요구사항은10개,사용자 시나리오11개,다음9페이즈는각10개 항목이다.
- 실제 구현과 설계를 분리했다. Flow member는인증아님,RWA done은업무완료아님,Node서버는serverless아님,localstorage탭감지는서버CAS아님.
- 비용표는 evidence/cost_model.py 하나의 산식으로 계산했으며10/100/1000/10000규모·무료한도조건·DB읽기/쓰기/저장·백업을 구분했다. 한국어 로그인 요구로 Cognito Essentials를 최종 권장했다.
- RWA 실제 운영 배정은미첨부. 마이그레이션계획은완료지만실행성공은UNVERIFIED.
- 원본을바꾸지않고발견한legacy위험은RISK_REGISTER에 남겼다.

## 결함과 판정

|범주|Critical|Major|Minor|설명|
|---|---:|---:|---:|---|
|P0에서 새로 만든 문서의 확인된 결함|0|0|0|최종 자체 점검 기준,독립 검수 전|
|기존 코드의 SaaS 전환 격차/위험|0|4|2|L-01~06,원본 미수정|
|신규 SaaS 구현|미평가|미평가|미평가|아직 구현하지 않음|

자체점수94/100,자체판정CONDITIONAL. 사용자·별도검수자 판정UNVERIFIED. 상시 규칙의 전체 Critical/Major0을 충족했다고 표시하지 않는다. 발견된 legacy 위험은 후속 단계에서 재사용하지 않거나 대체해야 한다.

## 미검증

실제Cognito/SES등록·메일·세션,Workers/D1배포·원자CAS·quota경쟁·한국지연·로그과금,계정간격리/초대/링크/결제,대량맵성능,실데이터migration,백업복원RPO/RTO,실사용자UX,의존성보안/법적전제. 해당페이즈 AC에 검증계획만 있다.

## 재현 안내

`sources/MAP_Workspace_P0_Source_Unchanged.zip`을 새 임시 디렉터리에 푼 뒤 flow-workspace에서 npm ci → npm run build → npm test → CHROMIUM_PATH 지정 npm run test:e2e. Chrome이 없으면 환경에 맞는 Playwright Chromium 설치가 필요하며 원본이 아닌 복사본에서만 진행한다.

RWA 프로브 재현은 실행파일을 `p0-verification/rwa-probe.mjs`,변경없는소스를 `p0-verification/rwa-map-server/`,로그목적지를 `map-platform/evidence/`로 두고 실행한다. 임시폴더에 data와adapter가생긴다. 기존운영데이터가있는폴더에는실행하지않는다. 본프로브는읽기전용분석을위한격리환경검증이지운영수정스크립트가아니다.


## 2026-10-10 결정 보완 기준

D-01/D-02/D-03은 **잠정 결정(프로토타입·Spike 검증 전)**이다. P0의 최종 상태는 **보완 완료 / 외부 검수 대기**이며 최종 PASS가 아니다. 사용자의 이번 요청 “P0 프롬프트 확인해서 작업 진행 / P1 프롬프트 진행 / 진행상황을 나눠서 진행”은 P0 보완 후 **P1 정적 디자인 작업 착수에 대한 직접 지시**로 기록한다. 이는 P0 기술 확정이나 외부 검수 PASS를 대신하지 않는다. P0 보완 패키지를 먼저 동결한 뒤 P1을 별도 단계로 수행하며 P2는 금지한다.
