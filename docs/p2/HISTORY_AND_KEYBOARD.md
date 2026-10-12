# 이력·키보드 계약

편집은 execute/validateMap을 거친 commit 한 건이다. Inspector 내용 적용/위치 적용/크기 적용은 각각 한 명령. 그룹 해제 및 여러 요소 삭제는 각각 한 번에 되돌린다. React Flow 드래그 중 위치는 렌더러에서만 관리, 종료 시 최종 상대좌표들을 move 한 건으로 반영한다. 동일내용 no-op은 추가 이력 없음. Undo 후 새 편집은 redo 분기를 폐기한다.

이력은 맵 snapshot을 공유하며 불변으로 취급한다. past/future 각 최대80개, 각 직렬화 UTF-8 예산16MiB로 오래된 항목을 버린다. 현 문서·UI·JS 런타임 객체 오버헤드는 이 예산 밖이다. 이력은 새로고침 시 사라진다. UI 선택/검색/필터/뷰포트는 이력에 포함하지 않으며 삭제된 선택은 정리한다.

Ctrl/Cmd+Z Undo, Ctrl/Cmd+Shift+Z 및 Ctrl/Cmd+Y Redo. Delete/Backspace 삭제 확인, Esc 선택 해제. 노드 초점에서 방향키10px, Shift+방향키50px. React Flow 기본 화살표 이동은 꺼서 단일 도메인 명령으로 처리한다. Enter/Space 선택·Tab 초점은 React Flow 기본 접근성을 이용한다. 목록의 체크박스·선택 버튼 및 Inspector의 좌표/그룹/크기 폼으로 포인터 대체 작업을 제공한다.

input/textarea/select/role=textbox/isContentEditable, compositionstart~end, KeyboardEvent.isComposing, keyCode229, 열린 모달에서는 전역 편집 단축키를 실행하지 않는다. 합성 composition 이벤트와 실제 브라우저 텍스트 CtrlZ를 검사한다. 운영체제 한국어 IME 조합·스크린리더 음성 출력은 미검증이다.
