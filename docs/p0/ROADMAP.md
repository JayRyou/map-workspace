# 결정 상태 안내

D-01~03은 잠정 결정이며 최종 확정이 아니다. 아래 원문 제안은 이 문서 말미의 보완 기준으로 구체화한다.

# P1~P9 실행 계획

모든 파일 경로는 **예상 신규 구조**다. 현재 구현된 파일로 오인하지 않는다. P0만 수행했으며 P1 이후는 대기다. 한 번의 Work는 한 페이즈, 사용자와 별도 검수자의 승인 전 다음 페이즈 금지. Gate A=P0~P3, Gate B=P4~P6, Gate C=P7~P9. 난이도는 상대값이며 납기 약속이 아니다.

## P1 — MAP 중심 UI/UX 통합 설계

1. **목표:** 편집 엔진 구현 전에 구조·용어·상태·작업 흐름을 검수 가능한 화면 설계로 확정한다.
2. **범위:** 공식 실제 제품 레퍼런스 보강, IA, 디자인 토큰 명세, 1440/390px 와이어프레임과 핵심 화면 상태. 그래프 엔진/인증/API 구현은 제외.
3. **선행 조건:** P0 범위·모델·UX 방향 검수 승인; 대표 사용자/테스트 맵 샘플 확인. 인프라 최종값은 중립적으로 설계 가능하나 인증 한국어 UX 제약 표시.
4. **구현 기능(설계 산출물):** P1.1 레퍼런스4종과 채택/배제 근거, P1.2 navigation/Inspector/state flow, P1.3 tokens/component states, P1.4 화면 검토 및 수정. 자세한 목록은 아래 P1 명세.
5. **예상 파일:** `docs/p1/RESEARCH.md`, `IA.md`, `TOKENS.md`, `COMPONENT_SPEC.md`, `WIREFRAMES.md`, `STATE_FLOWS.md`, `REVIEW.md`, `design/p1/*.svg` 또는 동등한 검수용 이미지. 루트 진행·QA·인수인계 갱신.
6. **완료 기준:** 모든 Must의 진입점·권한·실패/빈상태 존재, 데스크톱맵60%+, 상태/업무 의미 구분, 409 해결/초안 회수 이해 가능. 와이어프레임 링크/상태표 누락0.
7. **테스트 계획:** 3~4인 시나리오 워크스루; 참여자 없으면 분석자 점검과 사용자시험 UNVERIFIED를 분리. 키보드순서/200%확대/명암 대비 수치 점검. 390/768/1440/1920 구조 검토.
8. **위험:** 보드/업무 대시보드로 회귀, Inspector 과밀, 한글 길이, Cognito Essentials 화면 제약. 디자인에 API구현이 이미 있다고 표시하지 않는다.
9. **난이도:** 중. 인증 제공자 한글화 요구가 바뀌면 상.
10. **승인 필요:** IA/토큰/주요 화면·범용성·AI 밤티 배제 기준 사용자+검수자 승인. P2 시작은 별도 게이트.

### P1 즉시 착수 명세

|작업|입력|구체적 산출물|검수 질문|
|---|---|---|---|
|P1.1 레퍼런스|P0 DESIGN_DIRECTION|공식URL/조사일/화면근거/채택원리/비채택 각4종|외형 복제가 아닌 과업 근거인가?|
|P1.2 IA|REQ-01~10,US-01~11|route·역할·상태·행동 매트릭스와 용어집|첫 맵/공유/복구에 끊긴 경로 없는가?|
|P1.3 토큰|중립 업무도구 방향|한글 font scale,spacing,color,focus,radius,layer 명세|색만으로 상태 구분하지 않는가?|
|P1.4 맵 셸|빈 맵/소형 실제 예시|sidebar/topbar/canvas/Inspector 1440px|캔버스가 주인공인가?|
|P1.5 맥락|node/edge/group/decision/task|각 선택상태 Inspector,관련항목 이동|결정과 업무를 혼동하지 않는가?|
|P1.6 저장 상태|clean/dirty/saving/error/offline/conflict|6상태+권한회수 문구·행동·전환표|성공/오프라인/충돌을 사실대로 표시하는가?|
|P1.7 협업/데이터|roles/import/export/share|초대/권한/공개범위/복원/Markdown preview|비공개 데이터 유출 위험을 설명하는가?|
|P1.8 반응형/접근성|390/768/1440/1920|모바일조회·목록 대안·포커스·대비 보고|드래그나 hover 없이 과업이 가능한가?|
|P1.9 리뷰|US-01~11|문제 우선순위·수정전후·미검증 목록|Critical/Major 미해결 없이 설계 승인 가능한가?|

P1 비목표: 노드 CRUD 프로덕션 구현, 저장 어댑터, 데이터 변환 실행, backend/auth 인프라, 실제 결제/배포. 프로토타입 표현이 필요하면 모의 데이터와 비작동 저장/권한 상태임을 표시한다.

## P2 — MAP 편집 엔진

1. **목표:** 범용 노드·그룹·연결 편집과 관계 탐색, 로컬 왕복을 검증한다.
2. **범위:** 엔진/command/UndoRedo/selection/viewport와 로컬 map fixture. 프로젝트 서버·인증은 제외.
3. **선행 조건:** P1 승인, 재사용 라이선스/권리 확인, P0 Map schema 및 graph 정책 합의.
4. **구현 기능:** P2.1 common renderer/CRUD, P2.2 group좌표/edge관계, P2.3 UndoRedo/인접탐색, P2.4 대형 fixture/키보드. 한 단계 완료 후 다음 하위 작업으로 진행.
5. **예상 파일:** `src/domain/map.ts`, `graph/commands.ts`, `graph/history.ts`, `components/map/*`, `tests/map-domain.test.ts`, `tests/map-editor.e2e.ts`.
6. **완료 기준:** 노드/그룹/edge 생성·수정·삭제·undo/redo·위치 복원; 삭제 참조 유실0; 일반 cycles 허용; 크기 상한 안내; 임시로컬저장·복원 동작.
7. **테스트 계획:** node삭제영향/group해제좌표/중복edge/undo묶음/IME/keyboard,500노드1000edge 선택p95·프레임/heap 측정. 성능조건 기록.
8. **위험:** stage DAG를 전체에 적용, render storm, 좌표이중이동, history memory, 유료예제 라이선스.
9. **난이도:** 상.
10. **승인 필요:** 편집성과성능·접근성·시각회귀 검수; P3 진행승인.

## P3 — 프로젝트 및 도메인 관리

1. **목표:** 프로젝트/다중맵/결정/업무/명부와 데이터 이동을 정합하게 완성한다.
2. **범위:** 로컬 계층과 import/export/legacy migrator, 보관/휴지통. 실제 서버 권한은 P4/P5.
3. **선행 조건:** P2 승인, RWA 운영 state와 대응 HTML 버전 확보 또는 누락 배정을 UNVERIFIED로 유지하는 검수 합의.
4. **구현 기능:** P3.1 project/mapcatalog, P3.2 Decision/Task/Roster, P3.3 asyncrepository+IndexedDBdraft, P3.4 strictschema·두포맷migration·JSONpreview.
5. **예상 파일:** `src/domain/project.ts`, `context.ts`, `task.ts`, `roster.ts`, `schema/*`, `repositories/local.ts`, `migrations/legacy/*`, `components/inspector/*`.
6. **완료 기준:** US-01/02/08/09 로컬범위 통과, 결정/업무 분리, import non-destructive, 미래schema거부, export왕복 의미유실0.
7. **테스트 계획:** 원본/변환count·참조·한글왕복, 악성import/상한, 저장quota/다중탭, 삭제·복원·명부archive, migration재시도.
8. **위험:** 실데이터누락, stage삭제업무손실승계, roster이름기반권한오인, schema1포맷충돌.
9. **난이도:** 상; migration은 별도 하위 검수.
10. **승인 필요:** Gate A 제품핵심·마이그레이션경고 수용·로컬데이터보존 승인. Gate B/인프라 비용은 다음 승인.

## P4 — 인증 및 서버리스 저장

1. **목표:** 계정별 격리와 서버 저장/충돌/복구가 가능한 개인 SaaS 기반.
2. **범위:** auth/session, serverAPI, DBschema, membership검사, CAS/usage, 저장retry. 팀 초대UI는 P5.
3. **선행 조건:** P3/Gate A 승인, 공급자·리전/데이터위치·예산·Cognito Essentials 한글UX·SES production 접근 승인. 유료 자원 생성 전에 구체적 IaC 계획 검토.
4. **구현 기능:** P4.1 CAS+quota경쟁 spike, P4.2 signup/login/reset/session, P4.3 APIrepository·draftsync, P4.4 409resolver·snapshots·운영로그. spike실패 시 architecture ADR 재승인.
5. **예상 파일:** `api/auth/*`, `api/policies/*`, `api/maps/*`, `db/migrations/*`, `src/repositories/remote.ts`, `sync/*`, `infra/*`, `tests/api-isolation/*`.
6. **완료 기준:** 서로다른계정 데이터0노출, samebase동시저장한개성공, 서버실패/오프라인초안유지, auth로그아웃/해지실효, 추적가능한saveack.
7. **테스트 계획:** 실제staging 두계정IDOR,expiredJWT,CSRF,body/quota,DB일시실패,응답유실mutation재시도,request중재편집,한국지연,usage미터/비용.
8. **위험:** D1 batch업데이트0의침묵성공, 클라이언트role신뢰, Session/refresh암호화실패, 공급자기본tier요금변경.
9. **난이도:** 상.
10. **승인 필요:** 유료환경/IaC 적용, 보안·충돌·리전지연 검수, P5진행승인. 운영배포는 아직아님.

## P5 — 협업 및 공유

1. **목표:** 3~4인 팀이 권한에 따라 공동 맵을 관리한다.
2. **범위:** 초대·수락·취소·역할·소유권이전·공개읽기snapshot·감사. CRDT/실시간커서 제외.
3. **선행 조건:** P4 격리/CAS 승인, 역할표·공유범위정책 확정.
4. **구현 기능:** P5.1 프로젝트멤버, P5.2 초대token/이메일, P5.3 role회수/ownership, P5.4 shareprojection/revoke.
5. **예상 파일:** `api/invitations/*`, `api/shares/*`, `api/members/*`, `components/collaboration/*`, `tests/team.e2e.ts`.
6. **완료 기준:** US-03/04/06/11통과, viewer쓰기403,초대재사용불가,해지링크즉시차단,마지막owner제거불가.
7. **테스트 계획:** owner/editor/viewer/outsider4브라우저,동시수락좌석race,만료·타이메일·발급자권한회수,공유private필드누출,소유권이전트랜잭션.
8. **위험:** 프로젝트권한상속오해, 링크캐시잔존, 초대token로그, 멤버권한회수후session접근지속.
9. **난이도:** 상.
10. **승인 필요:** 3~4인 공동관리 검수, 공개읽기범위/유출안내 확인, P6진행승인.

## P6 — Markdown 컨텍스트 내보내기

1. **목표:** 사용자 선택을 정확한 이동가능 컨텍스트로 만든다.
2. **범위:** 선택0/1hop확장, 관계/설명/결정/업무,preview·복사·파일,작업지시패키지. 외부 AI실행없음.
3. **선행 조건:** P5 승인, export권한·공개projection 확정.
4. **구현 기능:** P6.1 selectionresolver, P6.2 deterministicMarkdownserializer, P6.3 preview/범위경고/작업지시템플릿.
5. **예상 파일:** `src/export/context.ts`, `markdown.ts`, `components/export/*`, `tests/context-export.test.ts`.
6. **완료 기준:** 방향/ID/decisionrationale/업무 누락0,선택밖private데이터0,한글/코드펜스/링크정상,모델API의존없음.
7. **테스트 계획:** 순환그래프hop제한,경계edge,삭제노드,공유viewer,악성Markdown/내장지시문,동일입력동일출력,긴본문크기.
8. **위험:** 암묵적전체맵export, scope확장누출, 코드펜스깨짐, 사용자텍스트를시스템지시로오인.
9. **난이도:** 중.
10. **승인 필요:** Gate B 로그인/공동저장/컨텍스트이동 시나리오 검수; P7 상용준비 승인.

## P7 — 수익화 기반

1. **목표:** 요금/제한/결제상태가 서버권한과일치하는상용준비.
2. **범위:** 플랜·usage·sandboxcheckout/webhook·좌석변경·해지/실패정책·운영/법적전제. 실제판매는별도승인.
3. **선행 조건:** Gate B 승인, 가격인터뷰·판매지역·사업자/세금/결제사 검토, provider승인/샌드박스계정.
4. **구현 기능:** P7.1 entitlementpolicy, P7.2 원자quota, P7.3 sandboxbilling, P7.4 개인정보/이용/환불/지원·삭제운영안.
5. **예상 파일:** `api/billing/*`, `domain/plans.ts`, `usage/*`, `components/billing/*`, `docs/operations/policies/*`.
6. **완료 기준:** 서버제한UI일치,중복/역순webhook정합,다운그레이드데이터회수가능,법적/운영전제 미확정항목명시.
7. **테스트 계획:** sandbox성공/실패/재시도/부분환불정책/좌석증감/해지예약/초과quota동시쓰기,live키미사용.
8. **위험:** 상품가설을확정판매로오해, 클라이언트success권한상승, 세금/국외이전/개인정보정책누락.
9. **난이도:** 상,외부사업자조건영향.
10. **승인 필요:** 가격·판매약관·결제사·개인정보·운영책임자,샌드박스검수. 실결제는별도명시승인.

## P8 — 통합 QA·보안

1. **목표:** 기능·권한·경쟁·복원·운영을통합검증하여출시차단결함0.
2. **범위:** 전체회귀,threatmodel부정테스트,performance,dependency/license,backuprestore,releasecandidate검증.
3. **선행 조건:** P7 승인,staging실환경·테스트계정·원본migrationfixture·구체부하목표.
4. **구현 기능:** P8.1회귀, P8.2권한/경쟁/남용, P8.3복원/성능/접근성, P8.4결함수정재검증·RC고정.
5. **예상 파일:** `tests/integration/*`, `tests/security/*`, `tests/load/*`, `docs/qa/P8_REPORT.md`, `docs/operations/RESTORE.md`.
6. **완료 기준:** Critical0/Major0,확인된회귀0,US-01~11통과,백업복구RPO/RTO실측·허용범위,검증불가항목출시영향명시.
7. **테스트 계획:** 다계정·다탭·네트워크절단·과금시뮬레이션·초대/링크철회·DB복원후철회재적용·500노드부하·직접API공격입력.
8. **위험:** 단위테스트통과를tenant보안통과로오인,fixture가작음,종속성알림누락,전체복원후권한되살아남.
9. **난이도:** 상.
10. **승인 필요:** 독립검수자의출시적합성판정과사용자RC승인. 남은Major를CONDITIONAL로우회해배포하지않음.

## P9 — 베타 출시 및 운영

1. **목표:** 승인된 RC를 배포하고 실제핵심흐름·복구·관측가능성을확인한다.
2. **범위:** 정적front/API배포,DNS/TLS,secret,예산/오류알람,runbook,베타온보딩·rollback. 대중홍보/메일발송은명시승인필요.
3. **선행 조건:** P8 PASS,Critical/Major0,운영도메인·지역·요금재조회·개인정보/환불정책,운영자/당직담당,사용자배포승인.
4. **구현 기능:** P9.1 배포계획·dryrun, P9.2승인후prodapply, P9.3로그인/저장/공유/복원smoke, P9.4운영가이드·관측·handoff.
5. **예상 파일:** `infra/prod/*`, `docs/operations/DEPLOY.md`, `RUNBOOK.md`, `ROLLBACK.md`, `BETA_REPORT.md`.
6. **완료 기준:** HTTPS/캐시/권한/모니터링 정상,3~4인베타핵심시나리오,배포버전/백업/rollback재현,운영책임자확인.
7. **테스트 계획:** production비파괴smoke,비로그인거부,다계정접근,링크해지,새revision저장,예산/오류테스트이벤트,되돌리기훈련.
8. **위험:** devsecret반입, SPAfallback으로API오류숨김, 새로그요금·무료한도소진, 운영역할부재.
9. **난이도:** 중~상.
10. **승인 필요:** 구체배포diff·예상월비용·도메인·공개범위·실판매여부최종승인; Gate C 판정.


## 2026-10-10 결정 보완 기준

D-01/D-02/D-03은 **잠정 결정(프로토타입·Spike 검증 전)**이다. P0의 최종 상태는 **보완 완료 / 외부 검수 대기**이며 최종 PASS가 아니다. 사용자의 이번 요청 “P0 프롬프트 확인해서 작업 진행 / P1 프롬프트 진행 / 진행상황을 나눠서 진행”은 P0 보완 후 **P1 정적 디자인 작업 착수에 대한 직접 지시**로 기록한다. 이는 P0 기술 확정이나 외부 검수 PASS를 대신하지 않는다. P0 보완 패키지를 먼저 동결한 뒤 P1을 별도 단계로 수행하며 P2는 금지한다.

## 결정 ↔ P1 수용 기준 양방향 추적

|결정|P1 기준|프로토타입/문서|실제 확정 테스트|
|---|---|---|---|
|D-01|P1-AC01 공급자 중립 가입/로그인·오류·로그아웃·차단|계정 화면/STATE_FLOWS/USER_FLOWS|P4 진입 전 PKCE·BFF·cookie/CORS·차단·배포/비용 Spike|
|D-02|P1-AC02 저장6상태+회수,서버최신본/내초안분리,재시도조건|상태 선택기/충돌 패널/STATE_FLOWS|P4 samebase경쟁·mutation중복·후속dirty·offline/회수/logout|
|D-03|P1-AC03 초대와공개snapshot 구분,preview·만료·해지|팀초대/공개snapshot/공개읽기 화면|P5 projection·역할·해지·만료·캐시 부정 테스트|

P1-AC01→D-01, P1-AC02→D-02, P1-AC03→D-03의 역방향도 위 행과 같다. 세 화면의 클릭 시뮬레이션은 실제 보안/서버저장 검증을 대신하지 않는다.

P1은 첨부 P1 프롬프트의 P1.1~P1.9를 따르며 정적 HTML/CSS/JS/SVG 클릭 데모를 포함한다. P4 진입 전 Spike를 먼저 검수하고 실패하면 공급자안을 재결정한다. P2 실제 엔진은 이번 요청에서 금지한다.
