import test from "node:test";
import assert from "node:assert/strict";
import { emptyDocument, activeMap } from "../src/project/model.ts";
import { projectCommand as run } from "../src/project/commands.ts";
import { validateProject } from "../src/project/validation.ts";
export function fixture() {
  let d = run(emptyDocument(), { type: "workspace", name: "작업 공간" });
  d = run(d, {
    type: "project",
    workspaceId: d.active.workspaceId!,
    name: "프로젝트 A",
  });
  return run(d, { type: "map", projectId: d.active.projectId!, title: "맵 A" });
}
test("A/B 프로젝트 분리와 맵 복제 ID 재발급", () => {
  let d = fixture();
  const a = activeMap(d)!;
  d = run(d, { type: "duplicate", mapId: a.map.id });
  assert.notEqual(d.active.mapId, a.map.id);
  d = run(d, {
    type: "project",
    workspaceId: d.active.workspaceId!,
    name: "B",
  });
  assert.equal(d.active.mapId, null);
  d = run(d, { type: "select", kind: "project", id: a.projectId });
  assert.equal(d.active.mapId, a.map.id);
});
test("보관 읽기 전용·휴지통 복구·30일 영구삭제 보호", () => {
  let d = fixture();
  const id = d.active.projectId!;
  d = run(d, { type: "lifecycle", kind: "project", id, action: "archive" });
  assert.throws(() => run(d, { type: "map", projectId: id, title: "불가" }));
  d = run(d, { type: "lifecycle", kind: "project", id, action: "delete" });
  assert.equal(d.active.projectId, null);
  assert.throws(() =>
    run(d, {
      type: "lifecycle",
      kind: "project",
      id,
      action: "purge",
      confirmation: "영구 삭제",
    }),
  );
  d = run(d, { type: "lifecycle", kind: "project", id, action: "restore" });
  assert.equal(d.active.projectId, id);
  assert.equal(d.maps.length, 1);
});
test("프로젝트 무효참조·중복·임의필드 거부", () => {
  const d = fixture();
  assert.throws(() => validateProject({ ...d, owner: "fake" }));
  d.projects[0].workspaceId = "missing";
  assert.throws(() => validateProject(d));
});

test("보관된 부모 안의 맵 관리 거부 및 영구삭제 보존기간 경과", () => {
  let d = fixture();
  const p = d.active.projectId!,
    m = d.active.mapId!;
  d = run(d, { type: "lifecycle", kind: "project", id: p, action: "archive" });
  assert.throws(() =>
    run(d, { type: "lifecycle", kind: "map", id: m, action: "delete" }),
  );
  d = run(d, { type: "lifecycle", kind: "project", id: p, action: "delete" });
  d.projects[0].deletedAt = "2026-01-01T00:00:00.000Z";
  d = run(d, {
    type: "lifecycle",
    kind: "project",
    id: p,
    action: "purge",
    confirmation: "영구 삭제",
  });
  assert.equal(d.projects.length, 0);
  assert.equal(d.maps.length, 0);
  assert.equal(d.workspaces.length, 1);
});
