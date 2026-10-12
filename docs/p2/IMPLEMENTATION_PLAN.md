# P2 구현 계획

사용자 승인 증거: 2026-10-10 KST “검수완료했어 … 다음 작업 진행해줘”. P0/P1 검수 완료 및 P2 착수 지시로 기록한다. 문서 보존본의 이전 “검수 대기/P2 금지”는 당시 상태이며 이번 명시 지시로 갱신한다. D-01~03의 기술 확정은 여전히 후속 Spike 조건부다.

P2.0 기반·권리·계약 → P2.1 CRUD → P2.2 그룹/관계 → P2.3 이력/키보드 → P2.4 로컬 저장 → P2.5 검증/납품. 각 단계 착수/종료를 PROGRESS에 기록한다. 독립 폴더에서 원본 변경 없이 작업한다. 라이선스 미확인 Flow/RWA 원본은 참고만 하고 새 코드로 구현한다.

UI → 단일 command/history → 검증된 Map 모델 → 로컬 저장소로 경계를 분리한다. React Flow의 화면 위치·선택 이벤트를 UI 상태와 도메인 명령으로 변환한다. 드래그 도중은 임시 위치, 종료 시 단일 명령이다. 모든 편집은 검증 후 commit하며 실패하면 기존 맵/이력을 보존한다.

검사: Node 내장 테스트로 모델/반례, Playwright로 실편집·새로고침·반응형, 500/1000 fixture 선택 p95·프레임·JS heap 실측. 실제 인증·API·DB·서버 CAS·결제·배포·P3 도메인 CRUD는 금지한다.

명령: npm ci / npm run dev / npm test / npm run build / npm run test:e2e / npm run test:performance. Node22.18 이상. 브라우저 실행 파일은 CHROMIUM_PATH 환경변수 또는 Playwright 설치 경로.
