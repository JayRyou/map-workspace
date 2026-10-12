# Patch 실행 원장

기준선`63d1c9105db5c78403bf8cbb1b601a0265d4f54b` / 로컬브랜치 feature/p3-domain-management. 원격없음.

|커밋|Patch/작업|
|---|---|
|`8d9fe5a4d06cf5449c5c8e4623bc25cc3fde50e3`|P3-000: 기준선·설계 동결 및 로컬 Git|
|`138ee2c3b10281bc0f29eba4ebf32b38ccd4f341`|P3-001: 프로젝트·맵 생성/분리/복제/보관/휴지통과 편집기 연결|
|`2b3941ae4e2ae77880a5f2155a0222c149f54134`|P3-002: 태그·상태·구조화 속성 Inspector와 메타데이터 검색|
|`6baf61df146be23314f2c316bf52931c541a27d2`|P3-003: 의사결정·정책·논의 CRUD와 상태/범위·로컬 변경이력·노드 양방향 탐색|
|`d4e4287649a82bd29033013f3e4699772cf406a7`|P3-004: 업무·명부 CRUD와 다대다 연결·선행DAG·진행률|
|`443a6eb6742b1a671542f944e5bbb428a99b1a0c`|P3-005: P3 내구저장·전체JSON·손상복구·원본보존 P2 명시이행|

P3-006 최종 커밋은 자기 SHA를 그 커밋의 본문에 넣을 수 없어 납품 PATCH_MANIFEST.md 및 그 안의 최종 PATCH_LOG.md에 기록합니다. 단계별 검증기록은 stages.json, 최종증거는 evidence/p3에 있습니다. 통합패치는 p2-baseline부터 최종HEAD까지 git diff --binary로 생성합니다.
