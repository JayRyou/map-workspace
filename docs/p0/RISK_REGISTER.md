# 결정 상태 안내

D-01~03은 잠정 결정이며 최종 확정이 아니다. 아래 원문 제안은 이 문서 말미의 보완 기준으로 구체화한다.

# 위험 및 미해결 사항

심각도는 제품을 공개 SaaS로 사용할 경우의 영향 기준. P0는 발견·설계 단계이며 원본 결함을 고치지 않았다. 우선순위와 “실제 결함/필수기능 격차/설계 불확실성”을 구분한다.

|ID|유형·심각도|근거/위험|대응·책임 페이즈|차단 게이트|
|---|---|---|---|---|
|L-01|기능격차 Major|두프로토타입계정/tenant격리없음;RWA읽기공개·공유키쓰기|serverauth+membership, P4보안담당|공개SaaS배포|
|L-02|기존결함 Major|RWA내부형식검증없음,import id/color HTML직접보간|strictschema·safeprojection·text rendering, P3/P4|외부데이터import/배포|
|L-03|기존결함 Major|RWA409→applyRemote 로컬초안교체|draft+명시적충돌해결, P4|공동편집출시|
|L-04|기존결함 Major|RWA손상state를빈상태로시작·후속저장가능|손상격리·writeblock·복원선택, P3/P4|운영데이터사용|
|L-05|기존결함 Minor|RWA백업파일명문자열정렬이v10/v2시간순서와다름|metadata시각/숫자revision정렬,기존코드는이번미수정|레거시서버계속운영시재검토|
|L-06|재사용제약 Minor|Flow동기LocalRepository를서버저장으로바로교체불가|async+error+revision계약, P3|P4연결|
|R-01|자료부족 높음|RWA운영people/assign없음,버전최신성불명|원본state/HTMLhash요청,P3 migrationowner|실데이터완전이관검수|
|R-02|라이선스 높음|제공코드상용권리·패키지NOTICE미확인|사용자권리확인·의존성LICENSE정리,P2|상용소스재사용|
|R-03|설계불확실 높음|D1조건부갱신0건에도batch후속문성공가능|CAS/usage/idempotency동시 저장 경쟁 spike,P4|server저장채택|
|R-04|확장 높음|단일D1DB10GB·쓰기처리량,대형JSON|5GB경보/7GB이행·workspace sharding계획,P4/P9|한계초과고객확대|
|R-05|가격 중간|MAU와저장수명불일치·snapshot/API증가|실usage계측·freeallowance확인·예산알람,P4/P9|운영예산승인|
|R-06|날짜 중간|2026-12-01 Workers Logs 가격변경예정|P9시공식요금재조회|출시비용견적|
|R-07|UX/인증 높음|한국어 Managed Login 지원은 확인, 실제 메일/오류/재설정 흐름 미실측|P1 경험 설계, P4 한국어 전체 흐름과 세션 검증|한국어가입출시|
|R-08|데이터위치 높음|한국사용자·국외저장/이전요건미확정|실영업지역/개인정보정책전문검토,P7|실사용자모집|
|R-09|운영 높음|백업존재와복원성공은다름,동일계정재해|P8복원훈련·철회대사·별도권한;외부backup추가검토|P9출시|
|R-10|보안 높음|공유projection설정오류로내부맥락노출|defaultdeny·snapshotpreview·부정테스트,P5/P8|공유기능출시|
|R-11|수익화 중간|플랜가격/좌석가치미검증|인터뷰·베타usage·sandbox,P7|실판매가격확정|
|R-12|사용성 중간|Inspector과밀·단계DAG범용맵강제|P1워크스루·P2cycle정책분리|P2시작/P8|

Legacy 항목의Severity는기존prototype목적전체를부정하는뜻이아니며상용SaaS전환차단요소다. L-02의HTML주입은정적경로확인으로,실제공격스크립트실행을재현했다고주장하지않는다.

P0 문서 자체의 확인된 Critical/Major는0이지만 legacy 공개 SaaS 전환 차단 Major4는열려있다. 따라서전체Critical/Major0·무조건PASS로표현하지 않는다. 미구현 SaaS 보안과운영은해당페이즈전까지UNVERIFIED다.


## 추가 위험과 확정 책임

|ID|위험|종료 게이트|
|---|---|---|
|D01-R1|공급자간 callback/JWKS/session·CORS·cookie 불일치|P4 진입 전 Spike, 실패 시 AWS 단일안 재결정|
|D02-R1|logout 이후 타계정 초안 노출/응답 유실 중복|P1 시나리오+P4 계정전환/중복/경쟁 실제 테스트|
|D03-R1|초대 링크를 공개 링크처럼 취급/원본 자동공개|P1 구분·P5 서버 projection 검사|

운영 리전/가격/법적 요건은 이번 보완에서 확정하지 않는다.
