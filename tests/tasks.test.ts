import test from "node:test";
import assert from "node:assert/strict";
import { emptyDocument } from "../src/project/model.ts";
import { projectCommand as cmd } from "../src/project/commands.ts";
import {
  saveTask,
  taskLifecycle,
  savePerson,
  archivePerson,
  progress,
  overdue,
} from "../src/project/tasks.ts";
import { saveDecision, deleteDecision } from "../src/project/decisions.ts";
function fixture() {
  let d = cmd(emptyDocument(), { type: "workspace", name: "w" });
  return cmd(d, {
    type: "project",
    workspaceId: d.active.workspaceId!,
    name: "p",
  });
}
const input = (d: any) => ({
  projectId: d.active.projectId,
  title: "업무",
  description: "",
  status: "todo" as const,
  priority: "normal" as const,
  startDate: null,
  dueDate: null,
  personIds: [],
  nodeRefs: [],
  decisionIds: [],
  predecessorIds: [],
});
test("업무만 DAG·교차 프로젝트/무효 선행/일정 거부", () => {
  let d = fixture();
  d = saveTask(d, { ...input(d), title: "A" });
  d = saveTask(d, { ...input(d), title: "B", predecessorIds: [d.tasks[0].id] });
  assert.throws(
    () =>
      saveTask(
        d,
        { ...input(d), predecessorIds: [d.tasks[1].id] },
        d.tasks[0].id,
      ),
    /순환/,
  );
  assert.throws(() => saveTask(d, { ...input(d), startDate: "2026-02-30" }));
  assert.throws(() =>
    saveTask(d, {
      ...input(d),
      startDate: "2026-10-12",
      dueDate: "2026-10-11",
    }),
  );
  d = taskLifecycle(d, d.tasks[0].id, "delete");
  assert.equal(d.tasks[1].predecessorIds.length, 0);
});
test("결정 확정≠업무 완료, 보관/차단 분모 및 기한경과", () => {
  let d = fixture();
  d = saveTask(d, input(d));
  d = saveTask(d, { ...input(d), status: "done" });
  d = saveTask(d, { ...input(d), status: "blocked", dueDate: "2026-01-01" });
  assert.deepEqual(progress(d.tasks), { done: 1, total: 3, percent: 33 });
  assert(overdue(d.tasks[2], "2026-10-11"));
  d = taskLifecycle(d, d.tasks[2].id, "archive");
  assert.equal(progress(d.tasks).percent, 50);
  d = saveDecision(d, {
    projectId: d.active.projectId!,
    title: "확정",
    kind: "decision",
    status: "accepted",
    scope: "in",
    rationale: "",
    notes: "",
    options: [],
    targetRefs: [],
  });
  assert.equal(progress(d.tasks).percent, 50);
});
test("명부 보관은 배정보존·새 배정거부, 결정삭제 참조해제", () => {
  let d = fixture();
  d = savePerson(d, d.active.workspaceId!, "마스터", "개발");
  const person = d.roster[0].id;
  d = saveTask(d, { ...input(d), personIds: [person] });
  d = archivePerson(d, person);
  assert.equal(d.tasks[0].personIds[0], person);
  assert.throws(() => saveTask(d, { ...input(d), personIds: [person] }));
  d = saveDecision(d, {
    projectId: d.active.projectId!,
    title: "결정",
    kind: "decision",
    status: "accepted",
    scope: "in",
    rationale: "",
    notes: "",
    options: [],
    targetRefs: [],
  });
  d = saveTask(d, { ...input(d), decisionIds: [d.decisions[0].id] });
  d = deleteDecision(d, d.decisions[0].id);
  assert.equal(d.tasks[1].decisionIds.length, 0);
});

test("다른 프로젝트의 업무·결정 및 다른 작업공간 담당자 참조 거부", () => {
  let d = fixture();
  const a = d.active.projectId!,
    w = d.active.workspaceId!;
  d = saveTask(d, input(d));
  const t = d.tasks[0].id;
  d = cmd(d, { type: "project", workspaceId: w, name: "B" });
  assert.throws(() => saveTask(d, { ...input(d), predecessorIds: [t] }));
  d = cmd(d, { type: "workspace", name: "다른 공간" });
  d = savePerson(d, d.active.workspaceId!, "다른 담당자", "");
  const person = d.roster[0].id;
  d = cmd(d, { type: "select", kind: "project", id: a });
  assert.throws(() => saveTask(d, { ...input(d), personIds: [person] }));
});
