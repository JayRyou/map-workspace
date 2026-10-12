import { useState } from "react";
import type {
  ProjectDocument,
  Decision,
  TargetRef,
} from "../../project/model.ts";
import { saveDecision, deleteDecision } from "../../project/decisions.ts";
export const decisionLabels = {
  proposed: "미정",
  evaluating: "검토 중",
  accepted: "확정",
  rejected: "채택 안 함",
  superseded: "대체됨",
};
export function RefPicker({
  doc,
  projectId,
  initial = [],
}: {
  doc: ProjectDocument;
  projectId: string;
  initial?: TargetRef[];
}) {
  return (
    <fieldset className="ref-picker">
      <legend>연결 맵·노드</legend>
      {doc.maps
        .filter(
          (m) =>
            m.projectId === projectId &&
            (!m.deletedAt || initial.some((r) => r.mapId === m.map.id)),
        )
        .map((m) => (
          <div key={m.map.id}>
            <b>
              {m.map.title}
              {m.deletedAt
                ? " · 휴지통의 기존 연결"
                : m.archivedAt
                  ? " · 보관"
                  : ""}
            </b>
            {m.map.nodes.map((n) => (
              <label className="inline-check" key={n.id}>
                <input
                  type="checkbox"
                  name="refs"
                  value={JSON.stringify({ mapId: m.map.id, nodeId: n.id })}
                  defaultChecked={initial.some(
                    (r) => r.mapId === m.map.id && r.nodeId === n.id,
                  )}
                />
                {n.label}
              </label>
            ))}
          </div>
        ))}
      <p className="hint">
        선택하지 않으면 프로젝트 전체 맥락입니다. 여러 맵의 노드를 함께 연결할
        수 있어요.
      </p>
    </fieldset>
  );
}
export const refsFrom = (f: FormData) =>
  f.getAll("refs").map((x) => JSON.parse(String(x)) as TargetRef);
export default function Decisions({
  doc,
  apply,
  jump,
  selected,
  initialId,
}: {
  doc: ProjectDocument;
  apply: (fn: (d: ProjectDocument) => ProjectDocument) => boolean;
  jump: (r: TargetRef) => void;
  selected: TargetRef[];
  initialId?: string;
}) {
  const [id, setId] = useState<string | null>(initialId || null),
    [editing, setEditing] = useState(!!initialId);
  const projectId = doc.active.projectId!,
    items = doc.decisions.filter(
      (x) => x.projectId === projectId && !x.deletedAt,
    ),
    item = items.find((x) => x.id === id);
  return (
    <>
      <p>
        결정 확정과 업무 완료는 별개입니다. 변경 기록은 이 기기의 최근50회
        요약이며 서버 감사 로그가 아닙니다.
      </p>
      <button
        disabled={!projectId}
        className="primary"
        onClick={() => {
          setId(null);
          setEditing(true);
        }}
      >
        결정 추가
      </button>
      {editing && (
        <form
          key={id || "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (
              apply((d) =>
                saveDecision(
                  d,
                  {
                    projectId,
                    title: String(f.get("title")),
                    kind: String(f.get("kind")) as Decision["kind"],
                    status: String(f.get("status")) as Decision["status"],
                    scope: String(f.get("scope")) as Decision["scope"],
                    rationale: String(f.get("rationale")),
                    notes: String(f.get("notes")),
                    options: String(f.get("options"))
                      .split("\n")
                      .map((x) => x.trim())
                      .filter(Boolean),
                    targetRefs: refsFrom(f),
                  },
                  id || undefined,
                ),
              )
            )
              setEditing(false);
          }}
        >
          <label>
            결정 제목
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={item?.title}
            />
          </label>
          <div className="field-pair">
            <label>
              기록 종류
              <select
                aria-label="기록 종류"
                name="kind"
                defaultValue={item?.kind || "decision"}
              >
                <option value="decision">의사결정</option>
                <option value="policy">정책</option>
                <option value="discussion">논의</option>
              </select>
            </label>
            <label>
              결정 상태
              <select
                aria-label="결정 상태"
                name="status"
                defaultValue={item?.status || "proposed"}
              >
                {Object.entries(decisionLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            적용 범위
            <select
              aria-label="적용 범위"
              name="scope"
              defaultValue={item?.scope || "unknown"}
            >
              <option value="unknown">미정</option>
              <option value="in">범위 안</option>
              <option value="out">범위 밖</option>
            </select>
          </label>
          <label>
            결정 근거
            <textarea
              name="rationale"
              defaultValue={item?.rationale}
              maxLength={10000}
            />
          </label>
          <label>
            대안 · 한 줄에 하나
            <textarea
              name="options"
              defaultValue={item?.options.join("\n")}
              maxLength={40000}
            />
          </label>
          <label>
            결정 메모
            <textarea
              name="notes"
              defaultValue={item?.notes}
              maxLength={10000}
            />
          </label>
          <RefPicker
            doc={doc}
            projectId={projectId}
            initial={item?.targetRefs || selected}
          />
          <div className="row">
            <button className="primary">결정 저장</button>
            <button type="button" onClick={() => setEditing(false)}>
              편집 취소
            </button>
          </div>
        </form>
      )}
      {!editing &&
        items.map((x) => (
          <article key={x.id} className="catalog-row">
            <b>{x.title}</b>
            <span>
              {decisionLabels[x.status]} ·{" "}
              {{ in: "범위 안", out: "범위 밖", unknown: "범위 미정" }[x.scope]}
            </span>
            <p className="plain-text">
              {x.rationale || "아직 근거가 없습니다."}
            </p>
            <small>
              작성 {new Date(x.createdAt).toLocaleString("ko-KR")} · 변경{" "}
              {new Date(x.updatedAt).toLocaleString("ko-KR")}
            </small>
            <div className="row">
              <button
                onClick={() => {
                  setId(x.id);
                  setEditing(true);
                }}
              >
                결정 수정
              </button>
              <button
                className="danger"
                onClick={() => {
                  if (
                    confirm(
                      "결정을 삭제할까요? 업무 본문은 보존하고 연결만 해제합니다.",
                    )
                  )
                    apply((d) => deleteDecision(d, x.id));
                }}
              >
                결정 삭제
              </button>
            </div>
            {x.targetRefs.map((r) => (
              <button key={JSON.stringify(r)} onClick={() => jump(r)}>
                {doc.maps
                  .find((m) => m.map.id === r.mapId)
                  ?.map.nodes.find((n) => n.id === r.nodeId)?.label ||
                  "연결 맵"}{" "}
                · 맵에서 보기 ↗
              </button>
            ))}
            <small>
              연결 업무:{" "}
              {doc.tasks
                .filter((t) => !t.deletedAt && t.decisionIds.includes(x.id))
                .map((t) => t.title)
                .join(", ") || "없음"}
            </small>
            <details>
              <summary>로컬 변경 이력 {x.changes.length}건</summary>
              {x.changes.map((h, i) => (
                <p key={i}>
                  {h.at} · {h.summary}
                </p>
              ))}
            </details>
          </article>
        ))}
      {!items.length && !editing && (
        <p className="empty-state">
          결정이 없습니다. 프로젝트 또는 선택한 노드의 맥락을 남겨 보세요.
        </p>
      )}
    </>
  );
}
