import { parseDocument } from "../graph/validation.ts";
import type { ProjectDocument } from "./model.ts";
import {
  newWorkspace,
  newProject,
  normalizeActive,
  now,
  lifecycle,
} from "./model.ts";
import { validateProject, insist } from "./validation.ts";
import { newId } from "../domain/map.ts";
export async function previewP2(raw: string) {
  const doc = parseDocument(raw);
  for (const e of [...doc.map.nodes, ...doc.map.edges, ...doc.map.groups])
    insist(
      Object.keys(e.metadata).every((k) =>
        ["description", "notes"].includes(k),
      ),
      "P2 원본 계약에 없는 확장 메타데이터입니다. P3 백업으로 가져오세요.",
    );
  const canonical = JSON.stringify({ map: doc.map, view: doc.view });
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  const fingerprint = Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  return { doc, fingerprint, raw };
}
export function migrateP2(
  source: ProjectDocument,
  preview: Awaited<ReturnType<typeof previewP2>>,
) {
  const d = structuredClone(source);
  insist(
    !d.migrations.some((x) => x.fingerprint === preview.fingerprint),
    "같은 P2 문서는 이미 이행했습니다. 중복 추가하지 않습니다.",
  );
  let w = d.workspaces.find(
    (w) => w.id === d.active.workspaceId && !w.archivedAt && !w.deletedAt,
  );
  if (!w) {
    w = newWorkspace("P2 가져온 작업 공간");
    d.workspaces.push(w);
  }
  const p = newProject(
    w.id,
    "P2 이행 · " + preview.doc.map.title.slice(0, 180),
  );
  d.projects.push(p);
  const map = structuredClone(preview.doc.map);
  if (d.maps.some((m) => m.map.id === map.id)) map.id = newId("map");
  d.maps.push({
    projectId: p.id,
    map,
    view: structuredClone(preview.doc.view),
    ...lifecycle(),
  });
  d.migrations.push({ fingerprint: preview.fingerprint, at: now() });
  d.active = { workspaceId: w.id, projectId: p.id, mapId: map.id };
  d.savedAt = now();
  return validateProject(normalizeActive(d));
}
