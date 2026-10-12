import { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, MarkerType, applyNodeChanges } from '@xyflow/react';
import type { Node, Edge, NodeProps, NodeChange, ReactFlowInstance, OnNodesChange, OnEdgesChange } from '@xyflow/react';
import type { Map as MapModel, View, Point } from '../../domain/map.ts';
import type { Command } from '../../graph/commands.ts';
import { neighborhood } from '../../graph/commands.ts';
type CardData = {
    label: string;
    typeKey: string;
    description: string;
};
const Card = memo(function Card({ data }: NodeProps<Node<CardData>>) { return <div className="map-card"><Handle type="target" position={Position.Left} aria-label="입력 연결점"/><span className="card-type">{data.typeKey}</span><strong>{data.label}</strong><span className="card-desc">{data.description || '설명을 입력해 맥락을 남기세요.'}</span><Handle type="source" position={Position.Right} aria-label="출력 연결점"/></div>; });
const Group = memo(function Group({ data }: NodeProps<Node<{
    label: string;
}>>) { return <div className="map-group"><span>{data.label}</span></div>; });
const nodeTypes = { mapNode: Card, mapGroup: Group };
export type GraphApi = ReactFlowInstance;
export default function GraphCanvas({ map, view, onView, run, onReady, onBusy, readOnly=false }: {
    readOnly?: boolean;
    map: MapModel;
    view: View;
    onView: (patch: Partial<View>) => void;
    run: (c: Command) => boolean;
    onReady: (api: GraphApi) => void;
    onBusy: (busy: boolean) => void;
}) {
    const selected = useMemo(() => new Set(view.selectedIds), [view.selectedIds]);
    const near = useMemo(() => neighborhood(map, view.selectedIds), [map, view.selectedIds]);
    const base = useMemo<Node[]>(() => [...map.groups.map(g => ({ id: g.id, type: 'mapGroup', position: g.position, data: { label: g.label }, style: { width: g.size.width, height: g.size.height }, ariaLabel: '그룹 ' + g.label, zIndex: -1 })), ...map.nodes.map(n => ({ id: n.id, type: 'mapNode', position: n.position, parentId: n.groupId, data: { label: n.label, typeKey: n.typeKey, description: n.metadata.description }, ariaLabel: '요소 ' + n.label, style: { width: 190 }, zIndex: 1 }))], [map]);
    const nodeCache = useRef(new Map<string, {
        base: Node;
        selected: boolean;
        className: string;
        node: Node;
    }>());
    const converted = useMemo(() => { const cache = new Map<string, {
        base: Node;
        selected: boolean;
        className: string;
        node: Node;
    }>(); const result = base.map(n => { const on = selected.has(n.id), className = view.selectedIds.length && (n.type === 'mapNode') && !near.nodes.has(n.id) ? 'context-muted' : ''; const old = nodeCache.current.get(n.id); const row = old && old.base === n && old.selected === on && old.className === className ? old : { base: n, selected: on, className, node: { ...n, selected: on, className } }; cache.set(n.id, row); return row.node; }); nodeCache.current = cache; return result; }, [base, selected, near, view.selectedIds.length]);
    const [nodes, setNodes] = useState<Node[]>(converted), nodesRef = useRef(nodes), dragging = useRef(false), moved = useRef<Record<string, Point>>({});
    const viewRef = useRef(view);
    viewRef.current = view;
    useEffect(() => { if (!dragging.current) {
        setNodes(current => { const existing = new Map(current.map(n => [n.id, n])); const next = converted.map(n => { const old = existing.get(n.id); if (!old)
            return n; if (old.data === n.data && old.selected === n.selected && old.className === n.className && old.parentId === n.parentId && old.position.x === n.position.x && old.position.y === n.position.y && old.style === n.style)
            return old; return { ...n, measured: old.measured }; }); nodesRef.current = next; return next; });
    } }, [converted]);
    const edgeCache = useRef(new Map<string, {
        base: MapModel['edges'][number];
        selected: boolean;
        active: boolean;
        edge: Edge;
    }>());
    const lines = useMemo<Edge[]>(() => { const cache = new Map<string, {
        base: MapModel['edges'][number];
        selected: boolean;
        active: boolean;
        edge: Edge;
    }>(); const result = map.edges.map(e => { const on = selected.has(e.id), active = on || near.edges.has(e.id), old = edgeCache.current.get(e.id); if (old && old.base === e && old.selected === on && old.active === active) {
        cache.set(e.id, old);
        return old.edge;
    } const color = active ? '#245dc1' : '#7d8d9b'; const edge: Edge = { id: e.id, source: e.sourceNodeId, target: e.targetNodeId, label: e.label, type: 'smoothstep', selected: on, markerEnd: { type: MarkerType.ArrowClosed, color }, style: { stroke: color, strokeWidth: on ? 2.5 : 1.5 }, labelStyle: { fill: '#435462', fontSize: 11 }, labelBgStyle: { fill: '#f7f8fa' }, interactionWidth: 24, ariaLabel: '연결 ' + e.label }; cache.set(e.id, { base: e, selected: on, active, edge }); return edge; }); edgeCache.current = cache; return result; }, [map.edges, selected, near]);
    const selectChanges = useCallback((changes: ({
        type: string;
        id?: string;
        selected?: boolean;
    })[]) => { const events = changes.filter(c => c.type === 'select'); if (!events.length)
        return; const ids = new Set(viewRef.current.selectedIds); for (const e of events)
        if (e.id) {
            if (e.selected)
                ids.add(e.id);
            else
                ids.delete(e.id);
        } const next = [...ids]; if (next.join('|') !== viewRef.current.selectedIds.join('|')) {
        viewRef.current = { ...viewRef.current, selectedIds: next };
        onView({ selectedIds: next });
    } }, [onView]);
    const changes: OnNodesChange = useCallback((cs: NodeChange[]) => { setNodes(ns => { const next = applyNodeChanges(cs, ns); nodesRef.current = next; return next; }); selectChanges(cs); for (const c of cs)
        if (c.type === 'position' && c.position && dragging.current)
            moved.current[c.id] = c.position; }, [selectChanges]);
    const edgeChanges: OnEdgesChange = useCallback(cs => selectChanges(cs), [selectChanges]);
    const start = () => { if (dragging.current)
        return; dragging.current = true; moved.current = {}; onBusy(true); };
    const finish = () => { if (!dragging.current)
        return; dragging.current = false; const positions = { ...moved.current }; moved.current = {}; if (Object.keys(positions).length && !run({ type: 'move', positions })) {
        setNodes(converted);
        nodesRef.current = converted;
    } onBusy(false); };
    return <div className="graph-root" data-testid="canvas"><ReactFlow nodes={nodes} edges={lines} nodeTypes={nodeTypes} onNodesChange={changes} onEdgesChange={edgeChanges} onNodeDragStart={start} onNodeDragStop={finish} onSelectionDragStart={start} onSelectionDragStop={finish} onConnect={c => { if (c.source && c.target)
        run({ type: 'addEdge', edge: { id: 'e_' + crypto.randomUUID(), sourceNodeId: c.source, targetNodeId: c.target, typeKey: 'relation', label: '이어짐', metadata: { description: '', notes: '' } } }); }} onInit={api => onReady(api)} defaultViewport={view.viewport} onMoveEnd={(_, viewport) => onView({ viewport })} deleteKeyCode={null} disableKeyboardA11y selectionOnDrag panOnDrag={[1, 2]} multiSelectionKeyCode={['Control', 'Meta', 'Shift']} selectionKeyCode="Shift" minZoom={.05} maxZoom={4} nodesDraggable={!readOnly} elementsSelectable nodesConnectable={!readOnly} selectNodesOnDrag nodeDragThreshold={3} ariaLabelConfig={{ 'controls.zoomIn.ariaLabel': '맵 확대', 'controls.zoomOut.ariaLabel': '맵 축소', 'controls.fitView.ariaLabel': '전체 보기', 'controls.interactive.ariaLabel': '상호작용 전환', 'node.a11yDescription.keyboardDisabled': 'Enter로 선택합니다. 방향키로 이동하고 상세에서 수정하세요.', 'edge.a11yDescription.default': 'Enter로 연결을 선택하고 상세에서 수정하세요.' }} proOptions={{ hideAttribution: false }}><Background gap={18} size={1} color="#d9dfe4"/><Controls showInteractive={false}/></ReactFlow><div className="canvas-caption">드래그로 영역 선택 · Shift/Ctrl 다중 선택 · 마우스 휠 확대 · 우클릭 드래그 이동</div></div>;
}

