import { openBrowser } from "./browser-utils.mjs";
import { setupProject, addNode } from "./p3-ui.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sampleMap } from "../src/fixtures/sample.ts";
import { defaultView } from "../src/domain/map.ts";
import { serializeDocument } from "../src/repositories/local-map.ts";
const key = "map-workspace:p3:workspace-local:v3",
  legacyKey = "map-workspace:p2:map-local:v1",
  e = await openBrowser(),
  p = e.page,
  checks = [];
p.setDefaultTimeout(10000);
p.on("dialog", (d) => d.accept());
const get = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
const stable = (d) => ({ ...d, savedAt: "" });
try {
  await setupProject(p, e.url);
  await addNode(p, "보존 노드");
  await p.waitForFunction(
    (k) => JSON.parse(localStorage.getItem(k))?.maps[0]?.map.nodes.length === 1,
    key,
  );
  const before = await get();
  await p.reload();
  await p.getByLabel("요소 이름", { exact: true }).waitFor();
  assert.deepEqual(stable(await get()), stable(before));
  checks.push("P3 전체 저장·reload 의미동등");
  await p.getByRole("button", { name: "백업·복원", exact: true }).click();
  const [download] = await Promise.all([
    p.waitForEvent("download"),
    p
      .getByRole("button", { name: "P3 전체 백업 내려받기", exact: true })
      .click(),
  ]);
  const raw = fs.readFileSync(await download.path(), "utf8");
  assert.deepEqual(stable(JSON.parse(raw)), stable(await get()));
  checks.push("실제 전체 백업 다운로드");
  const legacy = serializeDocument(sampleMap(), defaultView());
  await p.evaluate(([k, v]) => localStorage.setItem(k, v), [legacyKey, legacy]);
  await p
    .getByRole("button", { name: "이 기기의 P2 미리보기", exact: true })
    .click();
  await p
    .getByRole("button", { name: "원본 보존 후 P2 이행 확인", exact: true })
    .click();
  await p.waitForFunction(
    (k) => JSON.parse(localStorage.getItem(k)).migrations.length === 1,
    key,
  );
  assert.equal(
    await p.evaluate((k) => localStorage.getItem(k), legacyKey),
    legacy,
  );
  assert.equal((await get()).projects.length, 2);
  checks.push("P2 원본 키 보존·새프로젝트 이행");
  await p
    .getByRole("button", { name: "이 기기의 P2 미리보기", exact: true })
    .click();
  await p
    .getByRole("button", { name: "원본 보존 후 P2 이행 확인", exact: true })
    .click();
  await p
    .locator("dialog")
    .getByText(/이미 이행/)
    .waitFor();
  assert.equal((await get()).projects.length, 2);
  checks.push("P2 중복이행 멱등 차단");
  await p
    .getByLabel("P3 백업 가져오기")
    .setInputFiles({
      name: "restore.json",
      mimeType: "application/json",
      buffer: Buffer.from(raw),
    });
  await p
    .getByRole("button", { name: "P3 백업으로 교체 확인", exact: true })
    .click();
  assert.equal((await get()).projects.length, 1);
  checks.push("P3 가져오기 미리보기·전체교체");
  await p
    .getByLabel("P3 백업 가져오기")
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"schemaVersion":999}'),
    });
  await p.getByText(/P3 로컬 백업 v3만 지원/).waitFor();
  assert.equal((await get()).projects.length, 1);
  checks.push("미지원JSON 현재문서 보존");
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  const tab = await e.context.newPage();
  await tab.goto(e.url);
  await tab.getByLabel("요소 이름", { exact: true }).waitFor();
  await tab.getByLabel("요소 이름", { exact: true }).fill("다른 탭");
  await tab.getByRole("button", { name: "내용 적용", exact: true }).click();
  await p.getByText("다른 탭 변경 · 저장 중지", { exact: false }).waitFor();
  checks.push("실제 다중탭 변경 자동저장 차단");
  await tab.close();
  fs.writeFileSync(
    "evidence/p3/005-browser.json",
    JSON.stringify({ checks, passed: checks.length }, null, 2),
  );
  console.log("005 PASS", checks.length);
} catch (err) {
  fs.writeFileSync(
    "evidence/p3/005-failure.txt",
    await p.locator("body").innerText(),
  );
  throw err;
} finally {
  await e.close();
}
