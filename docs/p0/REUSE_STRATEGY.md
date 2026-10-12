# 재사용 전략

## 채택안

React/TypeScript/Vite + React Flow를 새 MAP Workspace의 기술 기반으로 선택한다. 기존 화면을 복제하지 않고 기능 단위로 옮긴다. 이 문서는 제안이며 실제 코드 이동은 P2 이후 승인된 페이즈에서 한다.

|자산|재사용 단위|변경점|이행 페이즈|
|---|---|---|---|
|Flow Graph|controlled graph·선택·좌표 저장·키보드 패턴|stage/box 타입 제거, 공통 MapNode renderer, 그룹 추가|P2|
|Flow model 유틸|ID·참조 정리·의존성 검사 사고방식|task DAG와 일반 relation 분리, 삭제 시 업무 자동 삭제 금지|P2–P3|
|Flow 검증|ID/참조/날짜/URL/사이즈 검증 케이스|새 schema와 서버 공용 validator; strict allowlist|P3–P4|
|Flow 저장 추상화|UI와 persistence 분리|Promise·AbortSignal·revision·오류 결과·draft store 설계|P3–P4|
|Flow 폼/공통 컴포넌트|Confirm/Modal/입력/빈 상태/포커스 처리|P1 토큰에 맞춰 재구성, 전역 토스트 남용 방지|P2–P3|
|Flow 테스트|실패 입력·왕복·참조 정리·저장 오류 시나리오|도메인 이름과 새 모델에 맞춰 다시 작성|P2–P8|
|RWA 탐색|1-hop 강조, 상태/담당자 필터, 상세 관계 링크|React 상태 선택기로 구현, O(V+E) 인접 인덱스|P2|
|RWA 맥락|역할·확정사항·미정사항·단계 흐름|typed decision/notes/views로 보존|P3|
|RWA 담당자|main/sub 및 node/edge/group 대상 배정|roster와 계정 권한 분리, 유실 없는 변환|P3|
|RWA 동시성 개념|baseVersion와409|서버 DB CAS + 로컬 초안 보존; 구현은 교체|P4|

폐기 대상은 고정 산업 레이아웃을 제품 기본값으로 삼는 방식, 수작업 SVG path를 범용 편집의 기본 저장 형식으로 삼는 방식, Node 파일 서버, URL의 공유 관리자 키, shallow JSON 검증, 409 후 무조건 덮어쓰기다. 기존 데이터 자체는 폐기하지 않는다. 원본을 migration provenance에 보관하고 별도 예시 맵으로 가져온다.

## 이관 원칙과 경계

1. 먼저 domain/types, schema, graph commands, persistence interfaces를 독립 모듈로 정의한다. 화면에서 localStorage나 vendor API를 직접 호출하지 않는다.
2. renderer는 position/style/selection을 다루고 권한 판단·플랜 제한·데이터 참조는 별도 계층에서 검증한다. 클라이언트 검사는 사용성, 서버 검사는 보안이다.
3. 샘플과 운영 데이터는 분리한다. 자동으로 로그인 계정과 이름이 같은 기존 담당자를 연결하지 않는다. 사용자 확인 후 roster에 userId를 연결한다.
4. 마이그레이션은 원본 읽기 → 정규화 → 검증 → 경고 보고 → 새 프로젝트 생성 순서다. 기존 프로젝트 전체 대체는 기본 옵션이 아니다.
5. 라이선스는 제공 코드의 권리·라이선스 파일이 명확하지 않아 상용 재사용 권리 확인 필요. 패키지 LICENSE와 배포 NOTICE는 P2에서 수집한다. React Flow 유료 예제 코드를 무료 구현으로 간주하지 않는다.

대안 A(두 UI 연결)는 데이터/권한/탐색 중복 때문에 기각한다. 대안 B(RWA 단일 HTML 확대)는 테스트성과 유지보수 비용 때문에 기각한다. 대안 C(완전 신규 그래프 엔진)는 검증된 라이브러리 상호작용을 다시 만들 부담 때문에 기각한다.
