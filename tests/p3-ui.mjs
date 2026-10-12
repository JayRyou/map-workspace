export async function setupProject(p, url) {
  await p.goto(url);
  await p
    .getByRole("button", { name: "작업 공간·프로젝트·맵 만들기", exact: true })
    .click();
  for (const [tab, name] of [
    ["작업 공간", "로컬 공간"],
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
}
export async function addNode(p, label) {
  await p.getByRole("button", { name: "＋ 요소", exact: true }).click();
  await p.locator("dialog input[name=label]").fill(label);
  await p.getByRole("button", { name: "요소 만들기", exact: true }).click();
}
