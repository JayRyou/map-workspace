# 재사용·라이선스 감사

|출처/파일·함수|참고 또는 포함|결론|
|---|---|---|
|Flow src/components/Graph.tsx: Graph, changes, onNodeDragStop|controlled graph와 종료 이벤트 패턴 참고|원본 권리 불명확. 소스 복사0, 새 GraphCanvas 구현. 중복 move 호출 방지|
|Flow src/useWorkspace.ts·repository.ts·validation.ts|UI/저장 분리·오류 사례 참고|코드/legacy스키마/실데이터 포함0|
|RWA public/index.html: setPerson, idsByPerson, itemBtn, renderPerson 및 관계 강조|1-hop 관계 탐색 UX 참고|고정 산업 구조·사람 데이터·SVG 경로·서버 코드 복사0|
|P1 prototype/styles.css/index.html/app.js|색/3영역/목록·Inspector 설계만 재현|동일 작업에서 만든 디자인. P1 mock 이벤트와 JSON을 제품 모델로 사용하지 않음|
|Noto Sans KR 400/600|P1 로컬 woff2 포함|SIL OFL1.1 원문 public/fonts/LICENSE.txt|
|React/React DOM/React Flow|설치 패키지 기반 포함|MIT 원문과 transitive LICENSE를 public/licenses에 수집, attribution 유지|
|Vite/TypeScript/Playwright|개발·테스트 도구|MIT/Apache2 및 의존성 원문/버전 manifest 기록|
|아이콘·샘플|기본 문자/직접 작성 범용 샘플|외부 이미지·유료 예제·원본 RWA 데이터 사용0|

정확한 버전은 package-lock.json 및 public/licenses/manifest.json. 공식 React Flow 문서는 API 동작 확인용이며 유료 예제 코드를 복사하지 않았다. 기존 원본 재사용권은 후속 원본 이관 시 확인해야 한다. 기존 자료의 문서는 docs/p0,docs/p1 및 reference에 원문으로 보존했다. 미확인 원본 코드 자체는 신규 소스 ZIP에 포함하지 않는다.
