import type { ProjectDocument } from "./model.ts";
import { validateMap, validateView, bytes } from "../graph/validation.ts";
export const MAX_BYTES = 10 * 1048576;
export function insist(ok: unknown, msg: string): asserts ok {
  if (!ok) throw new Error(msg);
}
export function object(x: unknown, keys: string[]): Record<string, any> {
  insist(
    x && typeof x === "object" && !Array.isArray(x),
    "객체 형식이 필요합니다.",
  );
  for (const k of Object.keys(x))
    insist(
      keys.includes(k) &&
        !["__proto__", "constructor", "prototype"].includes(k),
      "지원하지 않는 필드: " + k,
    );
  return x as Record<string, any>;
}
export function string(
  x: unknown,
  max = 200,
  required = true,
): asserts x is string {
  insist(
    typeof x === "string" && x.length <= max && (!required || x.trim()),
    "문자열 길이/형식을 확인하세요. 최대 " + max + "자",
  );
}
export function identity(x: unknown) {
  string(x, 100);
  insist(/^[A-Za-z0-9_-]+$/.test(x), "ID 형식이 잘못됐습니다.");
}
export function array(x: unknown, max: number): asserts x is any[] {
  insist(
    Array.isArray(x) && x.length <= max,
    "배열 개수 한도 " + max + "개를 확인하세요.",
  );
}
export function stamp(x: unknown, nullable = false) {
  if (nullable && x === null) return;
  string(x, 40);
  insist(
    /^\d{4}-\d\d-\d\dT/.test(x) && Number.isFinite(Date.parse(x)),
    "날짜/시각이 잘못됐습니다.",
  );
}
export function life(x: Record<string, any>) {
  stamp(x.archivedAt, true);
  stamp(x.deletedAt, true);
}
export function validateProject(input: unknown): ProjectDocument {
  const d = object(input, [
    "format",
    "schemaVersion",
    "workspaces",
    "projects",
    "maps",
    "active",
    "savedAt",
    "decisions",
    "tasks",
    "roster",
    "migrations",
  ]);
  insist(
    d.format === "map-workspace-project-local" && d.schemaVersion === 3,
    "P3 로컬 백업 v3만 지원합니다.",
  );
  stamp(d.savedAt);
  array(d.workspaces, 20);
  array(d.projects, 100);
  array(d.maps, 100);
  const ids = new Set<string>();
  const add = (s: unknown) => {
    identity(s);
    insist(!ids.has(s as string), "중복 ID");
    ids.add(s as string);
  };
  for (const w of d.workspaces) {
    object(w, ["id", "name", "archivedAt", "deletedAt"]);
    add(w.id);
    string(w.name);
    life(w);
  }
  for (const p of d.projects) {
    object(p, [
      "id",
      "workspaceId",
      "name",
      "description",
      "archivedAt",
      "deletedAt",
    ]);
    add(p.id);
    string(p.name);
    string(p.description, 10000, false);
    life(p);
    insist(
      d.workspaces.some((w: any) => w.id === p.workspaceId),
      "프로젝트의 작업 공간 참조 오류",
    );
  }
  for (const m of d.maps) {
    object(m, ["projectId", "map", "view", "archivedAt", "deletedAt"]);
    life(m);
    validateMap(m.map);
    add(m.map.id);
    validateView(m.view, m.map);
    insist(
      d.projects.some((p: any) => p.id === m.projectId),
      "맵의 프로젝트 참조 오류",
    );
  }
  array(d.decisions, 10000);
  for (const x of d.decisions) {
    object(x, [
      "id",
      "projectId",
      "kind",
      "title",
      "status",
      "scope",
      "rationale",
      "notes",
      "options",
      "targetRefs",
      "createdAt",
      "updatedAt",
      "changes",
      "archivedAt",
      "deletedAt",
    ]);
    add(x.id);
    insist(
      d.projects.some((p: any) => p.id === x.projectId),
      "결정 프로젝트 참조 오류",
    );
    insist(
      ["decision", "policy", "discussion"].includes(x.kind),
      "결정 종류 오류",
    );
    insist(
      ["proposed", "evaluating", "accepted", "rejected", "superseded"].includes(
        x.status,
      ),
      "결정 상태 오류",
    );
    insist(["in", "out", "unknown"].includes(x.scope), "결정 범위 오류");
    string(x.title);
    string(x.rationale, 10000, false);
    string(x.notes, 10000, false);
    array(x.options, 20);
    x.options.forEach((v: unknown) => string(v, 2000));
    stamp(x.createdAt);
    stamp(x.updatedAt);
    life(x);
    validateRefs(d, x.targetRefs, x.projectId);
    array(x.changes, 50);
    for (const h of x.changes) {
      object(h, ["at", "summary"]);
      stamp(h.at);
      string(h.summary, 300);
    }
  }
  for (const p of d.projects)
    insist(
      d.decisions.filter((x: any) => x.projectId === p.id).length <= 100,
      "프로젝트 결정100개 한도",
    );
  array(d.migrations, 1000);
  const fingerprints = new Set<string>();
  for (const m of d.migrations) {
    object(m, ["fingerprint", "at"]);
    insist(
      typeof m.fingerprint === "string" &&
        /^[a-f0-9]{64}$/.test(m.fingerprint) &&
        !fingerprints.has(m.fingerprint),
      "이행 fingerprint 오류/중복",
    );
    fingerprints.add(m.fingerprint);
    stamp(m.at);
  }
  array(d.roster, 2000);
  for (const x of d.roster) {
    object(x, ["id", "workspaceId", "displayName", "roleLabel", "archivedAt"]);
    add(x.id);
    string(x.displayName);
    string(x.roleLabel, 200, false);
    stamp(x.archivedAt, true);
    insist(
      d.workspaces.some((w: any) => w.id === x.workspaceId),
      "명부 작업공간 참조 오류",
    );
  }
  for (const w of d.workspaces)
    insist(
      d.roster.filter((x: any) => x.workspaceId === w.id).length <= 100,
      "작업공간 담당자100명 한도",
    );
  array(d.tasks, 20000);
  for (const x of d.tasks) {
    object(x, [
      "id",
      "projectId",
      "title",
      "description",
      "status",
      "priority",
      "startDate",
      "dueDate",
      "personIds",
      "nodeRefs",
      "decisionIds",
      "predecessorIds",
      "createdAt",
      "updatedAt",
      "archivedAt",
      "deletedAt",
    ]);
    add(x.id);
    const p = d.projects.find((p: any) => p.id === x.projectId);
    insist(p, "업무 프로젝트 참조 오류");
    string(x.title);
    string(x.description, 10000, false);
    insist(
      ["todo", "doing", "done", "blocked"].includes(x.status),
      "업무 상태 오류",
    );
    insist(
      ["low", "normal", "high", "urgent"].includes(x.priority),
      "우선순위 오류",
    );
    date(x.startDate);
    date(x.dueDate);
    insist(
      !x.startDate || !x.dueDate || x.startDate <= x.dueDate,
      "마감일은 시작일보다 빠를 수 없습니다.",
    );
    stamp(x.createdAt);
    stamp(x.updatedAt);
    life(x);
    validateRefs(d, x.nodeRefs, x.projectId);
    insist(
      x.nodeRefs.every((r: any) => r.nodeId),
      "업무는 노드 단위로 연결하세요.",
    );
    for (const key of ["personIds", "decisionIds", "predecessorIds"]) {
      array(x[key], key === "personIds" ? 100 : 200);
      insist(new Set(x[key]).size === x[key].length, "중복 업무 참조");
      x[key].forEach(identity);
    }
    for (const id of x.personIds)
      insist(
        d.roster.some(
          (r: any) => r.id === id && r.workspaceId === p.workspaceId,
        ),
        "담당자 명부 참조 오류",
      );
    for (const id of x.decisionIds)
      insist(
        d.decisions.some(
          (v: any) =>
            v.id === id && v.projectId === x.projectId && !v.deletedAt,
        ),
        "결정 참조 오류",
      );
    for (const id of x.predecessorIds)
      insist(
        id !== x.id &&
          d.tasks.some(
            (t: any) =>
              t.id === id && t.projectId === x.projectId && !t.deletedAt,
          ),
        "선행업무 참조 오류",
      );
  }
  for (const p of d.projects) {
    const tasks = d.tasks.filter((t: any) => t.projectId === p.id);
    insist(tasks.length <= 200, "프로젝트 업무200개 한도");
    const visiting = new Set<string>(),
      done = new Set<string>(),
      byId = new Map<string, any>(tasks.map((t: any) => [t.id, t]));
    const visit = (id: string) => {
      if (done.has(id)) return;
      insist(!visiting.has(id), "업무 선행관계의 순환은 허용하지 않습니다.");
      visiting.add(id);
      for (const prev of byId.get(id).predecessorIds) visit(prev);
      visiting.delete(id);
      done.add(id);
    };
    tasks.forEach((t: any) => visit(t.id));
  }
  const a = object(d.active, ["workspaceId", "projectId", "mapId"]);
  const w = d.workspaces.find((x: any) => x.id === a.workspaceId),
    p = d.projects.find((x: any) => x.id === a.projectId),
    m = d.maps.find((x: any) => x.map.id === a.mapId);
  insist(a.workspaceId === null || (w && !w.deletedAt), "활성 작업 공간 오류");
  insist(
    a.projectId === null || (p && !p.deletedAt && p.workspaceId === w?.id),
    "활성 프로젝트 오류",
  );
  insist(
    a.mapId === null || (m && !m.deletedAt && m.projectId === p?.id),
    "활성 맵 오류",
  );
  insist(
    bytes(JSON.stringify(d)) <= MAX_BYTES,
    "전체 로컬 데이터가 10MiB 한도를 초과합니다.",
  );
  return structuredClone(d) as ProjectDocument;
}
export function parseProject(raw: string) {
  insist(bytes(raw) <= MAX_BYTES, "10MiB보다 큰 파일은 가져올 수 없습니다.");
  return validateProject(JSON.parse(raw));
}

export function validateRefs(d: any, refs: unknown, projectId: string) {
  array(refs, 500);
  const keys = new Set<string>();
  for (const v of refs) {
    const r = object(v, ["mapId", "nodeId"]);
    identity(r.mapId);
    if (r.nodeId !== undefined) identity(r.nodeId);
    const m = d.maps.find(
      (m: any) => m.map.id === r.mapId && m.projectId === projectId,
    );
    insist(
      m && (!r.nodeId || m.map.nodes.some((n: any) => n.id === r.nodeId)),
      "다른 프로젝트/없는 맵·노드 참조",
    );
    const key = JSON.stringify([r.mapId, r.nodeId]);
    insist(!keys.has(key), "중복 대상 참조");
    keys.add(key);
  }
}

export function date(x: unknown) {
  if (x === null) return;
  string(x, 10);
  insist(
    /^\d{4}-\d{2}-\d{2}$/.test(x) &&
      Number.isFinite(Date.parse(x)) &&
      new Date(x).toISOString().slice(0, 10) === x,
    "실제 달력 날짜가 필요합니다.",
  );
}
