import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { ID, Keyword, Section } from '../types/domain';
import { generateId } from '../utils/id';
import { STORAGE_PREFIX, rnStorage } from './persist/asyncStorage';

const ACCENTS = ['#7C5CFF', '#5BC0FF', '#FF7C9C', '#3DDC97', '#FFC857', '#FF9E5C'];

interface SectionsState {
    sections: Record<ID, Section>;
    orderedIds: ID[];
    hasHydrated: boolean;
}

interface SectionsActions {
    addSection: (input: {
        title: string;
        source?: string;
        universityId?: string;
        emoji?: string;
    }) => Section;
    removeSection: (id: ID) => void;
    restoreSection: (section: Section) => void;
    renameSection: (id: ID, title: string) => void;
    reorderSections: (newOrderedIds: ID[]) => void;
    togglePin: (id: ID) => void;
    toggleNotify: (id: ID) => void;
    addKeyword: (sectionId: ID, text: string) => void;
    removeKeyword: (sectionId: ID, keywordId: ID) => void;
    setHasHydrated: (v: boolean) => void;
}

export type SectionsStore = SectionsState & SectionsActions;

export const useSectionsStore = create<SectionsStore>()(
    persist(
        (set, get) => ({
            sections: {},
            orderedIds: [],
            hasHydrated: false,

            addSection: ({ title, source = '', universityId = 'uos', emoji }) => {
                const id = generateId();
                const now = Date.now();
                const idx = get().orderedIds.length;
                const accent = ACCENTS[idx % ACCENTS.length];
                const section: Section = {
                    id,
                    title,
                    source,
                    universityId,
                    emoji,
                    accentColor: accent,
                    order: idx,
                    pinned: false,
                    notifyOn: true,
                    keywords: [],
                    createdAt: now,
                    updatedAt: now,
                };
                set(s => ({
                    sections: { ...s.sections, [id]: section },
                    orderedIds: [...s.orderedIds, id],
                }));
                return section;
            },

            removeSection: (id) =>
                set(s => {
                    if (!s.sections[id]) return s;
                    const next = { ...s.sections };
                    delete next[id];
                    return {
                        sections: next,
                        orderedIds: s.orderedIds.filter(x => x !== id),
                    };
                }),

            restoreSection: (section) =>
                set(s => {
                    if (s.sections[section.id]) return s;
                    return {
                        sections: { ...s.sections, [section.id]: section },
                        orderedIds: [...s.orderedIds, section.id],
                    };
                }),

            renameSection: (id, title) =>
                set(s => {
                    const sec = s.sections[id];
                    if (!sec) return s;
                    return {
                        sections: {
                            ...s.sections,
                            [id]: { ...sec, title, updatedAt: Date.now() },
                        },
                    };
                }),

            reorderSections: (newOrderedIds) => set({ orderedIds: newOrderedIds }),

            togglePin: (id) =>
                set(s => {
                    const sec = s.sections[id];
                    if (!sec) return s;
                    return {
                        sections: {
                            ...s.sections,
                            [id]: { ...sec, pinned: !sec.pinned, updatedAt: Date.now() },
                        },
                    };
                }),

            toggleNotify: (id) =>
                set(s => {
                    const sec = s.sections[id];
                    if (!sec) return s;
                    return {
                        sections: {
                            ...s.sections,
                            [id]: { ...sec, notifyOn: !sec.notifyOn, updatedAt: Date.now() },
                        },
                    };
                }),

            addKeyword: (sectionId, text) =>
                set(s => {
                    const sec = s.sections[sectionId];
                    if (!sec) return s;
                    const trimmed = text.trim();
                    if (!trimmed) return s;
                    if (sec.keywords.some(k => k.text === trimmed)) return s;
                    const k: Keyword = {
                        id: generateId(),
                        text: trimmed,
                        createdAt: Date.now(),
                    };
                    return {
                        sections: {
                            ...s.sections,
                            [sectionId]: {
                                ...sec,
                                keywords: [...sec.keywords, k],
                                updatedAt: Date.now(),
                            },
                        },
                    };
                }),

            removeKeyword: (sectionId, keywordId) =>
                set(s => {
                    const sec = s.sections[sectionId];
                    if (!sec) return s;
                    return {
                        sections: {
                            ...s.sections,
                            [sectionId]: {
                                ...sec,
                                keywords: sec.keywords.filter(k => k.id !== keywordId),
                                updatedAt: Date.now(),
                            },
                        },
                    };
                }),

            setHasHydrated: (v) => set({ hasHydrated: v }),
        }),
        {
            name: STORAGE_PREFIX + 'sections',
            storage: rnStorage,
            version: 1,
            partialize: (s) => ({
                sections: s.sections,
                orderedIds: s.orderedIds,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

/** 화면용 정렬: pinned 먼저, 그 다음 사용자 지정 순서. */
export function useOrderedSections(): Section[] {
    return useSectionsStore(
        useShallow((s) => {
            const list = s.orderedIds
                .map(id => s.sections[id])
                .filter((x): x is Section => Boolean(x));
            return [
                ...list.filter(x => x.pinned),
                ...list.filter(x => !x.pinned),
            ];
        }),
    );
}
