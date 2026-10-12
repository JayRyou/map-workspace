import test from "node:test";
import assert from "node:assert/strict";
import {
  LocalProjectRepository,
  PROJECT_KEY,
  PREVIOUS_KEY,
  QUARANTINE_KEY,
} from "../src/repositories/project-local.ts";
import { emptyDocument } from "../src/project/model.ts";
import { projectCommand as cmd } from "../src/project/commands.ts";
import { parseProject } from "../src/project/validation.ts";
import { previewP2, migrateP2 } from "../src/project/migration.ts";
import { sampleMap } from "../src/fixtures/sample.ts";
import {
  serializeDocument,
  CURRENT_KEY,
} from "../src/repositories/local-map.ts";
import { defaultView } from "../src/domain/map.ts";
class Store {
  data = new Map<string, string>();
  fail = "";
  getItem(k: string) {
    return this.data.get(k) || null;
  }
  setItem(k: string, v: string) {
    if (this.fail === "all" || k === this.fail) throw new Error("quota");
    this.data.set(k, v);
  }
}
const doc = () => cmd(emptyDocument(), { type: "workspace", name: "정상" });
test("P3 전체 roundtrip·같은내용 재저장 멱등·이전본 회전", () => {
  const s = new Store(),
    r = new LocalProjectRepository(s),
    d = doc();
  r.load();
  r.save(d);
  const first = s.getItem(PROJECT_KEY);
  r.save({ ...d, savedAt: new Date(Date.now() + 1000).toISOString() });
  assert.equal(s.getItem(PROJECT_KEY), first);
  const next = cmd(d, { type: "workspace", name: "두번째" });
  r.save(next);
  assert.equal(s.getItem(PREVIOUS_KEY), first);
  assert.deepEqual(parseProject(s.getItem(PROJECT_KEY)!), next);
});
test("손상+정상이전본 자동쓰기차단·격리 실패 원본 보존", () => {
  const s = new Store();
  s.setItem(PROJECT_KEY, "broken");
  s.setItem(PREVIOUS_KEY, JSON.stringify(doc()));
  const r = new LocalProjectRepository(s),
    boot = r.load();
  assert(boot.blocked);
  assert.equal(boot.document.workspaces.length, 1);
  assert.throws(() => r.save(boot.document));
  s.fail = QUARANTINE_KEY;
  assert.throws(() => r.save(boot.document, true));
  assert.equal(s.getItem(PROJECT_KEY), "broken");
  s.fail = "";
  r.save(boot.document, true);
  assert(JSON.parse(s.getItem(QUARANTINE_KEY)!).current === "broken");
});
test("quota·다중탭 충돌·기존정상 문서와 호출자 초안 보존", () => {
  const s = new Store(),
    a = new LocalProjectRepository(s),
    b = new LocalProjectRepository(s);
  a.load();
  const d = doc();
  a.save(d);
  b.load();
  const next = cmd(d, { type: "workspace", name: "초안" });
  s.fail = PROJECT_KEY;
  assert.throws(() => a.save(next));
  assert.equal(parseProject(s.getItem(PROJECT_KEY)!).workspaces.length, 1);
  assert.equal(next.workspaces.length, 2);
  s.fail = "";
  a.save(next);
  assert.throws(() => b.save(d), /다른 탭/);
  assert.equal(parseProject(s.getItem(PROJECT_KEY)!).workspaces.length, 2);
});
test("P2 명시이행 원본 보존·중복차단·현재P3 실패롤백", async () => {
  const raw = serializeDocument(sampleMap(), defaultView()),
    preview = await previewP2(raw),
    s = new Store(),
    r = new LocalProjectRepository(s);
  s.setItem(CURRENT_KEY, raw);
  r.load();
  const before = doc();
  r.save(before);
  const next = migrateP2(before, preview);
  r.preserveP2(preview.fingerprint, raw);
  s.fail = PROJECT_KEY;
  assert.throws(() => r.save(next));
  assert.deepEqual(parseProject(s.getItem(PROJECT_KEY)!), before);
  assert.equal(s.getItem(CURRENT_KEY), raw);
  s.fail = "";
  r.save(next);
  assert.deepEqual(next.maps[0].map, sampleMap());
  assert.throws(() => migrateP2(next, preview), /이미 이행/);
  assert.equal(s.getItem(CURRENT_KEY), raw);
});
test("미지원/프로토타입/악성필드/무효참조/크기 거부", async () => {
  assert.throws(() =>
    parseProject(JSON.stringify({ ...doc(), schemaVersion: 99 })),
  );
  assert.throws(() => parseProject('{"__proto__":{}}'));
  assert.throws(() => parseProject(" ".repeat(10 * 1048576 + 1)));
  await assert.rejects(() => previewP2('{"schemaVersion":1,"demo":true}'));
  const d = doc();
  d.active.mapId = "missing";
  assert.throws(() => parseProject(JSON.stringify(d)));
});
