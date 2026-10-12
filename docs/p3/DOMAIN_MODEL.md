# P3 로컬 도메인 모델

스키마3 / format `map-workspace-project-local`. 인증/소유권/서버권한 필드는 P4에서 도입합니다. 모든 ID는 로컬 UUID이며 전체 카탈로그/도메인 ID 중복을 거부합니다. 맵 요소 ID는 맵 내부 유일성(P2 계약)을 유지합니다.

|소유 단위|역할|
|---|---|
|Workspace|로컬 작업 공간, name 및 보관/삭제 시각|
|Project|workspaceId, name, description, 보관/삭제|
|MapRecord|projectId + 기존 Map + View, 보관/삭제|
|Decision|projectId, kind(decision/policy/discussion), 상태·범위·근거·대안·메모·targetRefs·작성/변경시각|
|Task|projectId, 상태·우선순위·일정·personIds·nodeRefs·decisionIds·predecessorIds|
|RosterPerson|workspaceId·displayName·roleLabel·보관; 로그인/권한과 무관|

일반 맵은 순환 허용, 자기 연결과 source/target/type 중복만 거부합니다. 업무 선행관계는 같은 프로젝트 내에서만 DAG로 검증합니다. Decision 상태는 proposed(미정), evaluating(검토 중), accepted(확정), rejected(채택 안 함), superseded(대체됨). 범위는 별도 in/out/unknown입니다. 결정 확정이 Task done으로 전파되지 않습니다.

범용 metadata는 P2 description/notes를 필수로 유지하고 tags(최대20), customStatus(60자), properties(최대30)를 선택 확장합니다. 각 속성은 key/type/value이며 text/number/date/choice/url을 제공합니다. choice는 단일 선택 텍스트이며 전역 옵션 사전은 없습니다. 키 중복·위험키·NaN·잘못된 날짜·javascript URL을 거부합니다. HTML은 React의 일반 텍스트로만 렌더링하고 실행하지 않습니다. URL속성10개, 문자열값2000자 상한.

맵의 Undo/Redo는 P2 명령 이력을 그대로 사용합니다. 프로젝트/업무/결정 작업은 별도 관리 작업이며 캔버스 Undo 범위에 포함하지 않습니다. 노드 삭제 시 해당 target/node 참조만 해제하며 업무·결정 본문은 유지합니다. Undo로 노드가 돌아와도 해제한 도메인 링크는 자동 재연결하지 않습니다. 필요하면 다시 연결할 수 있으며 이 경계는 삭제 안내에 표시합니다.

맵/프로젝트/워크스페이스 삭제는 deletedAt tombstone. 부모가 삭제되면 하위 내용은 숨겨 보존하고 부모 복구 후 다시 접근할 수 있습니다. 30일 보존 후 ‘영구 삭제’ 입력을 받아 제거할 수 있고 자동 파기는 없습니다. 부모 영구 삭제는 해당 프로젝트의 도메인 레코드도 제거합니다. 단일 맵 영구 삭제는 프로젝트 도메인 본문을 남기고 맵참조만 해제합니다. 보관은 읽기전용입니다.

맵 복제는 모든 맵/요소 ID를 새로 발급하고 내부 edge/group 참조를 재작성합니다. 프로젝트 업무/결정은 복제하지 않습니다. 담당자 삭제는 물리 삭제 대신 보관하여 과거 배정을 보존합니다.
