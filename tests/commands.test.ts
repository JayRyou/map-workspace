import test from 'node:test';
import assert from 'node:assert/strict';
import { execute } from '../src/graph/commands.ts';
import { sampleMap, contextExamples, performanceMap } from '../src/fixtures/sample.ts';
import { absolutePosition, metadata } from '../src/domain/map.ts';
import { validateMap } from '../src/graph/validation.ts';
test('삭제: 노드 참조 edge 제거, 별도 결정/업무 예시는 보존', () => { const m = sampleMap(), before = JSON.stringify(contextExamples); const next = execute(m, { type: 'delete', ids: ['n_journey'] }); assert(!next.edges.some(e => e.sourceNodeId === 'n_journey' || e.targetNodeId === 'n_journey')); assert.equal(JSON.stringify(contextExamples), before); assert.equal(m.nodes.length, 6); });
test('일반 순환 및 양방향 허용', () => { const m = sampleMap(); assert.equal(validateMap(m).edges.length, 6); assert.equal(execute(m, { type: 'addEdge', edge: { id: 'back', sourceNodeId: 'n_journey', targetNodeId: 'n_interview', typeKey: 'relation', label: '역방향', metadata: metadata() } }).edges.length, 7); });
test('자가연결, 동일 방향+타입 중복, 무효 endpoint 거부; 다른 타입 허용', () => { const m = sampleMap(), e = m.edges[0]; for (const patch of [{ targetNodeId: e.sourceNodeId }, {}, { targetNodeId: 'absent' }])
    assert.throws(() => execute(m, { type: 'addEdge', edge: { ...e, id: 'new', ...patch } })); assert.equal(execute(m, { type: 'addEdge', edge: { ...e, id: 'new', typeKey: '다른 관계' } }).edges.length, 7); });
test('ID는 노드/연결/그룹 전체에서 유일', () => { const m = sampleMap(); assert.throws(() => execute(m, { type: 'addNode', node: { ...m.nodes[0], id: m.groups[0].id } })); });
test('기존 그룹 이동 후 해제/삭제 시 자식 절대위치 유지', () => { let m = execute(sampleMap(), { type: 'move', positions: { g_design: { x: 500, y: 300 } } }); const n = m.nodes.find(n => n.id === 'n_journey')!, p = absolutePosition(m, n); const d = execute(m, { type: 'delete', ids: ['g_design'] }); assert.deepEqual(absolutePosition(d, d.nodes.find(x => x.id === n.id)!), p); const u = execute(m, { type: 'reparent', nodeIds: [n.id] }); assert.deepEqual(u.nodes.find(x => x.id === n.id)!.position, p); });
test('재그룹화·크기변경은 절대좌표를 바꾸지 않음', () => { const m = sampleMap(), id = 'n_journey', p = absolutePosition(m, m.nodes.find(n => n.id === id)!); let a = execute(m, { type: 'group', id: 'newgroup', label: '합친 그룹', nodeIds: [id, 'n_interview'] }); assert.deepEqual(absolutePosition(a, a.nodes.find(n => n.id === id)!), p); a = execute(a, { type: 'resize', id: 'newgroup', size: { width: 800, height: 700 } }); assert.deepEqual(absolutePosition(a, a.nodes.find(n => n.id === id)!), p); });
test('중첩 그룹 및 없는 그룹 참조 차단', () => { const m = sampleMap(); assert.throws(() => execute(m, { type: 'group', id: 'x', label: '중첩', nodeIds: ['g_design'] })); assert.throws(() => execute(m, { type: 'reparent', nodeIds: ['n_journey'], groupId: 'missing' })); const a = structuredClone(m); a.nodes[0].groupId = 'missing'; assert.throws(() => validateMap(a)); });
test('500노드/1000연결 fixture 유효; 잘못된 숫자 거부', () => { assert.equal(validateMap(performanceMap()).edges.length, 1000); const m = sampleMap(); m.nodes[0].position.x = NaN; assert.throws(() => validateMap(m)); });

