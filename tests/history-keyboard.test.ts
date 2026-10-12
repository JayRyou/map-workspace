import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistory, commit, undo, redo } from '../src/graph/history.ts';
import { keyboardAction } from '../src/graph/keyboard.ts';
import { sampleMap } from '../src/fixtures/sample.ts';
import { absolutePosition, LIMIT } from '../src/domain/map.ts';
test('복합 생성/라벨/좌표/연결/그룹 삭제 전체 Undo/Redo는 ID·내용·관계 보존', () => { const original = sampleMap(); let h = createHistory(original); h = commit(h, { type: 'edit', id: 'n_journey', patch: { label: '변경 한글' } }); h = commit(h, { type: 'move', positions: { g_design: { x: 600, y: 100 }, n_journey: { x: 30, y: 90 } } }); h = commit(h, { type: 'delete', ids: ['n_interview', 'n_guide', 'e3'] }); const result = h.present; for (let i = 0; i < 3; i++)
    h = undo(h); assert.deepEqual(h.present, original); for (let i = 0; i < 3; i++)
    h = redo(h); assert.deepEqual(h.present, result); });
test('드래그 완료 위치 묶음은 단일 이력; 그룹+자식 Undo 좌표 정확', () => { let h = createHistory(sampleMap()); const before = structuredClone(h.present); h = commit(h, { type: 'move', positions: { g_design: { x: 570, y: 270 }, n_journey: { x: 70, y: 90 } } }); assert.equal(h.past.length, 1); assert.deepEqual(absolutePosition(h.present, h.present.nodes.find(n => n.id === 'n_journey')!), { x: 640, y: 360 }); assert.deepEqual(undo(h).present, before); });
test('연속 변경 후 Undo+새 편집은 redo 분기 폐기; no-op은 이력 없음', () => { let h = createHistory(sampleMap()); for (let i = 0; i < 30; i++)
    h = commit(h, { type: 'edit', id: 'n_journey', patch: { label: '연속 ' + i } }); h = undo(h); assert.equal(h.future.length, 1); h = commit(h, { type: 'title', title: '새 분기' }); assert.equal(h.future.length, 0); const same = commit(h, { type: 'title', title: '새 분기' }); assert.equal(h, same); });
test('이력 개수 상한 및 무효 명령 원본 보존', () => { let h = createHistory(sampleMap()); for (let i = 0; i < 120; i++)
    h = commit(h, { type: 'title', title: '버전' + i }); assert.equal(h.past.length, LIMIT.historyCount); const snapshot = JSON.stringify(h); assert.throws(() => commit(h, { type: 'move', positions: { n_journey: { x: Infinity, y: 0 } } })); assert.equal(JSON.stringify(h), snapshot); });
test('IME/input/contenteditable/modal은 Delete/Esc/CtrlZ로 편집기 명령 실행 안함', () => { for (const key of ['Delete', 'Backspace', 'Escape', 'z']) {
    const e = { key, ctrlKey: key === 'z' };
    assert.equal(keyboardAction(e, true, false, false), null);
    assert.equal(keyboardAction(e, false, true, false), null);
    assert.equal(keyboardAction({ ...e, isComposing: true }, false, false, false), null);
    assert.equal(keyboardAction({ ...e, keyCode: 229 }, false, false, false), null);
    assert.equal(keyboardAction(e, false, false, true), null);
} });
test('기본 단축키 Windows/macOS와 Redo 지원', () => { assert.equal(keyboardAction({ key: 'z', ctrlKey: true }, false, false, false), 'undo'); assert.equal(keyboardAction({ key: 'Z', metaKey: true, shiftKey: true }, false, false, false), 'redo'); assert.equal(keyboardAction({ key: 'y', ctrlKey: true }, false, false, false), 'redo'); assert.equal(keyboardAction({ key: 'Delete' }, false, false, false), 'delete'); });

