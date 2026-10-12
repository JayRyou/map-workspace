import { reconcileDomains } from "./project/decisions.ts";
import Backup from "./components/project/Backup.tsx";
import {
  browserProjectRepository,
  PROJECT_KEY,
} from "./repositories/project-local.ts";
import { migrateP2 } from "./project/migration.ts";
import Tasks, { Roster, taskLabels } from "./components/project/Tasks.tsx";
import { progress } from "./project/tasks.ts";
import Decisions, { decisionLabels } from "./components/project/Decisions.tsx";
import type { TargetRef } from "./project/model.ts";
import { useState, useRef, useEffect } from "react";
import App, { Dialog } from "./App.tsx";
import type { EditorHost, EditorControl, EditorRepository } from "./App.tsx";
import Manager from "./components/project/Manager.tsx";
import { activeMap, readOnly } from "./project/model.ts";
import type { ProjectDocument } from "./project/model.ts";
import { projectCommand } from "./project/commands.ts";
import type { ProjectCommand } from "./project/commands.ts";
import { parseDocument } from "./graph/validation.ts";
import type { Map, View } from "./domain/map.ts";
const error = (e: unknown) => (e instanceof Error ? e.message : String(e));
export default function WorkspaceApp() {
  const [repo] = useState(browserProjectRepository),
    [boot] = useState(() => repo.load());
  const [saveState, setSaveState] = useState(
    boot.blocked
      ? "저장 중지 · 초안 보존"
      : repo.expected
        ? "이 기기에서 저장됨"
        : "아직 저장하지 않은 새 작업 공간",
  );
  const [epoch, setEpoch] = useState(0);
  const [doc, setDoc] = useState<ProjectDocument>(boot.document),
    ref = useRef(doc);
  ref.current = doc;
  const [panel, setPanel] = useState<string | null>(null),
    [domainId, setDomainId] = useState<string | undefined>(),
    [notice, setNotice] = useState(boot.error),
    [dirty, setDirty] = useState(false);
  const control = useRef<EditorControl | null>(null),
    staged = useRef<{ map: Map; view: View } | null>(null),
    pendingJump = useRef<TargetRef | null>(null);
  const replace = (next: ProjectDocument) => {
    ref.current = next;
    setDoc(next);
  };
  const persist = (next: ProjectDocument, recover = false) => {
    replace(next);
    try {
      repo.save(next, recover);
      setSaveState("이 기기에서 저장됨");
      return true;
    } catch (e) {
      setSaveState("저장 실패 · 초안은 메모리에 유지");
      setNotice(error(e));
      return false;
    }
  };
  useEffect(() => {
    const change = (e: StorageEvent) => {
      if (e.key === PROJECT_KEY || e.key === null) {
        repo.stop();
        setSaveState("다른 탭 변경 · 저장 중지");
        setNotice(
          "현재 초안을 백업한 뒤 새로고침하거나 명시적으로 복구하세요.",
        );
      }
    };
    window.addEventListener("storage", change);
    return () => window.removeEventListener("storage", change);
  }, [repo]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (saveState !== "이 기기에서 저장됨" || dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [saveState, dirty]);
  const mutate = (c: ProjectCommand) => {
    try {
      const next = projectCommand(ref.current, c);
      setNotice("");
      const ok = persist(next);
      return ok;
    } catch (e) {
      setNotice(error(e));
      return false;
    }
  };
  const leave = () => {
    if (control.current?.isBusy()) {
      setNotice("요소 이동을 마친 뒤 다시 선택하세요.");
      return false;
    }
    if (
      dirty &&
      !confirm("적용하지 않은 입력이 있어요. 입력을 버리고 이동할까요?")
    )
      return false;
    if (control.current && !control.current.flush()) return false;
    if (dirty) {
      document
        .querySelectorAll<HTMLFormElement>(".inspector form,.title-form")
        .forEach((f) => f.reset());
      window.dispatchEvent(new Event("map-discard-input"));
    }
    setDirty(false);
    return true;
  };
  const dispatch = (c: ProjectCommand) => {
    if (!leave()) return false;
    if(c.type==='rename'&&c.kind==='map'&&c.id===ref.current.active.mapId&&control.current){if(!control.current.rename(c.name))return false;return control.current.flush();}
    return mutate(c);
  };
  const apply = (fn: (d: ProjectDocument) => ProjectDocument) => {
    if (!leave()) return false;
    try {
      const next = fn(ref.current);
      setNotice("");
      return persist(next);
    } catch (e) {
      setNotice(error(e));
      return false;
    }
  };
  const jump = (r: TargetRef) => {
    if (!dispatch({ type: "select", kind: "map", id: r.mapId })) return;
    pendingJump.current = r;
    setPanel(null);
  };
  const current = activeMap(doc),
    activeWorkspace = doc.workspaces.find(
      (w) => w.id === doc.active.workspaceId,
    ),
    activeProject = doc.projects.find((p) => p.id === doc.active.projectId);
  if (!current) control.current = null;
  const adapter = useRef<{
    mapId: string;
    repository: EditorRepository;
  } | null>(null);
  if (current && adapter.current?.mapId !== current.map.id) {
    control.current = null;
    staged.current = null;
    const mapId = current.map.id;
    adapter.current = {
      mapId,
      repository: {
        get blocked() {
          return repo.blocked;
        },
        load() {
          const m = ref.current.maps.find((m) => m.map.id === mapId)!;
          return {
            document: {
              format: "map-workspace-map-local",
              schemaVersion: 1,
              map: m.map,
              view: m.view,
              savedAt: ref.current.savedAt,
            },
            blocked: repo.blocked,
            error: repo.blocked ? boot.error : "",
            raw: null,
            backupRaw: null,
          };
        },
        save(raw) {
          const x = parseDocument(raw),
            m = ref.current.maps.find((m) => m.map.id === mapId);
          if (!m) throw new Error("맵이 없습니다.");
          const next = projectCommand(ref.current, {
            type: "editor",
            record: { ...m, map: x.map, view: x.view },
          });
          if (!persist(next))
            throw new Error("P3 저장 실패: 전체 초안은 메모리에 보존됩니다.");
        },
        stop() {
          repo.stop();
        },
        rawValues() {
          return { current: null, previous: null, quarantine: null };
        },
      },
    };
  }
  const open = (name: string, id?: string) => {
    setDomainId(id);
    if (name === "backup") {
      control.current?.flush();
      setPanel(name);
      return;
    }
    if (!leave()) return;
    setPanel(name);
  };
  const host: EditorHost | undefined = current
    ? {
        applied: () => setDirty(false),
        repository: adapter.current!.repository,
        storageKey: PROJECT_KEY,
        readOnly: readOnly(doc, current),
        bind: (x) => {
          control.current = x;
          const target = pendingJump.current;
          if (target && target.mapId === ref.current.active.mapId) {
            pendingJump.current = null;
            if (target.nodeId) x.jump(target.nodeId);
          }
        },
        open,
        context: (m, ids) => (
          <>
            <button onClick={() => open("decisions")}>정책·결정 열기</button>
            {doc.decisions
              .filter(
                (x) =>
                  !x.deletedAt &&
                  x.projectId === doc.active.projectId &&
                  (!ids.length ||
                    x.targetRefs.some(
                      (r) => r.mapId === m.id && ids.includes(r.nodeId || ""),
                    )),
              )
              .map((x) => (
                <button
                  className="related-item"
                  key={x.id}
                  onClick={() => open("decisions", x.id)}
                >
                  {x.title} · {decisionLabels[x.status]}
                </button>
              ))}
            <h4>연결 업무</h4>
            <button onClick={() => open("tasks")}>업무 열기</button>
            {doc.tasks
              .filter(
                (t) =>
                  !t.deletedAt &&
                  !t.archivedAt &&
                  t.projectId === doc.active.projectId &&
                  (!ids.length ||
                    t.nodeRefs.some(
                      (r) => r.mapId === m.id && ids.includes(r.nodeId || ""),
                    )),
              )
              .map((t) => (
                <button
                  className="related-item"
                  key={t.id}
                  onClick={() => open("tasks", t.id)}
                >
                  {t.title} · {taskLabels[t.status]} ·{" "}
                  {t.personIds
                    .map(
                      (id) => doc.roster.find((p) => p.id === id)?.displayName,
                    )
                    .join(", ") || "미지정"}
                </button>
              ))}
          </>
        ),
        stage: (map, view) => {
          staged.current = { map, view };
          const m = ref.current.maps.find((x) => x.map.id === map.id);
          if (
            m &&
            (JSON.stringify(m.map) !== JSON.stringify(map) ||
              JSON.stringify(m.view) !== JSON.stringify(view))
          ) {
            setSaveState(
              repo.blocked
                ? "저장 중지 · 초안 보존"
                : "변경 있음 · 로컬 저장 대기",
            );
            const draft = structuredClone(ref.current);
            const index = draft.maps.findIndex((x) => x.map.id === map.id);
            draft.maps[index] = { ...draft.maps[index], map, view };
            ref.current = reconcileDomains(draft);
            setDoc(ref.current);
          }
        },
      }
    : undefined;
  return (
    <div
      className="workspace-app"
      onChangeCapture={(e) => {
        if ((e.target as HTMLElement).closest(".inspector form,.title-form"))
          setDirty(true);
      }}
    >
      <header className="projectbar">
        <b>MAP Workspace</b>
        <label>
          작업 공간
          <select
            aria-label="작업 공간 선택"
            value={doc.active.workspaceId || ""}
            onChange={(e) =>
              dispatch({
                type: "select",
                kind: "workspace",
                id: e.target.value,
              })
            }
          >
            <option value="" disabled>
              작업 공간 없음
            </option>
            {doc.workspaces
              .filter((w) => !w.deletedAt)
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.archivedAt ? " · 보관" : ""}
                </option>
              ))}
          </select>
        </label>
        <label>
          프로젝트
          <select
            aria-label="프로젝트 선택"
            value={doc.active.projectId || ""}
            onChange={(e) =>
              dispatch({ type: "select", kind: "project", id: e.target.value })
            }
          >
            <option value="" disabled>
              프로젝트 없음
            </option>
            {doc.projects
              .filter(
                (p) => p.workspaceId === doc.active.workspaceId && !p.deletedAt,
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.archivedAt ? " · 보관" : ""}
                </option>
              ))}
          </select>
        </label>
        <label>
          맵
          <select
            aria-label="맵 선택"
            value={doc.active.mapId || ""}
            onChange={(e) =>
              dispatch({ type: "select", kind: "map", id: e.target.value })
            }
          >
            <option value="" disabled>
              맵 없음
            </option>
            {doc.maps
              .filter(
                (m) => m.projectId === doc.active.projectId && !m.deletedAt,
              )
              .map((m) => (
                <option key={m.map.id} value={m.map.id}>
                  {m.map.title}
                  {m.archivedAt ? " · 보관" : ""}
                </option>
              ))}
          </select>
        </label>
        <button onClick={() => open("manage")}>관리</button>
        <button onClick={() => open("contextMenu")}>결정·업무</button>
        <button onClick={() => open("backup")}>백업·복원</button>
      </header>
      <div className="project-status">
        이 기기의 로컬 작업 · {saveState} · 업무{" "}
        {
          progress(
            doc.tasks.filter((t) => t.projectId === doc.active.projectId),
          ).percent
        }
        %{readOnly(doc, current) && " · 보관 항목 읽기 전용"}
      </div>
      {notice && (
        <div className="notice" role="alert">
          {notice}
          <button onClick={() => setNotice("")}>닫기</button>
        </div>
      )}
      {current && host ? (
        <App key={current.map.id + ":" + epoch} host={host} />
      ) : (
        <main className="project-empty">
          <h1>
            {!activeWorkspace
              ? "첫 작업 공간을 만들어 보세요"
              : !activeProject
                ? "프로젝트를 만들어 보세요"
                : "첫 맵을 만들어 보세요"}
          </h1>
          <p>맵을 중심으로 구조와 결정, 업무를 연결합니다.</p>
          <button className="primary" onClick={() => setPanel("manage")}>
            작업 공간·프로젝트·맵 만들기
          </button>
        </main>
      )}
      {panel && (
        <Dialog
          title={
            {
              manage: "프로젝트·맵 관리",
              backup: "로컬 백업·복원",
              decisions: "정책·의사결정",
              tasks: "업무",
              roster: "담당자 명부",
            }[panel] || "관리"
          }
          onClose={() => setPanel(null)}
        >
          {panel === "contextMenu" ? (
            <div className="menu-list">
              <button onClick={() => open("decisions")}>정책·의사결정</button>
              <button onClick={() => open("tasks")}>업무 관리</button>
              <button onClick={() => open("roster")}>담당자 명부</button>
            </div>
          ) : panel === "manage" ? (
            <Manager doc={doc} dispatch={dispatch} />
          ) : panel === "decisions" ? (
            <Decisions
              initialId={domainId}
              doc={doc}
              apply={apply}
              jump={jump}
              selected={
                staged.current?.view.selectedIds
                  .filter((id) => current?.map.nodes.some((n) => n.id === id))
                  .map((nodeId) => ({ mapId: current!.map.id, nodeId })) || []
              }
            />
          ) : panel === "tasks" ? (
            <Tasks
              initialId={domainId}
              doc={doc}
              apply={apply}
              jump={jump}
              selected={
                staged.current?.view.selectedIds
                  .filter((id) => current?.map.nodes.some((n) => n.id === id))
                  .map((nodeId) => ({ mapId: current!.map.id, nodeId })) || []
              }
            />
          ) : panel === "roster" ? (
            <Roster doc={doc} apply={apply} />
          ) : (
            <Backup
              doc={doc}
              repo={repo}
              retry={() => persist(ref.current)}
              recover={() => {
                const ok = persist(ref.current, true);
                if (ok) {
                  adapter.current = null;
                  setEpoch((e) => e + 1);
                  setNotice("원본을 보존하고 현재 초안을 저장했습니다.");
                }
                return ok;
              }}
              restore={(next) => {
                if (!repo.blocked && !leave()) return false;
                try {
                  repo.save(next, repo.blocked);
                  replace(next);
                  adapter.current = null;
                  setEpoch((e) => e + 1);
                  setSaveState("이 기기에서 저장됨");
                  setNotice("백업을 복원했습니다.");
                  return true;
                } catch (e) {
                  setNotice(error(e));
                  return false;
                }
              }}
              migrate={(preview) => {
                if (!leave()) return false;
                try {
                  const next = migrateP2(ref.current, preview);
                  repo.preserveP2(preview.fingerprint, preview.raw);
                  repo.save(next);
                  replace(next);
                  adapter.current = null;
                  setEpoch((e) => e + 1);
                  setSaveState("이 기기에서 저장됨");
                  setNotice("P2 원본을 보존하고 새 프로젝트에 이행했습니다.");
                  return true;
                } catch (e) {
                  setNotice(error(e));
                  return false;
                }
              }}
            />
          )}
          {notice && (
            <p role="alert" className="form-error">
              {notice}
            </p>
          )}
        </Dialog>
      )}
    </div>
  );
}
