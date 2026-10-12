import { openBrowser } from "./browser-utils.mjs";
import { setupProject, addNode } from "./p3-ui.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
const e = await openBrowser(),
  p = e.page;
try {
  await setupProject(p, e.url);
  await addNode(p, "메타데이터 요소");
  await p.getByLabel("태그 · 쉼표로 구분").fill("긴급, 사용자경험");
  await p.getByLabel("요소 상태", { exact: true }).fill("검토 필요");
  await p.getByRole("button", { name: "속성 추가", exact: true }).click();
  await p.getByLabel("속성 이름 1", { exact: true }).fill("담당 분야");
  await p.getByLabel("속성 값 1", { exact: true }).fill("접근성");
  await p.getByRole("button", { name: "내용 적용", exact: true }).click();
  await p.getByLabel("요소 검색").fill("접근성");
  assert.equal(await p.locator(".element-row").count(), 1);
  await p.getByLabel("요소 검색").fill("없는 값");
  assert.equal(await p.locator(".element-row").count(), 0);
  fs.writeFileSync(
    "evidence/p3/002-browser.json",
    JSON.stringify({
      passed: ["태그·상태·구조화 속성 실제편집", "속성 검색1개/없음0개"],
    }),
  );
  console.log("002 browser PASS");
} finally {
  await e.close();
}
