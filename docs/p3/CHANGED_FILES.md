# P3 변경 파일

P2 편집엔진을 교체하지 않았습니다. GraphCanvas에는읽기전용제어,App에는외부Repository/제어API/맥락및속성폼을추가했습니다. graph/history/commands/keyboard는원래구현을유지하고validation은메타데이터를호환확장했습니다.

신규프로젝트모델/검증/명령·도메인CRUD·repository·UI및테스트는독립작성했습니다.기존자산과LICENSE는그대로사용하며새런타임라이브러리는추가하지않았습니다.

아래는마지막문서정리시점목록이며최종정확한목록은PATCH_MANIFEST.md와git diff --name-status를따릅니다.

- `.gitignore`
- `CHANGELOG.md`
- `HANDOFF.md`
- `PROGRESS.md`
- `QA.md`
- `README.md`
- `docs/p3/ACCEPTANCE_CHECKLIST.md`
- `docs/p3/DOMAIN_MODEL.md`
- `docs/p3/P3_PLAN.md`
- `docs/p3/QA_REPORT.md`
- `docs/p3/STORAGE_MIGRATION.md`
- `docs/p3/stages.json`
- `evidence/p3/001-browser.json`
- `evidence/p3/002-browser.json`
- `evidence/p3/003-browser.json`
- `evidence/p3/003-failure.txt`
- `evidence/p3/004-browser.json`
- `evidence/p3/005-browser.json`
- `evidence/p3/baseline.json`
- `evidence/p3/delivery.json`
- `evidence/p3/final-e2e.json`
- `evidence/p3/navigation.json`
- `evidence/p3/performance.json`
- `evidence/p3/storage-browser.json`
- `package-lock.json`
- `package.json`
- `reference/p2/CHANGELOG.md`
- `reference/p2/FILE_MANIFEST.json`
- `reference/p2/HANDOFF.md`
- `reference/p2/PROGRESS.md`
- `reference/p2/QA.md`
- `reference/p2/README.md`
- `src/App.tsx`
- `src/WorkspaceApp.tsx`
- `src/components/map/GraphCanvas.tsx`
- `src/components/project/Backup.tsx`
- `src/components/project/Decisions.tsx`
- `src/components/project/Manager.tsx`
- `src/components/project/MetadataFields.tsx`
- `src/components/project/Tasks.tsx`
- `src/domain/map.ts`
- `src/graph/validation.ts`
- `src/main.tsx`
- `src/project/commands.ts`
- `src/project/decisions.ts`
- `src/project/migration.ts`
- `src/project/model.ts`
- `src/project/tasks.ts`
- `src/project/validation.ts`
- `src/repositories/project-local.ts`
- `src/styles.css`
- `tests/decisions.test.ts`
- `tests/metadata.test.ts`
- `tests/p3-001.mjs`
- `tests/p3-002.mjs`
- `tests/p3-003.mjs`
- `tests/p3-004.mjs`
- `tests/p3-005.mjs`
- `tests/p3-delivery.mjs`
- `tests/p3-final.mjs`
- `tests/p3-navigation.mjs`
- `tests/p3-performance.mjs`
- `tests/p3-storage-browser.mjs`
- `tests/p3-ui.mjs`
- `tests/project-storage.test.ts`
- `tests/project.test.ts`
- `tests/tasks.test.ts`
