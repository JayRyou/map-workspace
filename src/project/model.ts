import type { Map, View } from "../domain/map.ts";
import { emptyMap, defaultView, newId } from "../domain/map.ts";
export type Lifecycle = { archivedAt: string | null; deletedAt: string | null };
export type Workspace = Lifecycle & { id: string; name: string };
export type Project = Lifecycle & {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
};
export type MapRecord = Lifecycle & { projectId: string; map: Map; view: View };
export type TargetRef = { mapId: string; nodeId?: string };
export type Decision = Lifecycle & {
  id: string;
  projectId: string;
  kind: "decision" | "policy" | "discussion";
  title: string;
  status: "proposed" | "evaluating" | "accepted" | "rejected" | "superseded";
  scope: "in" | "out" | "unknown";
  rationale: string;
  notes: string;
  options: string[];
  targetRefs: TargetRef[];
  createdAt: string;
  updatedAt: string;
  changes: { at: string; summary: string }[];
};
export type RosterPerson = {
  id: string;
  workspaceId: string;
  displayName: string;
  roleLabel: string;
  archivedAt: string | null;
};
export type Task = Lifecycle & {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "done" | "blocked";
  priority: "low" | "normal" | "high" | "urgent";
  startDate: string | null;
  dueDate: string | null;
  personIds: string[];
  nodeRefs: TargetRef[];
  decisionIds: string[];
  predecessorIds: string[];
  createdAt: string;
  updatedAt: string;
};
export type ProjectDocument = {
  format: "map-workspace-project-local";
  schemaVersion: 3;
  migrations: { fingerprint: string; at: string }[];
  tasks: Task[];
  roster: RosterPerson[];
  decisions: Decision[];
  workspaces: Workspace[];
  projects: Project[];
  maps: MapRecord[];
  active: {
    workspaceId: string | null;
    projectId: string | null;
    mapId: string | null;
  };
  savedAt: string;
};
export const lifecycle = (): Lifecycle => ({
  archivedAt: null,
  deletedAt: null,
});
export const now = () => new Date().toISOString();
export function emptyDocument(): ProjectDocument {
  return {
    format: "map-workspace-project-local",
    schemaVersion: 3,
    migrations: [],
    tasks: [],
    roster: [],
    decisions: [],
    workspaces: [],
    projects: [],
    maps: [],
    active: { workspaceId: null, projectId: null, mapId: null },
    savedAt: now(),
  };
}
export function newWorkspace(name: string): Workspace {
  return { id: newId("ws"), name, ...lifecycle() };
}
export function newProject(workspaceId: string, name: string): Project {
  return {
    id: newId("project"),
    workspaceId,
    name,
    description: "",
    ...lifecycle(),
  };
}
export function newMapRecord(projectId: string, title = "새 맵"): MapRecord {
  return {
    projectId,
    map: { ...emptyMap(), title },
    view: defaultView(),
    ...lifecycle(),
  };
}
export function activeMap(d: ProjectDocument) {
  return d.maps.find((m) => m.map.id === d.active.mapId);
}
export function readOnly(d: ProjectDocument, m?: MapRecord) {
  const p = d.projects.find(
    (p) => p.id === (m?.projectId || d.active.projectId),
  );
  const w = d.workspaces.find(
    (w) => w.id === (p?.workspaceId || d.active.workspaceId),
  );
  return !!(
    m?.archivedAt ||
    m?.deletedAt ||
    p?.archivedAt ||
    p?.deletedAt ||
    w?.archivedAt ||
    w?.deletedAt
  );
}
export function normalizeActive(d: ProjectDocument) {
  let w = d.workspaces.find(
    (x) => x.id === d.active.workspaceId && !x.deletedAt,
  );
  w ||= d.workspaces.find((x) => !x.deletedAt);
  let p = d.projects.find(
    (x) =>
      x.id === d.active.projectId && x.workspaceId === w?.id && !x.deletedAt,
  );
  p ||= d.projects.find((x) => x.workspaceId === w?.id && !x.deletedAt);
  let m = d.maps.find(
    (x) => x.map.id === d.active.mapId && x.projectId === p?.id && !x.deletedAt,
  );
  m ||= d.maps.find((x) => x.projectId === p?.id && !x.deletedAt);
  d.active = {
    workspaceId: w?.id || null,
    projectId: p?.id || null,
    mapId: m?.map.id || null,
  };
  return d;
}
