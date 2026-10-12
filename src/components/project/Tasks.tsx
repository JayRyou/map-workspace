import { useState } from "react";
import type { ProjectDocument, TargetRef, Task } from "../../project/model.ts";
import {
  saveTask,
  taskLifecycle,
  progress,
  overdue,
  savePerson,
  archivePerson,
} from "../../project/tasks.ts";
import { RefPicker, refsFrom } from "./Decisions.tsx";
export const taskLabels = {
    todo: "할 일",
    doing: "진행 중",
    done: "완료",
    blocked: "차단됨",
  },
  priorityLabels = {
    low: "낮음",
    normal: "보통",
    high: "높음",
    urgent: "긴급",
  };
type Props = {
  doc: ProjectDocument;
  apply: (fn: (d: ProjectDocument) => ProjectDocument) => boolean;
  jump: (r: TargetRef) => void;
  selected: TargetRef[];
  initialId?: string;
};
export default function Tasks({
  doc,
  apply,
  jump,
  selected,
  initialId,
}: Props) {
  const [id, setId] = useState<string | null>(initialId || null),
    [editing, setEditing] = useState(!!initialId),
    [all, setAll] = useState(false);
  const projectId = doc.active.projectId!,
    p = doc.projects.find((p) => p.id === projectId),
    items = doc.tasks.filter((t) => t.projectId === projectId && !t.deletedAt),
    item = items.find((t) => t.id === id),
    stats = progress(items);
  return (
    <>
      <p>
        업무 진행률{" "}
        <b>
          {stats.percent}% · {stats.done}/{stats.total}
        </b>{" "}
        · 완료 ÷ 보관/삭제하지 않은 전체 업무. 차단 업무도 분모에 포함합니다.
        결정 확정은 진행률에 영향을 주지 않습니다.
      </p>
      <div className="row">
        <button
          className="primary"
          disabled={!projectId}
          onClick={() => {
            setId(null);
            setEditing(true);
          }}
        >
          업무 추가
        </button>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={all}
            onChange={(e) => setAll(e.target.checked)}
          />
          보관 업무 보기
        </label>
      </div>
      {editing && (
        <form
          key={id || "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (
              apply((d) =>
                saveTask(
                  d,
                  {
                    projectId,
                    title: String(f.get("title")),
                    description: String(f.get("description")),
                    status: String(f.get("status")) as Task["status"],
                    priority: String(f.get("priority")) as Task["priority"],
                    startDate: String(f.get("startDate")) || null,
                    dueDate: String(f.get("dueDate")) || null,
                    personIds: f.getAll("personIds").map(String),
                    nodeRefs: refsFrom(f),
                    decisionIds: f.getAll("decisionIds").map(String),
                    predecessorIds: f.getAll("predecessorIds").map(String),
                  },
                  id || undefined,
                ),
              )
            )
              setEditing(false);
          }}
        >
          <label>
            업무 제목
            <input
              name="title"
              defaultValue={item?.title}
              required
              maxLength={200}
            />
          </label>
          <label>
            업무 설명
            <textarea
              name="description"
              defaultValue={item?.description}
              maxLength={10000}
            />
          </label>
          <div className="field-pair">
            <label>
              업무 상태
              <select
                name="status"
                aria-label="업무 상태"
                defaultValue={item?.status || "todo"}
              >
                {Object.entries(taskLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              우선순위
              <select
                name="priority"
                aria-label="우선순위"
                defaultValue={item?.priority || "normal"}
              >
                {Object.entries(priorityLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-pair">
            <label>
              시작일
              <input
                name="startDate"
                type="date"
                defaultValue={item?.startDate || ""}
              />
            </label>
            <label>
              마감일
              <input
                name="dueDate"
                type="date"
                defaultValue={item?.dueDate || ""}
              />
            </label>
          </div>
          <fieldset className="ref-picker">
            <legend>담당자 · 로컬 명부</legend>
            {doc.roster
              .filter(
                (x) =>
                  x.workspaceId === p?.workspaceId &&
                  (!x.archivedAt || item?.personIds.includes(x.id)),
              )
              .map((x) => (
                <label className="inline-check" key={x.id}>
                  <input
                    type="checkbox"
                    name="personIds"
                    value={x.id}
                    defaultChecked={item?.personIds.includes(x.id)}
                  />
                  {x.displayName}
                  {x.archivedAt ? " · 보관" : ""}
                </label>
              ))}
            <small>
              미선택은 담당자 미지정입니다. 로그인 계정이나 권한 배정이
              아닙니다.
            </small>
          </fieldset>
          <RefPicker
            doc={doc}
            projectId={projectId}
            initial={item?.nodeRefs || selected}
          />
          <fieldset className="ref-picker">
            <legend>관련 결정</legend>
            {doc.decisions
              .filter((x) => x.projectId === projectId && !x.deletedAt)
              .map((x) => (
                <label className="inline-check" key={x.id}>
                  <input
                    type="checkbox"
                    name="decisionIds"
                    value={x.id}
                    defaultChecked={item?.decisionIds.includes(x.id)}
                  />
                  {x.title}
                </label>
              ))}
          </fieldset>
          <fieldset className="ref-picker">
            <legend>선행 업무 · 순환 금지</legend>
            {items
              .filter((x) => x.id !== id)
              .map((x) => (
                <label className="inline-check" key={x.id}>
                  <input
                    type="checkbox"
                    name="predecessorIds"
                    value={x.id}
                    defaultChecked={item?.predecessorIds.includes(x.id)}
                  />
                  {x.title}
                </label>
              ))}
          </fieldset>
          <div className="row">
            <button className="primary">업무 저장</button>
            <button type="button" onClick={() => setEditing(false)}>
              편집 취소
            </button>
          </div>
        </form>
      )}
      {!editing &&
        items
          .filter((t) => all || !t.archivedAt)
          .map((t) => (
            <article className="catalog-row" key={t.id}>
              <b>{t.title}</b>
              <span>
                {taskLabels[t.status]} · {priorityLabels[t.priority]}
                {t.archivedAt ? " · 보관" : ""}
                {overdue(t) ? " · 기한 경과" : ""}
              </span>
              <p>{t.description}</p>
              <small>
                담당:{" "}
                {t.personIds
                  .map((id) => {
                    const p = doc.roster.find((x) => x.id === id);
                    return (
                      (p?.displayName || "미지정") +
                      (p?.archivedAt ? "(보관)" : "")
                    );
                  })
                  .join(", ") || "미지정"}{" "}
                · 일정 {t.startDate || "없음"} ~ {t.dueDate || "없음"}
              </small>
              <small>
                선행:{" "}
                {t.predecessorIds
                  .map((id) => items.find((x) => x.id === id)?.title)
                  .join(", ") || "없음"}{" "}
                · 연결 결정{" "}
                {t.decisionIds
                  .map((id) => doc.decisions.find((x) => x.id === id)?.title)
                  .join(", ") || "없음"}
              </small>
              <div className="row">
                <button
                  disabled={!!t.archivedAt}
                  onClick={() => {
                    setId(t.id);
                    setEditing(true);
                  }}
                >
                  업무 수정
                </button>
                <button
                  onClick={() =>
                    apply((d) =>
                      taskLifecycle(
                        d,
                        t.id,
                        t.archivedAt ? "unarchive" : "archive",
                      ),
                    )
                  }
                >
                  {t.archivedAt ? "보관 해제" : "업무 보관"}
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    if (
                      confirm(
                        "업무를 삭제할까요? 다른 업무의 선행참조만 해제하며 결정 본문은 보존합니다.",
                      )
                    )
                      apply((d) => taskLifecycle(d, t.id, "delete"));
                  }}
                >
                  업무 삭제
                </button>
              </div>
              {t.nodeRefs.map((r) => (
                <button key={JSON.stringify(r)} onClick={() => jump(r)}>
                  {doc.maps
                    .find((m) => m.map.id === r.mapId)
                    ?.map.nodes.find((n) => n.id === r.nodeId)?.label ||
                    "노드"}{" "}
                  · 맵에서 보기 ↗
                </button>
              ))}
            </article>
          ))}
      {!items.length && !editing && (
        <p className="empty-state">업무가 없어도 맵을 사용할 수 있어요.</p>
      )}
    </>
  );
}
export function Roster({
  doc,
  apply,
}: {
  doc: ProjectDocument;
  apply: Props["apply"];
}) {
  const [id, setId] = useState<string | null>(null),
    p = doc.roster.find((p) => p.id === id);
  return (
    <>
      <p>
        담당자 명부는 로컬 프로필입니다. 실제 회원·초대·접근 권한을 만들지
        않습니다. 삭제 대신 보관하여 과거 배정을 유지합니다.
      </p>
      <form
        key={id || "new"}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (
            apply((d) =>
              savePerson(
                d,
                doc.active.workspaceId!,
                String(f.get("name")),
                String(f.get("role")),
                id || undefined,
              ),
            )
          ) {
            setId(null);
            e.currentTarget.reset();
          }
        }}
      >
        <label>
          담당자 이름
          <input
            name="name"
            defaultValue={p?.displayName}
            required
            maxLength={200}
          />
        </label>
        <label>
          담당 역할
          <input name="role" defaultValue={p?.roleLabel} maxLength={200} />
        </label>
        <button className="primary" disabled={!doc.active.workspaceId}>
          {id ? "담당자 수정 저장" : "담당자 추가"}
        </button>
        {id && (
          <button type="button" onClick={() => setId(null)}>
            새 담당자
          </button>
        )}
      </form>
      {doc.roster
        .filter((p) => p.workspaceId === doc.active.workspaceId)
        .map((p) => (
          <section className="catalog-row" key={p.id}>
            <b>
              {p.displayName} · {p.roleLabel}
              {p.archivedAt ? " · 보관" : ""}
            </b>
            <div className="row">
              <button disabled={!!p.archivedAt} onClick={() => setId(p.id)}>
                담당자 수정
              </button>
              <button onClick={() => apply((d) => archivePerson(d, p.id))}>
                {p.archivedAt ? "담당자 복귀" : "담당자 보관"}
              </button>
            </div>
          </section>
        ))}
    </>
  );
}
