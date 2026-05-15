import { useMemo } from 'react';

import type { ID, Notice, Section } from '../../../types/domain';

/**
 * 홈 화면 섹션 정렬.
 *
 *  - editMode 동안에는 사용자 지정 순서를 그대로 유지 (드래그 결과 보존).
 *  - 일반 모드에서는 "신규 공지가 있는 섹션"을 상단으로 끌어올린다.
 *    동률(둘 다 신규 있음)일 경우 최신 공지 시각이 더 최근인 섹션이 위.
 *    둘 다 신규가 없으면 사용자 지정 순서 유지.
 *
 * 의도: lastVisitedAt 이후 publishedAt 인 공지를 "신규" 로 본다.
 * 삭제된 공지는 정렬 판정에서 제외.
 */
export function useSectionSort(
    userSections: Section[],
    editMode: boolean,
    noticeCache: Record<ID, Notice[]>,
    deletedIds: Set<ID>,
): Section[] {
    return useMemo(() => {
        if (editMode) return userSections;
        return [...userSections].sort((a, b) => {
            const aLv = a.lastVisitedAt;
            const bLv = b.lastVisitedAt;
            const aCache = (noticeCache[a.id] ?? []).filter(n => !deletedIds.has(n.id));
            const bCache = (noticeCache[b.id] ?? []).filter(n => !deletedIds.has(n.id));
            const aUnread = aLv !== null
                ? aCache.filter(n => new Date(n.publishedAt).getTime() > aLv)
                : [];
            const bUnread = bLv !== null
                ? bCache.filter(n => new Date(n.publishedAt).getTime() > bLv)
                : [];
            const aHas = aUnread.length > 0;
            const bHas = bUnread.length > 0;
            if (aHas !== bHas) return aHas ? -1 : 1;
            if (aHas && bHas) {
                const aLatest = Math.max(...aUnread.map(n => new Date(n.publishedAt).getTime()));
                const bLatest = Math.max(...bUnread.map(n => new Date(n.publishedAt).getTime()));
                return bLatest - aLatest;
            }
            return 0;
        });
    }, [editMode, userSections, noticeCache, deletedIds]);
}
