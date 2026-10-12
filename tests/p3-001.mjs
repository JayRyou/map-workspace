import { openBrowser } from "./browser-utils.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
const e = await openBrowser(),
  p = e.page;
try {
  await p.goto(e.url);
  await p
    .getByRole("button", { name: "작업 공간·프로젝트·맵 만들기", exact: true })
    .click();
  for (const [tab, name] of [
    ["작업 공간", "공간 A"],
    ["프로젝트", "프로젝트 A"],
    ["맵", "맵 A"],
  ]) {
    await p
      .locator("dialog")
      .getByRole("button", { name: tab, exact: true })
      .click();
    await p.getByLabel("새 항목 이름").fill(name);
    await p
      .getByRole("button", { name: "새 항목 만들기", exact: true })
      .click();
  }
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  await p.getByRole("button", { name: "＋ 요소", exact: true }).click();
  await p.locator("dialog input[name=label]").fill("A만의 노드");
  await p.getByRole("button", { name: "요소 만들기" }).click();
  await p.getByRole("button", { name: "관리", exact: true }).click();
  await p
    .locator("dialog")
    .getByRole("button", { name: "프로젝트", exact: true })
    .click();
  await p.getByLabel("새 항목 이름").fill("B");
  await p.getByRole("button", { name: "새 항목 만들기", exact: true }).click();
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  assert.equal(await p.locator(".react-flow__node-mapNode").count(), 0);
  await p.getByLabel("프로젝트 선택").selectOption({ label: "프로젝트 A" });
  await p.getByText("A만의 노드", { exact: true }).first().waitFor();
  fs.writeFileSync(
    "evidence/p3/001-browser.json",
    JSON.stringify({
      passed: [
        "작업공간→프로젝트→맵 생성",
        "실제노드 생성",
        "프로젝트 전환 시 맵 분리",
        "즉시 전환 후 원본 노드 유지",
      ],
    }),
  );
  console.log("001 browser PASS");
} finally {
  await e.close();
}
