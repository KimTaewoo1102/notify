import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { persistStorage } from './storage';
import type { Notice } from '../types/notice';
import type { SectionId } from './sectionsStore';

/**
 * 공지에 대한 사용자 메타 (핀 / 휴지통).
 * 원본 공지는 universities 어댑터에서 매번 새로 가져오지만,
 * 이 메타는 클라이언트가 영속 보관 → 백엔드 도입 시 동일 shape 의
 * `/me/notices/meta` 응답으로 대체된다.
 */

export interface NoticePinMeta {
    /** 사용자가 핀 한 시점 */
    pinnedAt: number;
    /** 핀 했을 때 보고 있던 섹션 (분석/UX 용) */
    fromSectionId?: SectionId;
}

export interface NoticeTrashMeta {
    /** 휴지통 이동 시점 */
    deletedAt: number;
    /** 어느 섹션에서 지웠는지 — 복구 대상 */
    originalSectionId?: SectionId;
    /** 휴지통에 들어간 공지의 원본 스냅샷 (소스가 사라져도 복구 가능) */
    snapshot: Notice;
}

interface NoticesState {
    /** noticeId → 핀 메타 */
    pins: Record<string, NoticePinMeta>;
    /** noticeId → 휴지통 메타 (스냅샷 포함) */
    trash: Record<string, NoticeTrashMeta>;

    // 핀
    pin: (notice: Notice, fromSectionId?: SectionId) => void;
    unpin: (id: string) => void;

    // 휴지통
    dismiss: (notice: Notice, sectionId?: SectionId) => void;
    dismissMany: (notices: Notice[], sectionId?: SectionId) => void;
    restore: (id: string) => NoticeTrashMeta | undefined;
    purge: (id: string) => void;
    purgeAll: () => void;
}

export const useNoticesStore = create<NoticesState>()(
    persist(
        (set, get) => ({
            pins: {},
            trash: {},

            pin: (notice, fromSectionId) =>
                set(state => ({
                    pins: {
                        ...state.pins,
                        [notice.id]: { pinnedAt: Date.now(), fromSectionId },
                    },
                })),

            unpin: id =>
                set(state => {
                    if (!state.pins[id]) return state;
                    const next = { ...state.pins };
                    delete next[id];
                    return { pins: next };
                }),

            dismiss: (notice, sectionId) =>
                set(state => ({
                    trash: {
                        ...state.trash,
                        [notice.id]: {
                            deletedAt: Date.now(),
                            originalSectionId: sectionId,
                            snapshot: notice,
                        },
                    },
                })),

            dismissMany: (notices, sectionId) =>
                set(state => {
                    const now = Date.now();
                    const next = { ...state.trash };
                    notices.forEach(n => {
                        next[n.id] = {
                            deletedAt: now,
                            originalSectionId: sectionId,
                            snapshot: n,
                        };
                    });
                    return { trash: next };
                }),

            restore: id => {
                const meta = get().trash[id];
                if (!meta) return undefined;
                set(state => {
                    const next = { ...state.trash };
                    delete next[id];
                    return { trash: next };
                });
                return meta;
            },

            purge: id =>
                set(state => {
                    if (!state.trash[id]) return state;
                    const next = { ...state.trash };
                    delete next[id];
                    return { trash: next };
                }),

            purgeAll: () => set({ trash: {} }),
        }),
        {
            name: 'notify-notices-meta-v1',
            version: 1,
            storage: createJSONStorage(() => persistStorage),
        },
    ),
);

// ─── Selectors ────────────────────────────────────────────────

/** 휴지통 목록 — 최근 삭제순 */
export const selectTrashList = (state: NoticesState): Notice[] =>
    Object.values(state.trash)
        .sort((a, b) => b.deletedAt - a.deletedAt)
        .map(meta => ({
            ...meta.snapshot,
            deletedAt: meta.deletedAt,
            originalSectionId: meta.originalSectionId,
        }));

/** 사용자 핀 공지 id 집합 */
export const selectPinnedIds = (state: NoticesState): Set<string> =>
    new Set(Object.keys(state.pins));

/** 휴지통에 들어간 공지 id 집합 */
export const selectTrashedIds = (state: NoticesState): Set<string> =>
    new Set(Object.keys(state.trash));

interface MetaSlice {
    pins: Record<string, NoticePinMeta>;
    trash: Record<string, NoticeTrashMeta>;
}

/**
 * 공지 배열 위에 사용자 메타(핀, 휴지통)를 합성.
 * - 휴지통에 들어간 항목은 결과에서 제외
 * - 핀 항목은 isUserPinned + userPinnedAt 부착, 정렬 가중치는 호출자 책임
 */
export const decorateWithMeta = (
    notices: Notice[],
    slice: MetaSlice,
): Notice[] => {
    const trashedIds = new Set(Object.keys(slice.trash));
    const pins = slice.pins;
    return notices
        .filter(n => !trashedIds.has(n.id))
        .map(n => {
            const pin = pins[n.id];
            return pin
                ? { ...n, isUserPinned: true, userPinnedAt: pin.pinnedAt }
                : n;
        });
};

/** 핀된 모든 공지 (스냅샷 기반 — 시스템 "고정" 섹션의 데이터 소스) */
export const selectPinnedNotices = (
    slice: MetaSlice,
    sourcePool: Notice[],
): Notice[] => {
    const map = new Map(sourcePool.map(n => [n.id, n]));
    return Object.entries(slice.pins)
        .map(([id, meta]) => {
            const base = map.get(id);
            if (!base) return undefined;
            return {
                ...base,
                isUserPinned: true,
                userPinnedAt: meta.pinnedAt,
            } as Notice;
        })
        .filter((n): n is Notice => !!n)
        .sort((a, b) => (b.userPinnedAt ?? 0) - (a.userPinnedAt ?? 0));
};
