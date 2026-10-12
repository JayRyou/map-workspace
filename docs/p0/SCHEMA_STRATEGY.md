# 스키마·버전·호환 전략

## 세 가지 버전 분리

1. `schemaVersion`: 데이터의 모양, 초기 MAP Workspace는 1. 기존 Flow의 schemaVersion1과 동일 제품이라는 뜻이 아니므로 `format` discriminator를 필수화한다.
2. `revision`: 특정 맵의 성공한 서버 변경 순번. 매번 증가, 충돌 검사용. 삭제/복구도 증가한다.
3. `exportVersion`: 내보내기 envelope 형식. UI 뷰 상태나 서버 DB migration 버전과 분리한다.

내보내기 예시(명세용, 실행 구현 아님):

```json
{
  "format": "map-workspace-backup",
  "exportVersion": 1,
  "schemaVersion": 1,
  "exportedAt": "2026-10-09T00:00:00Z",
  "source": {"app":"MAP Workspace","workspaceLabel":"예시"},
  "projects": [],
  "roster": [],
  "extensions": {},
  "manifest": {"payloadSha256":"생성 시 실제 계산"}
}
```

위 placeholder는 fixture가 아니다. 실제 exporter는 ISO date/hash/counts를 계산한다. 인증 token·invitation secret·공유 secret·결제 ID·세션·서버 권한은 export에서 제외한다. 작성자 표시·기존 UUID는 provenance로 포함 가능하지만 import 권한을 부여하지 않는다. 검증은 신뢰할 수 없는 hash가 아니라 schema/권한/참조에 근거한다.

## 검증 파이프라인

브라우저 파일 크기 확인 → 문자열/JSON parse → format/최상위 버전 allowlist → 깊이·배열·문자열·총 byte 제한 → own-property 기반 안전한 projection → ID 중복·참조·타입·URL·날짜·유한 좌표 확인 → preview → 서버 동일 검증 → import transaction. 압축파일/스크립트/HTML을 일반 import로 실행하지 않는다.

`__proto__`, `prototype`, `constructor` 키와 예상하지 못한 권한 필드는 거부한다. properties는 key-value 배열 또는 안전한 Map으로 처리하고 사용자 키를 JS 객체 prototype에 할당하지 않는다. 허용 URL은 https/http; javascript/data/file 차단, 서버가 링크를 fetch하지 않는다. 노트는 plain text/제한 Markdown이며 raw HTML 비활성화. style은 token enum으로 제한한다. unknown node type은 텍스트 fallback과 경고로 보존할 수 있지만 알 수 없는 실행 동작은 없다.

일반 맵 edge는 방향 관계이며 순환 허용. 자기 연결·동일 source/target/type 중복은 MVP에서 금지한다. 서로 다른 relation type은 중복 endpoint 허용. task predecessor는 동일 map 내 DAG. group membership은 하나, 부모 자신·중첩 그룹 금지. 날짜는 YYYY-MM-DD와 실제 달력 날짜를 검증하고 start≤due. null/빈 문자열 정책을 명세로 통일한다.

## 버전 호환

현재 버전은 read/write, 이전 지원 버전은 순수함수 `vN→vN+1` 체인을 거쳐 읽는다. 미래 major는 가져오기를 거부하고 원본 다운로드 보존 안내. 지원 범위는 현재+직전2개 major 제안, actual migrator fixture 없이는 호환을 약속하지 않는다. 알 수 없는 extension은 namespace/byte 상한을 두고 inert 상태로 왕복 보존한다.

서버는 배포 시 N/N-1 클라이언트 요청을 호환 창으로 검토하고 response의 minClientVersion으로 너무 오래된 클라이언트 쓰기를 막는다. 읽기 가능한 최신 데이터를 구형 클라이언트가 저장하며 새 필드를 삭제하는 사고를 예방한다. DB migration은 expand→backfill→검증→contract 순서, 단계별 rollback와 백업을 둔다. revision snapshot마다 schemaVersion이 있어 과거 복구 시 해당 버전 migrator를 적용한다.

## 복구와 삭제

import는 새 프로젝트를 만드는 것이 기본. 기존 map 복원은 별도 명시적 작업이며 이전 revision 보존 후 새 revision 생성. snapshot 원문을 “현재 revision번호”로 바꿔치기하지 않는다. export/import 왕복은 ID 재매핑을 제외한 의미적 동등성으로 검사한다. 전체 DB 복원은 개별 map 복원과 다르며 사용자 접근 중지·복원 대상 검증·공유 토큰 재해지·복원 이후 쓰기 대사 절차가 필요하다.

초안은 IndexedDB에 mapId+account/workspace 식별자로 분리하며 로그아웃 시 남은 초안 처리 안내. 다른 계정 로그인에 초안이 섞이지 않아야 한다. 저장 실패/초과용량에서 메모리 상태를 보존하고 다운로드 대안을 제공한다.
