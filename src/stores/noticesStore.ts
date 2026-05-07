import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { ID, Notice } from '../types/domain';
import { STORAGE_PREFIX, rnStorage } from './persist/asyncStorage';

/**
 * 사용자가 공지에 대해 부여한 상태 오버레이 (휴지통 / 핀 등).
 * 공지 본문은 어댑터(서버/스크레이핑)에서 오므로, 이 store 는 "어떤 공지를
 * 사용자가 어떻게 처리했는지" 만 보관한다. 휴지통에 들어간 공지는 payload
 * 스냅샷도 함께 저장 → 원본이 사라져도 휴지통/복구가 동작.
 */
export interface DeletedNoticeEntry {
    noticeId: ID;
    sectionId: ID;
    /** 삭제 시점의 공지 스냅샷. 휴지통 표시 + 복구 시 사용. */
    payload: Notice;
    deletedAt: number;
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

interface NoticesState {
    /** noticeId → deleted entry. */
    deleted: Record<ID, DeletedNoticeEntry>;
}

interface NoticesActions {
    markDeleted: (notice: Notice, sectionId: ID) => void;
    markManyDeleted: (notices: Notice[], sectionId: ID) => void;
    restore: (noticeId: ID) => DeletedNoticeEntry | undefined;
    purge: (noticeId: ID) => void;
    purgeExpired: () => void;
    purgeAll: () => void;
}

export type NoticesStore = NoticesState & NoticesActions;

export const useNoticesStore = create<NoticesStore>()(
    persist(
        (set, get) => ({
            deleted: {},

            markDeleted: (notice, sectionId) =>
                set(s => {
                    const now = Date.now();
                    return {
                        deleted: {
                            ...s.deleted,
                            [notice.id]: {
                                noticeId: notice.id,
                                sectionId,
                                payload: {
                                    ...notice,
                                    originalSectionId: sectionId,
                                    deletedAt: now,
                                },
                                deletedAt: now,
                            },
                        },
                    };
                }),

            markManyDeleted: (notices, sectionId) =>
                set(s => {
                    const now = Date.now();
                    const next = { ...s.deleted };
                    for (const notice of notices) {
                        next[notice.id] = {
                            noticeId: notice.id,
                            sectionId,
                            payload: {
                                ...notice,
                                originalSectionId: sectionId,
                                deletedAt: now,
                            },
                            deletedAt: now,
                        };
                    }
                    return { deleted: next };
                }),

            restore: (noticeId) => {
                const entry = get().deleted[noticeId];
                if (!entry) return undefined;
                set(s => {
                    const next = { ...s.deleted };
                    delete next[noticeId];
                    return { deleted: next };
                });
                return entry;
            },

            purge: (noticeId) =>
                set(s => {
                    if (!s.deleted[noticeId]) return s;
                    const next = { ...s.deleted };
                    delete next[noticeId];
                    return { deleted: next };
                }),

            purgeExpired: () =>
                set(s => {
                    const cutoff = Date.now() - THIRTY_DAYS;
                    const next: Record<ID, DeletedNoticeEntry> = {};
                    for (const [id, e] of Object.entries(s.deleted)) {
                        if (e.deletedAt > cutoff) next[id] = e;
                    }
                    return { deleted: next };
                }),

            purgeAll: () => set({ deleted: {} }),
        }),
        {
            name: STORAGE_PREFIX + 'notices',
            storage: rnStorage,
            version: 1,
            partialize: (s) => ({ deleted: s.deleted }),
        },
    ),
);

/* ─────────────────────── selectors ─────────────────────── */

/** 빠른 lookup용 — 공지 목록을 필터링할 때 사용. */
export function useDeletedNoticeIdSet(): Set<ID> {
    return useNoticesStore(
        useShallow((s) => new Set(Object.keys(s.deleted))),
    );
}

/** 섹션 헤더 배지 — 해당 섹션에서 삭제된 공지 수. */
export function useDeletedNoticeCountForSection(sectionId: ID): number {
    return useNoticesStore(
        (s) =>
            Object.values(s.deleted).filter((e) => e.sectionId === sectionId)
                .length,
    );
}

/** TrashScreen 통합 목록 — 모든 삭제된 공지(최신 삭제 순). */
export function useAllDeletedNotices(): DeletedNoticeEntry[] {
    return useNoticesStore(
        useShallow((s) =>
            Object.values(s.deleted).sort((a, b) => b.deletedAt - a.deletedAt),
        ),
    );
}
