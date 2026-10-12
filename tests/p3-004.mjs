import { openBrowser } from "./browser-utils.mjs";
import { setupProject, addNode } from "./p3-ui.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
const e = await openBrowser(),
  p = e.page;
p.setDefaultTimeout(8000);
try {
  await setupProject(p, e.url);
  await addNode(p, "업무 대상");
  await p.getByRole("button", { name: "담당자 명부", exact: true }).click();
  await p.getByLabel("담당자 이름", { exact: true }).fill("로컬 담당자");
  await p.getByLabel("담당 역할", { exact: true }).fill("개발");
  await p.getByRole("button", { name: "담당자 추가", exact: true }).click();
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  await p.getByRole("button", { name: "업무 열기", exact: true }).click();
  await p.getByRole("button", { name: "업무 추가", exact: true }).click();
  await p.getByLabel("업무 제목", { exact: true }).fill("검증 업무");
  await p.getByLabel("업무 상태", { exact: true }).selectOption("doing");
  await p.getByLabel("로컬 담당자", { exact: true }).check();
  await p.getByRole("button", { name: "업무 저장", exact: true }).click();
  assert((await p.locator("dialog").innerText()).includes("0% · 0/1"));
  await p.getByRole("button", { name: "업무 수정", exact: true }).click();
  await p.getByLabel("업무 상태", { exact: true }).selectOption("done");
  await p.getByRole("button", { name: "업무 저장", exact: true }).click();
  assert((await p.locator("dialog").innerText()).includes("100% · 1/1"));
  await p
    .getByRole("button", { name: "업무 대상 · 맵에서 보기 ↗", exact: true })
    .click();
  await p
    .getByRole("button", {
      name: "검증 업무 · 완료 · 로컬 담당자",
      exact: true,
    })
    .waitFor();
  fs.writeFileSync(
    "evidence/p3/004-browser.json",
    JSON.stringify({
      passed: [
        "로컬명부 생성·배정",
        "업무 상태 변경·진행률0→100",
        "업무→노드 이동·Inspector 담당자/상태 일치",
      ],
    }),
  );
  console.log("004 PASS");
} catch (err) {
  fs.writeFileSync(
    "evidence/p3/004-failure.txt",
    await p.locator("body").innerText(),
  );
  throw err;
} finally {
  await e.close();
}
