import { openBrowser } from "./browser-utils.mjs";
import { setupProject, addNode } from "./p3-ui.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
const e = await openBrowser(),
  p = e.page;
p.setDefaultTimeout(7000);
try {
  await setupProject(p, e.url);
  await addNode(p, "판단 대상");
  await p.getByRole("button", { name: "정책·결정 열기", exact: true }).click();
  await p.getByRole("button", { name: "결정 추가", exact: true }).click();
  await p.getByLabel("결정 제목", { exact: true }).fill("접근성 우선");
  await p.getByLabel("결정 상태", { exact: true }).selectOption("accepted");
  await p.getByLabel("결정 근거", { exact: true }).fill("키보드 접근을 보장");
  await p.getByRole("button", { name: "결정 저장", exact: true }).click();
  await p
    .getByRole("button", { name: "판단 대상 · 맵에서 보기 ↗", exact: true })
    .click();
  await p.getByLabel("요소 이름", { exact: true }).waitFor();
  assert.equal(
    await p.getByLabel("요소 이름", { exact: true }).inputValue(),
    "판단 대상",
  );
  assert.equal(
    await p
      .getByRole("button", { name: "접근성 우선 · 확정", exact: true })
      .count(),
    1,
  );
  fs.writeFileSync(
    "evidence/p3/003-browser.json",
    JSON.stringify({
      passed: [
        "결정 실제 생성·상태·근거 저장",
        "선택 노드 연결·결정→노드 이동",
        "Inspector 관련 결정 표시",
      ],
    }),
  );
  console.log("003 PASS");
} catch (err) {
  fs.writeFileSync(
    "evidence/p3/003-failure.txt",
    await p.locator("body").innerText(),
  );
  throw err;
} finally {
  await e.close();
}
