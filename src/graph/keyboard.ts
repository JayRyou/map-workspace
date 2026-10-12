export type KeyEvent = {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    isComposing?: boolean;
    keyCode?: number;
};
export function keyboardAction(e: KeyEvent, editing: boolean, composing: boolean, modal: boolean): 'undo' | 'redo' | 'delete' | 'escape' | null {
    if (editing || composing || modal || e.isComposing || e.keyCode === 229)
        return null;
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && key === 'z')
        return e.shiftKey ? 'redo' : 'undo';
    if ((e.ctrlKey || e.metaKey) && key === 'y')
        return 'redo';
    if (e.key === 'Delete' || e.key === 'Backspace')
        return 'delete';
    if (e.key === 'Escape')
        return 'escape';
    return null;
}

