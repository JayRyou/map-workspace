# 디자인 방향 및 실제 제품 참고

2026-10-09 공식 제품 문서/저장소 조사. 로그인한 실제 서비스의 전 화면을 직접 실사용한 결과는 아니며 아래는 공개 기능/문서에 근거한 설계 참고다. P1에서 화면 이미지·실제 흐름·접근성 검토를 보강한다. 이번 P0에서는 UI나 디자인 토큰 코드를 구현하지 않았다.

|제품·공식 자료|관찰 가능한 특징|채택할 원리|복제하지 않을 것|
|---|---|---|---|
|[Linear Display options](https://linear.app/docs/display-options)|목록/보드의정보·그룹·정렬을설정하며개인설정과workspace기본값분리|정보밀도조절,개인필터와공유데이터분리|이슈관리중심홈/브랜드색/화면외형|
|[FigJam Connectors](https://help.figma.com/hc/en-us/articles/1500004414542-Create-diagrams-and-flows-with-connectors-in-FigJam), [Sections](https://help.figma.com/hc/en-us/articles/4939765379351-Organize-your-FigJam-board-with-sections)|연결선의방향·스타일,구역별보드정리|관계방향과그룹의공간구조|장식스티커/게임/워크숍도구전체|
|[React Flow Sub Flows](https://reactflow.dev/learn/layouting/sub-flows)|parentId와상대좌표,부모/자식배치·상호작용|그룹좌표모델과controlledgraph기반|예제UI그대로,Pro전용예제무단복제|
|[Excalidraw 공식 저장소](https://github.com/excalidraw/excalidraw)|화이트보드·JSON저장·Undo/Redo·선택/편집도구|작업도구집중,내보내기/복원·회수가능성|손그림폰트/불규칙선/브랜드외형|

위 관찰에서 도출한 MAP Workspace의 선택은 우리 제품 요구에 대한 추론이다. 레퍼런스 제품의 현재 기능을 모두 구현하겠다는 약속이 아니다.

## 시각적 방향

중립 배경, 얇은 경계선, 제한된 강조색, 안정적인 한글 타이포를 사용한다. 노드는 제목+유형+필요한상태/담당자만 보여주고 긴맥락은Inspector로 옮긴다. 그룹은배경면·제목·경계로구분하며채도가높은큰영역을피한다. 선택/hover/편집가능handle이 명확해야 한다.

P1이 확정할 토큰: font/body/caption/heading, spacing4/8/12/16/24기반, border/surface/text/focus/semantic colors, radius4~8px, elevation 최소화, node폭/높이·edgehitarea·패널크기. 이는 후보범위이지이번에구현한디자인시스템이아니다. light mode를 먼저 완성하고 dark mode는Should가아닌추가검토로 남긴다.

## 금지 기준

무의미한 KPI카드·장식 Hero·반복그라데이션·글래스/글로우·과한모서리라운드·낭비되는패딩·캔버스를줄이는장식패널을사용하지 않는다. 색상·모션·그림자가 편집상태나관계를설명하지못하면제거한다. 이모지로전문업무정보의의미를대체하지 않는다.

## P1 제출 화면

빈맵/채워진맵,노드/연결/그룹선택,결정/업무연결,저장실패/오프라인/충돌,viewer,초대/공유preview,import오류,export범위,프로젝트보관/휴지통,390px모바일조회. 대표1440px과390px을 기본으로 하고768/1920은반응형규칙 검증용. 각화면은실제예시데이터와명확한상태를가지며내용없는카드로평가하지않는다.

P1 승인 기준은 UX_PRINCIPLES와 ROADMAP의 명세다. 외형 미관만으로 PASS를 주지 않고 과업 수행·관계가독성·저장신뢰·권한이해를 함께 평가한다.
