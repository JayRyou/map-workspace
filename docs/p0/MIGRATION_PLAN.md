# 기존 데이터 비파괴 마이그레이션 계획

현재 단계는 설계만 완료했다. 변환 코드·운영 데이터 import는 미실행이다. 입력 원본 hash는 evidence/source-sha256.json에 보존했다. RWA 운영 people/assign은 미첨부이므로 실제 담당자까지 성공했다고 평가하지 않는다.

## 공통 절차

1. 사용자가 제공한 원본을 읽기 전용 보관하고 format/hash/sourceVersion을 기록한다.
2. 외부 HTML/JS를 실행하는 범용 importer를 만들지 않는다. RWA 고정 버전용 추출기는 AST의 허용 literal 구조만 추출하며 함수/호출/동적 식이 있으면 중단한다.
3. deterministic source ID→신규 UUID map을 생성한다. importRunId+sourceHash unique로 재시도 중복 생성을 막는다. 같은 자료를 의도적으로 새 사본으로 가져오기는 새 run으로 구분한다.
4. preview에 대상 project/map 수, 생성할 roster, 자동 변환 필드, 참조 오류, 유실 가능 위치와 경고를 보여준다. 경고 수용과 오류를 구별한다.
5. 새 workspace/project 권한을 서버가 부여한다. 원본의 user/owner/role 값으로 실제 접근권한을 만들지 않는다.
6. 모든 참조·크기·플랜 검증이 성공한 경우에만 원자 commit. 다중 맵은 staging importRun이 완료될 때 catalog에 노출하고 실패 시 정리한다.
7. 새 ID 매핑표·counts·경고 보고·원본 hash를 다운로드한다. 사용자 검수 후 원본 유지, 실패 시 신규 importRun만 되돌린다.

## RWA 매핑

|원본|대상|보존/변환 규칙|
|---|---|---|
|SYSTEMS|MapGroup + metadata|name/desc/role 보존; 영역 없는 ext는 그룹 생성 여부를 preview, 위치는 산출 근거 표시|
|N.id,t,s,x,y,w,h,sys|MapNode|title/summary/절대좌표·크기·group link; group-relative 변환 후 시각 비교|
|E.id,from,to,t,st,role,done,open|MapEdge + ContextRecord|양 끝 매핑, label/방향/설명/결정 보존|
|E.d,lx,ly|legacyLayout extension|임의 SVG path는 inert 원문 보관, 새 engine는 endpoint 기반 routing; 외형 차이 보고|
|INTERNAL의 path 문자열|legacyLayout.annotations|ID/endpoint 없는 장식 경로를 업무 관계로 추측하지 않음|
|N/E/SYSTEMS.role|description|텍스트 의미 보존|
|done[]|Decision(status=accepted, provenance=legacy-import)|각 문장을 기록으로 보존, 새 사용자가 승인했다는 뜻 아님|
|open[]|Discussion/Decision(status=proposed)|미정 문구 그대로, 근거/선택지 자동 생성 금지|
|st: done/test/open/policy|decision certainty 및 scope|done→accepted, test→evaluating, open→proposed, policy→scope out/status proposed+legacy raw; 업무 완료로 변환 금지|
|STEPS|saved context views + 설명·결정|nodes/edges membership와 단계 이름·순서 보존; 필수 task로 만들지 않음|
|people|RosterPerson|id/name/role/color 검증. 허용 color token 밖은 원문 extension, 안전 기본색 표시|
|assign[target][person]|ElementAssignment|node/edge/sys:group별 target과 main/sub 보존; 없는 사람/대상은 오류 보고|
|version/updatedAt|import provenance|새 server revision과 별도|

people/assign만 있는 JSON은 HTML의 N/E/SYSTEMS/STEPS와 결합해야 완전한 맵이 된다. 정적 HTML만 가져오면 관계·설명은 옮길 수 있으나 실사용 배정은 알 수 없다. 운영 state.json 또는 브라우저 JSON과 분석한 HTML 버전의 일치 확인이 필요하다. 공개 업로드에 owner.key를 포함하지 않는다.

## Flow 매핑

|원본|대상|주의|
|---|---|---|
|Workspace.schemaVersion=1|legacy format flow-workspace-v1|신규 MAP schema1과 구분|
|projects[]|Project|기존 id는 provenance; 새 workspace를 사용자가 선택|
|project.stages / edges|주 맵의 node(type=stage) / edge(type=precedes)|원래 task progress/status는 workflow metadata에 보존|
|project.tasks|주 맵 Task|stageId→nodeIds, assigneeIds→roster, predecessors 재매핑; 진행 상태 뜻 보존|
|project.diagrams|추가 Map(type=system)|box→generic node, cycles 유지, diagram.stageId는 맵 간 relatedRef로 보존|
|project.members|RosterPerson|이름 일치로 계정 자동 결합 금지|
|activeProjectId|개인 view preference|shared data와 분리|
|urls/startDate/dueDate/priority|metadata/task 필드|날짜와 URL 재검증, 알 수 없는 값은 오류 보고|

stage와 diagram을 물리적으로 하나의 캔버스에 합치면 중복 ID·좌표 충돌이 생기므로 프로젝트 내 여러 맵으로 옮긴다. 연결된 stage에 관한 diagram 탐색은 catalog relation으로 제공한다.

## 검증과 rollback 기준

P3 fixture: RWA 정적 데이터, people/assign 정상·누락·알 수 없는 target, Flow sample 및 빈 project, 중복ID, 순환 diagram, 잘못된 predecessor, 미래 schema, 최대크기 초과, 악성 id/style/HTML. 노드·연결·그룹·결정·업무·배정 count와 모든 target resolve, 한글/줄바꿈 왕복, 의미적 diff=0을 요구한다. 위치/routing 차이는 별도 시각 확인 후 경고 수용한다.

입력 손실·임의 계정 권한·배정 누락이 있으면 commit 금지. 원본을 수정하지 않으므로 rollback은 새 importRun 삭제 및 기존 원본 재사용으로 가능하다. 이미 사용자가 수정한 import 결과는 자동 삭제하지 않고 복구 프로젝트로 격리한다. 운영 데이터와 코드의 실제 버전 확인은 P3 착수 입력 조건이다.
