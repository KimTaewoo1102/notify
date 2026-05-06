import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { persistStorage } from './storage';
import type { NoticeFeed } from '../types/notice';

export type SectionId = string;

/**
 * 시스템(보호) 섹션 식별자.
 * - 'pinned-default' 항상 최상단, 삭제/이름 변경 불가
 * - 'today' / 'hot' / 'keyword' 는 디폴트 시드일 뿐, 사용자가 자유롭게 다룰 수 있음.
 */
export type SystemKind = 'pinned-default';

export interface Section {
    id: SectionId;
    /** 화면에 표기되는 섹션 이름 (사용자 커스텀 가능) */
    title: string;
    icon: string;
    /** 데이터 소스 — 어떤 피드를 끌어올지 */
    feed: NoticeFeed;
    /** HOT 처럼 조회수 표시 여부 */
    showViews?: boolean;
    /** 알림 ON 여부 — Skia glow 표시 트리거 */
    alarmOn: boolean;
    /** 키워드 섹션 전용 키워드 목록 (1개 이상) */
    keywords?: string[];
    /** 섹션 자체 핀 (헤더 고정) — 공지 핀과는 별개 */
    pinned: boolean;
    /** 휴지통 이동 시점 (ms). 있으면 휴지통에 있음. */
    trashedAt?: number;
    /** 시스템 보호 섹션 식별자. undefined 면 일반 섹션. */
    isSystem?: SystemKind;
    /** 사용자 정의 정렬 순서 (작을수록 위). 시스템 핀 섹션은 -Infinity 로 강제. */
    order: number;
}

interface SectionsState {
    sections: Section[];
    keywords: string[];

    reorder: (next: Section[]) => void;
    toggleAlarm: (id: SectionId) => void;
    togglePin: (id: SectionId) => void;
    addSection: (s: Omit<Section, 'pinned' | 'order'>) => void;
    rename: (id: SectionId, title: string) => void;
    updateKeywords: (id: SectionId, keywords: string[]) => void;
    moveToTrash: (id: SectionId) => void;
    restore: (id: SectionId) => void;
    purge: (id: SectionId) => void;

    setKeywords: (k: string[]) => void;
    addKeyword: (k: string) => void;
    removeKeyword: (k: string) => void;
}

const PINNED_DEFAULT_ORDER = -Number.MAX_SAFE_INTEGER;

const buildDefaultSections = (): Section[] => [
    {
        id: 'pinned-default',
        title: '고정',
        icon: 'pin',
        feed: 'today',
        alarmOn: false,
        pinned: true,
        isSystem: 'pinned-default',
        order: PINNED_DEFAULT_ORDER,
    },
    {
        id: 'keyword',
        title: '내 키워드 공지',
        icon: 'key-outline',
        feed: 'keyword',
        alarmOn: true,
        pinned: false,
        order: 0,
    },
    {
        id: 'hot',
        title: 'HOT 공지',
        icon: 'flame-outline',
        feed: 'hot',
        showViews: true,
        alarmOn: false,
        pinned: false,
        order: 1,
    },
    {
        id: 'today',
        title: '최신 공지',
        icon: 'time-outline',
        feed: 'today',
        alarmOn: false,
        pinned: false,
        order: 2,
    },
];

const reindex = (list: Section[]): Section[] =>
    list.map((s, i) => ({
        ...s,
        order: s.isSystem === 'pinned-default' ? PINNED_DEFAULT_ORDER : i,
    }));

const ensureSystemSection = (list: Section[]): Section[] => {
    if (list.some(s => s.isSystem === 'pinned-default')) return list;
    return [buildDefaultSections()[0], ...list];
};

export const useSectionsStore = create<SectionsState>()(
    persist(
        (set, get) => ({
            sections: buildDefaultSections(),
            keywords: ['장학', '졸업', '컴공'],

            reorder: next =>
                set(() => ({
                    sections: reindex(ensureSystemSection(next)),
                })),

            toggleAlarm: id =>
                set(state => ({
                    sections: state.sections.map(s =>
                        s.id === id ? { ...s, alarmOn: !s.alarmOn } : s,
                    ),
                })),

            togglePin: id =>
                set(state => ({
                    sections: state.sections.map(s =>
                        s.id === id && s.isSystem !== 'pinned-default'
                            ? { ...s, pinned: !s.pinned }
                            : s,
                    ),
                })),

            addSection: s =>
                set(state => ({
                    sections: reindex([
                        ...state.sections,
                        { ...s, pinned: false, order: state.sections.length },
                    ]),
                })),

            rename: (id, title) =>
                set(state => ({
                    sections: state.sections.map(s =>
                        s.id === id && s.isSystem !== 'pinned-default'
                            ? { ...s, title }
                            : s,
                    ),
                })),

            updateKeywords: (id, keywords) =>
                set(state => ({
                    sections: state.sections.map(s =>
                        s.id === id ? { ...s, keywords } : s,
                    ),
                })),

            moveToTrash: id =>
                set(state => {
                    const target = state.sections.find(x => x.id === id);
                    // 시스템 섹션은 휴지통 이동 불가
                    if (!target || target.isSystem === 'pinned-default') return state;
                    return {
                        sections: state.sections.map(s =>
                            s.id === id ? { ...s, trashedAt: Date.now() } : s,
                        ),
                    };
                }),

            restore: id =>
                set(state => ({
                    sections: state.sections.map(s =>
                        s.id === id ? { ...s, trashedAt: undefined } : s,
                    ),
                })),

            purge: id =>
                set(state => {
                    const target = state.sections.find(x => x.id === id);
                    if (!target || target.isSystem === 'pinned-default') return state;
                    return {
                        sections: state.sections.filter(s => s.id !== id),
                    };
                }),

            setKeywords: keywords => set({ keywords }),

            addKeyword: k =>
                set(state =>
                    state.keywords.includes(k)
                        ? state
                        : { keywords: [...state.keywords, k] },
                ),

            removeKeyword: k =>
                set(state => ({
                    keywords: state.keywords.filter(x => x !== k),
                })),
        }),
        {
            name: 'notify-sections-v2',
            version: 2,
            storage: createJSONStorage(() => persistStorage),
            migrate: (persisted, version) => {
                // v1 → v2: 시스템 'pinned-default' 섹션 주입 + order 채움
                if (!persisted || typeof persisted !== 'object') return persisted as any;
                const state = persisted as Partial<SectionsState>;
                let sections = Array.isArray(state.sections) ? state.sections : [];
                sections = ensureSystemSection(
                    sections.map((s, i) => ({
                        ...s,
                        order:
                            s.isSystem === 'pinned-default'
                                ? PINNED_DEFAULT_ORDER
                                : (s as Section).order ?? i,
                    })) as Section[],
                );
                return { ...state, sections } as SectionsState;
            },
        },
    ),
);

/**
 * 활성 섹션 (휴지통이 아닌 것) — 시스템 핀 섹션이 무조건 최상단,
 * 그 뒤로 사용자 핀, 그 다음 order 순.
 */
export const selectActiveSections = (state: SectionsState): Section[] =>
    state.sections
        .filter(s => !s.trashedAt)
        .slice()
        .sort((a, b) => {
            // 시스템 핀 최우선
            const aSys = a.isSystem === 'pinned-default' ? 0 : 1;
            const bSys = b.isSystem === 'pinned-default' ? 0 : 1;
            if (aSys !== bSys) return aSys - bSys;
            // 사용자 핀 그 다음
            const aPin = a.pinned ? 0 : 1;
            const bPin = b.pinned ? 0 : 1;
            if (aPin !== bPin) return aPin - bPin;
            // 그리고 order
            return a.order - b.order;
        });

export const selectTrashedSections = (state: SectionsState): Section[] =>
    state.sections
        .filter(s => !!s.trashedAt)
        .sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0));

export const selectSectionById = (id: SectionId) =>
    (state: SectionsState): Section | undefined =>
        state.sections.find(s => s.id === id);
