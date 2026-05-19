import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { ID, Notice } from '../types/domain';
import { STORAGE_PREFIX, rnStorage } from './persist/asyncStorage';

/**
 * 사용자가 공지에 대해 부여한 상태 오버레이 (휴지통 / 핀).
 * 공지 본문은 어댑터(서버/스크레이핑)에서 오므로, 이 store 는 "어떤 공지를
 * 사용자가 어떻게 처리했는지" 만 보관한다. 휴지통 / 핀에 들어간 공지는 payload
 * 스냅샷도 함께 저장 → 원본이 사라져도 표시 / 복구 / 공유가 동작.
 */
export interface DeletedNoticeEntry {
    noticeId: ID;
    sectionId: ID;
    payload: Notice;
    deletedAt: number;
}

export interface PinnedNoticeEntry {
    noticeId: ID;
    sectionId: ID;
    payload: Notice;
    pinnedAt: number;
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

interface NoticesState {
    /** noticeId → deleted entry. */
    deleted: Record<ID, DeletedNoticeEntry>;
    /** noticeId → pinned entry. 사용자가 직접 고정한 공지. */
    pinned: Record<ID, PinnedNoticeEntry>;
}

interface NoticesActions {
    markDeleted: (notice: Notice, sectionId: ID) => void;
    markManyDeleted: (notices: Notice[], sectionId: ID) => void;
    restore: (noticeId: ID) => DeletedNoticeEntry | undefined;
    purge: (noticeId: ID) => void;
    purgeExpired: () => void;
    purgeAll: () => void;
    purgeForSection: (sectionId: ID) => void;

    /** 핀 토글 — 켜질 땐 deleted 에서 자동 제거(둘 다 켜진 상태 방지). */
    togglePin: (notice: Notice, sectionId: ID) => boolean;
    unpin: (noticeId: ID) => void;
}

export type NoticesStore = NoticesState & NoticesActions;

export const useNoticesStore = create<NoticesStore>()(
    persist(
        (set, get) => ({
            deleted: {},
            pinned: {},

            markDeleted: (notice, sectionId) =>
                set(s => {
                    const now = Date.now();
                    const nextPinned = { ...s.pinned };
                    delete nextPinned[notice.id]; // 삭제 시 핀 동시 해제
                    return {
                        pinned: nextPinned,
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
                    const nextDeleted = { ...s.deleted };
                    const nextPinned = { ...s.pinned };
                    for (const notice of notices) {
                        delete nextPinned[notice.id]; // 핀 동시 해제
                        nextDeleted[notice.id] = {
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
                    return { deleted: nextDeleted, pinned: nextPinned };
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

            purgeForSection: (sectionId) =>
                set(s => {
                    const next: Record<ID, DeletedNoticeEntry> = {};
                    for (const [id, e] of Object.entries(s.deleted)) {
                        if (e.sectionId !== sectionId) next[id] = e;
                    }
                    return { deleted: next };
                }),

            togglePin: (notice, sectionId) => {
                const isPinned = !!get().pinned[notice.id];
                if (isPinned) {
                    set(s => {
                        const next = { ...s.pinned };
                        delete next[notice.id];
                        return { pinned: next };
                    });
                    return false;
                }
                set(s => {
                    // 핀 시 휴지통에서도 자동 복원
                    const nextDeleted = { ...s.deleted };
                    delete nextDeleted[notice.id];
                    return {
                        deleted: nextDeleted,
                        pinned: {
                            ...s.pinned,
                            [notice.id]: {
                                noticeId: notice.id,
                                sectionId,
                                payload: {
                                    ...notice,
                                    isUserPinned: true,
                                    userPinnedAt: Date.now(),
                                },
                                pinnedAt: Date.now(),
                            },
                        },
                    };
                });
                return true;
            },

            unpin: (noticeId) =>
                set(s => {
                    if (!s.pinned[noticeId]) return s;
                    const next = { ...s.pinned };
                    delete next[noticeId];
                    return { pinned: next };
                }),
        }),
        {
            name: STORAGE_PREFIX + 'notices',
            storage: rnStorage,
            version: 2,
            partialize: (s) => ({ deleted: s.deleted, pinned: s.pinned }),
            // v1 → v2: pinned 필드 추가.
            migrate: (persisted: any, fromVersion) => {
                if (!persisted) return persisted;
                if (fromVersion < 2) {
                    return { ...persisted, pinned: persisted.pinned ?? {} };
                }
                return persisted;
            },
        },
    ),
);

/* ─────────────────────── selectors: deleted ─────────────────────── */

export function useDeletedNoticeIdSet(): Set<ID> {
    return useNoticesStore(
        useShallow((s) => new Set(Object.keys(s.deleted))),
    );
}

export function useDeletedNoticeCountForSection(sectionId: ID): number {
    return useNoticesStore(
        (s) =>
            Object.values(s.deleted).filter((e) => e.sectionId === sectionId)
                .length,
    );
}

export function useAllDeletedNotices(): DeletedNoticeEntry[] {
    return useNoticesStore(
        useShallow((s) =>
            Object.values(s.deleted).sort((a, b) => b.deletedAt - a.deletedAt),
        ),
    );
}

/* ─────────────────────── selectors: pinned ─────────────────────── */

export function usePinnedNoticeIdSet(): Set<ID> {
    return useNoticesStore(
        useShallow((s) => new Set(Object.keys(s.pinned))),
    );
}

/** 시스템 '고정' 섹션 — 사용자가 핀한 공지 목록(최신 핀 순). */
export function useAllPinnedNotices(): PinnedNoticeEntry[] {
    return useNoticesStore(
        useShallow((s) =>
            Object.values(s.pinned).sort((a, b) => b.pinnedAt - a.pinnedAt),
        ),
    );
}

/** 홈 화면 시스템 섹션 카드 — 핀 갯수 표시용. */
export function usePinnedNoticeCount(): number {
    return useNoticesStore((s) => Object.keys(s.pinned).length);
}
