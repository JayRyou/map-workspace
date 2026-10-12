# MAP Workspace · P2 로컬 편집기

**P2 완료 — 외부 검수 대기** · 2026-10-10 · v0.2.0

노드·연결·그룹을 실제 편집하는 React + TypeScript + React Flow 기반 로컬 MAP 편집기입니다. P0/P1은 사용자 검수 완료 상태이며 P3는 시작하지 않았습니다.

## 빌드 없이 실행

Node.js 22.18 이상을 설치한 뒤 압축을 풀고 이 폴더에서 실행합니다.

```sh
node scripts/serve-dist.mjs
```

브라우저에서 http://127.0.0.1:4173 를 엽니다. Windows는 `START.cmd`도 제공합니다. `dist/index.html`을 파일로 직접 열지 마세요. 정적 실행에는 npm 설치가 필요 없습니다. 같은 브라우저·프로필·주소·포트를 유지해야 같은 로컬 문서를 읽습니다. 종료는 터미널 Ctrl+C입니다.

## 소스 개발과 검사

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:e2e
node tests/accessibility.mjs
npm run test:performance
node tests/delivery.mjs
```

검증 환경은 Node 24.19.0 / Chromium 153.0.8010.0입니다. 브라우저 실행 파일을 별도로 제공하면 `CHROMIUM_PATH` 환경변수를 사용합니다. Linux에서 브라우저 OS 의존성이 추가로 필요할 수 있습니다.

실제 타입검사·빌드, 단위 22개, 통합 E2E 33개, 접근성·추가 조작 15개가 통과했습니다. 설치된 고정 버전 의존성으로 실행했으며, 캐시가 없는 새 환경의 `npm ci` 완료는 **UNVERIFIED**입니다. 오프라인 시도는 zustand 캐시 누락으로 중단됐습니다. portable registry lockfile과 dry-run 확인은 완료했습니다. 로그는 `evidence/`에 있습니다.

## 사용 흐름

1. 첫 실행의 범용 샘플에서 노드를 선택하고 Inspector의 이름·유형·설명·메모를 바꾼 뒤 **내용 적용**을 누릅니다. 위치와 그룹 크기도 각각 적용 버튼을 사용합니다.
2. `＋ 요소`, `↗ 연결`로 생성합니다. 노드 핸들을 드래그해 연결할 수도 있습니다. 빈 공간 드래그는 영역 선택, Shift/Ctrl은 다중 선택, 오른쪽 버튼 드래그는 캔버스 이동, 휠은 확대·축소입니다.
3. 노드를 선택하고 그룹을 만듭니다. 그룹 이동은 자식 상대좌표를 유지하고, 그룹 해제·삭제는 자식의 화면 좌표를 유지합니다.
4. Ctrl/Cmd+Z로 Undo, Ctrl/Cmd+Shift+Z 또는 Ctrl/Cmd+Y로 Redo합니다. 텍스트 입력/IME 중에는 캔버스 단축키를 가로채지 않습니다. 드래그 한 번은 이력 한 건입니다.
5. `로컬 문서`에서 P2 JSON 내보내기, 가져오기 미리보기, 이전 정상본·손상 복구를 사용합니다. 새 맵·샘플·성능 맵 교체 전 확인합니다. 중요한 작업은 JSON으로 내보내세요.
6. 390/768px에서는 목록이 기본입니다. 항목 선택으로 상세 편집, 닫기로 목록 복귀가 가능합니다. 연결은 대화상자, 이동·그룹 크기는 숫자 입력으로 조작할 수 있습니다.

## 저장·범위

현재 브라우저의 LocalStorage에만 저장합니다. 실제 write/readback 확인 뒤에만 `이 기기에서 저장됨`이 표시됩니다. 폼 입력은 **적용한 값**부터 저장 대상입니다. Undo 이력은 새로고침 후 초기화되며 지도와 표시 상태는 복원합니다.

`map-workspace-map-local` / schemaVersion 1은 P2 테스트 문서이며 P1 데모 JSON 및 P3 제품 백업과 호환을 약속하지 않습니다. 1MiB, 500노드, 1000연결, 50그룹 제한입니다. 다른 탭의 변경을 감지하면 자동 저장을 멈추지만 서버 CAS나 완전한 다중 탭 동시성 제어는 아닙니다. 인증·DB·서버 저장·공유·결제는 없습니다. 결정/업무는 읽기 전용 샘플입니다.

## 검수와 인계

- [검수 보고서](docs/p2/P2_REVIEW.md)
- [QA와 미검증 항목](docs/p2/QA_REPORT.md)
- [성능 실측](docs/p2/PERFORMANCE.md)
- [단계별 현황](PROGRESS.md), [변경 기록](CHANGELOG.md), [후속 인계](HANDOFF.md)
- [파일 목록과 차용 구분](docs/p2/CHANGED_FILES.md), [라이선스](docs/p2/REUSE_LICENSE_AUDIT.md)

`docs/p0`, `docs/p1`, `reference`는 승인 당시 원문입니다. 그 안의 단계 금지/진행 문구와 비용·기술 조사 시점은 역사적 기록이며 현재 P2 상태는 루트 문서와 `docs/p2`를 기준으로 합니다. 원본 Flow/RWA 코드는 참고만 했고 이 ZIP에 복사하지 않았습니다.

Git에는 `src`, `tests`, `scripts`, 문서, package.json/lockfile 및 public 자산을 함께 넣으면 됩니다. `node_modules`, 생성된 dist와 큰 프로파일은 .gitignore에 제외했습니다. 기존 원격 저장소를 만들거나 수정하지 않았습니다.
