export type Point = {
    x: number;
    y: number;
};
export type Property={key:string;type:'text'|'number'|'date'|'choice'|'url';value:string|number};
export type Metadata = {
    tags?:string[];customStatus?:string;properties?:Property[];
    description: string;
    notes: string;
};
export type MapNode = {
    id: string;
    typeKey: string;
    label: string;
    position: Point;
    groupId?: string;
    metadata: Metadata;
};
export type MapEdge = {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    typeKey: string;
    label: string;
    metadata: Metadata;
};
export type MapGroup = {
    id: string;
    label: string;
    position: Point;
    size: {
        width: number;
        height: number;
    };
    metadata: Metadata;
};
export type Map = {
    id: string;
    title: string;
    nodes: MapNode[];
    edges: MapEdge[];
    groups: MapGroup[];
};
export type View = {
    mode: 'map' | 'list';
    viewport: {
        x: number;
        y: number;
        zoom: number;
    };
    selectedIds: string[];
    search: string;
    typeFilter: string;
};
export type LocalDocument = {
    format: 'map-workspace-map-local';
    schemaVersion: 1;
    map: Map;
    view: View;
    savedAt: string;
};
export const LIMIT = { bytes: 1048576, nodes: 500, edges: 1000, groups: 50, label: 200, text: 10000, historyCount: 80, historyBytes: 16 * 1048576 };
export const metadata = (): Metadata => ({ description: '', notes: '' });
export const newId = (prefix = 'n') => prefix + '_' + crypto.randomUUID();
export const emptyMap = (): Map => ({ id: newId('map'), title: '새 맵', nodes: [], edges: [], groups: [] });
export const defaultView = (): View => ({ mode: 'map', viewport: { x: 0, y: 0, zoom: 1 }, selectedIds: [], search: '', typeFilter: '' });
export function absolutePosition(map: Map, node: MapNode): Point { const g = map.groups.find(g => g.id === node.groupId); return g ? { x: node.position.x + g.position.x, y: node.position.y + g.position.y } : { ...node.position }; }
export function allIds(map: Map): Set<string> { return new Set([...map.nodes, ...map.edges, ...map.groups].map(x => x.id)); }
export function cleanView(map: Map, view: View): View { const ids = allIds(map); return { ...view, selectedIds: view.selectedIds.filter(id => ids.has(id)) }; }

