import { absolutePosition, metadata } from '../domain/map.ts';
import type { Map, MapNode, MapEdge, MapGroup, Point, Metadata } from '../domain/map.ts';
import { MapError, validateMap } from './validation.ts';
export type Command = {
    type: 'addNode';
    node: MapNode;
} | {
    type: 'addEdge';
    edge: MapEdge;
} | {
    type: 'edit';
    id: string;
    patch: {
        label?: string;
        typeKey?: string;
        metadata?: Metadata;
        sourceNodeId?: string;
        targetNodeId?: string;
    };
} | {
    type: 'move';
    positions: Record<string, Point>;
} | {
    type: 'delete';
    ids: string[];
} | {
    type: 'group';
    id: string;
    label: string;
    nodeIds: string[];
} | {
    type: 'reparent';
    nodeIds: string[];
    groupId?: string;
} | {
    type: 'resize';
    id: string;
    size: MapGroup['size'];
} | {
    type: 'title';
    title: string;
} | {
    type: 'replace';
    map: Map;
};
export function execute(source: Map, command: Command): Map {
    const m = structuredClone(source);
    const requireItem = (id: string) => { const x = [...m.nodes, ...m.edges, ...m.groups].find(x => x.id === id); if (!x)
        throw new MapError('대상을 찾을 수 없습니다: ' + id); return x; };
    switch (command.type) {
        case 'addNode':
            m.nodes.push(structuredClone(command.node));
            break;
        case 'addEdge':
            m.edges.push(structuredClone(command.edge));
            break;
        case 'edit': {
            const x = requireItem(command.id);
            for (const [k, v] of Object.entries(command.patch)) {
                if (k === 'label' || k === 'metadata' || (k === 'typeKey' && 'typeKey' in x) || (['sourceNodeId', 'targetNodeId'].includes(k) && 'sourceNodeId' in x))
                    Object.assign(x, { [k]: v });
                else
                    throw new MapError('이 요소에서 수정할 수 없는 필드입니다.');
            }
            break;
        }
        case 'move':
            for (const [id, p] of Object.entries(command.positions)) {
                const x = requireItem(id);
                if (!('position' in x))
                    throw new MapError('연결선은 좌표를 갖지 않습니다.');
                x.position = { ...p };
            }
            break;
        case 'delete': {
            const ids = new Set(command.ids);
            command.ids.forEach(requireItem);
            for (const n of m.nodes)
                if (n.groupId && ids.has(n.groupId) && !ids.has(n.id)) {
                    n.position = absolutePosition(m, n);
                    delete n.groupId;
                }
            m.groups = m.groups.filter(g => !ids.has(g.id));
            m.nodes = m.nodes.filter(n => !ids.has(n.id));
            const ns = new Set(m.nodes.map(n => n.id));
            m.edges = m.edges.filter(e => !ids.has(e.id) && ns.has(e.sourceNodeId) && ns.has(e.targetNodeId));
            break;
        }
        case 'group': {
            if (!command.nodeIds.length)
                throw new MapError('그룹으로 묶을 노드를 선택하세요.');
            const ids = new Set(command.nodeIds);
            if (ids.size !== command.nodeIds.length)
                throw new MapError('중복 선택입니다.');
            const nodes = command.nodeIds.map(id => { const n = m.nodes.find(n => n.id === id); if (!n)
                throw new MapError('노드만 그룹으로 묶을 수 있습니다.'); return n; });
            const ps = nodes.map(n => absolutePosition(m, n));
            const x = Math.min(...ps.map(p => p.x)) - 24, y = Math.min(...ps.map(p => p.y)) - 48;
            const g = { id: command.id, label: command.label, position: { x, y }, size: { width: Math.max(...ps.map(p => p.x)) - x + 220, height: Math.max(...ps.map(p => p.y)) - y + 140 }, metadata: metadata() };
            m.groups.push(g);
            nodes.forEach((n, i) => { n.groupId = g.id; n.position = { x: ps[i].x - x, y: ps[i].y - y }; });
            break;
        }
        case 'reparent': {
            const target = command.groupId ? m.groups.find(g => g.id === command.groupId) : undefined;
            if (command.groupId && !target)
                throw new MapError('그룹이 없습니다.');
            for (const id of command.nodeIds) {
                const n = m.nodes.find(n => n.id === id);
                if (!n)
                    throw new MapError('노드가 없습니다.');
                const p = absolutePosition(m, n);
                if (target) {
                    n.groupId = target.id;
                    n.position = { x: p.x - target.position.x, y: p.y - target.position.y };
                }
                else {
                    delete n.groupId;
                    n.position = p;
                }
            }
            break;
        }
        case 'resize': {
            const g = m.groups.find(g => g.id === command.id);
            if (!g)
                throw new MapError('그룹이 없습니다.');
            g.size = { ...command.size };
            break;
        }
        case 'title':
            m.title = command.title;
            break;
        case 'replace': return validateMap(command.map);
    }
    return validateMap(m);
}
export function neighborhood(m: Map, selected: string[]) { const nodes = new Set<string>(), edges = new Set<string>(); const selectedSet = new Set(selected); for (const n of m.nodes)
    if (selectedSet.has(n.id) || (n.groupId && selectedSet.has(n.groupId)))
        nodes.add(n.id); for (const e of m.edges)
    if (selectedSet.has(e.id)) {
        nodes.add(e.sourceNodeId);
        nodes.add(e.targetNodeId);
        edges.add(e.id);
    } const origin = new Set(nodes); for (const e of m.edges)
    if (origin.has(e.sourceNodeId) || origin.has(e.targetNodeId)) {
        nodes.add(e.sourceNodeId);
        nodes.add(e.targetNodeId);
        edges.add(e.id);
    } return { nodes, edges }; }

