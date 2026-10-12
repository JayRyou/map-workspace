# 로컬 저장·마이그레이션

P3 repository 인터페이스는 load/save/stop/raw/legacy/preserveP2입니다. UI는 계정·서버 성공을 표시하지 않습니다. P3 키는 `map-workspace:p3:workspace-local:v3`, 이전 정상본은 `:previous`, 격리는 `:quarantine`입니다. P2 현재/previous/quarantine 키에는 쓰지 않습니다.

전체 문서: format=map-workspace-project-local, schemaVersion=3, workspaces/projects/maps/decisions/tasks/roster/migrations/active/savedAt. 각 맵의 그래프/표시 상태는 P2 엔진 계약을 유지합니다. P1 prototype JSON과 지원하지 않는 버전·임의키·깨진 참조·중복ID를 거부합니다. imported 문서는 자동 병합하지 않고 미리보기+전체교체 확인을 받습니다.

캔버스 적용/드래그 종료 뒤 최신 map/view를 메모리 aggregate에 즉시 반영하고400ms 후 저장합니다. 관리 작업은 즉시 저장합니다. 맵/프로젝트 전환 전 graph flush 실패나 드래그 중이면 전환을 막습니다. Inspector와 제목 폼의 미적용 입력은 이동 전에 버림 확인을 받습니다. 폼의 저장/적용 버튼을 누르지 않은 값은 JSON 백업 대상이 아닙니다.

write 이전 전체검증→expected raw 비교→유효한 현재값을 previous로 보존→현재값 쓰기→readback 일치 확인 순서입니다. savedAt만 다른 동일내용은 재기록하지 않습니다. 저장 실패시 메모리 초안을 보존하고 실제확인 전 완료 문구를 표시하지 않습니다. 구조가 너무 커지거나 quota가 부족하면 파일 백업으로 회수할 수 있습니다.

손상·current 유실+previous 존재는 자동쓰기 차단. 유효한 previous는 임시로 열되 덮어쓰지 않습니다. 명시복구 시 current/previous/기존quarantine을 새 격리값에 함께 보존한 뒤에만 저장합니다. 격리공간 부족시 원본 교체를 하지 않습니다. 재귀 격리값은 용량을 사용할 수 있으므로 복구 전 원문을 내려받으세요. 자동청소는 하지 않습니다.

다중탭은 storage event와 save직전 raw비교로 방어합니다. Web Storage 트랜잭션/서버 CAS가 아니므로 완전히 동시인 두 쓰기의 원자성은 보장하지 않습니다. 초안을 내려받고 새로고침하거나 명시복구로 현재초안을 선택합니다. P4에서는 서버 revision/권한검사를 추가해야 합니다.

## P2 이행

1. 현재/previous 키 또는 P2 JSON 파일을 읽고 map-local v1 검증. 잘못된입력은 거부.
2. 내용·요소수 미리보기와 원본 다운로드 제공.
3. map/view의 정규화JSON SHA256 fingerprint로 기존이행을 확인(savedAt만 다른 중복도 차단).
4. 별도 `:p2-original:<fingerprint>`에 원문을 쓰고 readback 확인. 기존 P2 키는 유지.
5. 활성 작업공간(읽기전용이면 새공간)의 **새 프로젝트**에 추가. 원래 map ID 충돌 시 새map ID만 발급. 내부노드/좌표/메타데이터/view는 보존.
6. 새P3문서 저장 성공 후에만 활성화. 실패하면 기존P3문서와 P2원본 유지; 작성된 별도 원본백업은 남길 수 있음. 동일fingerprint 재이행 차단.

전체 백업을 복원하면 migrations 영수증도 복원됩니다. P2 이전본 등 다른 내용은 다른fingerprint로 별도 이행 가능합니다. P2 이전 포맷을 P3으로 암묵적으로 간주하지 않습니다.

## 한도

P2 맵1MiB / 노드500 / 연결1000 / 그룹50 유지. 전체P3 UTF8 10MiB, 작업공간20·프로젝트100·맵100, 프로젝트결정100·업무200, 작업공간명부100. tombstone 포함 상한입니다. 브라우저 quota가 더 작으면 quota실패를 먼저 처리합니다. 전체export는 compact JSON으로 저장해 import 크기한도 왕복을 유지합니다. 회사/계정 백업 및 클라우드 RPO 보장을 뜻하지 않습니다.
