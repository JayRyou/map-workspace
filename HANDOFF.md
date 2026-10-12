# P3 인수인계

**P3 완료 — 외부 검수 대기**. P4 착수·원격 push·main 병합·배포를 수행하지 않았습니다.

## 유지할 계약

기존 P2 GraphCanvas/graph 명령·history·keyboard를 사용합니다. 외부 EditorHost가 repository·flush·rename·jump·도메인맥락을 주입합니다. 저장소/프로젝트셸이 P3 aggregate, 캔버스가 현재맵 편집이력을 소유합니다. 활성 맵 이름 변경도 title 명령을 통해 처리합니다. 뷰는 Undo 밖입니다.

MapRecord는 projectId와 P2 map/view 및 archivedAt/deletedAt을 가집니다. Decision/Task는 프로젝트 소유로 같은 프로젝트 여러맵을 연결합니다. RosterPerson은 workspace 소유 로컬명부이며 계정/권한이 아닙니다. 정확한 필드·한도는 src/project/model.ts, validation.ts와 docs/p3/DOMAIN_MODEL.md가 기준입니다.

결정 proposed/evaluating/accepted/rejected/superseded, 별도 scope in/out/unknown. 업무 todo/doing/done/blocked. 업무 done만 진행률 분자, 보관/삭제 제외가 분모이고 blocked는 포함합니다. 취소라는 별도 상태는 추가하지 않았으며 제외하려면 보관합니다. 선행순환만 거부하며 일반 맵 순환은 허용합니다.

## 데이터 보호와 제약

P3 LocalStorage aggregate는10MiB기술상한이지만 브라우저quota가 먼저 걸릴 수 있습니다. 현재/previous/격리값 및 P2 별도원본이 저장공간을 함께 씁니다. 권한/서버CAS 없이 raw비교+storage event만 사용합니다. 완전히 동시인 쓰기의 원자성을 주장하지 않습니다.

기존 P2 키에 쓰지 않으며 SHA256 내용 fingerprint로 명시적이행 중복을 막습니다. 전체 P3 backup v3와 P2 map-local v1은 구분합니다. 원본저장/새문서저장 실패시 기존 데이터 유지. 초안은 메모리에 유지하고 JSON으로 회수합니다. 전체한도를 넘긴 초안은 회수할 수 있지만 재가져오기 전 용량을 줄여야 합니다.

맵세션 Undo는 맵 전환/reload/전체백업교체 시 초기화합니다. 데이터/view는 유지합니다. 프로젝트/결정/업무 CRUD는 캔버스Undo 범위 밖입니다. 노드삭제는 업무/결정본문을 남기고 참조만 해제하며 노드Undo가 해제한 도메인링크까지 되돌리지는 않습니다. UI삭제안내와 문서에 표시했습니다.

Workspace/Project/Map 휴지통은30일 이후 확인에 의한 영구삭제만 가능하며 자동파기 없음. 보관부모 안에서 맵 변경을 차단합니다. Task/Decision 삭제표시는 백업에 남지만 개별 휴지통 UI는 제공하지 않습니다. Roster는보관/복귀만. 보존된 항목도 개수/용량한도에 포함합니다.

## P4 전에 확인

1. 실제 OS IME, native200%, 스크린리더, 터치, 다른브라우저 검수. QA_REPORT의 UNVERIFIED 참고.
2. 사용자/외부검수자가 P3 데이터/삭제/이력 경계를 승인해야 합니다.
3. P0 D-01/02/03의 잠정 기술 결정을 Spike로 확정하고 실제 계정/tenant/권한/revision/CAS 검증을 설계해야 합니다. P3 local IDs/명부를 인증주체로 그대로 사용하지 마세요.
4. LocalProjectRepository 인터페이스를 API로 바꿀 때 서버 ack/실패/권한회수/충돌 초안회수 의미를 보존하고 schema3→제품스키마 명시적migration을 만드세요.
5. 여러 프로젝트의 최대aggregate·장시간메모리·초기저장지연·실제기기성능을 추가 측정하세요. 현재500/1000은한맵 단일Linux 실측입니다.

코드 재현 기준 SHA·최종 SHA·Patch hash·정확한 적용 결과는 납품 PATCH_MANIFEST.md에 있습니다. P2 원본ZIP도 함께 제공합니다.

## P3-006

통합UX·회귀·실측·정적납품 및 통합패치 기준 확정

검증: 단위40·통합39·탐색5·이행7·손상3·납품4 PASS; p95 83.4ms; build 성공; 패치 재현결과는 납품manifest 참조
