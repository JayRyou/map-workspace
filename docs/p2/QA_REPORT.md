# P2 QA 보고서

**P2 완료 — 외부 검수 대기** · 2026-10-10. 실행한 범위에서 미해결 Critical 0 / Major 0 / Minor 0. 아래 미검증은 PASS에 포함하지 않습니다.

## 실제 실행 결과

|검사|결과|증거|
|---|---|---|
|도메인·history·keyboard·storage 단위|22 PASS / 0 FAIL|evidence/unit-final.log, tests/*.test.ts|
|통합 브라우저|33 PASS / 0 FAIL|evidence/e2e-results.json|
|접근성·실제 핸들 연결·관계 수정/삭제|15 PASS / 0 FAIL|evidence/accessibility.json|
|타입검사와 production build|성공|evidence/build-final.log|
|노드/그룹/드래그/손상저장 단계검사|실행 성공|evidence/p2-1~4-browser.json|
|대용량 500/1000|p95 84.3ms, 목표100ms 충족|evidence/performance.json|
|390/768/1440/1920|문서 가로넘침0, 목록·상세/캔버스 확인|screenshots/, E2E|
|런타임 JS오류 / 외부요청 / 자산404|0 / 0 / 0|evidence/e2e-results.json|
|납품 서버·상세 닫기·Inspector 캡처|4 PASS|evidence/delivery.json|
|새 설치 npm ci|UNVERIFIED; offline ENOTCACHED|evidence/npm-ci.log|
|lockfile offline dry-run|성공; 실제 설치 성공을 의미하지 않음|evidence/npm-ci-dry-run.log|

`npm test`, `npm run build`, `npm run test:e2e`, `node tests/accessibility.mjs`, `npm run test:performance`, `node tests/delivery.mjs`로 재현합니다. 설치 버전·환경·주의는 README를 따릅니다. 각 브라우저 스크립트는 자기 정적 서버와 새 브라우저 컨텍스트를 만들므로 사용자의 저장값을 사용하지 않습니다.

## 필수 반례 14개 추적

|번호|검증 내용|실제 증거·제한|
|---|---|---|
|1|노드 삭제가 관련 연결만 정리|commands 단위, E2E; 결정/업무는 별도 readonly fixture|
|2|그룹 해제·삭제 시 자식 절대위치 보존|commands 단위, P2.2 브라우저|
|3|그룹·내부노드 이동과 Undo 정확성|commands/history 단위, P2.2/3 브라우저|
|4|A→B→C→A 허용·무효 endpoint 거부|commands 단위, 실제 E2E 순환 생성|
|5|self 거부·동일source/target/type 중복 거부|단위 및 UI 중복 거부; 역방향·다른type 허용|
|6|드래그1회 Undo1회|15단계 포인터 이동→단일 history; P2.3|
|7|연속편집→Undo→새편집 redo 폐기|history 단위|
|8|IME Delete/Esc/Ctrl+Z 입력 보호|keyboard 단위, 합성 isComposing/keyCode229 브라우저; 실제 OS IME 미검증|
|9|다중삭제 Undo의 ID/관계/좌표 보존|E2E 실제 저장 모델 비교|
|10|손상값·정상본·초안 보존|storage 단위, P2.4 손상/quota/격리검사|
|11|새로고침 의미동등·저장표시 정확|E2E map/view 비교; 0/0/1 viewport도 복원|
|12|빈/작은/500·1000 맵|E2E 및 성능 fixture 실측|
|13|확대·모바일 필수 작업 접근|390/768 목록/상세, 720×500 동등 리플로 생성/수정; 실제200% 확대 미검증|
|14|이상JSON 크기/버전/참조/prototype 거부|storage/validation 단위, P2.4 import UI|

## 발견한 결함과 해결

|심각도|발견|수정·재검증|
|---|---|---|
|Major|선택 시 measured 정보 소실·연결 라벨 대량 재측정|크기/참조 유지; p95 450.3→84.3ms|
|Major|Undo 직후 이전 저장완료 문구가 잠깐 남음|명령 시점 dirty 즉시 반영; 실제 saved ack 대기 후 E2E 모델 동일|
|Major|저장된 viewport 0/0/1도 초기 fit으로 덮임|최초 새 문서에서만 fit; 정확 viewport 회귀 통과|
|Major|대화상자 Tab 순환·모바일 상세 초점 이동 부족|dialog 경계 순환·rAF 초점 이동; 접근성 검사 통과|
|Minor|다른 탭을 열기만 해도 timestamp 저장으로 충돌 감지|동일 map/view는 재기록 생략; 단위·두 탭 E2E 통과|
|Major|납품용 서버 경로 끝 슬래시로 정상 자산403|루트 경로 정규화; index/JS MIME 실제 확인|
|Minor|데스크톱 상세 닫기 무효 동작|선택 해제와 주영역 초점 복귀; 납품 검사 통과|

수정 전 실패 증거는 `evidence/archive/`에 보존하며 최종 PASS 기록과 구분합니다. 빌드에는 React Flow use-client/source-map 및 공개 폰트 URL의 런타임 해석 경고가 있습니다. 빌드 실패가 아니며 정적 서버에서 누락 자산0을 확인했습니다.

## 접근성·디자인

Tab/Enter 생성·선택·수정, Delete 확인 대화상자, Esc와 초점 복귀, 입력/textarea/contenteditable/IME 보호를 검사했습니다. React Flow의 기본 포커스·레이블을 사용하고, 이동/크기/연결은 Inspector 숫자 입력과 연결 대화상자를 제공합니다. 방향키 이동은 도메인 명령으로 10px, Shift+방향키는50px입니다. 본문/보조/주요 버튼/오류의 4색 조합 대비는 4.5:1 이상입니다. 이것은 전체 WCAG 인증을 의미하지 않습니다.

1440px에서 실제 캔버스 폭936px(65%). 회색 작업 영역·청색 선택·작은 모서리·간결한 줄/도구를 유지했습니다. 장식성 카드 대시보드·과도한 그라데이션/글로우·히어로 화면 없이 지도를 중심으로 배치했습니다. 390/768px는 목록 기본, 독립 스크롤 상세 패널로 편집합니다. 노드·그룹·연결과 결정/업무 샘플은 구분됩니다.

## 미검증과 외부 검수 경로

- **UNVERIFIED — 실제 OS 한글 IME**: Windows/macOS에서 조합 중 Delete/Esc/Ctrl+Z, 조합 확정 직후 전역 단축키를 확인해야 합니다. 합성 이벤트 통과를 실기기 통과로 치환하지 않았습니다.
- **UNVERIFIED — 실제 브라우저 200% 확대**: headless Ctrl+=가 viewport/DPR를 바꾸지 않았습니다. 720×500 CSS 리플로는 통과했지만 실제 확대에서 다시 확인해야 합니다.
- **UNVERIFIED — 스크린리더·터치 실기기·Firefox/Safari**: NVDA/VoiceOver와 iOS/Android에서 이름·역할·포커스·대체 폼을 검수해야 합니다.
- **UNVERIFIED — 깨끗한 환경 npm ci 완료**: 오프라인 캐시 누락. 인터넷 가능한 환경에서 lockfile 설치 후 build와 동일 테스트를 실행해야 합니다. 제공 dist는 설치 없이 실행 가능하며 실제 검증했습니다.
- **UNVERIFIED — 클라우드 배포·장시간 누수·동시 탭 원자성**: 실행 범위 밖입니다. 다른 탭 이벤트/읽기 비교 방어는 있지만 원자적 CAS를 보장하지 않습니다.

정적 dist에는 서버 런타임·외부 API 의존성이 없어 일반 정적 호스팅 구조에 적합합니다. S3 업로드/정책/CORS/라우팅/실제 제공은 검사하지 않았고 배포하지 않았습니다.
