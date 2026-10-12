import { openBrowser } from "./browser-utils.mjs";
import { addNode } from "./p3-ui.mjs";
import { emptyDocument } from "../src/project/model.ts";
import { projectCommand } from "../src/project/commands.ts";
import { sampleMap } from "../src/fixtures/sample.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
const key = "map-workspace:p3:workspace-local:v3",
  env = await openBrowser(),
  p = env.page,
  checks = [];
p.setDefaultTimeout(10000);
p.on("dialog", (d) => d.accept());
let d = projectCommand(emptyDocument(), {
  type: "workspace",
  name: "안전 공간",
});
d = projectCommand(d, {
  type: "project",
  workspaceId: d.active.workspaceId,
  name: "복구 프로젝트",
});
d = projectCommand(d, {
  type: "map",
  projectId: d.active.projectId,
  title: "복구맵",
});
d.maps[0].map = { ...sampleMap(), id: d.active.mapId };
try {
  await p.goto(env.url);
  await p.evaluate(
    ([key, raw]) => {
      localStorage.setItem(key, "broken");
      localStorage.setItem(key + ":previous", raw);
    },
    [key, JSON.stringify(d)],
  );
  await p.reload();
  await p
    .getByText("저장 중지 · 초안 보존", { exact: false })
    .first()
    .waitFor();
  assert.equal(await p.evaluate((k) => localStorage.getItem(k), key), "broken");
  checks.push("손상현재값 자동덮기 차단·이전본 임시복원");
  await p.getByRole("button", { name: "백업·복원", exact: true }).click();
  await p
    .getByRole("button", { name: "현재 초안으로 복구 확인", exact: true })
    .click();
  assert.equal(
    (await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)).maps[0]
      .map.nodes.length,
    6,
  );
  assert.equal(
    await p.evaluate(
      (k) => JSON.parse(localStorage.getItem(k + ":quarantine")).current,
      key,
    ),
    "broken",
  );
  checks.push("명시복구 현재/이전 원본 격리");
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  await p.evaluate((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === key) throw new DOMException("quota", "QuotaExceededError");
      return original.call(this, k, v);
    };
  }, key);
  await addNode(p, "quota 중 초안");
  await p.getByText("이 기기에 저장하지 못했어요", { exact: true }).waitFor();
  assert.equal(
    await p.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)).maps[0].map.nodes.length,
      key,
    ),
    6,
  );
  await p.getByRole("button", { name: "백업·복원", exact: true }).click();
  const [dl] = await Promise.all([
    p.waitForEvent("download"),
    p
      .getByRole("button", { name: "P3 전체 백업 내려받기", exact: true })
      .click(),
  ]);
  assert.equal(
    JSON.parse(fs.readFileSync(await dl.path(), "utf8")).maps[0].map.nodes
      .length,
    7,
  );
  checks.push("실제 quota 주입·저장정상본 유지·최신초안7개 다운로드");
  fs.writeFileSync(
    "evidence/p3/storage-browser.json",
    JSON.stringify({ checks, passed: checks.length }, null, 2),
  );
  console.log("Storage browser PASS", checks.length);
} catch (err) {
  fs.writeFileSync(
    "evidence/p3/storage-browser-failure.txt",
    await p.locator("body").innerText(),
  );
  throw err;
} finally {
  await env.close();
}
