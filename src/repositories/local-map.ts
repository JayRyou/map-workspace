import type { LocalDocument, Map, View } from '../domain/map.ts';
import { cleanView } from '../domain/map.ts';
import { parseDocument, MapError } from '../graph/validation.ts';
export const CURRENT_KEY = 'map-workspace:p2:map-local:v1', BACKUP_KEY = CURRENT_KEY + ':previous', CORRUPT_KEY = CURRENT_KEY + ':quarantine';
export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
export function documentFor(map: Map, view: View): LocalDocument { return { format: 'map-workspace-map-local', schemaVersion: 1, map, view: cleanView(map, view), savedAt: new Date().toISOString() }; }
export function serializeDocument(map: Map, view: View): string { const raw = JSON.stringify(documentFor(map, view)); parseDocument(raw); return raw; }
export type Boot = {
    document: LocalDocument | null;
    blocked: boolean;
    error: string;
    raw: string | null;
    backupRaw: string | null;
};
export class LocalMapRepository {
    expected: string | null = null;
    blocked = false;
    private storage: StorageLike;
    constructor(storage: StorageLike) { this.storage = storage; }
    load(): Boot {
        let raw: string | null = null, backupRaw: string | null = null;
        try {
            raw = this.storage.getItem(CURRENT_KEY);
            backupRaw = this.storage.getItem(BACKUP_KEY);
            this.expected = raw;
            if (raw)
                return { document: parseDocument(raw), blocked: false, error: '', raw, backupRaw };
            if (!backupRaw)
                return { document: null, blocked: false, error: '', raw, backupRaw };
            this.blocked = true;
            return { document: parseDocument(backupRaw), blocked: true, error: '현재 저장값이 없습니다. 이전 정상본을 임시로 열었고 자동 저장은 중지했어요.', raw, backupRaw };
        }
        catch {
            this.blocked = true;
            let document: LocalDocument | null = null;
            try {
                if (backupRaw)
                    document = parseDocument(backupRaw);
            }
            catch { /* Preserve both originals. */ }
            return { document, blocked: true, error: document ? '현재 저장값이 손상돼 이전 정상본을 임시로 열었어요. 원본을 회수한 뒤 저장소 교체를 선택하세요.' : '로컬 저장소를 읽지 못했어요. 기존 저장값은 보호하고 샘플을 임시로 열었어요. 문서를 회수한 뒤 복구하세요.', raw, backupRaw };
        }
    }
    save(raw: string, recover = false): void {
        const next = parseDocument(raw);
        if (this.blocked && !recover)
            throw new MapError('자동 저장이 중지됐어요. 현재 초안을 내려받고 복구를 선택하세요.');
        const current = this.storage.getItem(CURRENT_KEY);
        if (!recover && current !== this.expected) {
            this.blocked = true;
            throw new MapError('다른 탭에서 저장값이 바뀌었어요. 덮어쓰지 않고 현재 초안을 유지합니다.');
        }
        if (!recover && current) {
            const old = parseDocument(current);
            if (JSON.stringify(old.map) === JSON.stringify(next.map) && JSON.stringify(old.view) === JSON.stringify(next.view)) return;
        }
        if (recover) {
            const backup = this.storage.getItem(BACKUP_KEY);
            if (current !== null || backup !== null)
                this.storage.setItem(CORRUPT_KEY, JSON.stringify({ current, backup, quarantinedAt: new Date().toISOString() }));
        }
        if (current) {
            let valid = false;
            try {
                parseDocument(current);
                valid = true;
            }
            catch { /* never rotate corrupt current over good backup */ }
            if (valid)
                this.storage.setItem(BACKUP_KEY, current);
        }
        this.storage.setItem(CURRENT_KEY, raw);
        if (this.storage.getItem(CURRENT_KEY) !== raw)
            throw new MapError('저장 확인에 실패했어요. 현재 초안을 회수하세요.');
        this.expected = raw;
        this.blocked = false;
    }
    stop() { this.blocked = true; }
    rawValues() { return { current: this.storage.getItem(CURRENT_KEY), previous: this.storage.getItem(BACKUP_KEY), quarantine: this.storage.getItem(CORRUPT_KEY) }; }
}
export function browserRepository(): LocalMapRepository { try {
    return new LocalMapRepository(window.localStorage);
}
catch {
    return new LocalMapRepository({ getItem() { throw new Error('저장소 접근 거부'); }, setItem() { throw new Error('저장소 접근 거부'); } });
} }

