import { useState } from "react";
import type { ProjectDocument } from "../../project/model.ts";
import { parseProject, MAX_BYTES } from "../../project/validation.ts";
import type { ProjectRepository } from "../../repositories/project-local.ts";
import { previewP2 } from "../../project/migration.ts";
export function download(raw: string, name: string) {
  const url = URL.createObjectURL(
      new Blob([raw], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export default function Backup({
  doc,
  repo,
  restore,
  migrate,
  recover,
  retry,
}: {
  doc: ProjectDocument;
  repo: ProjectRepository;
  restore: (d: ProjectDocument) => boolean;
  migrate: (p: Awaited<ReturnType<typeof previewP2>>) => boolean;
  recover: () => boolean;
  retry: () => boolean;
}) {
  const [preview, setPreview] = useState<ProjectDocument | null>(null),
    [legacy, setLegacy] = useState<Awaited<
      ReturnType<typeof previewP2>
    > | null>(null),
    [error, setError] = useState("");
  const handle = (fn: () => void) => {
    try {
      fn();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const p2 = async (raw: string | null) => {
    setLegacy(null);
    setPreview(null);
    try {
      if (!raw) throw new Error("P2 원본이 없습니다.");
      setLegacy(await previewP2(raw));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <>
      <p>
        P3 로컬 백업 v3 · 이 기기의 모든 작업 공간·프로젝트·맵·결정·업무·명부를
        포함합니다. 계정/클라우드 백업이 아닙니다. 전체10MiB, 맵1MiB 상한과
        브라우저 저장 한도 중 먼저 도달한 한도가 적용됩니다.
      </p>
      <div className="row">
        <button
          className="primary"
          onClick={() =>
            handle(() => download(JSON.stringify(doc), "MAP-P3-backup.json"))
          }
        >
          P3 전체 백업 내려받기
        </button>
        <button onClick={retry} disabled={repo.blocked}>
          로컬 저장 재시도
        </button>
      </div>
      <label>
        P3 백업 JSON
        <input
          type="file"
          accept=".json"
          aria-label="P3 백업 가져오기"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            setPreview(null);
            setLegacy(null);
            if (!f) return;
            try {
              if (f.size > MAX_BYTES)
                throw new Error("10MiB 한도를 초과합니다.");
              setPreview(parseProject(await f.text()));
              setError("");
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            }
          }}
        />
      </label>
      {preview && (
        <section className="import-preview">
          <h3>P3 백업 미리보기</h3>
          <p>
            작업 공간 {preview.workspaces.length} · 프로젝트{" "}
            {preview.projects.length} · 맵 {preview.maps.length} · 결정{" "}
            {preview.decisions.length} · 업무 {preview.tasks.length}
          </p>
          <p>
            현재 전체 로컬 데이터를 교체합니다. 먼저 현재 백업을 내려받으세요.
            기존 정상본은 이전 슬롯으로 보존합니다.
          </p>
          <button
            onClick={() => {
              if (
                confirm("현재 모든 프로젝트를 이 백업으로 교체할까요?") &&
                restore(preview)
              )
                setPreview(null);
            }}
          >
            P3 백업으로 교체 확인
          </button>
        </section>
      )}
      <hr />
      <h3>P2 원본의 명시적 이행</h3>
      <p>
        P2 키와 이전 정상본은 변경하지 않습니다. 미리보기 후 원본 별도 백업에
        성공해야 새 프로젝트를 추가합니다. 동일 내용의 중복 이행은 차단합니다.
      </p>
      <div className="row">
        <button
          onClick={() =>
            handle(() => {
              void p2(repo.legacy().current);
            })
          }
        >
          이 기기의 P2 미리보기
        </button>
        <button
          onClick={() =>
            handle(() => {
              void p2(repo.legacy().previous);
            })
          }
        >
          P2 이전 정상본 미리보기
        </button>
      </div>
      <label>
        P2 원본 JSON
        <input
          type="file"
          accept=".json"
          aria-label="P2 원본 가져오기"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (f.size > 1048576) {
              setLegacy(null);
              setError("P2 원본은1MiB까지 지원합니다.");
              return;
            }
            await p2(await f.text());
          }}
        />
      </label>
      {legacy && (
        <section className="import-preview">
          <h3>{legacy.doc.map.title}</h3>
          <p>
            P2 요소 {legacy.doc.map.nodes.length} · 연결{" "}
            {legacy.doc.map.edges.length} · 그룹 {legacy.doc.map.groups.length}
          </p>
          <button onClick={() => download(legacy.raw, "MAP-P2-original.json")}>
            P2 원본 내려받기
          </button>
          <button
            className="primary"
            onClick={() => {
              if (
                confirm("P2 원본을 보존하고 새 P3 프로젝트로 가져올까요?") &&
                migrate(legacy)
              )
                setLegacy(null);
            }}
          >
            원본 보존 후 P2 이행 확인
          </button>
        </section>
      )}
      <hr />
      <h3>손상·충돌 복구</h3>
      <div className="row">
        <button
          onClick={() =>
            handle(() =>
              download(
                JSON.stringify(repo.raw(), null, 2),
                "MAP-P3-storage-recovery.json",
              ),
            )
          }
        >
          저장소 원문 회수
        </button>
        <button
          onClick={() =>
            handle(() => {
              const raw = repo.raw().previous;
              if (!raw) throw new Error("이전 정상본이 없습니다.");
              setPreview(parseProject(raw));
              setLegacy(null);
            })
          }
        >
          이전 정상본 미리보기
        </button>
        <button
          onClick={() => {
            if (
              confirm(
                "현재/이전/기존 격리값을 함께 보존한 뒤 현재 초안으로 교체합니다. 충분한 공간이 없으면 중지합니다. 계속할까요?",
              )
            )
              recover();
          }}
        >
          현재 초안으로 복구 확인
        </button>
      </div>
      <p className="hint">
        다른 탭 충돌은 자동 병합하지 않습니다. 먼저 초안을 백업한 후
        새로고침하거나 명시적으로 복구하세요. 서버 CAS가 아닙니다.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
