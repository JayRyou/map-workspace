# 결정 상태 안내

D-01~03은 잠정 결정이며 최종 확정이 아니다. 아래 원문 제안은 이 문서 말미의 보완 기준으로 구체화한다.

# 도메인 및 저장 모델

설계안 1.0. 계층은 User↔WorkspaceMember→Workspace→Project→Map이다. 인증 주체, 명부, 결정을 업무와 분리한다. 기본 project는 private이며 승인된 ProjectMember만 접근한다. Workspace owner/admin은 관리 목적상 모든 프로젝트에 접근할 수 있고 UI에 이 권한을 명시한다.

## 엔티티 사전

|엔티티|핵심 필드|무결성·보관 위치|
|---|---|---|
|User|id, authIssuer, authSubject, verifiedEmail, displayName, disabledAt|issuer+subject unique; 이메일은 식별 키 아님; SQL|
|Workspace|id, ownerUserId, name, planId, revision, deletedAt|owner는 활성 member; 마지막 owner 제거 금지; SQL|
|WorkspaceMember|workspaceId,userId,role(owner/admin/member/guest),status|복합 PK; guest는 지정 프로젝트만; SQL|
|Project|id,workspaceId,ownerUserId,name,description,archivedAt,deletedAt,revision|복합 FK로 tenant 고정; SQL|
|ProjectMember|workspaceId,projectId,userId,role(owner/editor/viewer)|workspace membership 필요, owner 유일; SQL|
|Map|id,workspaceId,projectId,title,schemaVersion,revision,payload,bytes,updatedBy,deletedAt|map aggregate+검색 가능한 catalog; SQL|
|MapNode|id,typeKey,label,position,groupId?,metadata,assignmentIds|같은 map 참조; payload|
|MapEdge|id,sourceNodeId,targetNodeId,typeKey,label,metadata,assignmentIds|endpoint 둘 다 같은 map; payload|
|MapGroup|id,label,position,size,metadata,assignmentIds|단일 부모, 중첩 금지; payload|
|NodeMetadata|description,notes,properties,externalLinks,customStatus?|property schema type 일치; 수식/HTML 금지; payload|
|Decision|id,kind(decision/policy/discussion),title,status,scope,rationale,options,notes,targetRefs|상태 proposed/evaluating/accepted/rejected/superseded; scope in/out/unknown; payload|
|Task|id,title,description,status,priority,dueDate?,startDate?,nodeIds,predecessorIds|상태 todo/doing/done/blocked; 업무 없는 노드 허용; payload|
|RosterPerson|id,workspaceId,displayName,roleLabel,userId?,archivedAt|명부이지 권한 아님; 계정 연결은 명시적 확인; SQL|
|TaskAssignment/ElementAssignment|id,personId,targetType,targetId,role(main/sub)|task/node/edge/group/decision 대상, 존재하는 roster; payload|
|Invitation|id,workspaceId,projectId,emailDigest,role,tokenHash,expiresAt,acceptedAt,inviterId|7일·1회·확인된 동일 이메일; SQL|
|ShareLink|id,workspaceId,mapId,tokenHash,snapshotId,expiresAt,revokedAt|읽기 전용 published projection; 전체 private aggregate 안 줌; SQL|
|MapRevision|workspaceId,mapId,revision,schemaVersion,payloadHash,payload,createdBy,createdAt,reason|불변 snapshot, 보존 정책으로 prune; SQL|
|AuditEvent|id,workspaceId,actorId,event,targetId,at,requestId|민감 본문 제외; 90일 운영 가설; SQL|
|Subscription|workspaceId,providerCustomerId,providerSubscriptionId,status,periodEnd,entitlementVersion|권한은 검증 webhook에서만 변경; SQL|
|PlanLimit|planId,version,projectMax,mapMax,seatMax,bytesMax,historyDays/historyCount|변경 이력과 적용 시점 보존; SQL|
|UsageCounter|workspaceId,period,key,value,revision|저장 트랜잭션 내 증가/감소; 재계산 작업; SQL|
|Session/Idempotency|tokenHash,userId,expiresAt / workspaceId,actorId,mutationId,resultRevision|원본 토큰 미저장; 만료 정리; SQL|

“SQL”은 권장 D1 물리 모델이다. AWS 대안은 같은 논리 모델을 tenant PK/sk로 표현하고 Map payload는 400KiB item 제한 때문에 필요 시 chunk 분할한다. 한 맵 제한1MiB를 한 DynamoDB item에 그대로 넣을 수 없다.

## 왜 혼합 모델인가

프로젝트/멤버/초대/플랜은 인덱스 조회와 권한 검사가 잦아 정규화한다. 맵의 노드·연결·결정·업무는 한 번에 읽고 저장하므로 bounded JSON aggregate로 시작한다. aggregate 내부 참조와 삭제를 한 revision에서 검증할 수 있고 두 편집자의 경쟁도 단순해진다. 반면 큰 맵 전체 쓰기와 맵 단위 충돌이 증가한다. 여러 맵의 업무 대시보드·세밀한 동시 편집이 필요해지면 별도 인덱스/정규화로 확장한다. 검색 인덱스는 source of truth가 아니며 revision 기준 재구성 가능해야 한다.

인덱스: members(workspaceId,userId), projects(workspaceId,deletedAt,updatedAt), projectMembers(projectId,userId), maps(workspaceId,projectId,deletedAt), revisions(mapId,revision), invites(tokenHash), shares(tokenHash), audit(workspaceId,at), usage(workspaceId,period,key). 모든 FK는 가능한 tenant 복합키를 포함한다. payload 검증에서 workspace나 프로젝트가 다른 ID를 참조하지 못하게 한다.

## 참조와 삭제 규칙

- node 삭제: 연결 edge와 node-target assignment 제거; task.nodeIds/decision.targetRefs에서 참조만 해제하고 업무·결정 내용은 보존한다. 삭제 확인에 영향 개수 표시. Flow의 단계 삭제→업무 연쇄 삭제를 그대로 사용하지 않는다.
- group 삭제: 내부 node는 절대좌표로 변환하여 그룹에서 해제. “내용까지 삭제”는 MVP 기본 동작 아님.
- task 삭제: task-target 배정 및 다른 task의 predecessor 참조 해제. decision 기록은 남기되 링크 끊김 표시.
- roster 삭제: 물리 삭제 대신 archive; 과거 작성자/배정 표시 보존. 계정 탈퇴와 workspace 권한 회수는 별도.
- map/project 삭제: tombstone30일, 즉시 공유 해지·API 일반 조회 차단. project 복구 후 하위 map 복구 가능. 영구 삭제는 권한 재확인·확인 문구·감사, 백업 보존 만료 일정까지 안내.
- 소유권 이전: 대상 활성 membership 확인, 새 owner와 이전 owner 역할·감사 변경을 하나의 트랜잭션으로 적용. 마지막 owner 탈퇴 금지.

## 동시성과 자동 저장

클라이언트는 `{baseRevision, mutationId, schemaVersion, payload}`를 보낸다. 서버는 membership·project 상태·schema·usage를 검증하고 DB에서 **revision 일치 조건의 원자 갱신**을 수행한다. current payload, revision snapshot, usage, audit, idempotency 결과는 함께 commit되거나 모두 실패해야 한다. 먼저 읽고 나중에 무조건 쓰는 방식은 금지한다. 역할 회수·프로젝트 보관과 저장이 경쟁할 때도 저장 commit 시점의 활성 membership과 상태 조건을 같은 원자 경계에서 확인한다.

D1에서는 batch의 원자성만 믿고 UPDATE 영향 행0을 성공으로 취급하면 안 된다. P4 검증에서 SQL 조건/constraint 또는 trigger로 충돌 시 후속 snapshot/usage 삽입도 막아야 한다. 지원하지 않는 일반 BEGIN transaction API를 임의 가정하지 않는다. DynamoDB는 condition+TransactWriteItems, chunk들을 포함한 비용/크기를 검증한다.

클라이언트 상태: clean→dirty→saving→clean, 실패 시 offline/error,409시 conflict. 800ms idle debounce와 최대5초 flush를 초안으로 하되 드래그 종료·폼 완료를 하나의 편집 명령으로 묶는다. 요청 중 추가 편집이 있으면 전송한 snapshot만 ack 처리하고 새 dirty는 유지한다. 단일 map save queue, mutationId 재전송 중복 제거. 서버 ack 전 “저장됨” 표시 금지.

409는 서버 revision과 비교용 최신본을 반환하되 로컬 초안을 덮지 않는다. “내 초안 다운로드 / 새 맵으로 저장 / 최신본 열고 변경 재적용”을 제공한다. 사용자 동의 없는 baseRevision 변경 후 재전송 금지. 권한이 회수되면 서버 내용 재조회는 거부하되 이미 가진 초안은 사용자에게 회수 방법을 제공한다.

## 용량·사용량

기술 상한은 MVP_SCOPE 기준. 저장량은 UTF-8 bytes로 사전 측정하고 서버에서 다시 계산한다. 플랜이 허용한 공간과 SQL 운영 headroom은 별도다. 원자적 usage check 없이 동시에 맵을 생성하면 플랜 초과 race가 생긴다. 실제 저장 총량·snapshot·휴지통을 합산하고 매일 재계산하여 drift를 경보한다. deleted/archived 데이터도 물리 보관 중엔 포함한다.

비용 모델의 평균 0.5MB/MAU는 상품의 저장 상한이 아니다. 비활성 유저 데이터도 남기 때문에 MAU가 일정해도 저장량은 성장한다. D1 단일 DB 10GB 제한을 고려해 5GB 경고/7GB 증설 결정, 성장 시 workspace별 shard 또는 다른 DB 이전이 필요하다. 아직 성능을 실측하지 않았다.


## D-02/D-03 추가 상태 계약

|사건|기존 상태|처리|후속 상태|
|---|---|---|---|
|동일 revision 경쟁|saving|409,서버 최신본 별도 보관,내 초안 유지|conflict|
|응답 유실|saving|같은 mutationId로 전송 결과 조회/재전송;새 변경으로 취급 금지|error 또는 saving|
|저장 중 추가 수정|saving|전송 snapshot만 ack,뒤의 dirty 유지|dirty|
|오프라인|dirty/saving|계정·workspace별 draft,서버 성공표시 금지|offline|
|권한 회수|모든 상태|새 쓰기 중지,허용된 초안 회수,서버에서 권한 재검증|revoked|
|로그아웃|dirty/conflict/offline|초안 내보내기/로그아웃 취소/초안 삭제 확인;타계정 노출 방지|signedOut|

retry는 최신 revision 무조건 대입이 아니다. 최신본을 읽고 내 변경을 명시적으로 재적용하거나 새 사본 선택 후 새 baseRevision/mutationId를 사용한다. Invitation은 수신자 이메일·계정·project role에 결합한 1회 접근 승인이고 ShareLink는 로그인 없이도 공개 snapshot만 조회하는 토큰이다. 두 엔티티·URL·행동을 분리한다.
