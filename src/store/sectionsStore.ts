import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './storage';
import type { NoticeFeed } from '../types/notice';

export type SectionId = NoticeFeed | string;

export interface Section {
    id: SectionId;
    title: string;
    icon: string;
    feed: NoticeFeed;
    showViews?: boolean;
    /** 알림 ON 여부 — Skia glow 표시 트리거 */
    alarmOn: boolean;
    /** 키워드 섹션의 경우 사용자 키워드 */
    keywords?: string[];
    /** 상단 고정 */
    pinned: boolean;
    /** 휴지통 들어간 시점 (있으면 휴지통에 있음) */
    trashedAt?: number;
}

interface SectionsState {
    sections: Section[];
    keywords: string[];

    reorder: (next: Section[]) => void;
    toggleAlarm: (id: SectionId) => void;
    togglePin: (id: SectionId) => void;
    addSection: (s: Omit<Section, 'pinned'>) => void;
    moveToTrash: (id: SectionId) => void;
    restore: (id: SectionId) => void;
    purge: (id: SectionId) => void;
    setKeywords: (k: string[]) => void;
    addKeyword: (k: string) => void;
    removeKeyword: (k: string) => void;
}

const DEFAULT_SECTIONS: Section[] = [
    {
        id: 'keyword',
        title: '내 키워드 공지',
        icon: 'key-outline',
        feed: 'keyword',
        alarmOn: true,
        pinned: false,
    },
    {
        id: 'hot',
        title: 'HOT 공지',
        icon: 'flame-outline',
        feed: 'hot',
        showViews: true,
        alarmOn: false,
        pinned: false,
    },
    {
        id: 'today',
        title: '최신 공지',
        icon: 'time-outline',
        feed: 'today',
        alarmOn: false,
        pinned: false,
    },
];

export const useSectionsStore = create<SectionsState>()(
    persist(
        (set, get) => ({
            sections: DEFAULT_SECTIONS,
            keywords: ['장학', '졸업', '컴공'],

            reorder: next => set({ sections: next }),

            toggleAlarm: id =>
                set(state => ({
                    sections: state.sections.map(s =>
                        s.id === id ? { ...s, alarmOn: !s.alarmOn } : s,
                    ),
                })),

            togglePin: id =>
                set(state => ({
                    sections: state.sections.map(s =>
                        s.id === id ? { ...s, pinned: !s.pinned } : s,
                    ),
                })),

            addSection: s =>
                set(state => ({
                    sections: [...state.sections, { ...s, pinned: false }],
                })),

            moveToTrash: id =>
                set(state => ({
                    sections: state.sections.map(s =>
                        s.id === id ? { ...s, trashedAt: Date.now() } : s,
                    ),
                })),

            restore: id =>
                set(state => ({
                    sections: state.sections.map(s =>
                        s.id === id ? { ...s, trashedAt: undefined } : s,
                    ),
                })),

            purge: id =>
                set(state => ({
                    sections: state.sections.filter(s => s.id !== id),
                })),

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
            name: 'notify-sections-v1',
            storage: createJSONStorage(() => mmkvStorage),
        },
    ),
);

/** 휴지통이 아닌 활성 섹션. 핀 고정이 위로 정렬됨. */
export const selectActiveSections = (state: SectionsState) =>
    state.sections
        .filter(s => !s.trashedAt)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned));

export const selectTrashedSections = (state: SectionsState) =>
    state.sections
        .filter(s => !!s.trashedAt)
        .sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0));
