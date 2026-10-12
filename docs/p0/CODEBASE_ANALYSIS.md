# 기존 코드 분석

분석일 2026-10-09. 현재 요청은 P0이며 코드 구현 변경은 하지 않았다. 제품 임시 명칭은 상위 규칙의 **MAP Workspace**를 따른다. 프롬프트의 MAP Platform과 명칭이 충돌하므로 산출물 폴더·필수 파일명만 요청대로 유지한다.

## 입력과 증거 범위

|자료|출처·버전|실제 내용|한계|
|---|---|---|---|
|flow-workspace.7z|이번 첨부|React/TS 소스, lockfile, 테스트, 기존 QA 자료|기존 QA 기록은 현재 실행 증거와 구분|
|rwa-map-server.zip|앞서 공유된 자료, v0|server.js, public/index.html, package.json, README.md, .gitignore|이번 첨부에는 없어 이전 자료를 사용; 운영 최신본 여부 확인 불가|
|상시 규칙·P0 프롬프트|이번 첨부|작업 범위·산출물·승인 규칙|상시 규칙 우선|

이하 `R/`는 RWA 압축의 `rwa-map-server/`, `F/`는 Flow 압축의 `flow-workspace/`다. 원본을 `p0-input/`에 추출하고 별도 `p0-verification/`에서만 설치·실행했다. SHA-256 목록과 사후 비교는 `evidence/`에 있다. 앱 소스는 변경 없는 별도 소스 ZIP으로 제공하고, 문서 ZIP에는 입력 식별자와 분석 자료를 제공한다.

## RWA MAP

의존성 없는 Node HTTP 서버 + 단일 HTML/SVG. `R/server.js`는 HTML과 API를 제공하며 파일 저장을 담당한다. `R/public/index.html`은 데이터·렌더링·상호작용·동기화가 함께 있는 구조다.

|영역|실제 구현 근거|판정|
|---|---|---|
|그래프 데이터|`SYSTEMS`, `N`, `E`, 단계 배열; 노드 위치·크기, edge source/target 대신 from/to, SVG path d|구현 확인: 소스에 고정된 관계 데이터|
|그룹|SYSTEMS 영역 좌표와 SVG 사각형; ext는 별도 영역 좌표 없음|부분 구현: 편집 가능한 범용 그룹 아님|
|관계 탐색|`neighborhood`, `select`, `setFocus`, `linksFor`, `setFilter`, `setPerson`|구현 확인: 인접 관계·상태·담당자 강조|
|캔버스|`apply`, `zoomAt`, `fit`, 포인터 이벤트, `setFocusMode`|구현 확인: 이동/확대; 노드 CRUD/위치 편집은 미구현|
|상세 맥락|`renderDetail`, `showSystem`, `renderOverview`; role/done/open 텍스트|구현 확인: 읽기 중심, 별도 정책/결정 CRUD는 미구현|
|담당자|`renderManager`, `setRole`, `assigned`; people와 assign|구현 확인: main/sub 배정; 대상은 노드·연결선·sys: 그룹|
|서버 저장|`GET/PUT /api/state`, `exclusive`, `persist`, baseVersion|구현 확인: 단일 공유 상태, 충돌 409, 파일 교체·백업|
|클라이언트 동기화|`save` 400ms debounce, `push`, `poll` 5초, `applyRemote`|부분 구현: 충돌을 감지하지만 내 변경 보존은 안 됨|
|인증|`loadOwnerKey`, `isOwner`, X-Owner-Key|부분 구현: 공유 편집 키. 계정 인증·사용자별 권한은 없음|
|백업|담당자 JSON 복사/적용; 서버 data/backups|부분 구현: 그래프·정책 원문은 HTML에만 있음|

`done=확정`, `test=테스트하며 결정`, `open=미정`, `policy=MVP 밖`이다. 업무의 완료/진행 상태로 해석하면 의미가 손상된다. SYSTEMS와 N/E의 `done[]`, `open[]`도 결정 관련 서술이며 실행 가능한 금융·인증·결제 시스템이 아니다. 예를 들어 “Supabase Auth”가 노드에 적혀 있어도 이 앱에 Supabase 인증이 연결되었다는 뜻이 아니다.

저장 상태는 `{version, updatedAt, state:{people,assign}}`. 서버는 읽기를 공개하며 편집 키가 맞아야 쓸 수 있다. README의 “인증 없음”은 계정 인증이 없다는 취지로만 맞고, 실제 편집 키 통제는 존재한다. 제품 SaaS의 소유권/초대/감사와 동등하지 않다.

중요 결함: 서버 `isValid`가 people의 원소·assign 참조를 검증하지 않는다. 브라우저 가져오기는 더 느슨하다. `renderManager`는 import 값의 id/color를 HTML 속성에 직접 보간한다. 정상 이름 등에 esc를 사용하지만 전체 입력이 안전하다고 볼 수 없다. `push`의 409 경로는 `applyRemote`로 로컬 내용을 교체하여 초안을 잃는다. 손상 파일을 load에서 빈 상태로 여는 정책도 복구 확인 없이 후속 저장할 위험이 있다. 백업 파일명을 문자열 정렬해 정리하므로 v10/v2 이후 오래된 순서를 보장하지 못한다.

실행 프로브에서 비인증 GET 200, 비인증 PUT 403, 정상 저장 200, 오래된 버전 409, 동일 버전 동시 요청 200/409, 얕은 타입 오류 400, 내부 잘못된 데이터 수용 200을 확인했다. 마지막 항목은 **결함 재현 성공**이지 보안 통과가 아니다. data/state.json·owner.key·운영 백업은 입력 ZIP에 없어 실제 사람/배정의 완전한 마이그레이션 검증은 불가능하다.

## Flow Workspace

React 19 + TypeScript 5.9 계열 + Vite 7 + @xyflow/react 12 계열. 정확한 설치 재현 기준은 package-lock.json이다. 서버 런타임 의존 없이 dist 정적 빌드가 가능하다. `vite.config.ts`의 base는 `./`다.

|파일·심볼|책임|판정·제약|
|---|---|---|
|`F/src/App.tsx`, App|프로젝트 생성/편집/전환, 모드 전환, JSON import/export|구현 확인; 프로젝트 보관/삭제 없음|
|`F/src/components/Graph.tsx`, Graph/Card|React Flow controlled nodes/edges, 이동/연결/선택|구현 확인; stage/box에 결합, 그룹/Undo/Redo 없음|
|`F/src/components/Architecture.tsx`|다이어그램 및 박스 CRUD, 단계 연결, 보기 모드|구현 확인; 보기 모드는 클라이언트 옵션|
|`F/src/components/Tasks.tsx`, Forms.tsx, Inspector.tsx|업무/단계 편집, 담당자·상태·기한·의존성|구현 확인; 범용 맥락으로 확장 필요|
|`F/src/components/Timeline.tsx`|업무 날짜를 막대로 표시|구현 확인; 복잡한 간트·리소스 계획은 아님|
|`F/src/model.ts`|Workspace/Project/Stage/Task/Diagram/Member, canConnect/removeStage/removeTask|구현 확인; 단계를 지우면 관련 업무를 삭제하고 diagram은 stage 연결만 해제|
|`F/src/repository.ts`, LocalRepository|동기 load/save와 LocalStorage|구현 확인; API 전환 설계 의도는 있지만 비동기 서버 어댑터는 미구현|
|`F/src/useWorkspace.ts`|초기 검증, 저장, 손상 데이터 보호, storage 이벤트|구현 확인; 탭 간 쓰기 중단은 서버 동시성 해결 아님|
|`F/src/validation.ts`, validateWorkspace/parseBackup|스키마·ID·참조·날짜·URL·좌표·DAG·크기 검증|구현 확인; client-only이며 모든 저장에 동일 크기 검증이 적용되지는 않음|

Workspace는 `schemaVersion:1, activeProjectId, projects[]`를 저장한다. 프로젝트에 members/stages/edges/tasks/diagrams가 중첩된다. Member는 이름/역할을 담은 담당자 명부이며 로그인 사용자가 아니다. stages의 edge와 업무 선행관계는 DAG, 아키텍처 diagram의 edge는 순환 허용이다. 범용 맵에 stage의 DAG 검사를 일괄 적용하면 시스템 구조·양방향 관계를 표현하지 못한다.

`parseBackup`는 5MiB 제한, validateWorkspace는 프로젝트100·멤버100·단계500·업무3000·다이어그램500 등의 상한을 둔다. 이 수치는 현재 로컬 앱 방어 기준이며 SaaS 플랜이나 성능 보장으로 승계하지 않는다.

임시 복사본 `npm ci`, `npm run build`, `npm test`, `npm run test:e2e`를 재실행했다. 단위 17/17, 브라우저 29/29 통과. 기존 테스트 범위는 로컬 편집·복원·반응형·키보드·저장 실패이며 계정 간 격리/과금/서버 동시성은 검증하지 않는다. 상세 환경·로그는 루트 QA.md 참고.

## 결론

Flow의 프론트 기반과 검증 패턴을 선택적으로 재사용하고 RWA의 관계 탐색·상세 맥락을 범용 모델로 재구현한다. 서버/인증/협업/플랜은 새로 만든다. 두 앱을 이어 붙이거나 RWA Node 파일 서버를 SaaS 백엔드로 배포하는 방안은 채택하지 않는다.
