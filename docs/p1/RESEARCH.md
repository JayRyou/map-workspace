# P1.1 제품·안티패턴 리서치

조사일 2026-10-10 KST. 아래 제품 기능은 공식 사이트/문서에 근거하며, P1의 채택 판단은 조사자의 해석이다. 타사 화면을 본 제품 이미지로 복제하지 않는다. 공식 문서의 화면 예시 링크를 제공하고, 실제 제작한 프로토타입의 캡처는 screenshots/에 별도로 둔다. 타사 로그인 세션을 통한 실사용 검증은 하지 않았다.

|제품/근거|확인한 패턴|우리 제품에 채택|배제|
|---|---|---|---|
|[Linear 표시 옵션](https://linear.app/docs/display-options), [Peek](https://linear.app/docs/peek)|개인 표시 옵션과 workspace 기본값 분리; 상세 preview/키보드 진입|맵을 유지한 Inspector, 개인 view 상태, 작은 도구|이슈 목록 중심 홈·브랜드 복제|
|[FigJam 연결선](https://help.figma.com/hc/en-us/articles/1500004414542-Create-diagrams-and-flows-with-connectors-in-FigJam)|방향과 connector style로 관계 표현|선택 대상과 연결 관계를 텍스트/선 강조|워크숍 스티커/장식성 카드|
|[React Flow sub-flows](https://reactflow.dev/learn/layouting/sub-flows)|parentId·부모 상대 좌표와 그룹|그룹/노드/연결 구분, 관계 탐색 설계|실제 React Flow 엔진 통합은 P2; P1은 SVG 샘플|
|[Excalidraw 공식 저장소](https://github.com/excalidraw/excalidraw), [편집기](https://excalidraw.com/)|캔버스 도구,UndoRedo,열린JSON포맷,화살표라벨|캔버스 중심,내보내기와 회수 가능한 데이터 경험|손그림 폰트·라이브 협업 구현|

## 표현 사용 맥락

- 한국어 ‘AI 밤티 디자인’: [도름 공개 게시물](https://dorms.school/board/p/781a36da-3517-42e7-a5ce-d9b1667d9c76)에서 과도한 그라데이션·이모지 등 반복적인 AI 디자인을 지적하는 구어적 표현으로 사용된다. 학술적 표준 정의나 정량 판별법으로 취급하지 않는다.
- 영어 ‘AI design slop’: [SmoothUI 작성자 글](https://smoothui.dev/blog/ai-design-slop)은 반복적이고 교체 가능한 UI의 예로 보라색 계열 그라데이션 등을 제시한다. 작성자의 비평/관찰이며 색 자체가 나쁘다는 보편 법칙은 아니다.
- ‘generic AI-generated UI’: [design-slop-cop 작성자 저장소](https://github.com/AdrianKrebs/design-slop-cop)는 여러 시각 패턴을 점검하는 도구 사례다. 해당 도구를 실행하거나 점수를 품질 보증으로 사용하지 않았다.

검색에서 찾은 의견과 검증된 제품 기능을 구분한다. 본 프로젝트의 배제 기준은 사용자 프롬프트와 업무 도구 과업에 근거한다. 중립색·사이드바만으로 좋은 디자인이 되지 않으며, 선택/관계/저장/권한의 이해 가능성을 함께 검토한다.
