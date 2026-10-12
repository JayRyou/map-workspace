import { useState } from "react";
import type { ProjectDocument } from "../../project/model.ts";
import type { ProjectCommand } from "../../project/commands.ts";
export default function Manager({
  doc,
  dispatch,
}: {
  doc: ProjectDocument;
  dispatch: (c: ProjectCommand) => boolean;
}) {
  const [kind, setKind] = useState<"workspace" | "project" | "map">("project"),
    [name, setName] = useState(""),
    [trash, setTrash] = useState(false),
    [edit, setEdit] = useState<string | null>(null);
  const rows =
    kind === "workspace"
      ? doc.workspaces
      : kind === "project"
        ? doc.projects.filter((p) => p.workspaceId === doc.active.workspaceId)
        : doc.maps
            .filter((m) => m.projectId === doc.active.projectId)
            .map((m) => ({ ...m, id: m.map.id, name: m.map.title }));
  const create = () => {
    const ok =
      kind === "workspace"
        ? dispatch({ type: "workspace", name })
        : kind === "project"
          ? dispatch({
              type: "project",
              workspaceId: doc.active.workspaceId || "",
              name,
            })
          : dispatch({
              type: "map",
              projectId: doc.active.projectId || "",
              title: name,
            });
    if (ok) setName("");
  };
  return (
    <div className="manager">
      <p>로컬 작업 공간과 프로젝트입니다. 계정·팀 권한을 만들지 않습니다.</p>
      <div className="row">
        {(["workspace", "project", "map"] as const).map((k) => (
          <button
            aria-pressed={kind === k}
            key={k}
            onClick={() => {
              setKind(k);
              setEdit(null);
            }}
          >
            {{ workspace: "작업 공간", project: "프로젝트", map: "맵" }[k]}
          </button>
        ))}
        <label className="inline-check">
          <input
            type="checkbox"
            checked={trash}
            onChange={(e) => setTrash(e.target.checked)}
          />
          휴지통 보기
        </label>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <label>
          새 {{ workspace: "작업 공간", project: "프로젝트", map: "맵" }[kind]}{" "}
          이름
          <input
            aria-label="새 항목 이름"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button className="primary">새 항목 만들기</button>
      </form>
      {rows
        .filter((x) => (trash ? !!x.deletedAt : !x.deletedAt))
        .map((x) => (
          <section key={x.id} className="catalog-row">
            <b>{x.name}</b>
            <small>
              {x.deletedAt
                ? "휴지통"
                : x.archivedAt
                  ? "보관 · 읽기 전용"
                  : "사용 중"}
            </small>
            {edit === x.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  if (
                    dispatch({
                      type: "rename",
                      kind,
                      id: x.id,
                      name: String(f.get("name")),
                      description: String(f.get("description") || ""),
                    })
                  )
                    setEdit(null);
                }}
              >
                <label>
                  변경 이름
                  <input
                    name="name"
                    defaultValue={x.name}
                    required
                    maxLength={200}
                  />
                </label>
                {"description" in x && (
                  <label>
                    프로젝트 설명
                    <textarea
                      name="description"
                      defaultValue={String(x.description)}
                      maxLength={10000}
                    />
                  </label>
                )}
                <button>이름·설명 적용</button>
                <button type="button" onClick={() => setEdit(null)}>
                  취소
                </button>
              </form>
            ) : (
              <div className="row">
                {!x.deletedAt && (
                  <>
                    <button
                      onClick={() =>
                        dispatch({ type: "select", kind, id: x.id })
                      }
                    >
                      선택
                    </button>
                    <button
                      disabled={!!x.archivedAt}
                      onClick={() => setEdit(x.id)}
                    >
                      수정
                    </button>
                    {kind === "map" && (
                      <button
                        disabled={!!x.archivedAt}
                        onClick={() =>
                          dispatch({ type: "duplicate", mapId: x.id })
                        }
                      >
                        복제
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            x.archivedAt
                              ? "보관을 해제할까요?"
                              : "보관하면 읽기 전용이 됩니다. 계속할까요?",
                          )
                        )
                          dispatch({
                            type: "lifecycle",
                            kind,
                            id: x.id,
                            action: x.archivedAt ? "unarchive" : "archive",
                          });
                      }}
                    >
                      {x.archivedAt ? "보관 해제" : "보관"}
                    </button>
                    <button
                      className="danger"
                      onClick={() => {
                        if (
                          confirm(
                            "휴지통으로 이동할까요? 하위 데이터는 보존하며 복구할 수 있습니다.",
                          )
                        )
                          dispatch({
                            type: "lifecycle",
                            kind,
                            id: x.id,
                            action: "delete",
                          });
                      }}
                    >
                      삭제
                    </button>
                  </>
                )}
                {x.deletedAt && (
                  <>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "lifecycle",
                          kind,
                          id: x.id,
                          action: "restore",
                        })
                      }
                    >
                      복구
                    </button>
                    <button
                      disabled={
                        Date.now() - Date.parse(x.deletedAt) < 30 * 86400000
                      }
                      title="삭제 후30일 경과 필요"
                      onClick={() => {
                        const confirmation = prompt(
                          "하위 데이터를 영구 제거합니다. 먼저 백업하세요. ‘영구 삭제’를 입력하세요.",
                        );
                        if (confirmation)
                          dispatch({
                            type: "lifecycle",
                            kind,
                            id: x.id,
                            action: "purge",
                            confirmation,
                          });
                      }}
                    >
                      영구 삭제
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        ))}
      {!rows.filter((x) => (trash ? !!x.deletedAt : !x.deletedAt)).length && (
        <p className="empty-state">아직 항목이 없어요. 위에서 만들어 보세요.</p>
      )}
      <p className="hint">
        삭제는 휴지통 이동이며 자동 파기하지 않습니다. 30일 후에만 명시적으로
        영구 삭제할 수 있습니다. 맵 복제는 구조와 메타데이터를 복제하며
        프로젝트의 업무·결정은 중복 생성하지 않습니다.
      </p>
    </div>
  );
}
