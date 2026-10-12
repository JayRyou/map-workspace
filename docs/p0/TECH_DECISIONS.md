# 결정 상태 안내

D-01~03은 잠정 결정이며 최종 확정이 아니다. 아래 원문 제안은 이 문서 말미의 보완 기준으로 구체화한다.

# 기술 결정 기록

“상위 규칙 확정”과 “P0 권장안”을 구분한다. 아직 사용자가 P0를 승인하지 않았다.

|ADR|주제|결정 제안|이유·포기하는 점|상태/후속|
|---|---|---|---|---|
|01|제품/범위|MAP Workspace,범용MAP,정적front+serverless|상시규칙 우선; 프롬프트임시명충돌 기록|상위규칙 확정|
|02|프론트|React+TS+Vite+React Flow|Flow 자산 재사용; 직접SVG 자유도 일부포기|승인 제안,P2검증|
|03|저장모델|관계형catalog+boundedmapaggregate|원자성·단순읽기; 세밀동시편집포기|승인 제안,P3/P4|
|04|인프라|CFWorkersPaid+D1,staticassets|SQL/요금단순; DB10GB/쓰기한계·공급자2개|우선권장,P4spike후확정|
|05|인증|Cognito Essentials+SES,codePKCE,BFFsession|자체비밀번호금지; 관리형 한국어 로그인; Lite보다 유료 MAU 단가 높음|승인 제안, P4 검증|
|06|충돌|maprevisionCAS+초안보존|CRDT보다단순; 동시에다른노드편집해도충돌|승인 제안|
|07|일반관계|순환허용,taskDAG분리|아키텍처표현가능; domain검증추가|승인 제안|
|08|명부|RosterPerson과User분리|기존비회원배정보존; 계정연결UI필요|승인 제안|
|09|공유|private기본,read-onlysnapshotlink|유출범위제한; 수정후명시갱신필요|승인 제안|
|10|history|revision마다증가,제한된snapshot보존|복구·비용균형; 모든중간상태무기한아님|승인 제안,P7요금|
|11|백업|D1TimeTravel+R2일별7본|운영복구·내보내기; 계정전체재해방어한계|P8복원전UNVERIFIED|
|12|AI|Markdownexport만필수|외부AI비용/자동실행없음|상위규칙 확정|

## P0에서 승인받을 사항

1. Must/Should/Later 경계와 3~4인 베타 우선순위.
2. MAP 공통 모델, 결정/업무 분리, 명부/계정 분리, 맵 단위충돌 방식.
3. CF 권장안 및 Cognito 두 공급자 사용 허용. 대안은 AWS 단일 공급자. P1은 provider중립 설계가 가능하지만 P4 전에는 선택이 필요하다.
4. Free에도4인편집 허용,공유snapshot 정책,저장/이력 상한은 상품 검증 가설로 유지할지.
5. 30일휴지통·7본백업·플랜이력 정책과 국내 대상 서비스의 데이터 위치 검토 착수.

## P1 진행을 막지 않는 보류와 막는 조건

가격 최종값·실제결제사·리전·도메인은 P7/P4/P9 이전에 정하면 된다. 반면 P0 범위·IA 기본 사용자 흐름을 승인하지 않으면 P1 작업을 시작하지 않는다. 원본 상용재사용권과 RWA실데이터는 P2/P3 이전 조건. P4의CAS/세션/spike실패는 인프라 재결정 조건이다.


## 2026-10-10 결정 보완 기준

D-01/D-02/D-03은 **잠정 결정(프로토타입·Spike 검증 전)**이다. P0의 최종 상태는 **보완 완료 / 외부 검수 대기**이며 최종 PASS가 아니다. 사용자의 이번 요청 “P0 프롬프트 확인해서 작업 진행 / P1 프롬프트 진행 / 진행상황을 나눠서 진행”은 P0 보완 후 **P1 정적 디자인 작업 착수에 대한 직접 지시**로 기록한다. 이는 P0 기술 확정이나 외부 검수 PASS를 대신하지 않는다. P0 보완 패키지를 먼저 동결한 뒤 P1을 별도 단계로 수행하며 P2는 금지한다.

### D-01 — Cloudflare + Cognito
- 결정: Static Assets/Workers Paid/D1 + Cognito Essentials, OAuth Authorization Code + PKCE를 잠정 채택. BFF 세션은 검토안.
- 대안: AWS S3/CloudFront/Cognito/API Gateway/Lambda/DynamoDB 단일 공급자.
- 이유: 정적 배포와 SQL 관계 모델, 초기 운영 복잡도/비용을 함께 고려.
- 위험: JWKS/issuer/token_use/client_id 검증, 공급자 간 장애, 쿠키/CORS/domain/CSRF, logout/session 폐기·계정 차단·권한 회수, 한국어 메일/오류, 요금 변화와 저장 위치.
- 확정 게이트: **P4 진입 전 Spike**에서 code+PKCE/callback/session/logout/차단, 실제 atomic CAS+quota경쟁, static/API 배포경로·SPA fallback, 비용/한국 접속 지연을 검증. 실패 시 AWS 단일안으로 ADR 재결정. 자원 생성/비용은 해당 단계 승인 후.
- 미확정: 운영 리전, 최종 가격, 법적 요건. P1은 공급자 중립 화면이다.

### D-02 — 맵 Revision/CAS
- 결정: baseRevision+mutationId, 원자적 조건부 저장. 같은 revision 경쟁은 성공1건/4091건.
- 대안: CRDT/자동병합(Later), 무조건 last-write-wins(데이터 유실 때문에 제외).
- 이유: 3~4인 협업에서 작은 구현으로 충돌을 드러내고 초안을 보존.
- 위험: 응답 유실/중복 재시도, 저장 중 후속 수정, offline, role 회수/logout, SQL update0건 후 다른 행 commit.
- 확정 게이트: P1 화면 수용 기준 P1-AC02, P4 실제 경쟁/장애 주입 테스트. 일반 그래프 순환 허용, task predecessor만 DAG.

### D-03 — 비공개 및 공개 스냅샷
- 결정: workspace/project/map 기본 비공개. 초대 회원은 서버 역할 검사. 비회원은 별도로 발행한 읽기 snapshot만 접근.
- 대안: live 원본 공개(의도치 않은 갱신/누출 위험으로 제외), 외부 공유 전면 금지(검토 흐름 저해).
- 이유: 공개 범위를 명확히 하면서 협업과 외부 검토를 구분.
- 위험: 민감 metadata 포함, 토큰 유출/캐시잔존, 초대와 공유 혼동.
- 확정 게이트: P1-AC03 공개 preview·해지/만료 표현, P5 서버 projection/권한/revocation 부정 테스트. 검색엔진 noindex, Referrer-Policy:no-referrer, 기본 공개 필드 allowlist. 원본 변경은 자동 갱신하지 않음. 무료/유료 공유 제한은 가설.
