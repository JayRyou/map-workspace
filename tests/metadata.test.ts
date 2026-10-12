import test from "node:test";
import assert from "node:assert/strict";
import { sampleMap } from "../src/fixtures/sample.ts";
import { validateMap } from "../src/graph/validation.ts";
import { execute } from "../src/graph/commands.ts";
import { createHistory, commit, undo } from "../src/graph/history.ts";
test("P2 설명/메모 보존 및 P3 태그/속성 Undo 왕복", () => {
  const m = sampleMap(),
    n = m.nodes[0],
    metadata = {
      ...n.metadata,
      tags: ["검토"],
      customStatus: "검토 중",
      properties: [
        { key: "비용", type: "number" as const, value: 125 },
        { key: "날짜", type: "date" as const, value: "2026-10-11" },
      ],
    };
  const h = commit(createHistory(m), {
    type: "edit",
    id: n.id,
    patch: { metadata },
  });
  assert.equal(h.present.nodes[0].metadata.description, n.metadata.description);
  assert.deepEqual(undo(h).present, m);
  assert.deepEqual(
    validateMap(JSON.parse(JSON.stringify(h.present))),
    h.present,
  );
});
test("속성 타입/날짜/URL/중복/한도/위험 키 거부", () => {
  for (const props of [
    [{ key: "x", type: "number", value: "3" }],
    [{ key: "x", type: "date", value: "2026-02-30" }],
    [{ key: "x", type: "url", value: "javascript:alert(1)" }],
    [{ key: "__proto__", type: "text", value: "x" }],
    Array.from({ length: 31 }, (_, i) => ({
      key: "k" + i,
      type: "text",
      value: "",
    })),
  ]) {
    const m = sampleMap();
    assert.throws(() =>
      execute(m, {
        type: "edit",
        id: m.nodes[0].id,
        patch: {
          metadata: { description: "", notes: "", properties: props as any },
        },
      }),
    );
  }
});
test("HTML는 실행 없이 문자열로 보존", () => {
  const m = sampleMap();
  const n = execute(m, {
    type: "edit",
    id: m.nodes[0].id,
    patch: {
      metadata: { description: "<img src=x onerror=alert(1)>", notes: "" },
    },
  });
  assert(n.nodes[0].metadata.description.includes("<img"));
});
