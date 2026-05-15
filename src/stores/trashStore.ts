import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ID, Section } from '../types/domain';
import { generateId } from '../utils/id';
import { STORAGE_PREFIX, rnStorage } from './persist/asyncStorage';

export interface TrashEntry {
    id: string;
    payload: Section;
    deletedAt: number;
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

interface TrashState {
    entries: TrashEntry[];
}

interface TrashActions {
    pushSection: (section: Section) => void;
    restore: (entryId: ID) => Section | undefined;
    purge: (entryId: ID) => void;
    purgeExpired: () => void;
    purgeAll: () => void;
}

export type TrashStore = TrashState & TrashActions;

export const useTrashStore = create<TrashStore>()(
    persist(
        (set, get) => ({
            entries: [],

            pushSection: (section) =>
                set(s => ({
                    entries: [
                        {
                            // 컬리전 회피용 random id. 같은 ms 에 두 번 삭제해도 안전.
                            // (이전 포맷 `${section.id}:${Date.now()}` 와 string 호환,
                            //  기존 persist 엔트리도 그대로 동작.)
                            id: generateId(),
                            payload: section,
                            deletedAt: Date.now(),
                        },
                        ...s.entries,
                    ],
                })),

            restore: (entryId) => {
                const entry = get().entries.find(e => e.id === entryId);
                if (!entry) return undefined;
                set(s => ({
                    entries: s.entries.filter(e => e.id !== entryId),
                }));
                return entry.payload;
            },

            purge: (entryId) =>
                set(s => ({
                    entries: s.entries.filter(e => e.id !== entryId),
                })),

            purgeExpired: () => {
                const cutoff = Date.now() - THIRTY_DAYS;
                set(s => ({
                    entries: s.entries.filter(e => e.deletedAt > cutoff),
                }));
            },

            purgeAll: () => set({ entries: [] }),
        }),
        {
            name: STORAGE_PREFIX + 'trash',
            storage: rnStorage,
            version: 1,
            partialize: (s) => ({ entries: s.entries }),
        },
    ),
);
