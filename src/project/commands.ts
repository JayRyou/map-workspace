import { reconcileDomains } from "./decisions.ts";
import type { ProjectDocument, MapRecord } from "./model.ts";
import {
  newWorkspace,
  newProject,
  newMapRecord,
  normalizeActive,
  readOnly,
  now,
} from "./model.ts";
import { validateProject, insist } from "./validation.ts";
import { newId, cleanView, defaultView } from "../domain/map.ts";
export type ProjectCommand =
  | { type: "workspace"; name: string }
  | { type: "project"; workspaceId: string; name: string }
  | { type: "map"; projectId: string; title: string }
  | { type: "select"; kind: "workspace" | "project" | "map"; id: string }
  | {
      type: "rename";
      kind: "workspace" | "project" | "map";
      id: string;
      name: string;
      description?: string;
    }
  | {
      type: "lifecycle";
      kind: "workspace" | "project" | "map";
      id: string;
      action: "archive" | "unarchive" | "delete" | "restore" | "purge";
      confirmation?: string;
    }
  | { type: "duplicate"; mapId: string }
  | { type: "editor"; record: MapRecord };
export function projectCommand(
  source: ProjectDocument,
  c: ProjectCommand,
): ProjectDocument {
  const d = structuredClone(source);
  const find = (kind: string, id: string) => {
    const x =
      kind === "workspace"
        ? d.workspaces.find((x) => x.id === id)
        : kind === "project"
          ? d.projects.find((x) => x.id === id)
          : d.maps.find((x) => x.map.id === id);
    insist(x, "대상이 없습니다.");
    return x;
  };
  switch (c.type) {
    case "workspace": {
      const w = newWorkspace(c.name);
      d.workspaces.push(w);
      d.active = { workspaceId: w.id, projectId: null, mapId: null };
      break;
    }
    case "project": {
      const w = find("workspace", c.workspaceId);
      insist(
        !w.archivedAt && !w.deletedAt,
        "보관/삭제한 작업 공간은 읽기 전용입니다.",
      );
      const p = newProject(c.workspaceId, c.name);
      d.projects.push(p);
      d.active = { workspaceId: c.workspaceId, projectId: p.id, mapId: null };
      break;
    }
    case "map": {
      const p = d.projects.find((x) => x.id === c.projectId);
      insist(
        p && !readOnly(d, { projectId: c.projectId } as MapRecord),
        "읽기 전용 프로젝트입니다.",
      );
      const m = newMapRecord(c.projectId, c.title);
      d.maps.push(m);
      d.active = {
        workspaceId: p.workspaceId,
        projectId: p.id,
        mapId: m.map.id,
      };
      break;
    }
    case "select": {
      const x = find(c.kind, c.id);
      insist(!x.deletedAt, "삭제한 항목은 복구 후 선택하세요.");
      if (c.kind === "workspace")
        d.active = { workspaceId: c.id, projectId: null, mapId: null };
      else if (c.kind === "project") {
        const p = d.projects.find((x) => x.id === c.id)!;
        d.active = { workspaceId: p.workspaceId, projectId: p.id, mapId: null };
      } else {
        const m = d.maps.find((x) => x.map.id === c.id)!,
          p = d.projects.find((x) => x.id === m.projectId)!;
        d.active = { workspaceId: p.workspaceId, projectId: p.id, mapId: c.id };
      }
      break;
    }
    case "rename": {
      const x = find(c.kind, c.id);
      insist(
        !x.deletedAt && !x.archivedAt,
        "보관/삭제한 항목은 읽기 전용입니다.",
      );
      if ("map" in x) {
        insist(!readOnly(d, x), "읽기 전용입니다.");
        x.map.title = c.name;
      } else {
        if ("workspaceId" in x)
          insist(
            !readOnly(d, { projectId: x.id } as MapRecord),
            "읽기 전용입니다.",
          );
        x.name = c.name;
        if ("description" in x && c.description !== undefined)
          x.description = c.description;
      }
      break;
    }
    case "duplicate": {
      const m = find("map", c.mapId) as MapRecord;
      insist(!readOnly(d, m), "읽기 전용 맵은 복제할 수 없습니다.");
      const copy = structuredClone(m);
      const ids = new Map(
        [...copy.map.nodes, ...copy.map.groups, ...copy.map.edges].map((x) => [
          x.id,
          newId("el"),
        ]),
      );
      copy.map.id = newId("map");
      copy.map.title = copy.map.title.slice(0, 190) + " 사본";
      for (const x of [
        ...copy.map.nodes,
        ...copy.map.groups,
        ...copy.map.edges,
      ])
        x.id = ids.get(x.id)!;
      for (const n of copy.map.nodes)
        if (n.groupId) n.groupId = ids.get(n.groupId);
      for (const e of copy.map.edges) {
        e.sourceNodeId = ids.get(e.sourceNodeId)!;
        e.targetNodeId = ids.get(e.targetNodeId)!;
      }
      copy.view = defaultView();
      d.maps.push(copy);
      d.active.mapId = copy.map.id;
      break;
    }
    case "editor": {
      const i = d.maps.findIndex((x) => x.map.id === c.record.map.id);
      insist(i >= 0, "열린 맵을 찾을 수 없습니다.");
      insist(
        c.record.projectId === d.maps[i].projectId,
        "프로젝트 간 이동은 허용하지 않습니다.",
      );
      if (readOnly(d, d.maps[i]))
        insist(
          JSON.stringify(d.maps[i].map) === JSON.stringify(c.record.map),
          "보관한 맵은 읽기 전용입니다.",
        );
      d.maps[i] = {
        ...d.maps[i],
        map: c.record.map,
        view: cleanView(c.record.map, c.record.view),
      };
      break;
    }
    case "lifecycle": {
      const x = find(c.kind, c.id);
      if ("map" in x)
        insist(
          !readOnly(d, { projectId: x.projectId } as MapRecord),
          "상위 프로젝트가 읽기 전용입니다.",
        );
      else if ("workspaceId" in x) {
        const w = d.workspaces.find((w) => w.id === x.workspaceId);
        insist(
          w && !w.archivedAt && !w.deletedAt,
          "상위 작업 공간이 읽기 전용입니다.",
        );
      }
      if (c.action === "purge") {
        insist(
          x.deletedAt && Date.now() - Date.parse(x.deletedAt) >= 30 * 86400000,
          "휴지통 보존30일이 지나야 영구 삭제할 수 있습니다.",
        );
        insist(
          c.confirmation === "영구 삭제",
          "영구 삭제 확인 문구가 필요합니다.",
        );
        if (c.kind === "workspace") {
          const ps = new Set(
            d.projects.filter((p) => p.workspaceId === c.id).map((p) => p.id),
          );
          d.maps = d.maps.filter((m) => !ps.has(m.projectId));
          d.projects = d.projects.filter((p) => !ps.has(p.id));
          d.workspaces = d.workspaces.filter((w) => w.id !== c.id);
        } else if (c.kind === "project") {
          d.maps = d.maps.filter((m) => m.projectId !== c.id);
          d.projects = d.projects.filter((p) => p.id !== c.id);
        } else d.maps = d.maps.filter((m) => m.map.id !== c.id);
      } else if (c.action === "archive") x.archivedAt = now();
      else if (c.action === "unarchive") x.archivedAt = null;
      else if (c.action === "delete") x.deletedAt = now();
      else x.deletedAt = null;
      break;
    }
  }
  reconcileDomains(d);
  normalizeActive(d);
  d.savedAt = now();
  return validateProject(d);
}
