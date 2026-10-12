# 로컬 편집기 계약

MapNode/MapEdge/MapGroup은 P0의 id/typeKey/label/position/groupId/metadata 이름을 따른다. 연결 endpoint는 sourceNodeId/targetNodeId. 그룹은 부모를 갖지 않는다. ID는 모든 요소 종류에서 유일, 자기 연결 금지, 동일 source+target+typeKey 중복 금지, 역방향과 다른 타입은 허용한다. 일반 그래프 순환을 허용한다.

메타데이터는 description/notes 평문만. 사용자 HTML을 실행하지 않는다. 미지원 필드를 가져오기에서 거부한다. 결정/업무 예시는 Map 밖의 불변 읽기 전용 표시이며 노드 삭제에 의해 연쇄 삭제되지 않는다. 실제 Task/Decision 도메인 참조 정리는 P3 계약이다.

그룹 없는 노드 위치는 절대좌표, 그룹 내 노드는 부모 상대좌표다. 절대좌표=그룹 position+노드 position. 그룹 이동은 그룹 position만 변경한다. 자식 이동은 상대 position만 변경한다. 새 그룹·부모 변경·해제·그룹 삭제는 기존 절대좌표를 먼저 계산해 변환한다. 그룹 삭제는 자식을 보존하며 간접 연결도 유지한다. 크기 변경은 오른쪽/아래 경계를 바꾸며 자식 좌표를 바꾸지 않는다. 그룹 경계를 넘어 자식을 옮겨도 membership은 유지하고 Inspector에서 명시적으로 해제한다. 자동포함/중첩/자동크기확대는 없다.

단일 명령 execute→validateMap→history commit, 실패 시 변경 없음. 렌더러의 드래그 미리보기는 history에 포함하지 않고 종료 시 positions 한 건으로 commit한다. 선택/검색/필터/뷰포트는 View이며 편집 이력과 분리한다.

React Flow 공식 근거(2026-10-10): https://reactflow.dev/learn/layouting/sub-flows ; https://reactflow.dev/learn/advanced-use/accessibility ; https://reactflow.dev/api-reference/react-flow . parentId는 상대좌표를 사용하며 부모를 먼저 렌더한다. 라이브러리 선택/탐색과 실제 도메인 명령을 분리한다.
