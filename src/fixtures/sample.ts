import { metadata } from '../domain/map.ts';
import type { Map } from '../domain/map.ts';
export function sampleMap(): Map {
    return { id: 'map_sample', title: '서비스 출시 기획', groups: [{ id: 'g_discover', label: '탐색 · 문제와 근거', position: { x: 40, y: 70 }, size: { width: 250, height: 350 }, metadata: metadata() }, { id: 'g_design', label: '설계 · 흐름과 판단', position: { x: 370, y: 70 }, size: { width: 250, height: 350 }, metadata: metadata() }, { id: 'g_verify', label: '검증 · 공유와 실행', position: { x: 700, y: 70 }, size: { width: 250, height: 350 }, metadata: metadata() }], nodes: [
            { id: 'n_interview', typeKey: '리서치', label: '사용자 인터뷰', position: { x: 28, y: 60 }, groupId: 'g_discover', metadata: { description: '처음 온 사람이 어디서 망설이는지 듣고 관찰합니다.', notes: '' } },
            { id: 'n_insight', typeKey: '문제 정의', label: '흩어진 피드백', position: { x: 28, y: 215 }, groupId: 'g_discover', metadata: { description: '의견과 결정의 이유를 같은 맥락에서 찾을 수 있어야 합니다.', notes: '' } },
            { id: 'n_journey', typeKey: '핵심 흐름', label: '첫 사용 경험', position: { x: 28, y: 60 }, groupId: 'g_design', metadata: { description: '맵을 이해하고 요소를 선택해 연결의 의미를 살펴봅니다.', notes: '' } },
            { id: 'n_guide', typeKey: '아이디어', label: '안내 문구', position: { x: 28, y: 215 }, groupId: 'g_design', metadata: { description: '짧고 구체적인 말로 다음 행동을 알려 줍니다.', notes: '' } },
            { id: 'n_prototype', typeKey: '산출물', label: '클릭 프로토타입', position: { x: 28, y: 60 }, groupId: 'g_verify', metadata: { description: '작은 실험에서 실제 조작 흐름을 확인합니다.', notes: '' } },
            { id: 'n_review', typeKey: '검증', label: '사용성 검토', position: { x: 28, y: 215 }, groupId: 'g_verify', metadata: { description: '모바일과 키보드 조작도 함께 살펴봅니다.', notes: '' } }
        ], edges: [['e1', 'n_interview', 'n_journey', '관찰을 반영'], ['e2', 'n_insight', 'n_journey', '문제를 정의'], ['e3', 'n_journey', 'n_prototype', '화면으로 표현'], ['e4', 'n_journey', 'n_guide', '문구를 다듬기'], ['e5', 'n_prototype', 'n_review', '직접 살펴보기'], ['e6', 'n_review', 'n_interview', '피드백 순환']].map(([id, sourceNodeId, targetNodeId, label]) => ({ id, sourceNodeId, targetNodeId, label, typeKey: 'relation', metadata: metadata() })) };
}
// P3 domain examples are immutable presentation data, never members of the editor aggregate.
export const contextExamples = Object.freeze({ decision: '초기 진입 방식 · 확정', task: '안내 문구 검토 · 진행 중', notice: 'P1 맥락 샘플 / 읽기 전용 · 결정과 업무 CRUD는 P3' });
export function performanceMap(): Map { const m: Map = { id: 'map_perf', title: '성능 확인 · 500요소 / 1000연결', nodes: [], edges: [], groups: [] }; for (let i = 0; i < 500; i++)
    m.nodes.push({ id: 'n' + i, typeKey: '요소', label: '확인 요소 ' + i, position: { x: (i % 25) * 240, y: Math.floor(i / 25) * 145 }, metadata: metadata() }); for (let i = 0; i < 500; i++)
    for (const step of [1, 25])
        m.edges.push({ id: 'e' + i + '_' + step, sourceNodeId: 'n' + i, targetNodeId: 'n' + ((i + step) % 500), typeKey: 'relation', label: '연결', metadata: metadata() }); return m; }

