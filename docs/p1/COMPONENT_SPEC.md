# 컴포넌트 명세

|컴포넌트|상태|행동|
|---|---|---|
|탐색버튼|default/hover/active/focus|선택화면 aria-current,명확한focus|
|맵노드|default/selected/related/dim/focus|button,Enter/Space로선택,관련선강조|
|관계선|default/selected/related|라벨button과요소목록대안|
|Inspector|node/edge/group/decision/task/readonly|선택제목/상태/관계/입력폼preview|
|상태바|clean/dirty/saving/error/offline/conflict/revoked|텍스트+아이콘,실패복구행동|
|폼|normal/focus/error/disabled|label명시,IME입력그대로,실제제출없음|
|대화상자|open/closed|native dialog,Escape닫기/트랩/원래포커스복귀|
|초대|draft/pending/expired|계정회원역할;공개snapshot별도|
|snapshot|private/preview/published/revoked/expired|발행된사본만,원본자동갱신없음|

모든 편집 버튼은 ‘편집 화면 예시’로 연결한다. 제출은 ‘예시 확인’이며 데이터를 변경하지 않는다. 시나리오 선택기와 복구·공유 예시 버튼은 메모리상의 화면 상태만 모의 전환한다. 외부 통신·localStorage/IndexedDB 저장 없음.
