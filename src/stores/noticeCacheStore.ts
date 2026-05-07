import { create } from 'zustand';

import type { ID, Notice } from '../types/domain';

/**
 * 섹션별 최신 공지 목록을 메모리에 캐시하는 volatile store.
 *
 * - 영구 저장 없음 — 앱 재시작 시 초기화.
 * - SectionDetailScreen 에서 fetch 완료 후 setCache() 호출.
 * - HomeScreen 에서 각 섹션의 unread 공지 미리보기 + 뱃지 카운트에 사용.
 */
interface NoticeCacheState {
    cache: Record<ID, Notice[]>;
}

interface NoticeCacheActions {
    /** fetch 완료된 공지 목록을 섹션 캐시에 저장. */
    setCache: (sectionId: ID, notices: Notice[]) => void;
    /** 특정 섹션 캐시를 제거 (섹션 삭제 시 정리용). */
    clearCache: (sectionId: ID) => void;
}

export type NoticeCacheStore = NoticeCacheState & NoticeCacheActions;

export const useNoticeCacheStore = create<NoticeCacheStore>()((set) => ({
    cache: {},

    setCache: (sectionId, notices) =>
        set(s => ({ cache: { ...s.cache, [sectionId]: notices } })),

    clearCache: (sectionId) =>
        set(s => {
            const next = { ...s.cache };
            delete next[sectionId];
            return { cache: next };
        }),
}));

/* ─── selectors ─── */

/**
 * 특정 섹션의 캐시된 공지 목록. 캐시 미스 시 빈 배열.
 * lastVisitedAt 기준 unread 필터링은 호출하는 쪽에서 처리.
 */
export function useNoticeCacheForSection(sectionId: ID): Notice[] {
    return useNoticeCacheStore(s => s.cache[sectionId] ?? []);
}

/** 섹션별 unread 공지 개수. lastVisitedAt 이후 publishedAt 인 항목만 카운트. */
export function useUnreadCount(
    sectionId: ID,
    lastVisitedAt: number | null,
    deletedIds: Set<ID>,
): number {
    return useNoticeCacheStore(s => {
        const notices = s.cache[sectionId] ?? [];
        if (lastVisitedAt === null) return 0;
        return notices.filter(
            n =>
                !deletedIds.has(n.id) &&
                new Date(n.publishedAt).getTime() > lastVisitedAt,
        ).length;
    });
}
