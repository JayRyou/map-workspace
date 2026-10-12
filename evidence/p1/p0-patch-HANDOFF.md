# P0 인수인계

현재 상태: **P0 작업 완료 / 검수 대기**. 자체 CONDITIONAL94/100,사용자·별도 검수자 미승인. 다음 Work는 P0검수피드백 반영 또는 승인 후 P1만 수행한다.

## 기준과 결정

상위 `MAP_PLATFORM_WORK_RULES.md`를 적용한다. 임시제품명MAP Workspace,범용맵·한글·정적front+최소serverless·단일페이즈·승인게이트는 고정기준이다. 프롬프트의MAP Platform은제품명으로승계하지않았다. 요청된map-platform폴더와필수파일명은유지했다.

권장안: React/TS/Vite/React Flow; 관계형catalog+boundedJSONmap; 결정/업무와명부/계정분리; revisionCAS+초안보존; CloudflareWorkersPaid/D1/staticassets+CognitoEssentials한국어ManagedLogin+SES,TimeTravel/R2백업. 모두 P0설계제안이며실제구축된인프라가아니다.

최종검토에서CognitoLite초안은한국어관리형로그인요구를확실히지원하는Essentials로보정했다. 무료미적용10kMAU인증비는$150이며Lite의$55와다르다. 같은10kMAU공용무료한도가사용가능하면인증비0이라는조건은유지한다. 관련비용표/산식/ADR을모두갱신했다.

## 데이터 및 소스

기존416파일변경0. 실제schema변경/DBmigration미실행. Flow코드는이번7z,RWA는이전공유zip v0기준. 실사용RWA people/assign은미제공이므로운영버전·stateJSON확인전이관성공을주장하지않는다. sources/의 source ZIP은 입력 그대로 재패키징했으며legacydist/QA도그당시자료다.

## 승인 요청 목록

|항목|권장 선택|대안/보류가능시점|
|---|---|---|
|P0 범위 및 다음페이즈|Must와범용모델을검수후P1만진행|수정요청시P0보완|
|인프라 방향|Cloudflare+Cognito Essentials|AWS 단일공급자;최종리전·예산은P4전|
|동시 편집|맵단위CAS,내초안보존/명시적해결|실시간자동병합은Later|
|공유·요금 가설|private기본,공개snapshot읽기,Free4인편집|가격/상한최종값은P7|
|운영 데이터/재사용 권리|실데이터와상용재사용권확인|각각P3/P2전필수|

이번 요청은 P0 보완 후 P1 디자인 착수를 직접 지시했다. P0 기술 최종 승인/외부 검수는 여전히 대기다. 인프라실생성/실결제/운영배포승인은이번에요청하거나실행하지않았다.

## 다음 Work 입력

1. 이 ZIP의상시규칙/PROGRESS/QA/HANDOFF와P0전체문서.
2. P0검수결과와승인범위,수정해야할사항.
3. 변경없는두프로토타입source ZIP.
4. 가능하면대표맵샘플과3~4인베타사용역할;P1참여자가없으면사용성검증미실행표시.

P1실행명세는docs/p0/ROADMAP.md의P1절과별도P1_SPEC.md에있다. P1은리서치·IA·토큰·와이어프레임·상태흐름까지만진행하고P2엔진구현을선행하지않는다.


## 2026-10-10 결정 보완 기준

D-01/D-02/D-03은 **잠정 결정(프로토타입·Spike 검증 전)**이다. P0의 최종 상태는 **보완 완료 / 외부 검수 대기**이며 최종 PASS가 아니다. 사용자의 이번 요청 “P0 프롬프트 확인해서 작업 진행 / P1 프롬프트 진행 / 진행상황을 나눠서 진행”은 P0 보완 후 **P1 정적 디자인 작업 착수에 대한 직접 지시**로 기록한다. 이는 P0 기술 확정이나 외부 검수 PASS를 대신하지 않는다. P0 보완 패키지를 먼저 동결한 뒤 P1을 별도 단계로 수행하며 P2는 금지한다.
