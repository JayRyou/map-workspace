import type { Map } from '../domain/map.ts';
import { LIMIT } from '../domain/map.ts';
import { execute } from './commands.ts';
import type { Command } from './commands.ts';
import { bytes } from './validation.ts';
export type History = {
    past: Map[];
    present: Map;
    future: Map[];
};
export const createHistory = (map: Map): History => ({ past: [], present: map, future: [] });
function bounded(stack: Map[]) { let size = 0; const keep: Map[] = []; for (let i = stack.length - 1; i >= 0; i--) {
    const cost = bytes(JSON.stringify(stack[i]));
    if (keep.length >= LIMIT.historyCount || size + cost > LIMIT.historyBytes)
        break;
    size += cost;
    keep.unshift(stack[i]);
} return keep; }
export function commit(h: History, c: Command): History { const next = execute(h.present, c); if (JSON.stringify(next) === JSON.stringify(h.present))
    return h; return { past: bounded([...h.past, h.present]), present: next, future: [] }; }
export function undo(h: History): History { if (!h.past.length)
    return h; return { past: h.past.slice(0, -1), present: h.past.at(-1)!, future: bounded([...h.future, h.present]) }; }
export function redo(h: History): History { if (!h.future.length)
    return h; return { past: bounded([...h.past, h.present]), present: h.future.at(-1)!, future: h.future.slice(0, -1) }; }

