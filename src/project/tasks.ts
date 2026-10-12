import type { ProjectDocument, Task } from "./model.ts";
import { readOnly, now, lifecycle } from "./model.ts";
import { validateProject, insist } from "./validation.ts";
import { newId } from "../domain/map.ts";
import { reconcileDomains } from "./decisions.ts";
export type TaskInput = Pick<
  Task,
  | "projectId"
  | "title"
  | "description"
  | "status"
  | "priority"
  | "startDate"
  | "dueDate"
  | "personIds"
  | "nodeRefs"
  | "decisionIds"
  | "predecessorIds"
>;
export function saveTask(
  source: ProjectDocument,
  input: TaskInput,
  id?: string,
) {
  const d = structuredClone(source);
  insist(
    d.projects.some((p) => p.id === input.projectId) &&
      !readOnly(d, { projectId: input.projectId } as any),
    "프로젝트가 없거나 읽기 전용입니다.",
  );
  const old = id ? d.tasks.find((t) => t.id === id) : undefined;
  if (id)
    insist(
      old &&
        old.projectId === input.projectId &&
        !old.deletedAt &&
        !old.archivedAt,
      "업무가 없거나 보관 상태입니다.",
    );
  for (const personId of input.personIds) {
    const person = d.roster.find((p) => p.id === personId);
    insist(
      person && (!person.archivedAt || old?.personIds.includes(personId)),
      "보관된 담당자는 새로 배정할 수 없습니다.",
    );
  }
  const at = now(),
    t: Task = {
      ...input,
      id: old?.id || newId("task"),
      ...lifecycle(),
      createdAt: old?.createdAt || at,
      updatedAt: at,
    };
  if (old) d.tasks[d.tasks.indexOf(old)] = t;
  else d.tasks.push(t);
  d.savedAt = at;
  return validateProject(d);
}
export function taskLifecycle(
  source: ProjectDocument,
  id: string,
  action: "delete" | "archive" | "unarchive",
) {
  const d = structuredClone(source),
    t = d.tasks.find((x) => x.id === id);
  insist(
    t && !readOnly(d, { projectId: t.projectId } as any),
    "업무가 없거나 읽기 전용입니다.",
  );
  if (action === "delete") t.deletedAt = now();
  else t.archivedAt = action === "archive" ? now() : null;
  t.updatedAt = now();
  d.savedAt = now();
  return validateProject(reconcileDomains(d));
}
export function savePerson(
  source: ProjectDocument,
  workspaceId: string,
  displayName: string,
  roleLabel: string,
  id?: string,
) {
  const d = structuredClone(source),
    w = d.workspaces.find((w) => w.id === workspaceId);
  insist(w && !w.archivedAt && !w.deletedAt, "작업 공간이 읽기 전용입니다.");
  const old = id
    ? d.roster.find((p) => p.id === id && p.workspaceId === workspaceId)
    : undefined;
  if (id) insist(old && !old.archivedAt, "담당자가 없거나 보관 상태입니다.");
  const p = {
    id: old?.id || newId("person"),
    workspaceId,
    displayName,
    roleLabel,
    archivedAt: null,
  };
  if (old) d.roster[d.roster.indexOf(old)] = p;
  else d.roster.push(p);
  d.savedAt = now();
  return validateProject(d);
}
export function archivePerson(source: ProjectDocument, id: string) {
  const d = structuredClone(source),
    p = d.roster.find((p) => p.id === id);
  insist(p, "담당자가 없습니다.");
  const w = d.workspaces.find((w) => w.id === p.workspaceId);
  insist(w && !w.archivedAt && !w.deletedAt, "작업 공간이 읽기 전용입니다.");
  p.archivedAt = p.archivedAt ? null : now();
  d.savedAt = now();
  return validateProject(d);
}
export function progress(tasks: Task[]) {
  const included = tasks.filter((t) => !t.archivedAt && !t.deletedAt),
    done = included.filter((t) => t.status === "done").length;
  return {
    done,
    total: included.length,
    percent: included.length ? Math.round((done / included.length) * 100) : 0,
  };
}
export function overdue(
  t: Task,
  today = new Date().toLocaleDateString("en-CA"),
) {
  return !!(
    t.dueDate &&
    t.dueDate < today &&
    t.status !== "done" &&
    !t.archivedAt &&
    !t.deletedAt
  );
}
