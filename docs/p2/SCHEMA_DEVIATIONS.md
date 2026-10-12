# P0 대비 P2 전용 계약

|항목|P2 선택|사유·P3 영향|승인|
|---|---|---|---|
|envelope|format=map-workspace-map-local, schemaVersion=1|P1 mock/제품 backup과 엄격 분리; P3 importer는 별도 변환 필요|P2 프롬프트 허용|
|Map|id/title/nodes/edges/groups|workspaceId/projectId/revision/사용자·서버 필드는 미구현, 서버 저장 오인 방지|P2 범위 내|
|메타데이터|description/notes plain text만|속성/배정/결정/업무 완전 모델은 P3. 알 수 없는 필드는 거부해 무음 손실 방지|P2 최소 메타데이터|
|위치|그룹 없는 노드 절대좌표, 그룹 내 상대좌표|그룹 화면 좌표+상대=절대; 해제·삭제 시 변환|P0 정렬|
|UI|별도 view: viewport/mode/selectedIds/search/typeFilter|이력에서 제외; 로컬 왕복 보존|UI 임시 상태 분리|
|저장|LocalStorage2슬롯(현재/이전 정상), 별도 키|계정 없는 단일 로컬 문서. P0 계정별 IndexedDB draft와 다른 테스트 경계|P2에서 선택 허용|

운영 스키마/서버 revision/권한/사용자 데이터 migration 승인을 요청하는 변경은 없다. P3에 production 호환을 약속하지 않는다. 악의적·미지원 형식은 거부한다. P2 문서 최대1MiB,500노드/1000연결/50그룹.
