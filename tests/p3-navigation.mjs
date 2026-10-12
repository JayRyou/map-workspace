import { openBrowser } from "./browser-utils.mjs";
import { setupProject, addNode } from "./p3-ui.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
const env = await openBrowser(),
  p = env.page,
  key = "map-workspace:p3:workspace-local:v3",
  checks = [];
p.setDefaultTimeout(10000);
let accept = true,
  dialogs = 0;
p.on("dialog", (d) => {
  dialogs++;
  return accept ? d.accept() : d.dismiss();
});
const saved = () =>
  p
    .locator(".statebar")
    .getByText("이 기기에서 저장됨", { exact: true })
    .waitFor();
try {
  await setupProject(p, env.url);
  await addNode(p, "A 노드");
  await p.getByRole("button", { name: "관리", exact: true }).click();
  for (const [tab, name] of [
    ["프로젝트", "프로젝트 B"],
    ["맵", "맵 B"],
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
  await addNode(p, "B 노드");
  for (let i = 0; i < 4; i++) {
    await p
      .getByLabel("프로젝트 선택")
      .selectOption({ label: i % 2 ? "프로젝트 B" : "프로젝트 A" });
    await p.getByLabel("요소 이름", { exact: true }).waitFor();
    assert.equal(
      await p.getByLabel("요소 이름", { exact: true }).inputValue(),
      i % 2 ? "B 노드" : "A 노드",
    );
  }
  await saved();
  await p.reload();
  await saved();
  assert.equal(
    await p.getByLabel("요소 이름", { exact: true }).inputValue(),
    "B 노드",
  );
  checks.push("A/B 각자맵·노드 빠른4회전환·reload 격리");
  await p.getByLabel("요소 이름", { exact: true }).fill("미적용 초안");
  accept = false;
  const beforeDialogs = dialogs;
  await p.getByLabel("프로젝트 선택").selectOption({ label: "프로젝트 A" });
  assert.equal(
    await p.getByLabel("요소 이름", { exact: true }).inputValue(),
    "미적용 초안",
  );
  assert(dialogs > beforeDialogs);
  checks.push("미적용 Inspector 초안 전환취소 보존");
  accept = true;
  await p.getByRole("button", { name: "내용 적용", exact: true }).click();
  await p.getByRole("button", { name: "관리", exact: true }).click();
  const row = p
    .locator("dialog .catalog-row")
    .filter({ hasText: "프로젝트 B" });
  await row.getByRole("button", { name: "보관", exact: true }).click();
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  assert(
    await p
      .getByRole("button", { name: "내용 적용", exact: true })
      .isDisabled(),
  );
  checks.push("보관 프로젝트 Inspector 읽기전용");
  await p.getByRole("button", { name: "관리", exact: true }).click();
  await row.getByRole("button", { name: "보관 해제", exact: true }).click();
  await row.getByRole("button", { name: "삭제", exact: true }).click();
  await p.getByLabel("휴지통 보기").check();
  await p
    .locator("dialog .catalog-row")
    .filter({ hasText: "프로젝트 B" })
    .getByRole("button", { name: "복구", exact: true })
    .click();
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  await p.getByLabel("프로젝트 선택").selectOption({ label: "프로젝트 B" });
  await saved();
  assert.equal(
    await p.getByLabel("요소 이름", { exact: true }).inputValue(),
    "미적용 초안",
  );
  checks.push("프로젝트 삭제·휴지통 복구 하위맵 보존");
  await p.getByRole("button", { name: "관리", exact: true }).click();
  await p
    .locator("dialog")
    .getByRole("button", { name: "맵", exact: true })
    .click();
  await p
    .locator("dialog .catalog-row")
    .getByRole("button", { name: "수정", exact: true })
    .click();
  await p.getByLabel("변경 이름", { exact: true }).fill("바꾼 맵 이름");
  await p.getByRole("button", { name: "이름·설명 적용", exact: true }).click();
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  assert.equal(
    await p.getByLabel("맵 제목", { exact: true }).inputValue(),
    "바꾼 맵 이름",
  );
  await addNode(p, "이름 변경 이후 요소");
  await saved();
  await p.reload();
  await saved();
  assert.equal(
    await p.getByLabel("맵 제목", { exact: true }).inputValue(),
    "바꾼 맵 이름",
  );
  checks.push("관리자 맵이름 변경이 편집·reload 후 유지");
  const d = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
  assert.equal(d.maps.length, 2);
  fs.writeFileSync(
    "evidence/p3/navigation.json",
    JSON.stringify({ checks, passed: checks.length }, null, 2),
  );
  console.log("Navigation PASS", checks.length);
} catch (err) {
  fs.writeFileSync(
    "evidence/p3/navigation-failure.txt",
    await p.locator("body").innerText(),
  );
  throw err;
} finally {
  await env.close();
}
