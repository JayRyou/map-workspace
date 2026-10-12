import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalMapRepository, CURRENT_KEY, BACKUP_KEY, CORRUPT_KEY, serializeDocument } from '../src/repositories/local-map.ts';
import { parseDocument } from '../src/graph/validation.ts';
import { defaultView, LIMIT } from '../src/domain/map.ts';
import { sampleMap } from '../src/fixtures/sample.ts';
class Memory {
    data = new Map<string, string>();
    failKey = '';
    getItem(k: string) { return this.data.get(k) ?? null; }
    setItem(k: string, v: string) { if (k === this.failKey)
        throw new Error('QuotaExceededError'); this.data.set(k, v); }
}
const raw = () => serializeDocument(sampleMap(), defaultView());
test('저장/왕복: 라벨·좌표·그룹·참조·뷰포트·선택 의미 보존', () => { const mem = new Memory(), repo = new LocalMapRepository(mem); repo.load(); const map = sampleMap(), view = { ...defaultView(), mode: 'list' as const, viewport: { x: 44, y: 77, zoom: .8 }, selectedIds: ['n_journey'], search: '경험' }; repo.save(serializeDocument(map, view)); const loaded = new LocalMapRepository(mem).load(); assert.deepEqual(loaded.document?.map, map); assert.deepEqual(loaded.document?.view, view); assert.equal(loaded.blocked, false); });
test('다음 저장은 이전 정상본 유지; quota 실패해도 현재 정상본 보존', () => { const mem = new Memory(), repo = new LocalMapRepository(mem); repo.load(); const a = raw(); repo.save(a); mem.failKey = CURRENT_KEY; const m = sampleMap(); m.title = '변경'; assert.throws(() => repo.save(serializeDocument(m, defaultView()))); assert.equal(mem.getItem(CURRENT_KEY), a); assert.equal(mem.getItem(BACKUP_KEY), a); });
test('손상 현재값+정상 backup: 초안 복구·자동저장 차단·원본 보존', () => { const mem = new Memory(); mem.setItem(CURRENT_KEY, '{broken'); mem.setItem(BACKUP_KEY, raw()); const repo = new LocalMapRepository(mem), boot = repo.load(); assert.equal(boot.blocked, true); assert.equal(boot.document?.map.nodes.length, 6); assert.throws(() => repo.save(raw())); assert.equal(mem.getItem(CURRENT_KEY), '{broken'); repo.save(raw(), true); assert.equal(JSON.parse(mem.getItem(CORRUPT_KEY)!).current, '{broken'); assert.equal(parseDocument(mem.getItem(BACKUP_KEY)!).map.nodes.length, 6); });
test('격리 보존이 실패하면 명시 복구도 손상 원본을 덮지 않음', () => { const mem = new Memory(); mem.setItem(CURRENT_KEY, 'broken'); const repo = new LocalMapRepository(mem); repo.load(); mem.failKey = CORRUPT_KEY; assert.throws(() => repo.save(raw(), true)); assert.equal(mem.getItem(CURRENT_KEY), 'broken'); });
test('미지원 schema/unknown 권한 필드/prototype/무효 참조/초과크기 거부', () => { const base = JSON.parse(raw()); for (const x of [{ ...base, schemaVersion: 99 }, { ...base, authToken: 'secret' }, JSON.parse(raw().replace('"map":', '"__proto__":{},"map":'))])
    assert.throws(() => parseDocument(JSON.stringify(x))); base.map.edges[0].targetNodeId = 'missing'; assert.throws(() => parseDocument(JSON.stringify(base))); assert.throws(() => parseDocument(' '.repeat(LIMIT.bytes + 1))); });
test('다른 탭 변경 감지 시 덮지 않음; 읽기/쓰기 접근 거부', () => { const mem = new Memory(), repo = new LocalMapRepository(mem); repo.load(); const other = raw(); mem.setItem(CURRENT_KEY, other); assert.throws(() => repo.save(raw())); assert.equal(mem.getItem(CURRENT_KEY), other); const locked = new LocalMapRepository({ getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } }); assert(locked.load().blocked); assert.throws(() => locked.save(raw(), true)); });
test('P1 mock 및 제품 backup 형식은 P2로 가져오지 않음', () => { for (const format of ['p1-design-mock', 'map-workspace-backup'])
    assert.throws(() => parseDocument(JSON.stringify({ ...JSON.parse(raw()), format }))); });


test('동일 내용의 새 탭 열기는 저장 시각만 바꿔 다른 탭에 변경을 보내지 않음',()=>{const mem=new Memory(),repo=new LocalMapRepository(mem);repo.load();const a=raw();repo.save(a);const b=JSON.parse(a);b.savedAt='2027-01-01T00:00:00.000Z';repo.save(JSON.stringify(b));assert.equal(mem.getItem(CURRENT_KEY),a);assert.equal(mem.getItem(BACKUP_KEY),null)});
