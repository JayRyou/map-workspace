# 변경 파일 목록

P1 소스를 덮어쓰지 않고 P2 독립 디렉터리에 생성했습니다. 기존 Flow/RWA 구현의 파일·함수 참고와 재작성 구분은 REUSE_LICENSE_AUDIT.md를 따릅니다. 원본754개 무변경 확인은 evidence/source-integrity-p2.json입니다.

|경로/범위|구분|
|---|---|
|src/**|독립 신규 구현. P1 디자인·원본의 동작 개념만 참고|
|tests/**, scripts/**|신규 검사·패키징·라이선스 수집 코드|
|docs/p2/**, 루트 보고서/설정|신규 P2 계약·보고·설정|
|docs/p0/**, docs/p1/**, reference/P1_*.md|원본 문서 그대로 보존|
|screenshots/p1-*, evidence/p1/**, reference/evidence/**|과거 P1 증거 복사|
|screenshots/p2-*, evidence/나머지|실행한 P2 증거|
|public/fonts/**|P1의 OFL 폰트 재사용, 라이선스 포함|
|public/licenses/**|실제 의존성 원문·manifest 수집|
|dist/**|src/public에서 생성한 정적 빌드|

## P2 소스·계약 파일 전수

- `.gitignore`
- `CHANGELOG.md`
- `HANDOFF.md`
- `MAP_PLATFORM_WORK_RULES.md`
- `PROGRESS.md`
- `QA.md`
- `README.md`
- `START.cmd`
- `docs/p0/ACCEPTANCE_CRITERIA.md`
- `docs/p0/ARCHITECTURE.md`
- `docs/p0/CODEBASE_ANALYSIS.md`
- `docs/p0/COST_COMPARISON.md`
- `docs/p0/DATA_MODEL.md`
- `docs/p0/DESIGN_DIRECTION.md`
- `docs/p0/FEATURE_COMPARISON.md`
- `docs/p0/IA.md`
- `docs/p0/MIGRATION_PLAN.md`
- `docs/p0/MONETIZATION.md`
- `docs/p0/MVP_SCOPE.md`
- `docs/p0/PRD.md`
- `docs/p0/REUSE_STRATEGY.md`
- `docs/p0/RISK_REGISTER.md`
- `docs/p0/ROADMAP.md`
- `docs/p0/SCHEMA_STRATEGY.md`
- `docs/p0/SECURITY_MODEL.md`
- `docs/p0/TECH_DECISIONS.md`
- `docs/p0/USER_SCENARIOS.md`
- `docs/p0/UX_PRINCIPLES.md`
- `docs/p1/ACCESSIBILITY.md`
- `docs/p1/COMPONENT_SPEC.md`
- `docs/p1/DECISIONS_PENDING.md`
- `docs/p1/DESIGN_GUARDRAILS.md`
- `docs/p1/GLOSSARY.md`
- `docs/p1/IA.md`
- `docs/p1/PROTOTYPE_GUIDE.md`
- `docs/p1/REQ_TRACEABILITY.md`
- `docs/p1/RESEARCH.md`
- `docs/p1/REVIEW.md`
- `docs/p1/STATE_FLOWS.md`
- `docs/p1/TOKENS.md`
- `docs/p1/USER_FLOWS.md`
- `docs/p1/WIREFRAMES.md`
- `docs/p1/stage-log.json`
- `docs/p2/EDITOR_CONTRACT.md`
- `docs/p2/HISTORY_AND_KEYBOARD.md`
- `docs/p2/IMPLEMENTATION_PLAN.md`
- `docs/p2/P2_REVIEW.md`
- `docs/p2/PERFORMANCE.md`
- `docs/p2/QA_REPORT.md`
- `docs/p2/REUSE_LICENSE_AUDIT.md`
- `docs/p2/SCHEMA_DEVIATIONS.md`
- `docs/p2/STORAGE_BOUNDARY.md`
- `index.html`
- `package-lock.json`
- `package.json`
- `scripts/licenses.mjs`
- `scripts/serve-dist.mjs`
- `src/App.tsx`
- `src/components/map/GraphCanvas.tsx`
- `src/domain/map.ts`
- `src/fixtures/sample.ts`
- `src/graph/commands.ts`
- `src/graph/history.ts`
- `src/graph/keyboard.ts`
- `src/graph/validation.ts`
- `src/main.tsx`
- `src/repositories/local-map.ts`
- `src/styles.css`
- `tests/accessibility.mjs`
- `tests/browser-utils.mjs`
- `tests/commands.test.ts`
- `tests/delivery.mjs`
- `tests/editor.e2e.mjs`
- `tests/history-keyboard.test.ts`
- `tests/p2-1.mjs`
- `tests/p2-2.mjs`
- `tests/p2-3.mjs`
- `tests/p2-4.mjs`
- `tests/performance.mjs`
- `tests/storage.test.ts`
- `tsconfig.json`
- `vite.config.ts`
