# P2 인계

**P2 완료 — 외부 검수 대기**. 사용자·검수자 승인 전 P3 착수 금지.

## 실행 및 기준선

루트 README의 `node scripts/serve-dist.mjs`로 배포용 dist를 로컬 실행합니다. 개발은 `npm ci` 이후 `npm run dev`; 정확한 버전은 lockfile, 변경 파일은 docs/p2/CHANGED_FILES.md, 패키지별 SHA-256은 FILE_MANIFEST.json입니다. 외부 Git 원격 생성·push·배포는 하지 않았습니다.

## P3가 이어받을 계약

- 공통 모델: src/domain/map.ts. Map의 id/title/nodes/edges/groups와 최소 metadata(description/notes)만 P2에서 구현했습니다.
- 연결: 유효 source/target, 전체 ID 유일성, self 거부, 동일source/target/type 거부. 역방향·서로 다른type·일반 순환 허용. 업무 DAG는 별도 도메인 정책이어야 합니다.
- 그룹: 단일부모·중첩없음. 그룹 위치는 절대좌표, 소속노드는 상대좌표. 해제/삭제 시 그룹 위치를 더해 자식 화면위치를 보존합니다. 그룹 삭제로 자식·관계는 삭제하지 않습니다.
- 편집: graph/commands.ts execute→검증→history commit. 드래그는 종료1회, UI view는 이력 밖입니다. Undo/Redo는 past/future 각80건/16MiB이며 reload 후 사라집니다.
- 저장: format=map-workspace-map-local / schemaVersion=1 / map/view/savedAt. 키 map-workspace:p2:map-local:v1, :previous, :quarantine. 현재/이전 정상·격리 보존과 실패시 초안 유지. 최대1MiB/500노드/1000edge/50그룹.
- 가져오기: unknown key/버전/prototype/잘못된 참조 거부, 미리보기 후 교체. P1 데모 형식이나 제품 backup이 아닙니다. P3는 명시적 migration/fixture와 roundtrip 검증을 새로 정의해야 합니다.
- 동시성: storage event/expectedRaw 비교는 로컬 방어이며 서버 revision/CAS가 아닙니다. P0 D-01/02/03은 여전히 잠정이고 인증·공유·DB 결정으로 확정하지 않았습니다.
- UI: 실제 저장 readback 뒤 완료 표시. Inspector 폼은 적용 버튼부터 명령화합니다. 결정/업무 예시는 editor aggregate 밖의 읽기 전용 표시입니다.

## 미완성·검수 필요

제품 workspace/project/권한/revision, 결정·업무 CRUD, 제품 속성 스키마·정식 백업 migration은 구현하지 않았습니다. 계정·서버·DB·초대·공유·결제·인프라도 없습니다.

실제OS 한글IME, native200%확대, 스크린리더, 터치실기기, Firefox/Safari, 깨끗한 npm ci 완료는 UNVERIFIED입니다. QA_REPORT의 외부 검수 경로대로 확인하고 승인 결과를 남겨야 합니다. 단일 Linux 측정의 p95 결과를 모든 기기 보증으로 사용하지 마세요. 그룹은 Inspector 크기 입력으로 조절하며 캔버스 전용 리사이즈 핸들은 제공하지 않습니다.

## 하위 단계 인계 원장


## P2.0 진행 중

입력·승인·라이선스·독립 스캐폴드 작성

검증: 원본 해시 기준 생성, 설치 패키지 버전 확인

남은 사항: 모델 및 라이선스 증거 확정

## P2.0 완료

독립 디렉터리·공통모델·P2형식·재사용/라이선스 계약 확정

검증: 입력 대조·실제 설치버전 고정·라이선스 원문 수집

남은 사항: 기존 코드 직접복사0; P2.1 실제 CRUD UI 연결

## P2.1 진행 중

검증 가능한 명령 계층과 실제 CRUD 화면 연결

검증: 도메인 초기8개 검사 통과

남은 사항: React Flow/Inspector 실제 입력·다중선택 연결

## P2.1 완료

노드/연결 CRUD·실제 Inspector·다중선택·뷰포트 연결

검증: 타입검사/build 성공; 생성→라벨/좌표수정 브라우저 확인; JS오류0

남은 사항: P2.2 그룹 이동/해제 및 관계 탐색 검증

## P2.2 진행 중

단일부모 그룹과 1-hop·검색/유형필터 연결

검증: 순환/중복/그룹 좌표 단위검사8개 통과

남은 사항: 브라우저 그룹화/이동/해제와 선택 확인

## P2.2 완료

단일부모 그룹 생성·이동·크기·해제·삭제,1-hop/검색/필터

검증: 그룹화 위치유지→이동→Undo→해제 브라우저 통과; 검색1건 확인

남은 사항: P2.3 실제 드래그 단일이력/키보드·IME 검사

## P2.3 진행 중

명령단위 Undo/Redo와 입력/IME 보호 계층

검증: 복합 이력·분기폐기·상한·단축키 자동검사 추가

남은 사항: 브라우저 드래그·키보드 입력 보호 검사

## P2.3 완료

명령 이력80건/16MiB 상한·단축키·입력/IME 보호·드래그 종료 묶음

검증: 단위14개 통과;15단계 드래그1이력/UndoRedo/키보드삭제/합성IME 브라우저 통과

남은 사항: 실제 OS 한글IME는 미검증; P2.4 안전한 로컬 저장 연결

## P2.4 진행 중

P2 map-local v1 자동저장·이전정상본·손상 차단·import preview

검증: 스키마 allowlist/용량/참조 검증 계층 활용

남은 사항: 저장실패/손상 데이터/새로고침 실제 테스트

## P2.4 완료

로컬 전용 v1 저장·읽기 검증·이전 정상본/손상 격리·미리보기 교체·샘플/빈맵

검증: 단위21개; 새로고침 의미동등·다운로드·오류거부·손상복구·quota초안보존 통과

남은 사항: P2.5 통합 E2E/성능/반응형·미검증 정리

## P2.5 진행 중

실측 QA·회귀·정적패키징

검증: 기존 단계 검사 완료; 통합 검증 시작

남은 사항: 500/1000 p95·프레임/메모리·4폭·접근성·납품

## P2.5 완료

통합 QA·성능 개선·4폭/접근성·소스와 정적 dist 패키징

검증: 단위22·E2E33·접근성15·납품4 PASS; build 성공; 500/1000 선택 p95 84.3ms; 원본754개 무변경

남은 사항: 실기기 IME/200%/AT/터치/타브라우저 및 새 npm 설치 UNVERIFIED; 외부 검수 대기
