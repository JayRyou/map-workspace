# P3 자체 QA 보고서

**P3 완료 — 외부 검수 대기**. 실행한 범위에서 Critical/Major 미해결0건. 실제 미검증은 PASS에 포함하지 않습니다. 최종 Patch 재현 결과는 납품 PATCH_MANIFEST.md를 기준으로 확인합니다.

## 실제 결과

|범위|결과|근거|
|---|---|---|
|P2 기준선|npm ci/build·단위22·E2E33 PASS|evidence/p3/baseline.json 및 baseline 로그|
|최종 도메인/저장/그래프 단위|40 PASS / 0 FAIL|evidence/p3/006-unit.log|
|통합 사용자 흐름·P2 회귀·반응형|39 PASS / 0 FAIL|evidence/p3/final-e2e.json|
|프로젝트 분리·전환취소·보관·복구·이름변경|5 PASS|evidence/p3/navigation.json|
|새로고침·백업·P2 이행·실제2탭|7 PASS|evidence/p3/005-browser.json|
|실제 손상/격리/주입 quota·초안다운로드|3 PASS|evidence/p3/storage-browser.json|
|정적 서버·JS MIME·라이선스|4 PASS|evidence/p3/delivery.json|
|TypeScript/production build|PASS|evidence/p3/006-build.log|
|JS 오류/외부요청/자산HTTP오류|0/0/0|final-e2e.json|

하위 Patch의 001~005 브라우저 결과는 각 단계 증거이며 위 최종 통합 검사에 중복 합산하지 않았습니다. source ZIP의 evidence/p3에는 실제 로그를 포함합니다. 새 npm 설치와 최종 Patch 적용 후의 재실행은 별도 납품 증거로 구분합니다.

## 결함 발견과 재검증

|분류|문제|처리|
|---|---|---|
|환경|이전 Chromium 실행파일이 잘려 시작시 SIGSEGV|정상 패키지 재추출 후 기준선 E2E33 통과|
|환경|Playwright CDN ZIP 잘림|설치 실패 공개; CHROMIUM_PATH의 정상 Chromium153 사용|
|Minor|관리 폼의 union description 타입 오류|명시적 문자열 처리, build 통과|
|Minor|결정 선택기의 접근 가능한 이름이 모호함|명시적 aria-label, 실제 상태 변경 통과|
|Major|관리 화면의 맵 이름과 편집기 상태가 달라 덮일 수 있음|활성 맵 이름변경을 기존 title 명령으로 위임; 편집/reload 후 보존 검사|
|Major|새 프로젝트 셸에 P2 샘플/성능 맵 ID 교체 경로 잔존|카탈로그 Map ID 유지, P3 저장/성능 실제 검증|
|Major|전체 용량검증 실패가 미저장 최신 맵을 aggregate에서 누락시킬 가능성|검증된 맵의 메모리 초안을 우선 보존; 저장시 전체검증/오류, quota 초안7개 회수 검증|
|Minor|전환 승인 뒤 미적용 폼 표시가 남음|승인된 입력버림을 폼과 속성행에 반영; 실패한 적용은 dirty 해제하지 않음|
|Minor|모바일에서 담당자 메뉴 진입이 부족함|상단 결정·업무 메뉴,390/768 접근 검사|

실패했던 selector 문구 차이와 초기 브라우저 실행 실패 로그는 숨기지 않고 보존했습니다. 최종 결과 파일과 당시 실패파일을 구별합니다. 빌드에는 기존 React Flow use-client/source-map, 폰트 URL 런타임 해석 및500KB chunk 경고가 남지만 빌드/HTTP/런타임 오류는 없습니다.

## 성능

동일 P2 방식의500노드/1000연결 fixture. Linux / Node24.19.0 / headless Chromium153.0.8010.0 / INTEL(R) XEON(R) PLATINUM 8573C / 논리CPU9 / 메모리10GiB /1440×1000 / CPU throttle1.

|항목|최종 실측|
|---|---:|
|fixture 전환→저장 확인|1469ms|
|선택 p50 / p95 / 최대|66.6 / 83.4 / 99.3ms|
|목표 p95≤100ms|충족|
|팬 rAF p50 / p95|16.7 / 16.8ms|
|33.4ms 초과 간격|2 / 93개|
|GC 후 JS heap 전 / 후|27,459,712 / 27,021,076bytes|

45회 DOM click→선택 클래스/Inspector일치→다음 rAF, 처음5회 제외40표본. CPU Profiler 사용. 물리 입력장치/GPU presentation 측정이 아닙니다. 팬90단계 rAF 간격과 강제GC 후 JS heap만 측정하며 전체 프로세스/GPU/native 메모리는 제외합니다. 초기 버전의 p95 84.7ms에서 마지막 측정 83.4ms. 단일 실행 결과이며 모든 기기 성능·누수 없음의 보증이 아닙니다.

## 접근성·디자인

390/768/1440/1920 가로넘침0, 모바일 목록/상세/명부 진입, 대화상자 Tab 순환·Esc 초점 복귀, 합성 composition/Delete/Esc/Ctrl+Z 보호를 확인했습니다. 1440 캔버스 폭936px(65%). P1 회색 작업영역·작은 모서리·청색 선택·중앙 캔버스/Inspector를 유지했습니다. 대형 장식 카드·그라데이션·글로우·대시보드로 대체하지 않았습니다.

## UNVERIFIED

- 실제 Windows/macOS 한글 IME: 합성 이벤트만 검증. 실제 조합/확정/취소 중 키보드 검수 필요.
- native 브라우저200% 확대:720×500 CSS 동등 리플로만 검사. 실제 확대/글꼴확대 별도 검수 필요.
- NVDA/VoiceOver·Firefox/Safari·터치 실기기·장시간 편집/많은 프로젝트·메모리 누수·전체프로세스메모리.
- Windows START.cmd의 실기기 실행. 같은 Node 정적 서버 코드는 Linux에서 HTTP로 실행 확인.
- 실제 S3/Cloudflare 제공·배포·권한·서버 CAS. P4 이후 범위이며 수행하지 않음.

정적 dist는 브라우저 런타임 외 백엔드나 외부 API가 필요하지 않습니다. 실제 S3 정책·라우팅·CORS·캐시 검증은 하지 않았습니다.
