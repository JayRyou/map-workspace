import { LIMIT } from '../domain/map.ts';
import type { Map, LocalDocument, View, Metadata, Point } from '../domain/map.ts';
export class MapError extends Error {
    constructor(message: string) { super(message); this.name = 'MapError'; }
}
export const bytes = (x: string) => new TextEncoder().encode(x).byteLength;
function fail(m: string): never { throw new MapError(m); }
function obj(x: unknown, keys: string[], at: string): Record<string, unknown> { if (!x || typeof x !== 'object' || Array.isArray(x))
    fail(at + ': 객체가 필요합니다.'); const o = x as Record<string, unknown>; for (const k of Object.keys(o))
    if (!keys.includes(k) || ['__proto__', 'constructor', 'prototype'].includes(k))
        fail(at + ': 지원하지 않는 필드 ' + k); return o; }
function text(x: unknown, at: string, max = 200, required = true): string { if (typeof x !== 'string' || x.length > max || (required && !x.trim()))
    fail(at + ': 비어 있지 않은 ' + max + '자 이하의 문자열이어야 합니다.'); return x as string; }
function id(x: unknown, at: string): string { const s = text(x, at, 100); if (!/^[a-zA-Z0-9_-]+$/.test(s))
    fail(at + ': ID 형식이 잘못됐습니다.'); return s; }
function num(x: unknown, at: string, min = -100000, max = 100000): number { if (typeof x !== 'number' || !Number.isFinite(x) || x < min || x > max)
    fail(at + ': 허용 범위의 유한 숫자가 필요합니다.'); return x as number; }
function point(x: unknown, at: string): Point { const o = obj(x, ['x', 'y'], at); return { x: num(o.x, at + '.x'), y: num(o.y, at + '.y') }; }
function meta(x: unknown): Metadata { const o = obj(x, ['description', 'notes'], '메타데이터'); return { description: text(o.description, '설명', LIMIT.text, false), notes: text(o.notes, '메모', LIMIT.text, false) }; }
function array(x: unknown, max: number, at: string): unknown[] { if (!Array.isArray(x) || x.length > max)
    fail(at + ': 최대 ' + max + '개 배열만 지원합니다.'); return x as unknown[]; }
export function validateMap(input: unknown): Map {
    const o = obj(input, ['id', 'title', 'nodes', 'edges', 'groups'], '맵');
    const groups = array(o.groups, LIMIT.groups, '그룹').map(v => { const g = obj(v, ['id', 'label', 'position', 'size', 'metadata'], '그룹'); const s = obj(g.size, ['width', 'height'], '그룹 크기'); return { id: id(g.id, '그룹ID'), label: text(g.label, '그룹 이름'), position: point(g.position, '그룹 위치'), size: { width: num(s.width, '너비', 160, 20000), height: num(s.height, '높이', 100, 20000) }, metadata: meta(g.metadata) }; });
    const nodes = array(o.nodes, LIMIT.nodes, '노드').map(v => { const n = obj(v, ['id', 'typeKey', 'label', 'position', 'groupId', 'metadata'], '노드'); return { id: id(n.id, '노드ID'), typeKey: text(n.typeKey, '노드 타입', 60), label: text(n.label, '노드 이름'), position: point(n.position, '노드 위치'), ...(n.groupId !== undefined ? { groupId: id(n.groupId, '그룹 참조') } : {}), metadata: meta(n.metadata) }; });
    const edges = array(o.edges, LIMIT.edges, '연결').map(v => { const e = obj(v, ['id', 'sourceNodeId', 'targetNodeId', 'typeKey', 'label', 'metadata'], '연결'); return { id: id(e.id, '연결ID'), sourceNodeId: id(e.sourceNodeId, '출발ID'), targetNodeId: id(e.targetNodeId, '도착ID'), typeKey: text(e.typeKey, '관계 타입', 60), label: text(e.label, '관계 이름'), metadata: meta(e.metadata) }; });
    const ids = new Set<string>();
    for (const el of [...groups, ...nodes, ...edges]) {
        if (ids.has(el.id))
            fail('중복 ID: ' + el.id);
        ids.add(el.id);
    }
    const ns = new Set(nodes.map(n => n.id)), gs = new Set(groups.map(g => g.id)), relations = new Set<string>();
    for (const n of nodes) {
        if (n.groupId && !gs.has(n.groupId))
            fail('존재하지 않는 그룹: ' + n.groupId);
        const g = groups.find(g => g.id === n.groupId);
        if (g) {
            num(n.position.x + g.position.x, '노드 절대X');
            num(n.position.y + g.position.y, '노드 절대Y');
        }
    }
    for (const e of edges) {
        if (!ns.has(e.sourceNodeId) || !ns.has(e.targetNodeId))
            fail('연결 대상 노드가 없습니다.');
        if (e.sourceNodeId === e.targetNodeId)
            fail('자기 자신을 연결할 수 없습니다.');
        const key = JSON.stringify([e.sourceNodeId, e.targetNodeId, e.typeKey]);
        if (relations.has(key))
            fail('같은 방향·타입의 연결이 이미 있습니다.');
        relations.add(key);
    }
    const result = { id: id(o.id, '맵ID'), title: text(o.title, '맵 제목'), nodes, edges, groups };
    if (bytes(JSON.stringify(result)) > LIMIT.bytes)
        fail('맵이 1 MiB 한도를 초과합니다.');
    return result;
}
export function validateView(input: unknown, map: Map): View {
    const v = obj(input, ['mode', 'viewport', 'selectedIds', 'search', 'typeFilter'], '화면 상태');
    if (v.mode !== 'map' && v.mode !== 'list')
        fail('지원하지 않는 화면 모드입니다.');
    const p = obj(v.viewport, ['x', 'y', 'zoom'], '뷰포트');
    const ids = new Set([...map.nodes, ...map.edges, ...map.groups].map(x => x.id));
    const selected = array(v.selectedIds, 1550, '선택').map(x => id(x, '선택ID'));
    if (selected.some(id => !ids.has(id)) || new Set(selected).size !== selected.length)
        fail('선택 상태 참조가 잘못됐습니다.');
    return { mode: v.mode, viewport: { x: num(p.x, '화면X', -1000000, 1000000), y: num(p.y, '화면Y', -1000000, 1000000), zoom: num(p.zoom, '배율', .05, 4) }, selectedIds: selected, search: text(v.search, '검색', 200, false), typeFilter: text(v.typeFilter, '유형 필터', 60, false) };
}
export function parseDocument(raw: string): LocalDocument {
    if (bytes(raw) > LIMIT.bytes)
        fail('로컬 문서가 1 MiB 한도를 초과합니다.');
    let x: unknown;
    try {
        x = JSON.parse(raw);
    }
    catch {
        fail('JSON이 손상됐습니다. 원본 파일과 현재 편집 내용은 유지됩니다.');
    }
    const o = obj(x, ['format', 'schemaVersion', 'map', 'view', 'savedAt'], '로컬 문서');
    if (o.format !== 'map-workspace-map-local' || o.schemaVersion !== 1)
        fail('지원하지 않는 형식/버전입니다. P2 map-local v1만 지원합니다.');
    const map = validateMap(o.map), view = validateView(o.view, map);
    const savedAt = text(o.savedAt, '저장 시각', 40);
    if (!/^\d{4}-\d\d-\d\dT/.test(savedAt) || !Number.isFinite(Date.parse(savedAt)))
        fail('저장 시각이 잘못됐습니다.');
    return { format: 'map-workspace-map-local', schemaVersion: 1, map, view, savedAt };
}

