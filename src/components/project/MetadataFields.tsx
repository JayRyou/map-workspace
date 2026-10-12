import { useState, useEffect } from "react";
import type { Metadata, Property } from "../../domain/map.ts";
export function metadataFromForm(f: FormData, old: Metadata): Metadata {
  const properties: Property[] = [];
  for (let i = 0; f.has("propKey" + i); i++) {
    const key = String(f.get("propKey" + i)),
      type = String(f.get("propType" + i)) as Property["type"],
      raw = String(f.get("propValue" + i));
    if (key.trim())
      properties.push({
        key,
        type,
        value: type === "number" ? Number(raw) : raw,
      });
  }
  return {
    ...old,
    description: String(f.get("description")),
    notes: String(f.get("notes")),
    tags: String(f.get("tags") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    customStatus: String(f.get("customStatus") || ""),
    properties,
  };
}
export default function MetadataFields({ meta }: { meta: Metadata }) {
  const [rows, setRows] = useState<Property[]>(meta.properties || []);
  useEffect(() => {
    const reset = () => setRows(meta.properties || []);
    window.addEventListener("map-discard-input", reset);
    return () => window.removeEventListener("map-discard-input", reset);
  }, [meta]);
  return (
    <>
      <label>
        태그 · 쉼표로 구분
        <input
          name="tags"
          defaultValue={meta.tags?.join(", ")}
          maxLength={1250}
        />
      </label>
      <label>
        요소 상태
        <input
          name="customStatus"
          defaultValue={meta.customStatus || ""}
          maxLength={60}
          placeholder="예: 검토 필요"
        />
      </label>
      <h3>사용자 정의 속성</h3>
      {rows.map((p, i) => (
        <div className="property-row" key={i}>
          <label>
            속성 이름
            <input
              aria-label={"속성 이름 " + (i + 1)}
              name={"propKey" + i}
              value={p.key}
              maxLength={60}
              required
              onChange={(e) =>
                setRows(
                  rows.map((x, j) =>
                    j === i ? { ...x, key: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <label>
            형식
            <select
              name={"propType" + i}
              value={p.type}
              onChange={(e) =>
                setRows(
                  rows.map((x, j) =>
                    j === i
                      ? {
                          ...x,
                          type: e.target.value as Property["type"],
                          value: "",
                        }
                      : x,
                  ),
                )
              }
            >
              {Object.entries({
                text: "텍스트",
                number: "숫자",
                date: "날짜",
                choice: "선택 값",
                url: "URL",
              }).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            속성 값
            <input
              name={"propValue" + i}
              aria-label={"속성 값 " + (i + 1)}
              value={p.value}
              type={
                p.type === "number"
                  ? "number"
                  : p.type === "date"
                    ? "date"
                    : "text"
              }
              step="any"
              maxLength={2000}
              required
              onChange={(e) =>
                setRows(
                  rows.map((x, j) =>
                    j === i ? { ...x, value: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            onClick={() => setRows(rows.filter((_, j) => i !== j))}
          >
            속성 제거 {i + 1}
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={rows.length >= 30}
        onClick={() => setRows([...rows, { key: "", type: "text", value: "" }])}
      >
        속성 추가
      </button>
      <p className="hint">
        최대30개. URL은 http/https만 지원하며 자동으로 실행하지 않습니다. 선택
        값은 단일 텍스트 값입니다.
      </p>
    </>
  );
}
