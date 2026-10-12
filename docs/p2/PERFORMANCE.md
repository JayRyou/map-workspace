# P2 성능 실측

2026-10-10 UTC · [원시 수치](../../evidence/performance.json) · 실행 `npm run test:performance`

## 환경과 방법

Linux / AMD EPYC 9V74 / 할당 논리 CPU 9 / 런타임 메모리 10GiB, Node 24.19.0, headless Chromium 153.0.8010.0, 1440×1000, CPU throttle 1배. 정적 production dist를 로컬 HTTP 서버에서 실행했습니다. 범용 500노드·1000연결 fixture를 UI로 교체하고 실제 저장된 개수까지 확인했습니다.

선택은 DOM click 이벤트부터 선택 클래스와 Inspector 대상이 일치한 후 다음 requestAnimationFrame까지 측정합니다. 45회 중 최초 5회를 제외한 40회입니다. 물리 입력 장치 지연이나 GPU 화면 presentation 시간의 측정은 아닙니다. CPU Profiler를 켠 상태의 실행입니다. 팬은 우클릭 드래그 90단계 중 rAF 간격, 메모리는 CDP 강제 GC 전후의 JS heap입니다.

|항목|측정값|판정 범위|
|---|---:|---|
|초기 대용량 맵 전환→저장 확인|1,622ms|해당 환경 1회|
|선택 p50|66.7ms|40회 표본|
|선택 p95|84.3ms|목표 100ms 이하 충족|
|선택 최대|101.7ms|모든 선택이 100ms 이하라는 의미 아님|
|팬 프레임 p50 / p95|16.7 / 16.7ms|93개 간격; 33ms 초과 0개|
|선택 구간 Script / Layout / Style|1,804.843 / 160.681 / 40.615ms|45회 누적|
|선택 구간 Task|3,318.765ms|45회 누적|
|GC 후 heap 전 / 후|27,756,312 / 27,242,212 bytes|차이 −514,100 bytes|

## 실패와 개선

최초 선택 p95 450.3ms → 객체 캐시 적용 356.5ms → React Flow의 measured 크기를 보존한 최종 84.3ms. 증거는 `performance-before-cache.json`, `performance-after-cache.json`, `performance.json`입니다. 측정 초기화로 1,000개 연결 라벨을 반복 생성하고 getBBox를 호출하던 경로를 수정했습니다. 도메인 참조·선택·스타일·좌표가 같은 노드와 연결은 안정된 객체를 유지합니다. 드래그 이력은 종료 시 한 번만 적재합니다.

단일 실행 결과를 기기 전체의 성능 보증으로 확대하지 않습니다. 실제 저사양 PC, 모바일 실기기, Firefox/Safari, 장시간 편집·메모리 누수는 **UNVERIFIED**입니다. JS heap은 전체 프로세스·GPU·native 메모리를 포함하지 않습니다. 큰 CPU 프로파일 원본은 배포 ZIP에서 제외하고 재현 가능한 측정 코드와 요약 수치를 포함했습니다. 외부 검수에서 동일 스크립트와 실제 기기 조작을 함께 수행해야 합니다.
