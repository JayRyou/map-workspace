import test from "node:test";
import assert from "node:assert/strict";
import { emptyDocument } from "../src/project/model.ts";
import { projectCommand as cmd } from "../src/project/commands.ts";
import { saveDecision, deleteDecision } from "../src/project/decisions.ts";
import { sampleMap } from "../src/fixtures/sample.ts";
function fixture() {
  let d = cmd(emptyDocument(), { type: "workspace", name: "w" });
  d = cmd(d, {
    type: "project",
    workspaceId: d.active.workspaceId!,
    name: "p",
  });
  d = cmd(d, { type: "map", projectId: d.active.projectId!, title: "m" });
  d.maps[0].map = { ...sampleMap(), id: d.active.mapId! };
  return d;
}
const input = (d: any) => ({
  projectId: d.active.projectId,
  title: "결정",
  kind: "decision" as const,
  status: "proposed" as const,
  scope: "unknown" as const,
  rationale: "근거",
  notes: "",
  options: [],
  targetRefs: [{ mapId: d.active.mapId, nodeId: "n_journey" }],
});
test("한 노드 여러 결정·P0 상태·범위·이력·삭제 보존", () => {
  let d = fixture();
  d = saveDecision(d, input(d));
  d = saveDecision(d, input(d));
  assert.equal(d.decisions.length, 2);
  const id = d.decisions[0].id;
  d = saveDecision(d, { ...input(d), status: "accepted", scope: "out" }, id);
  assert.equal(d.decisions[0].changes.length, 2);
  d = deleteDecision(d, id);
  assert(d.decisions[0].deletedAt);
  assert.equal(d.maps[0].map.nodes.length, 6);
});
test("노드 삭제는 결정 본문 유지·참조해제 및 잘못된 관계 거부", () => {
  let d = fixture();
  d = saveDecision(d, input(d));
  const record = structuredClone(d.maps[0]);
  record.map.nodes = record.map.nodes.filter((n) => n.id !== "n_journey");
  record.map.edges = record.map.edges.filter(
    (e) => e.sourceNodeId !== "n_journey" && e.targetNodeId !== "n_journey",
  );
  d = cmd(d, { type: "editor", record });
  assert.equal(d.decisions[0].targetRefs.length, 0);
  assert.equal(d.decisions[0].rationale, "근거");
  assert.throws(() => saveDecision(d, { ...input(d), status: "done" as any }));
  assert.throws(() => saveDecision(d, input(d)));
});
