import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { FormEvent, ReactNode } from 'react';
import GraphCanvas from './components/map/GraphCanvas.tsx';
import type { GraphApi } from './components/map/GraphCanvas.tsx';
import { defaultView, emptyMap, metadata, newId, absolutePosition, cleanView } from './domain/map.ts';
import type { Map, View, MapNode, MapEdge, MapGroup } from './domain/map.ts';
import { commit, createHistory, undo, redo } from './graph/history.ts';
import type { Command } from './graph/commands.ts';
import { neighborhood } from './graph/commands.ts';
import { browserRepository, serializeDocument, CURRENT_KEY, BACKUP_KEY } from './repositories/local-map.ts';
import { parseDocument } from './graph/validation.ts';
import type { LocalDocument } from './domain/map.ts';
import { keyboardAction } from './graph/keyboard.ts';
import { sampleMap, performanceMap, contextExamples } from './fixtures/sample.ts';
function Dialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
    const ref=useRef<HTMLDialogElement>(null), composing=useRef(false);
    useEffect(()=>{
        const old=document.activeElement as HTMLElement;
        ref.current?.showModal();
        return()=>{ref.current?.close();if(old?.isConnected)old.focus();};
    },[]);
    return <dialog ref={ref} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}}
        onCancel={e=>{e.preventDefault();if(!composing.current)onClose();}}
        onKeyDown={e=>{
            if(e.nativeEvent.isComposing||composing.current)return;
            if(e.key!=='Tab')return;
            const targets=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')||[]).filter(x=>x.getClientRects().length>0);
            if(!targets.length){e.preventDefault();return;}
            const first=targets[0],last=targets.at(-1)!;
            if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
            else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
        }} aria-labelledby="modal-title">
        <header><div><span className="eyebrow">MAP WORKSPACE</span><h2 id="modal-title">{title}</h2></div><button onClick={onClose} aria-label="대화상자 닫기">×</button></header>
        <div className="dialog-body">{children}</div>
    </dialog>;
}
const message = (e: unknown) => e instanceof Error ? e.message : String(e);
export default function App() {
    const [repository] = useState(browserRepository), [boot] = useState(() => repository.load());
    const [history, setHistory] = useState(() => createHistory(boot.document?.map || sampleMap())), historyRef = useRef(history);
    historyRef.current = history;
    const map = history.present;
    const [view, setView] = useState<View>(() => boot.document ? { ...boot.document.view, mode: innerWidth <= 800 ? 'list' : boot.document.view.mode } : { ...defaultView(), mode: innerWidth <= 800 ? 'list' : 'map', selectedIds: ['n_journey'] });
    const viewRef = useRef(view);
    viewRef.current = view;
    const [storageState, setStorageState] = useState<'dirty' | 'saving' | 'saved' | 'error'>(boot.blocked ? 'error' : 'dirty'), [storageError, setStorageError] = useState(boot.error), [pendingImport, setPendingImport] = useState<LocalDocument | null>(null);
    const needsInitialFit = useRef(!boot.document);
    const [dialog, setDialog] = useState<string | null>(null), [notice, setNotice] = useState(''), [panel, setPanel] = useState(false), [busy, setBusy] = useState(false);
    const api = useRef<GraphApi | null>(null), composing = useRef(false);
    const updateView = useCallback((patch: Partial<View>) => { setStorageState(repository.blocked ? 'error' : 'dirty'); setView(v => ({ ...v, ...patch })); }, [repository]);
    const run = useCallback((c: Command) => { try {
        const next = commit(historyRef.current, c);
        if (next !== historyRef.current)
            setStorageState(repository.blocked ? 'error' : 'dirty');
        historyRef.current = next;
        setHistory(next);
        setView(v => cleanView(next.present, v));
        setNotice('');
        return true;
    }
    catch (e) {
        setNotice(message(e));
        return false;
    } }, []);
    const restore = (dir: 'undo' | 'redo') => { if (busy)
        return; const next = (dir === 'undo' ? undo : redo)(historyRef.current); if (next !== historyRef.current)
        setStorageState(repository.blocked ? 'error' : 'dirty'); historyRef.current = next; setHistory(next); setView(v => cleanView(next.present, v)); setNotice(dir === 'undo' ? '편집을 되돌렸어요.' : '편집을 다시 실행했어요.'); };
    const select = (id: string, focus = true) => { updateView({ selectedIds: [id] }); setPanel(true); if (focus && view.mode === 'map') {
        const node = map.nodes.find(n => n.id === id), group = map.groups.find(g => g.id === id);
        if (node) {
            const p = absolutePosition(map, node);
            void api.current?.setCenter(p.x + 95, p.y + 50, { zoom: Math.max(view.viewport.zoom, .8), duration: 180 });
        }
        else if (group)
            void api.current?.fitView({ nodes: [{ id }], padding: .3, duration: 180 });
    } };
    const saveNow = useCallback((recover = false) => { try {
        const raw = serializeDocument(historyRef.current.present, viewRef.current);
        repository.save(raw, recover);
        setStorageState('saved');
        setStorageError('');
        return true;
    }
    catch (e) {
        setStorageState('error');
        setStorageError(message(e) + ' 현재 편집 내용은 메모리에 유지됩니다.');
        return false;
    } }, [repository]);
    useEffect(() => { if (repository.blocked) {
        setStorageState('error');
        return;
    } if (busy) {
        setStorageState('dirty');
        return;
    } setStorageState('dirty'); const timer = setTimeout(() => { setStorageState('saving'); saveNow(); }, 400); return () => clearTimeout(timer); }, [map, view, busy, repository, saveNow]);
    useEffect(() => { const listener = (e: StorageEvent) => { if (e.key === CURRENT_KEY || e.key === null) {
        repository.stop();
        setStorageState('error');
        setStorageError('다른 탭에서 로컬 문서가 바뀌었어요. 현재 초안을 내려받고 새로고침하거나 명시적으로 저장소를 교체하세요.');
    } }; window.addEventListener('storage', listener); return () => window.removeEventListener('storage', listener); }, [repository]);
    useEffect(() => { const before = (e: BeforeUnloadEvent) => { if (storageState !== 'saved') {
        e.preventDefault();
        e.returnValue = '';
    } }; window.addEventListener('beforeunload', before); return () => window.removeEventListener('beforeunload', before); }, [storageState]);
    const download = (raw: string, name: string, type = 'application/json') => { const url = URL.createObjectURL(new Blob([raw], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); };
    const exportCurrent = () => { try {
        download(serializeDocument(historyRef.current.present, viewRef.current), 'MAP-P2-map-local.json');
        setNotice('P2 테스트 형식의 현재 문서를 내려받았어요. 제품용 백업 형식은 아닙니다.');
    }
    catch (e) {
        setNotice(message(e));
    } };
    const primary = view.selectedIds.at(-1);
    useEffect(() => { if (panel && innerWidth <= 800) {
        const t = requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.inspector>header button')?.focus());
        return () => cancelAnimationFrame(t);
    } }, [panel, primary]);
    const item = useMemo(() => [...map.nodes, ...map.edges, ...map.groups].find(x => x.id === primary), [map, primary]);
    const selectedNodes = map.nodes.filter(n => view.selectedIds.includes(n.id));
    useEffect(() => { const resize = () => { if (innerWidth <= 800)
        updateView({ mode: 'list' }); }; window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, [updateView]);
    useEffect(() => { const onKey = (e: KeyboardEvent) => { const el = e.target as HTMLElement; const textTarget = !!el.closest('input,textarea,select,[role="textbox"]') || el.isContentEditable; const action = keyboardAction(e, textTarget, composing.current, !!dialog); if (e.isComposing || e.keyCode === 229 || composing.current || textTarget || dialog)
        return; if (action === 'undo' || action === 'redo') {
        e.preventDefault();
        restore(action);
    }
    else if (action === 'delete' && view.selectedIds.length) {
        e.preventDefault();
        setDialog('delete');
    }
    else if (action === 'escape') {
        updateView({ selectedIds: [] });
        setPanel(false);
    }
    else if (el.closest('.react-flow__node') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 50 : 10, positions: Record<string, {
            x: number;
            y: number;
        }> = {};
        for (const x of [...map.groups, ...map.nodes])
            if (view.selectedIds.includes(x.id) && !('groupId' in x && x.groupId && view.selectedIds.includes(x.groupId))) {
                positions[x.id] = { x: x.position.x + (e.key === 'ArrowRight' ? delta : e.key === 'ArrowLeft' ? -delta : 0), y: x.position.y + (e.key === 'ArrowDown' ? delta : e.key === 'ArrowUp' ? -delta : 0) };
            }
        if (Object.keys(positions).length)
            run({ type: 'move', positions });
    } }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [view, map, dialog, busy]);
    const createNode = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget), id = newId(), host = document.querySelector('.graph-root')?.getBoundingClientRect(); const p = host && api.current ? api.current.screenToFlowPosition({ x: host.left + host.width / 2 - 95, y: host.top + host.height / 2 - 45 }) : { x: 80 + (map.nodes.length % 5) * 40, y: 100 + (map.nodes.length % 5) * 40 }; if (run({ type: 'addNode', node: { id, label: String(f.get('label')), typeKey: String(f.get('typeKey')), position: p, metadata: metadata() } })) {
        updateView({ selectedIds: [id] });
        setDialog(null);
        setPanel(true);
    } };
    const createEdge = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget), id = newId('e'); if (run({ type: 'addEdge', edge: { id, label: String(f.get('label')), typeKey: String(f.get('typeKey')), sourceNodeId: String(f.get('source')), targetNodeId: String(f.get('target')), metadata: metadata() } })) {
        updateView({ selectedIds: [id] });
        setDialog(null);
        setPanel(true);
    } };
    const replaceMap = (m: Map) => { if (run({ type: 'replace', map: m })) {
        setDialog(null);
        updateView({ ...defaultView(), mode: innerWidth <= 800 ? 'list' : 'map' });
        requestAnimationFrame(() => requestAnimationFrame(() => void api.current?.fitView({ padding: .16, maxZoom: 1 })));
        setPanel(false);
    } };
    const match = (n: {
        label: string;
        id: string;
        typeKey?: string;
    }) => (!view.search || n.label.toLowerCase().includes(view.search.toLowerCase())) && (!view.typeFilter || n.typeKey === view.typeFilter);
    const filtered = [...map.nodes, ...map.edges, ...map.groups].filter(match);
    const near = neighborhood(map, view.selectedIds);
    return <div className="app" onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}>
 <a className="skip" href="#main">편집 영역으로 건너뛰기</a><div className="demo-band"><span><b>P2 로컬 편집기</b> · 이 브라우저에서만 작업 · 서버/계정 없음</span><button onClick={() => setDialog('help')}>사용 안내 ↗</button></div>
 <header className="appbar"><div className="brand"><span className="brand-mark">⌘</span><b>MAP Workspace</b></div><span className="breadcrumb">내 기기의 작업 공간 <span>/</span> {map.title}</span><button className="mobile-menu" onClick={() => setDialog('menu')} aria-label="탐색 메뉴">☰</button><div className="app-actions"><button onClick={() => setDialog('new')}>새 맵</button><button className="primary" onClick={() => setDialog('data')}>로컬 문서</button></div></header>
 <div className="body-grid"><aside className="sidebar"><div className="workspace-name"><span>S</span><div><b>내 작업 공간</b><small>이 기기 · 로컬 문서</small></div></div><nav><button className="active" onClick={() => { updateView({ mode: 'map' }); setPanel(false); }}>⌘ 전체 구조 <small>{map.nodes.length}</small></button><button onClick={() => updateView({ mode: 'list' })}>▤ 요소 목록</button><button onClick={() => setDialog('sample')}>↻ 샘플 맵 열기</button><div className="nav-label">맥락 · 읽기 전용</div><button onClick={() => setDialog('context')}>◇ 정책·결정 샘플</button><button onClick={() => setDialog('context')}>☑ 연결 업무 샘플</button><div className="nav-label">로컬 관리</div><button onClick={() => setDialog('data')}>↥ 가져오기·내보내기</button><button onClick={() => setDialog('help')}>? 단축키·도움말</button></nav><div className="sidebar-bottom"><p>관계를 읽고,<br />생각을 연결하세요.</p><small>팀·공유·인증은 후속 단계</small></div></aside>
 <main id="main" tabIndex={-1}><div className="map-heading"><div><form className="title-form" key={map.title} onSubmit={e => { e.preventDefault(); run({ type: 'title', title: String(new FormData(e.currentTarget).get('title')) }); }}><input name="title" aria-label="맵 제목" defaultValue={map.title} maxLength={200}/><button title="맵 제목 적용" aria-label="맵 제목 적용">✓</button></form><p>요소와 관계를 직접 편집하고, 연결된 맥락을 살펴보세요.</p></div><span className="local-label">로컬 전용</span></div>
 <div className={'statebar ' + (storageState === 'error' ? 'error' : '')} role="status"><b>{({ dirty: '변경 있음 · 이 기기에 저장 대기', saving: '이 기기에 저장 중…', saved: '이 기기에서 저장됨', error: '이 기기에 저장하지 못했어요' })[storageState]}</b><span>이력 {history.past.length}건 · 서버 저장 없음</span>{storageState === 'error' && <button onClick={() => setDialog('data')}>초안 회수·복구</button>}</div>{storageError && <div className="notice storage-error" role="alert">{storageError}</div>}
 {notice && <div className="notice" role="alert"><span>{notice}</span><button aria-label="알림 닫기" onClick={() => setNotice('')}>×</button></div>}
 <div className="editor"><section className="canvas-column"><div className="map-toolbar"><div className="tool-group"><button onClick={() => setDialog('node')} disabled={busy}>＋ 요소</button><button onClick={() => setDialog('edge')} disabled={map.nodes.length < 2 || busy} title={map.nodes.length < 2 ? '노드가 2개 이상 필요해요' : '노드 사이 관계 추가'}>↗ 연결</button><button onClick={() => setDialog('group')} disabled={!selectedNodes.length || busy} title="선택한 노드를 그룹으로 묶기">▢ 그룹</button></div><div className="history-buttons"><button aria-label="되돌리기" title="Ctrl/Cmd+Z" disabled={!history.past.length || busy} onClick={() => restore('undo')}>↶</button><button aria-label="다시 실행" title="Ctrl/Cmd+Shift+Z" disabled={!history.future.length || busy} onClick={() => restore('redo')}>↷</button></div><div className="view-toggle"><button aria-pressed={view.mode === 'map'} onClick={() => updateView({ mode: 'map' })}>맵</button><button aria-pressed={view.mode === 'list'} onClick={() => updateView({ mode: 'list' })}>목록</button></div></div>
 <div className="search-bar"><input aria-label="요소 검색" placeholder="이름으로 찾기" maxLength={200} value={view.search} onChange={e => updateView({ search: e.target.value })}/><select aria-label="유형 필터" value={view.typeFilter} onChange={e => updateView({ typeFilter: e.target.value })}><option value="">모든 유형</option>{[...new Set([...map.nodes, ...map.edges].map(n => n.typeKey))].map(t => <option key={t}>{t}</option>)}</select><span>{map.nodes.length} 요소 · {map.edges.length} 관계 · {map.groups.length} 그룹</span>{view.selectedIds.length > 0 && <button onClick={() => setDialog('delete')} disabled={busy}>선택 삭제 ({view.selectedIds.length})</button>}</div>
 {view.mode === 'map' && !view.search && !view.typeFilter ? <div className="canvas-host"><GraphCanvas map={map} view={view} onView={updateView} run={run} onBusy={setBusy} onReady={flow => { api.current = flow; if (needsInitialFit.current) {
        needsInitialFit.current = false;
        requestAnimationFrame(() => void flow.fitView({ padding: .12, maxZoom: 1 }));
    } }}/>{map.nodes.length === 0 && <div className="empty-canvas"><span className="empty-icon">＋</span><h2>첫 연결을 시작해 보세요</h2><p>아이디어 하나에서 시작해도 좋아요.</p><button className="primary" onClick={() => setDialog('node')}>첫 요소 추가</button></div>}</div> : <div className="element-list"><p className="list-hint">체크박스로 여러 요소를 선택할 수 있어요. 이름을 누르면 상세를 엽니다.</p>{filtered.map(x => <div className={'element-row ' + (view.selectedIds.includes(x.id) ? 'selected' : '')} key={x.id}><input type="checkbox" aria-label={x.label + ' 다중 선택'} checked={view.selectedIds.includes(x.id)} onChange={e => updateView({ selectedIds: e.target.checked ? [...view.selectedIds, x.id] : view.selectedIds.filter(id => id !== x.id) })}/><button onClick={() => select(x.id, false)}><b>{x.label}</b><small>{'sourceNodeId' in x ? '연결선' : ('typeKey' in x ? x.typeKey : '그룹')}</small></button><span>↗</span></div>)}{!filtered.length && <div className="empty-state"><h3>{map.nodes.length ? '일치하는 요소가 없어요' : '아직 요소가 없어요'}</h3><button onClick={() => { updateView({ search: '', typeFilter: '' }); setDialog('node'); }}>요소 추가</button></div>}</div>}
 <footer className="canvas-footer"><span>일반 순환 연결 허용 · 선택 {view.selectedIds.length}개</span><button onClick={() => void api.current?.fitView({ padding: .12, maxZoom: 1 })} disabled={view.mode !== 'map' || !!view.search || !!view.typeFilter}>전체 보기</button></footer></section>
 <aside className={'inspector ' + (panel ? 'mobile-open' : '')} aria-label="선택 요소 상세"><header><span>상세 맥락</span><button aria-label="상세 닫기" onClick={() => { setPanel(false); if (window.innerWidth > 800) { updateView({ selectedIds: [] }); requestAnimationFrame(() => document.getElementById('main')?.focus()); } else { requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.element-row.selected button')?.focus()); } }}>×</button></header>{item ? <><Inspector key={map.id + ':' + item.id} item={item} map={map} run={run} busy={busy}/><section className="inspector-section"><h3>연결된 요소 · 1-hop</h3>{map.nodes.filter(n => near.nodes.has(n.id) && !view.selectedIds.includes(n.id)).map(n => <button className="related-item" key={n.id} onClick={() => select(n.id)}>{n.label}<span>↗</span></button>)}{near.nodes.size === 0 && <p>아직 연결된 요소가 없어요.</p>}</section></> : <div className="empty-inspector"><span>↖</span><h2>맥락을 살펴보세요</h2><p>노드, 연결선, 그룹을 선택하면<br />실제 내용을 수정할 수 있어요.</p></div>}<section className="inspector-section"><h3>정책·결정 / 업무</h3><p className="sample-label">{contextExamples.notice}</p><button className="related-item" onClick={() => setDialog('context')}>{contextExamples.decision}</button><button className="related-item" onClick={() => setDialog('context')}>{contextExamples.task}</button></section></aside></div></main></div>
 {dialog && <Dialog title={({ node: '요소 추가', edge: '관계 연결', group: '선택 요소를 그룹으로', delete: '선택한 요소 삭제', new: '빈 맵으로 시작', sample: '샘플 맵 열기', context: '결정과 업무 · 읽기 전용', data: 'P2 로컬 문서', help: '사용 안내', menu: '탐색 메뉴', recover: '저장소 교체 확인', perf: '성능 확인용 맵' })[dialog] || '안내'} onClose={() => setDialog(null)}>
 {dialog === 'node' && <form onSubmit={createNode}><label>이름<input name="label" autoFocus required maxLength={200} defaultValue="새 요소"/></label><label>유형<input name="typeKey" required maxLength={60} defaultValue="아이디어" list="node-types"/></label><datalist id="node-types"><option>아이디어</option><option>리서치</option><option>핵심 흐름</option><option>시스템</option></datalist><button className="primary">요소 만들기</button></form>}
 {dialog === 'edge' && <form onSubmit={createEdge}><label>관계 이름<input name="label" defaultValue="이어짐" required maxLength={200}/></label><label>관계 유형<input name="typeKey" defaultValue="relation" required maxLength={60}/></label><label>출발 노드<select name="source" defaultValue={selectedNodes[0]?.id}>{map.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}</select></label><label>도착 노드<select name="target" defaultValue={selectedNodes[1]?.id || map.nodes.find(n => n.id !== selectedNodes[0]?.id)?.id}>{map.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}</select></label><p>순환·역방향 허용. 자기 연결과 같은 방향·유형의 중복 연결은 만들 수 없어요.</p><button className="primary">연결 만들기</button></form>}
 {dialog === 'group' && <form onSubmit={e => { e.preventDefault(); const id = newId('g'); if (run({ type: 'group', id, label: String(new FormData(e.currentTarget).get('label')), nodeIds: selectedNodes.map(n => n.id) })) {
            updateView({ selectedIds: [id] });
            setDialog(null);
            setPanel(true);
        } }}><p>선택한 노드 {selectedNodes.length}개를 묶어요. 기존 화면 위치는 유지합니다.</p><label>그룹 이름<input name="label" defaultValue="새 그룹" required maxLength={200}/></label><button className="primary">그룹 만들기</button></form>}
 {dialog === 'delete' && <><p>{view.selectedIds.length}개 선택을 삭제합니다. 노드에 연결된 관계는 함께 삭제되며 그룹 안의 노드는 보존됩니다. 결정·업무 샘플은 영향을 받지 않습니다.</p><p>되돌리기로 복원할 수 있어요.</p><div className="row"><button onClick={() => setDialog(null)}>취소</button><button className="danger" onClick={() => { if (run({ type: 'delete', ids: view.selectedIds })) {
            setDialog(null);
            setPanel(false);
        } }}>선택 삭제 확인</button></div></>}
 {['new', 'sample'].includes(dialog) && <><p>현재 맵을 {dialog === 'new' ? '빈 맵' : '작은 샘플 맵'}으로 교체합니다. 현재 세션에서는 되돌리기로 복원할 수 있어요. 필요한 내용은 먼저 로컬 문서로 내려받으세요.</p><div className="row"><button onClick={() => setDialog('data')}>현재 문서 회수</button><button className="primary" onClick={() => replaceMap(dialog === 'new' ? emptyMap() : sampleMap())}>현재 맵 교체 확인</button></div></>}
 {dialog === 'context' && <><span className="sample-label">{contextExamples.notice}</span><h3>초기 진입 방식 · 결정 확정</h3><p>맵을 먼저 보여 주어 관계를 이해하도록 합니다.</p><h3>안내 문구 검토 · 업무 진행 중</h3><p>결정 확정은 업무 완료를 의미하지 않습니다. 실제 결정·업무·담당자 명부 편집은 P3 범위입니다.</p></>}
 {dialog === 'data' && <><p>이 브라우저·이 주소의 저장소에만 보관합니다. 계정/클라우드 백업이 아닙니다. 최대1 MiB의 <b>P2 map-local v1 테스트 형식</b>만 지원합니다.</p><div className="row"><button className="primary" onClick={exportCurrent}>현재 문서 내려받기</button><button onClick={() => saveNow()} disabled={repository.blocked || busy}>로컬 저장 재시도</button></div><hr /><h3>가져오기 미리보기</h3><label>JSON 파일 · P2 테스트 형식<input type="file" accept=".json,application/json" aria-label="P2 JSON 가져오기" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file)
            return; setPendingImport(null); try {
            if (file.size > 1048576)
                throw new Error('1 MiB보다 큰 파일은 가져올 수 없어요.');
            setPendingImport(parseDocument(await file.text()));
            setNotice('');
        }
        catch (err) {
            setNotice(message(err));
        } }}/></label>{pendingImport && <section className="import-preview"><h3>{pendingImport.map.title}</h3><p>요소 {pendingImport.map.nodes.length} · 연결 {pendingImport.map.edges.length} · 그룹 {pendingImport.map.groups.length}</p><p>현재 맵을 교체합니다. 현재 세션의 되돌리기 또는 이전 정상 저장본으로 복구할 수 있어요. 먼저 필요한 내용을 내려받으세요.</p><button onClick={() => { if (run({ type: 'replace', map: pendingImport.map })) {
            setStorageState(repository.blocked ? 'error' : 'dirty');
            setView({ ...pendingImport.view, mode: innerWidth <= 800 ? 'list' : pendingImport.view.mode });
            void api.current?.setViewport(pendingImport.view.viewport);
            setPendingImport(null);
            setDialog(null);
        } }}>가져온 문서로 교체 확인</button></section>}<hr /><h3>저장 실패·손상 복구</h3><p>기존 저장값은 자동으로 삭제하지 않아요. 저장소 교체는 원본을 격리 보관한 뒤에만 진행합니다.</p><div className="row"><button onClick={() => { try {
            download(JSON.stringify(repository.rawValues(), null, 2), 'MAP-P2-storage-recovery.json');
            setNotice('저장소 원문을 회수했어요. 이 파일은 직접 가져오기 형식이 아닙니다.');
        }
        catch (e) {
            setNotice(message(e));
        } }}>저장소 원문 회수</button><button onClick={() => { try {
            const raw = repository.rawValues().previous;
            if (!raw)
                throw new Error('이전 정상본이 없습니다.');
            setPendingImport(parseDocument(raw));
            setNotice('이전 정상본을 미리보기로 열었어요. 교체 전 현재 문서를 회수하세요.');
        }
        catch (e) {
            setNotice(message(e));
        } }}>이전 정상본 미리보기</button><button onClick={() => setDialog('recover')}>현재 초안으로 저장소 교체</button></div></>}
 {dialog === 'recover' && <><p>현재 편집 내용을 새 정상본으로 저장합니다. 기존 저장값과 이전본은 별도의 격리 키에 보관합니다. 보관 공간이 부족하면 교체하지 않습니다. 이전 격리본이 있다면 최신 회수본으로 갱신되므로 먼저 내려받으세요.</p><div className="row"><button onClick={exportCurrent}>현재 문서 내려받기</button><button className="danger" onClick={() => { if (saveNow(true)) {
            setDialog(null);
            setNotice('원본을 격리 보관하고 이 기기에 현재 문서를 저장했어요.');
        } }}>원본 보존 후 저장소 교체 확인</button></div></>}

 {dialog === 'menu' && <div className="menu-list"><button onClick={() => { updateView({ mode: 'list' }); setDialog(null); }}>요소 목록</button><button onClick={() => { updateView({ mode: 'map' }); setDialog(null); }}>맵 보기</button><button onClick={() => setDialog('sample')}>샘플 맵</button><button onClick={() => setDialog('help')}>단축키·도움말</button><button onClick={() => setDialog('context')}>결정·업무 읽기 전용</button></div>}
 {dialog === 'help' && <><ul><li>맵: 노드 드래그 이동, 핸들을 이어 관계 생성.</li><li>빈 영역 드래그: 다중 선택. Shift/Ctrl 클릭으로 선택 추가.</li><li>우클릭/가운데 버튼 드래그: 화면 이동. 휠: 확대/축소.</li><li>Ctrl/Cmd+Z: 되돌리기. Ctrl/Cmd+Shift+Z: 다시 실행.</li><li>Delete/Backspace: 삭제 확인. Esc: 선택 해제/대화상자 닫기.</li><li>노드 초점에서 방향키10px / Shift+방향키50px 이동.</li><li>입력란·한글 조합 중에는 편집기 단축키를 실행하지 않습니다.</li><li>모바일/키보드 대안: 목록 체크박스 → 상세 폼 → 적용.</li></ul><p>서버 저장·실제 로그인·팀 초대·공유·결제 기능은 없습니다.</p><button onClick={() => { setDialog('perf'); }}>500요소 성능 fixture 확인</button></>}
 {dialog === 'perf' && <><p>현재 맵을 500노드/1000연결 테스트 데이터로 교체합니다. 먼저 현재 문서를 내보내세요.</p><button onClick={() => replaceMap(performanceMap())}>성능 fixture로 교체</button></>}
 {notice && <p className="form-error" role="alert">{notice}</p>}
 </Dialog>}
 </div>;
}
function Inspector({ item, map, run, busy }: {
    item: MapNode | MapEdge | MapGroup;
    map: Map;
    run: (c: Command) => boolean;
    busy: boolean;
}) {
    const isEdge = 'sourceNodeId' in item, isGroup = 'size' in item, isNode = !isEdge && !isGroup;
    const form = useRef<HTMLFormElement>(null);
    useEffect(() => { form.current?.reset(); }, [item]);
    return <><section className="inspector-section"><span className="eyebrow">{isEdge ? '연결선' : isGroup ? '그룹' : '맵 요소'} · 실제 편집</span><h2>{item.label}</h2><small className="muted">ID {item.id.slice(0, 16)}</small></section><form ref={form} className="inspector-section" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); run({ type: 'edit', id: item.id, patch: { label: String(f.get('label')), metadata: { description: String(f.get('description')), notes: String(f.get('notes')) }, ...(!isGroup ? { typeKey: String(f.get('typeKey')) } : {}), ...(isEdge ? { sourceNodeId: String(f.get('source')), targetNodeId: String(f.get('target')) } : {}) } }); }}>
 <label>이름<input name="label" aria-label="요소 이름" defaultValue={item.label} required maxLength={200}/></label>{!isGroup && <label>유형<input name="typeKey" defaultValue={item.typeKey} required maxLength={60}/></label>}
 {isEdge && <><label>출발<select name="source" defaultValue={item.sourceNodeId}>{map.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}</select></label><label>도착<select name="target" defaultValue={item.targetNodeId}>{map.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}</select></label></>}
 <label>설명<textarea name="description" defaultValue={item.metadata.description} maxLength={10000}/></label><label>메모<textarea name="notes" defaultValue={item.metadata.notes} maxLength={10000}/></label><button className="primary wide" disabled={busy}>내용 적용</button></form>
 {!isEdge && <form className="inspector-section" key={'position' + JSON.stringify(item.position) + (isGroup ? JSON.stringify(item.size) : '')} onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); run({ type: 'move', positions: { [item.id]: { x: Number(f.get('x')), y: Number(f.get('y')) } } }); }}><h3>위치 {isNode && item.groupId ? '· 그룹 기준 상대좌표' : '· 캔버스 좌표'}</h3><div className="field-pair"><label>X<input name="x" aria-label="X 좌표" type="number" step="any" defaultValue={item.position.x} min={-100000} max={100000} required/></label><label>Y<input name="y" aria-label="Y 좌표" type="number" step="any" defaultValue={item.position.y} min={-100000} max={100000} required/></label></div><button className="wide" disabled={busy}>위치 적용</button></form>}
 {isGroup && <form className="inspector-section" key={'size' + JSON.stringify(item.size)} onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); run({ type: 'resize', id: item.id, size: { width: Number(f.get('width')), height: Number(f.get('height')) } }); }}><h3>그룹 크기</h3><div className="field-pair"><label>너비<input name="width" type="number" defaultValue={item.size.width} min={160} max={20000} required/></label><label>높이<input name="height" type="number" defaultValue={item.size.height} min={100} max={20000} required/></label></div><button className="wide" disabled={busy}>크기 적용</button><p className="hint">그룹 삭제·해제는 자식 노드의 화면 위치를 유지해요.</p><button type="button" className="wide" disabled={busy} onClick={() => run({ type: 'delete', ids: [item.id] })}>그룹 해제 · 내부 노드 보존</button></form>}
 {isNode && <section className="inspector-section"><label>소속 그룹<select aria-label="소속 그룹" value={item.groupId || ''} disabled={busy} onChange={e => run({ type: 'reparent', nodeIds: [item.id], groupId: e.target.value || undefined })}><option value="">그룹 없음</option>{map.groups.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label><p className="hint">소속을 바꿔도 화면상의 위치는 유지됩니다.</p></section>}</>;
}

