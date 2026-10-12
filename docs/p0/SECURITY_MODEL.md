# 결정 상태 안내

D-01~03은 잠정 결정이며 최종 확정이 아니다. 아래 원문 제안은 이 문서 말미의 보완 기준으로 구체화한다.

# 보안·권한·복구 설계

설계 명세이며 구현된 보안 인증이 아니다. 서버를 신뢰 경계로 삼고 모든 객체 접근을 검증한다. 참고: [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [Cognito JWT 확인](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html), 조회2026-10-09.

## 역할 매트릭스

|동작|Workspace owner/admin|Project owner|Project editor|Project viewer|공유 방문자|
|---|---|---|---|---|---|
|지정 프로젝트 맵 읽기|허용|허용|허용|허용|published snapshot만|
|맵/노드/업무/결정 저장|허용|허용|허용|거부|거부|
|맵 휴지통/복구|허용|허용|허용|거부|거부|
|프로젝트 보관/삭제·멤버 초대|허용|허용|거부|거부|거부|
|읽기 공유 생성/해지|허용|허용|거부|거부|거부|
|워크스페이스 멤버·정책 관리|허용|거부|거부|거부|거부|
|워크스페이스 소유권 이전/삭제|owner만|거부|거부|거부|거부|
|결제·좌석 계약 변경|owner만|거부|거부|거부|거부|
|개인 JSON/Markdown export|권한 내 허용|허용|허용|허용|공개 projection만|

Workspace member는 프로젝트 생성 가능하지만 다른 private project 접근권한을 자동으로 얻지 않는다. guest는 초대된 프로젝트만 접근한다. 모든 project member는 활성 WorkspaceMember이어야 한다. Workspace admin의 광범위 접근은 정책과 초대 안내에 명시한다. owner/admin role은 요청 payload로 수정할 수 없다.

## 요청 검증 순서

TLS→세션/토큰검증→account상태→서버에서 resource의 workspace/project 로드→활성 membership/역할→보관/삭제상태→schema/참조/플랜→CAS transaction→감사/응답. body.workspaceId/userId/plan을 신뢰하지 않는다. ID를 UUID로 만드는 것만으로 보안이 생기지 않는다. 목록·검색·export·revision·복구·공유 관리에도 같은 정책을 적용한다.

JWT 사용 시 signature/JWKS kid/허용alg/iss/exp/nbf/token_use를 검증하며 access token은 client_id, ID token은 aud를 대조한다. ID token을 resource API 권한 토큰으로 혼용하지 않는다. 자체 opaque session은 만료·해지 여부를 매 요청 확인하며 membership은 DB 현재값을 읽는다. 단순 JWT 오프라인검증만으로 사용자 차단·logout이 즉시 반영된다고 가정하지 않는다.

## 위협과 대응·검증

|위협|대응|필수 부정 테스트|
|---|---|---|
|타 사용자 프로젝트 조회(IDOR)|tenant 조건+membership, 목록 필터,404|A세션으로B의 map/revision/export ID 조회 모두 거부|
|권한 없는 수정/삭제|서버 role 검사, actor는 session에서 도출|viewer가 curl로PUT/DELETE/restore 호출→403|
|클라이언트 권한 우회|UI disable과 별도 서버 정책|payload role/admin·workspaceId 변조가 효과 없음|
|초대 링크 악용|256-bit 무작위 token hash 저장,7일 만료,1회,verified email 일치|재사용·타계정·만료·초대자권한회수·seat경쟁 거부|
|공개 링크 유출|기본off, 읽기만, revoke/expiry, 공개 projection whitelist|token으로private API·roster email·과거revision 접근 불가|
|JSON 악성 입력|strictschema·depth/bytes/arraylimit·safeprojection|prototype키·HTML/id/style주입·거대한payload·foreignref 거부|
|XSS/HTML|React text rendering, rawHTML금지, Markdown sanitize, CSP|설명·label·property·import값 스크립트 미실행|
|CSRF/session theft|HttpOnly/Secure/SameSite cookie,Origin/CSRFtoken,codePKCE+state/nonce|외부Origin write·재사용callback·로그아웃session 거부|
|API남용·메일폭탄|계정/IP/tenant rate limits,quota,bodylimit,backoff|429/Retry-After,초안 유지,읽기 회수 가능|
|데이터유실·경쟁|원자CAS·immutable revision·draft·idempotency·백업|동시동일base 한개성공,실패초안존속,재시도중복없음|
|관리계정오용|최소IAM·MFA·prod분리·승인된breakglass·감사|운영자기본권한으로DB덤프불가,권한상승기록|
|과금 권한위조|서명webhook·eventunique·순서정합·서버plan|위조/중복/역순event가entitlement훼손하지 않음|

## 공유와 export

공유 시 사용자가 선택한 공개 대상만 별도 immutable snapshot으로 생성한다. 기본 projection은 노드/연결/그룹/공개 설명이며 사람 이메일·내부 메모·비공개 결정·업무는 제외하고 추가 포함은 preview로 확인한다. 원본 변경이 자동으로 공개되지 않고 owner가 갱신한다. 토큰 원문은 생성 시1회 표시하며 로그에서 마스킹. 공유 페이지 Referrer-Policy:no-referrer, index 금지, 제3자 스크립트 최소화. 해지 상태 조회를 생략하는 CDN 장기 캐시 금지.

비공개 export도 현재 사용자 권한을 따르며 공유 링크의 scope로 전체 workspace export를 할 수 없다. Markdown 내 사용자 텍스트는 데이터 블록으로 출력하고 문서 내 지시문을 실제 도구 실행 명령으로 취급하지 않는다. 선택 관계를 확장할 때 권한 검사를 다시 한다.

## 데이터 손실 시나리오

A/B가같은revision편집→B409: 서버 최신본과 로컬 초안을 각각 보존. 응답 유실→재전송: mutationId로 같은 ack 반환. 요청 중 재편집→이전 ack: 뒤에 생긴 dirty 유지. offline→재로그인/권한회수: 저장 차단·초안 회수. DB복원→공유해지복구: 복원 이후 철회 이벤트 재적용 또는 전체 링크/session 회전. schema migration 실패: write freeze·snapshot rollback. quota 변경: 기존 읽기/export를 열고 증가 쓰기만 제한.

## 운영 복구

D1 Paid Time Travel30일을 기본 사고복구에 활용하고 일별 SQL/JSON export7본을 R2에 분리한다. 백업 작업 실패알람·hash/manifest·시크릿 제외·복원 연습을 P8에서 검증한다. 암호화 at-rest/transport를 확인하고 export 접근권한을 운영API와 분리한다. RPO24h/RTO4h 목표, 실제 복원 측정 전 SLA 미제공. 휴지통30일, 플랜별 version history, 백업 보존은 서로 다른 정책이다.

로그는 requestId/actor의내부ID/tenantID/operation/status/latency/bytes/revision 중심. 입력본문·password·token·링크secret·개인email 기록 금지. 기본 운영 로그7일(CF),감사90일,백업7본 정책은 P7 개인정보/탈퇴 정책과 맞춰 승인받는다. 국내 데이터 보관/국외 이전 법적 판단은 본 P0에서 확정하지 않으며 실제 서비스 지역·사업자 정보로 P7 전문 검토한다.


## D-01~03 보완

권한 이름의 계층을 유지한다: Workspace owner/admin, Project owner/editor/viewer. 명부 RosterPerson은 권한을 갖지 않는다. 초대 수락은 확인된 동일 이메일·활성 초대자 권한을 검사하고, 공개 snapshot URL은 초대 수락에 사용할 수 없다. 공개 snapshot의 민감 메타데이터(이메일/내부메모/비공개결정/서버ID)는 기본 제외한다. 해지/만료를 매 조회 확인하고 캐시가 우회하지 못하게 한다. noindex는 비밀 보호 수단이 아니며, 링크 유출 시 누구나 공개 snapshot을 볼 수 있음을 preview에 표시한다.
