# P3 수용 기준

|번호|판정|근거|
|---|---|---|
|1 프로젝트A/B 격리·전환/reload|PASS|navigation5 검사|
|2 P2 graph CRUD·선택·Undo/Redo·그룹|PASS|기존단위22 포함40, final-e2e39의 실제 순환/삭제/드래그/그룹|
|3 노드맥락·결정/업무 CRUD·양방향|PASS|003/004 단계검사, 통합 사용자 여정|
|4 결정상태/업무상태/진행률|PASS|tasks 단위 및 통합0→100%|
|5 업무DAG·일반그래프순환|PASS|tasks 단위 순환거부, 실제맵 A→B→C→A|
|6 삭제/보관·참조무결성|PASS|project/tasks/decisions 단위, navigation 휴지통복구|
|7 P2 원본보존·롤백·중복|PASS|project-storage 단위,005-browser|
|8 백업roundtrip·악성JSON/버전|PASS|project-storage/metadata 단위,005와통합|
|9 quota/손상/다중탭|PASS 범위 한정|storage-browser 실제주입,005 실제2탭; 원자적CAS 아님|
|10 IME/키보드|부분 검증|합성IME·Tab/Esc/포커스 PASS,실제OS IME UNVERIFIED|
|11 4폭·정보밀도·디자인|PASS|390/768/1440/1920스크린샷·캔버스65%|
|12 build·tests·JS오류0|PASS|최종로그·final-e2e.json|
|13 프로젝트→맵→노드/그룹→결정/업무→백업복원|PASS|tests/p3-final.mjs 한 브라우저 흐름|
|14 정적HTTP·백엔드의존없음|PASS|delivery.json; 외부요청0, 실제클라우드는미검증|
|15 통합Patch 적용·최종소스일치|납품 검증 참조|PATCH_MANIFEST.md의 apply/tree hash/새설치·검사 결과|

본 표의 부분 검증을 전체 환경 PASS로 승격하지 않습니다. 실행 가능한 자체QA 완료 후 사용자·외부 검수 대기이며 P4를 시작하지 않습니다.
