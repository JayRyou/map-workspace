import type { ProjectDocument, Decision, TargetRef } from "./model.ts";
import { readOnly, now, lifecycle } from "./model.ts";
import { validateProject, insist } from "./validation.ts";
import { newId } from "../domain/map.ts";
export type DecisionInput = Pick<
  Decision,
  | "projectId"
  | "kind"
  | "title"
  | "status"
  | "scope"
  | "rationale"
  | "notes"
  | "options"
  | "targetRefs"
>;
export function saveDecision(
  source: ProjectDocument,
  input: DecisionInput,
  id?: string,
) {
  const d = structuredClone(source);
  insist(
    d.projects.some((p) => p.id === input.projectId) &&
      !readOnly(d, { projectId: input.projectId } as any),
    "프로젝트가 없거나 읽기 전용입니다.",
  );
  const old = id ? d.decisions.find((x) => x.id === id) : undefined;
  if (id)
    insist(
      old && old.projectId === input.projectId && !old.deletedAt,
      "결정을 찾을 수 없습니다.",
    );
  const at = now();
  const x: Decision = {
    ...input,
    id: old?.id || newId("decision"),
    createdAt: old?.createdAt || at,
    updatedAt: at,
    ...lifecycle(),
    changes: [
      ...(old?.changes || []),
      {
        at,
        summary: old
          ? "내용/상태 변경: " + old.status + " → " + input.status
          : "생성: " + input.status,
      },
    ].slice(-50),
  };
  if (old) d.decisions[d.decisions.indexOf(old)] = x;
  else d.decisions.push(x);
  d.savedAt = at;
  return validateProject(d);
}
export function deleteDecision(source: ProjectDocument, id: string) {
  const d = structuredClone(source),
    x = d.decisions.find((x) => x.id === id);
  insist(
    x && !readOnly(d, { projectId: x.projectId } as any),
    "결정이 없거나 읽기 전용입니다.",
  );
  x.deletedAt = now();
  x.updatedAt = now();
  d.savedAt = now();
  return validateProject(reconcileDomains(d));
}
export function validRefs(
  d: ProjectDocument,
  refs: TargetRef[],
  projectId: string,
) {
  return refs.filter((r) =>
    d.maps.some(
      (m) =>
        m.projectId === projectId &&
        m.map.id === r.mapId &&
        (!r.nodeId || m.map.nodes.some((n) => n.id === r.nodeId)),
    ),
  );
}
export function reconcileDomains(d: ProjectDocument) {
  d.decisions = d.decisions.filter((x) =>
    d.projects.some((p) => p.id === x.projectId),
  );
  for (const x of d.decisions)
    x.targetRefs = validRefs(d, x.targetRefs, x.projectId);
  d.roster = d.roster.filter((x) =>
    d.workspaces.some((w) => w.id === x.workspaceId),
  );
  d.tasks = d.tasks.filter((x) => d.projects.some((p) => p.id === x.projectId));
  for (const t of d.tasks) {
    t.nodeRefs = validRefs(d, t.nodeRefs, t.projectId);
    t.decisionIds = t.decisionIds.filter((id) =>
      d.decisions.some((x) => x.id === id && !x.deletedAt),
    );
    t.predecessorIds = t.predecessorIds.filter((id) =>
      d.tasks.some((x) => x.id === id && !x.deletedAt),
    );
    t.personIds = t.personIds.filter((id) => d.roster.some((x) => x.id === id));
  }
  return d;
}
