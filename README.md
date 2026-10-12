# MAP Workspace · P3 로컬 도메인 관리

**P3 완료 — 외부 검수 대기** · v0.3.0 · 2026-10-11. P4 미착수.

승인된 P2 편집기를 유지하고 로컬 작업 공간/프로젝트/맵 관리, 범용 메타데이터, 정책·의사결정, 업무·담당자, 전체 백업과 P2 이행을 추가했습니다. 로그인·서버 저장·권한·초대·공유·결제·클라우드 배포는 없습니다.

## 즉시 실행

Node.js 22.18 이상. 전체 소스 ZIP 또는 실행용 ZIP을 풀고 루트에서:

```sh
node scripts/serve-dist.mjs
```

http://127.0.0.1:4173 를 엽니다. Windows는 START.cmd도 사용할 수 있습니다. npm 설치 없이 제공 dist를 실행합니다. index.html을 직접 더블클릭하지 마세요. 같은 브라우저·프로필·주소·포트를 유지해야 같은 로컬 데이터를 읽습니다.

## 개발과 검사

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:storage-browser
node tests/p3-navigation.mjs
node tests/p3-005.mjs
npm run test:performance
npm run dev
```

별도 Chromium 경로는 CHROMIUM_PATH로 지정할 수 있습니다. 검증 환경은 Node24.19.0, Linux headless Chromium153.0.8010.0입니다. 새 npm ci 완료를 확인했습니다. 본 환경의 Playwright CDN 브라우저 ZIP 다운로드는 잘림 실패가 있어 정상 Chromium 패키지로 실행 파일을 복구했습니다. 브라우저 설치 자체가 모든 네트워크에서 보장되는 것은 아닙니다.

P2 전용 tests/editor.e2e.mjs, p2-*.mjs, accessibility.mjs는 과거 검사 원문입니다. 현재 P3의 기본 npm run test:e2e는 tests/p3-final.mjs입니다. 단위검사는 기존 P2 22개를 포함해40개입니다.

## 기능 데모

1. 처음의 관리 화면에서 작업 공간→프로젝트→맵 순서로 생성합니다. 상단 선택기로 서로 다른 프로젝트를 전환합니다.
2. 요소/연결을 추가하고 노드 다중선택→그룹을 사용합니다. Inspector의 내용/위치/크기 적용 버튼이 편집 명령입니다. 일반 그래프 순환은 허용합니다.
3. 설명·메모·태그·요소 상태·속성을 작성하고 검색합니다. 텍스트·숫자·날짜·선택 값·URL 속성을 지원합니다.
4. 결정·업무 메뉴에서 담당자 명부를 만들고, 선택 노드에 결정과 업무를 연결합니다. 결정 확정과 업무 완료는 별개입니다. 업무 선행관계의 순환만 차단합니다.
5. 맵 Inspector의 관련 항목을 누르면 해당 결정/업무 상세가 열립니다. 연결 노드 버튼으로 맵에 돌아옵니다.
6. 백업·복원에서 전체 P3 JSON을 내려받고, 가져오기 미리보기→확인으로 복원합니다. 기존 P2 문서는 별도 미리보기와 명시적 이행으로 새 프로젝트에 추가합니다.

관리의 보관은 읽기전용입니다. 작업 공간/프로젝트/맵 삭제는 휴지통 이동이며 복구할 수 있고 자동 삭제하지 않습니다. 30일 후 확인 문구를 입력한 영구 삭제만 하위 데이터를 제거합니다. 담당자는 삭제 대신 보관합니다.

맵 Undo/Redo는 현재 맵 세션 단위입니다. 다른 맵 전환·새로고침·전체 백업 교체 후 이전 맵의 편집 이력은 유지하지 않습니다. 실제 지도와 표시 상태는 저장합니다. 프로젝트/결정/업무 CRUD는 캔버스 Undo에 포함하지 않습니다. 노드 삭제 Undo 후 해제된 업무/결정 링크는 자동 재연결하지 않으며 내용은 보존합니다. 미적용 Inspector/제목 입력은 전환 전에 확인합니다.

## 데이터와 문서

P3 format=map-workspace-project-local / schemaVersion=3. P2 저장 키는 변경하지 않습니다. 전체10MiB/맵1MiB 한도와 브라우저quota 중 먼저 도달한 한도를 적용합니다. 단일 LocalStorage 문서이며 서버 CAS·다중탭 원자성을 보장하지 않습니다. 중요한 작업은 JSON으로 회수하세요. 폼에 입력만 한 미적용 값은 백업 대상이 아닙니다.

- [설계](docs/p3/P3_PLAN.md), [도메인 모델](docs/p3/DOMAIN_MODEL.md), [저장·이행](docs/p3/STORAGE_MIGRATION.md)
- [진행](PROGRESS.md), [QA](QA.md), [수용 기준](docs/p3/ACCEPTANCE_CHECKLIST.md), [인계](HANDOFF.md)
- [Patch 기록](docs/p3/PATCH_LOG.md), [변경 파일](docs/p3/CHANGED_FILES.md)

통합 Patch와 정확한 기준/최종 SHA·적용 검증은 납품 패키지의 PATCH_MANIFEST.md를 따르세요. P2_BASELINE_SOURCE.zip은 승인 원본과 동일한 바이트입니다. 원본 P0/P1 문서 및 기존 라이선스를 보존했고, P2 루트 문서는 reference/p2에 보존했습니다. 과거 문서의 ‘다음 단계 금지’와 링크 경로는 당시 상태/원래 루트 기준이며 현재 P3 안내로 대체됩니다.
