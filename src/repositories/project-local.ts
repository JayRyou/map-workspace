import type { StorageLike } from "./local-map.ts";
import { CURRENT_KEY as P2_KEY, BACKUP_KEY as P2_BACKUP } from "./local-map.ts";
import type { ProjectDocument } from "../project/model.ts";
import { emptyDocument } from "../project/model.ts";
import {
  parseProject,
  validateProject,
  insist,
} from "../project/validation.ts";
export const PROJECT_KEY = "map-workspace:p3:workspace-local:v3",
  PREVIOUS_KEY = PROJECT_KEY + ":previous",
  QUARANTINE_KEY = PROJECT_KEY + ":quarantine";
export type ProjectBoot = {
  document: ProjectDocument;
  blocked: boolean;
  error: string;
};
export interface ProjectRepository {
  blocked: boolean;
  load: () => ProjectBoot;
  save: (doc: ProjectDocument, recover?: boolean) => void;
  stop: () => void;
  raw: () => {
    current: string | null;
    previous: string | null;
    quarantine: string | null;
  };
  legacy: () => { current: string | null; previous: string | null };
  preserveP2: (fingerprint: string, raw: string) => void;
}
export class LocalProjectRepository implements ProjectRepository {
  blocked = false;
  expected: string | null = null;
  storage: StorageLike;
  constructor(storage: StorageLike) {
    this.storage = storage;
  }
  load(): ProjectBoot {
    let raw: string | null = null,
      previous: string | null = null;
    try {
      raw = this.storage.getItem(PROJECT_KEY);
      previous = this.storage.getItem(PREVIOUS_KEY);
      this.expected = raw;
      if (raw)
        return { document: parseProject(raw), blocked: false, error: "" };
      if (!previous)
        return { document: emptyDocument(), blocked: false, error: "" };
      throw new Error("현재 저장값이 없습니다.");
    } catch {
      this.blocked = true;
      let doc = emptyDocument();
      try {
        if (previous) doc = parseProject(previous);
      } catch {}
      return {
        document: doc,
        blocked: true,
        error:
          "로컬 저장값을 읽지 못했습니다. 원본을 보존하고 자동 저장을 중지했어요. 백업·복원에서 초안을 회수하세요.",
      };
    }
  }
  save(input: ProjectDocument, recover = false) {
    const next = validateProject(input),
      raw = JSON.stringify(next);
    insist(
      !this.blocked || recover,
      "다른 탭/손상으로 저장이 중지됐습니다. 먼저 초안을 내려받으세요.",
    );
    const current = this.storage.getItem(PROJECT_KEY);
    if (!recover && current !== this.expected) {
      this.blocked = true;
      throw new Error(
        "다른 탭이 먼저 저장했습니다. 초안을 유지하고 덮어쓰지 않습니다.",
      );
    }
    if (!recover && current) {
      const old = parseProject(current);
      if (
        JSON.stringify({ ...old, savedAt: "" }) ===
        JSON.stringify({ ...next, savedAt: "" })
      )
        return;
    }
    if (recover) {
      const previous = this.storage.getItem(PREVIOUS_KEY),
        prior = this.storage.getItem(QUARANTINE_KEY);
      this.storage.setItem(
        QUARANTINE_KEY,
        JSON.stringify({
          current,
          previous,
          prior,
          at: new Date().toISOString(),
        }),
      );
    }
    if (current) {
      let valid = false;
      try {
        parseProject(current);
        valid = true;
      } catch {}
      if (valid) this.storage.setItem(PREVIOUS_KEY, current);
    }
    this.storage.setItem(PROJECT_KEY, raw);
    if (this.storage.getItem(PROJECT_KEY) !== raw) {
      this.blocked = true;
      throw new Error(
        "저장 확인에 실패했습니다. 이전 정상본과 초안을 회수하세요.",
      );
    }
    this.expected = raw;
    this.blocked = false;
  }
  stop() {
    this.blocked = true;
  }
  raw() {
    return {
      current: this.storage.getItem(PROJECT_KEY),
      previous: this.storage.getItem(PREVIOUS_KEY),
      quarantine: this.storage.getItem(QUARANTINE_KEY),
    };
  }
  legacy() {
    return {
      current: this.storage.getItem(P2_KEY),
      previous: this.storage.getItem(P2_BACKUP),
    };
  }
  preserveP2(fingerprint: string, raw: string) {
    const key = PROJECT_KEY + ":p2-original:" + fingerprint,
      old = this.storage.getItem(key);
    if (old !== null) {
      insist(
        old === raw,
        "동일 이행 원본이 이미 별도 저장돼 있습니다. 원문을 확인하세요.",
      );
      return;
    }
    this.storage.setItem(key, raw);
    insist(
      this.storage.getItem(key) === raw,
      "P2 원본 백업 확인에 실패했습니다.",
    );
  }
}
export function browserProjectRepository() {
  try {
    return new LocalProjectRepository(window.localStorage);
  } catch {
    return new LocalProjectRepository({
      getItem() {
        throw new Error("로컬 저장소 접근 거부");
      },
      setItem() {
        throw new Error("로컬 저장소 접근 거부");
      },
    });
  }
}
