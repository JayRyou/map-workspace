import { openBrowser } from "./browser-utils.mjs";
import { setupProject, addNode } from "./p3-ui.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
const env = await openBrowser(),
  p = env.page,
  key = "map-workspace:p3:workspace-local:v3",
  checks = [],
  errors = [],
  external = [],
  httpErrors = [];
p.setDefaultTimeout(12000);
p.on("dialog", (d) => d.accept());
p.on("pageerror", (e) => errors.push(e.message));
p.on("request", (r) => {
  if (/^http/.test(r.url()) && !r.url().startsWith(env.url))
    external.push(r.url());
});
p.on("response", (r) => {
  if (r.status() >= 400) httpErrors.push(r.url());
});
const ck = (name, ok, detail) => {
  checks.push({ name, pass: !!ok, detail });
  assert(ok, name);
};
const saved = () =>
  p
    .locator(".statebar")
    .getByText("이 기기에서 저장됨", { exact: true })
    .waitFor();
const doc = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
const record = async () => {
  const d = await doc();
  return d.maps.find((m) => m.map.id === d.active.mapId);
};
const open = async (name) => {
  await p.getByRole("button", { name: "결정·업무", exact: true }).click();
  await p.locator("dialog").getByRole("button", { name, exact: true }).click();
};
try {
  await setupProject(p, env.url);
  ck(
    "작업공간→프로젝트→빈맵",
    await p.getByRole("button", { name: "첫 요소 추가" }).isVisible(),
  );
  const width = await p
    .locator(".canvas-column")
    .evaluate((x) => x.getBoundingClientRect().width);
  ck("1440 캔버스60% 이상", width / 1440 >= 0.6, {
    width,
    ratio: width / 1440,
  });
  for (const [i, name] of ["요소 A", "요소 B", "요소 C"].entries()) {
    await addNode(p, name);
    await p.getByLabel("X 좌표", { exact: true }).fill(String(100 + i * 260));
    await p.getByRole("button", { name: "위치 적용", exact: true }).click();
  }
  await saved();
  const ids = (await record()).map.nodes.map((n) => n.id);
  ck("3노드 실제생성", ids.length === 3);
  for (const [a, b] of [
    [0, 1],
    [1, 2],
    [2, 0],
  ]) {
    await p.getByRole("button", { name: "↗ 연결", exact: true }).click();
    await p.locator("dialog select[name=source]").selectOption(ids[a]);
    await p.locator("dialog select[name=target]").selectOption(ids[b]);
    await p.getByRole("button", { name: "연결 만들기", exact: true }).click();
  }
  await saved();
  ck("일반 그래프 순환 허용", (await record()).map.edges.length === 3);
  await p.getByRole("button", { name: "↗ 연결", exact: true }).click();
  await p.locator("dialog select[name=source]").selectOption(ids[0]);
  await p.locator("dialog select[name=target]").selectOption(ids[1]);
  await p.getByRole("button", { name: "연결 만들기", exact: true }).click();
  ck("중복 연결 거부", await p.locator("dialog .form-error").isVisible());
  await p.keyboard.press("Escape");
  await p.getByRole("button", { name: "목록", exact: true }).click();
  await p.getByRole("button", { name: "요소 A 아이디어", exact: true }).click();
  await p.getByLabel("태그 · 쉼표로 구분").fill("검수, 중요");
  await p
    .getByLabel("설명", { exact: true })
    .fill("<img src=x onerror=alert(1)> 설명");
  await p.getByRole("button", { name: "내용 적용", exact: true }).click();
  ck(
    "HTML 실행요소 삽입없음",
    (await p.locator(".inspector img").count()) === 0,
  );
  await p.getByLabel("요소 검색").fill("중요");
  ck("메타데이터 검색", (await p.locator(".element-row").count()) === 1);
  await p.getByLabel("요소 검색").fill("");
  await p
    .getByRole("checkbox", { name: "요소 B 다중 선택", exact: true })
    .check();
  await p.getByRole("button", { name: "▢ 그룹", exact: true }).click();
  await p.locator("dialog input[name=label]").fill("핵심 흐름");
  await p.getByRole("button", { name: "그룹 만들기", exact: true }).click();
  await saved();
  let before = await record();
  ck(
    "2노드 그룹 상대좌표",
    before.map.nodes.filter((n) => n.groupId).length === 2,
  );
  await p.getByLabel("X 좌표", { exact: true }).fill("200");
  await p.getByRole("button", { name: "위치 적용", exact: true }).click();
  await p.locator(".inspector input[name=width]").fill("680");
  await p.getByRole("button", { name: "크기 적용", exact: true }).click();
  await saved();
  let grouped = await record();
  ck(
    "그룹 위치·크기 편집",
    grouped.map.groups[0].position.x === 200 &&
      grouped.map.groups[0].size.width === 680,
  );
  await p.getByRole("button", { name: "되돌리기", exact: true }).click();
  await p.getByRole("button", { name: "다시 실행", exact: true }).click();
  await saved();
  assert.deepEqual((await record()).map, grouped.map);
  ck("복합 Undo/Redo 정확", true);
  await p.getByRole("button", { name: "요소 A 아이디어", exact: true }).click();
  await p
    .getByRole("checkbox", { name: "요소 B 다중 선택", exact: true })
    .check();
  await p.getByRole("button", { name: "선택 삭제 (2)", exact: true }).click();
  await p.getByRole("button", { name: "선택 삭제 확인", exact: true }).click();
  await saved();
  ck("다중삭제 dangling edge0", (await record()).map.edges.length === 0);
  await p.getByRole("button", { name: "되돌리기", exact: true }).click();
  await saved();
  assert.deepEqual((await record()).map, grouped.map);
  ck("다중삭제 Undo ID/좌표/관계 동일", true);
  await p.getByRole("button", { name: "맵", exact: true }).click();
  await p
    .locator(".canvas-footer")
    .getByRole("button", { name: "전체 보기", exact: true })
    .click();
  await saved();
  const node = p.locator('.react-flow__node[data-id="' + ids[2] + '"]');
  const box = await node.boundingBox(),
    oldHistory = Number(
      (await p.locator(".statebar").innerText()).match(/이력 (\d+)/)[1],
    );
  await p.mouse.move(box.x + 60, box.y + 35);
  await p.mouse.down();
  await p.mouse.move(box.x + 140, box.y + 90, { steps: 15 });
  await p.mouse.up();
  await saved();
  const after = await node.boundingBox();
  ck(
    "드래그15단계 단일이력",
    Number(
      (await p.locator(".statebar").innerText()).match(/이력 (\d+)/)[1],
    ) ===
      oldHistory + 1,
  );
  await p.getByRole("button", { name: "되돌리기", exact: true }).click();
  await saved();
  ck(
    "드래그 Undo 위치복원",
    Math.abs((await node.boundingBox()).x - box.x) < 1 &&
      Math.abs(after.x - box.x) > 30,
  );
  await p.locator("#main").dispatchEvent("compositionstart");
  for (const key of ["Delete", "Escape", "z"])
    await p
      .locator("#main")
      .dispatchEvent("keydown", {
        key,
        ctrlKey: key === "z",
        isComposing: true,
        bubbles: true,
      });
  await p.locator("#main").dispatchEvent("compositionend");
  ck(
    "합성 IME 단축키 보호",
    (await p.locator("dialog").count()) === 0 &&
      (await p.locator(".react-flow__node-mapNode").count()) === 3,
  );
  await p.getByRole("button", { name: "목록", exact: true }).click();
  await p.getByRole("button", { name: "요소 A 아이디어", exact: true }).click();
  await open("담당자 명부");
  await p.getByLabel("담당자 이름", { exact: true }).fill("검수 담당자");
  await p.getByRole("button", { name: "담당자 추가", exact: true }).click();
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  await open("정책·의사결정");
  await p.getByRole("button", { name: "결정 추가", exact: true }).click();
  await p.getByLabel("결정 제목", { exact: true }).fill("키보드 접근 우선");
  await p.getByLabel("결정 상태", { exact: true }).selectOption("accepted");
  await p
    .getByLabel("결정 근거", { exact: true })
    .fill("입력 접근성 검토 결과");
  await p.getByRole("button", { name: "결정 저장", exact: true }).click();
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  await open("업무 관리");
  await p.getByRole("button", { name: "업무 추가", exact: true }).click();
  await p.getByLabel("업무 제목", { exact: true }).fill("접근성 점검");
  await p.getByLabel("업무 상태", { exact: true }).selectOption("doing");
  await p.getByLabel("검수 담당자", { exact: true }).check();
  await p.getByLabel("키보드 접근 우선", { exact: true }).check();
  await p.getByRole("button", { name: "업무 저장", exact: true }).click();
  let data = await doc();
  ck(
    "결정 확정≠업무 완료",
    data.decisions[0].status === "accepted" && data.tasks[0].status === "doing",
  );
  ck(
    "명부·노드·결정 다중참조",
    data.tasks[0].personIds.length === 1 &&
      data.tasks[0].nodeRefs.length === 1 &&
      data.tasks[0].decisionIds.length === 1,
  );
  ck("진행률0%", (await p.locator("dialog").innerText()).includes("0% · 0/1"));
  await p.getByRole("button", { name: "업무 수정", exact: true }).click();
  await p.getByLabel("업무 상태", { exact: true }).selectOption("done");
  await p.getByRole("button", { name: "업무 저장", exact: true }).click();
  ck(
    "완료시100%",
    (await p.locator("dialog").innerText()).includes("100% · 1/1"),
  );
  await p
    .getByRole("button", { name: "요소 A · 맵에서 보기 ↗", exact: true })
    .click();
  await p.getByLabel("요소 이름", { exact: true }).waitFor();
  ck(
    "업무→노드 이동",
    (await p.getByLabel("요소 이름", { exact: true }).inputValue()) ===
      "요소 A",
  );
  await p
    .getByRole("button", { name: "키보드 접근 우선 · 확정", exact: true })
    .click();
  ck(
    "노드→결정 상세 직접 이동",
    (await p.getByLabel("결정 제목", { exact: true }).inputValue()) ===
      "키보드 접근 우선",
  );
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  await saved();
  before = await doc();
  await p.reload();
  await saved();
  data = await doc();
  assert.deepEqual({ ...data, savedAt: "" }, { ...before, savedAt: "" });
  ck("전체 도메인 reload 동일", true);
  await p.getByRole("button", { name: "백업·복원", exact: true }).click();
  const [dl] = await Promise.all([
    p.waitForEvent("download"),
    p.getByRole("button", { name: "P3 전체 백업 내려받기" }).click(),
  ]);
  const raw = fs.readFileSync(await dl.path());
  await p
    .getByLabel("P3 백업 가져오기")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: raw,
    });
  await p.getByRole("button", { name: "P3 백업으로 교체 확인" }).click();
  assert.deepEqual((await doc()).tasks, data.tasks);
  ck("한 사용자 여정 백업/복원 완료", true);
  await p.getByRole("button", { name: "대화상자 닫기" }).click();
  for (const width of [390, 768, 1440, 1920]) {
    await p.setViewportSize({ width, height: width < 800 ? 950 : 1080 });
    await p.reload();
    await saved();
    ck(
      width + " 문서 가로넘침0",
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    if (width < 800) {
      ck(width + " 목록 대안", await p.locator(".element-list").isVisible());
      await p
        .getByRole("button", { name: "요소 A 아이디어", exact: true })
        .click();
      await p.waitForFunction(
        () => document.activeElement.getAttribute("aria-label") === "상세 닫기",
      );
      ck(width + " 상세 초점", true);
      await p.screenshot({ path: "screenshots/p3-" + width + "-detail.png" });
      await p.getByRole("button", { name: "상세 닫기", exact: true }).click();
      await p.getByRole("button", { name: "결정·업무", exact: true }).click();
      ck(
        width + " 모바일 도메인 접근",
        await p
          .locator("dialog")
          .getByRole("button", { name: "담당자 명부", exact: true })
          .isVisible(),
      );
      await p.keyboard.press("Escape");
    } else {
      await p.getByRole("button", { name: "맵", exact: true }).click();
      await p
        .locator(".canvas-footer")
        .getByRole("button", { name: "전체 보기", exact: true })
        .click();
      await saved();
    }
    await p.screenshot({ path: "screenshots/p3-" + width + ".png" });
  }
  await p.setViewportSize({ width: 720, height: 500 });
  await p.getByRole("button", { name: "＋ 요소", exact: true }).focus();
  await p.keyboard.press("Enter");
  await p.locator("dialog input[name=label]").fill("확대 대안");
  for (let i = 0; i < 9; i++) await p.keyboard.press("Tab");
  ck(
    "dialog Tab 초점순환",
    await p.evaluate(() =>
      document.querySelector("dialog").contains(document.activeElement),
    ),
  );
  await p.keyboard.press("Escape");
  ck(
    "Esc 초점복귀",
    await p.evaluate(() => document.activeElement.textContent.includes("요소")),
  );
  ck(
    "720 CSS 200%동등 리플로",
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  ck("JS 콘솔오류0", errors.length === 0, errors);
  ck("외부요청0", external.length === 0, external);
  ck("자산HTTP오류0", httpErrors.length === 0, httpErrors);
  fs.writeFileSync(
    "evidence/p3/final-e2e.json",
    JSON.stringify(
      {
        checks,
        passed: checks.length,
        errors,
        external,
        httpErrors,
        browser: env.browser.version(),
        unverified: [
          "실제 OS IME",
          "native200%",
          "스크린리더",
          "터치실기기",
          "Firefox/Safari",
        ],
      },
      null,
      2,
    ),
  );
  console.log("P3 final E2E PASS", checks.length);
} catch (err) {
  await p.screenshot({ path: "evidence/p3/final-failure.png" }).catch(() => {});
  fs.writeFileSync(
    "evidence/p3/final-failure.json",
    JSON.stringify(
      {
        checks,
        error: String(err),
        errors,
        body: await p.locator("body").innerText(),
      },
      null,
      2,
    ),
  );
  throw err;
} finally {
  await env.close();
}
