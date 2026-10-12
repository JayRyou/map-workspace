# 기능 비교 및 처리 결정

상태: 구현 확인=실제 코드 존재, 부분 구현=요구 일부만 충족, 설계만 존재=문서/추상화 의도만 존재, 미구현=관련 코드 없음, 확인 불가=입력/검증 부족. 난이도는 통합에 필요한 상대값(하/중/상)이며 기존 코드의 완성도와 다르다. 경로 접두어는 CODEBASE_ANALYSIS.md 기준.

|기능|RWA MAP|Flow Workspace|처리|근거·예상 난이도|코드 위치|
|---|---|---|---|---|---|
|정적 프론트|구현 확인|구현 확인|Flow 기반 재사용|React/TS 분리 가능; 하|R/public/index.html; F/vite.config.ts|
|노드 CRUD/이동|미구현: 고정 N|구현 확인: stage/box|재사용 후 범용화|도메인 필드 분리; 중|F/components/Graph.tsx, App.tsx, Architecture.tsx|
|연결선 CRUD|미구현: 고정 E|구현 확인|재사용·확장|관계 이름/유형/메타데이터 추가; 중|R/index.html E; F/Graph.tsx, ConnectionForm.tsx|
|순환 관계|고정 데이터로 표현|구현 확인: diagram만 허용|정책 분리|일반 맵 허용, 업무 의존성 거부; 중|F/model.ts canConnect|
|그룹/영역|부분 구현: 고정 SYSTEMS|미구현|재구현|범용 그룹 CRUD와 좌표; 상|R/index.html SYSTEMS|
|관계 탐색·주변 강조|구현 확인|부분 구현: 선택만|RWA 동작 재구현|1-hop/방향 필터, 표시와 저장 분리; 중|R/index.html neighborhood/select/setFocus|
|확대/이동/맞춤|구현 확인|구현 확인|Flow 재사용|SVG 직접 제어 폐기; 하|R/zoomAt; F/Graph.tsx|
|Undo/Redo|미구현|미구현|신규|명령 단위, 저장 버전과 별도; 상|해당 모듈 없음|
|상세 설명·속성|부분 구현: 고정 role/done/open|부분 구현: 단계 설명·URL|재구현|공통 Inspector와 사용자 정의 속성; 중|R/renderDetail; F/Inspector.tsx, Forms.tsx|
|정책/결정 관리|부분 구현: 정적 안건·확정/미정|미구현|내용 보존, CRUD 신규|결정/업무 상태 분리; 상|R/STATUS, N/E/SYSTEMS|
|업무 CRUD/기한/선행|미구현|구현 확인|선택적으로 재사용|단계 필수 결합 제거; 중|F/Tasks.tsx, Forms.tsx, model.ts|
|담당자 명부/배정|구현 확인|구현 확인|모델 이관|계정과 roster 분리; edge/group 배정 보존; 중|R/setRole; F/Member/assigneeIds|
|프로젝트 CRUD/보관|미구현|부분 구현: 생성/수정/전환|보관/삭제 신규|소유권·복구 포함; 중|F/App.tsx|
|다중 맵|미구현|부분 구현: flow+diagrams|통합 모델 신규|flow도 Map, diagram도 Map; 상|F/model.ts Project/Diagram|
|타임라인|미구현|구현 확인|Later로 보류|MAP MVP 필수 아님; 하|F/Timeline.tsx|
|JSON 백업/복원|부분 구현: roster만|구현 확인: workspace|검증 패턴 재사용|새 envelope·미리보기·서버 검증; 중|R/renderManager; F/App.tsx, validation.ts|
|저장소 분리|미구현: DOM/API 혼합|구현 확인: 로컬 인터페이스|인터페이스 재설계|async/error/CAS 요구; 중|F/repository.ts|
|원격 어댑터|구현 확인: 자체 파일 API|설계만 존재: 저장소 추상화|서버리스 신규|local load/save 교체만으로 불가; 상|R/server.js; F/repository.ts|
|충돌 방지·초안 보존|부분 구현:409 후 덮음|부분 구현: 다른 탭 중단|재구현|로컬 초안+명시적 해결; 상|R/push/applyRemote; F/useWorkspace.ts|
|계정 인증/테넌트 격리|부분 구현: 공유 쓰기 키|미구현|신규|SaaS 공개 운영 차단 요건; 상|R/isOwner, GET /api/state|
|초대·역할·공유 링크|미구현|미구현|신규|서버 권한 평가; 상|관련 구현 없음|
|Markdown 컨텍스트|미구현|미구현|신규|선택/관계/맥락, 외부 AI 불필요; 중|관련 구현 없음|
|플랜·결제·사용량|미구현|미구현|신규(P7)|검증된 webhook 기반; 상|관련 구현 없음|
|실사용 배정 데이터|확인 불가|확인 불가: 샘플만 검증|추가 자료 필요|브라우저 export/운영 state 요청; 중|R/data 미첨부|
|자동 테스트|미구현|구현 확인|테스트 패턴 재사용|17 단위·29 E2E 재실행; 중|F/tests/*|

위 Flow 구성요소 경로는 모두 `F/src/components/`, App/model 등은 `F/src/` 하위다. R/index.html 표기는 `R/public/index.html`의 약칭이다.
