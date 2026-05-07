import type { Section } from '../types/domain';

/**
 * TODO: 백엔드 연동 시 제거할 Mock Data
 * ──────────────────────────────────────────────────────────────
 * UI/모션 검증용 시드 섹션. 첫 실행 시 sectionsStore.seedMockOnce()
 * 가 한 번만 주입한다 (이미 사용자가 섹션을 만들어 둔 상태면 스킵).
 *
 * 실제 백엔드와 붙일 때 지울 곳:
 *   1) 이 파일 (src/data/mockSections.ts)
 *   2) sectionsStore.ts 의 `hasSeededMock` 플래그 + `seedMockOnce` 액션
 *      + 거기서의 buildMockSections() 호출
 *   3) 호출부(파일 하단의 useSectionsStore.getState().seedMockOnce())
 *
 * 위 셋만 제거하면 흔적 없이 mock 의존성이 사라진다.
 */

const NOW = Date.now();

interface MockSpec {
    id: string;
    title: string;
    accentColor: string;
    notifyOn: boolean;
    keywords: string[];
}

const SPECS: MockSpec[] = [
    {
        id: 'mock:cs',
        title: '컴퓨터과학부',
        accentColor: '#7C5CFF',
        notifyOn: true, // Glow 펄스 시연용 — 첫 카드는 알림 ON 으로 시작
        keywords: ['컴퓨터과학부', '소프트웨어'],
    },
    {
        id: 'mock:ai',
        title: 'AI · 인턴',
        accentColor: '#5BC0FF',
        notifyOn: false, // 사용자가 직접 켜서 '부르르' 모션을 확인할 카드
        keywords: ['AI', '인공지능', '인턴'],
    },
    {
        id: 'mock:scholarship',
        title: '장학금',
        accentColor: '#FFC857',
        notifyOn: true,
        keywords: ['장학', '장학금'],
    },
    {
        id: 'mock:exchange',
        title: '교환학생',
        accentColor: '#3DDC97',
        notifyOn: false,
        keywords: ['교환학생', '해외'],
    },
];

export function buildMockSections(): Section[] {
    return SPECS.map((spec, i) => ({
        id: spec.id,
        kind: 'user',
        title: spec.title,
        source: '',
        universityId: 'uos',
        accentColor: spec.accentColor,
        order: i,
        pinned: false,
        notifyOn: spec.notifyOn,
        keywords: spec.keywords.map((text, ki) => ({
            id: `${spec.id}:kw:${ki}`,
            text,
            createdAt: NOW,
        })),
        createdAt: NOW,
        updatedAt: NOW,
    }));
}
