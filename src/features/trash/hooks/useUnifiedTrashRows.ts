import { useEffect, useMemo } from 'react';

import { useTrashStore, type TrashEntry } from '../../../stores/trashStore';
import {
    useAllDeletedNotices,
    useNoticesStore,
    type DeletedNoticeEntry,
} from '../../../stores/noticesStore';
import type { ID } from '../../../types/domain';

export type UnifiedTrashRow =
    | { kind: 'section'; deletedAt: number; entry: TrashEntry }
    | { kind: 'notice'; deletedAt: number; entry: DeletedNoticeEntry };

interface Result {
    rows: UnifiedTrashRow[];
    totalCount: number;
}

/**
 * sectionId 가 주어지면 해당 섹션에서 삭제한 공지만 반환 (섹션 항목 제외).
 * 없으면 모든 섹션 및 공지 항목을 합쳐 반환.
 * 가장 최근에 삭제된 항목이 위로 오도록 정렬.
 */
export function useUnifiedTrashRows(sectionId?: ID): Result {
    const sectionEntries = useTrashStore(s => s.entries);
    const noticeEntries = useAllDeletedNotices();

    const purgeExpiredSections = useTrashStore(s => s.purgeExpired);
    const purgeExpiredNotices = useNoticesStore(s => s.purgeExpired);

    useEffect(() => {
        purgeExpiredSections();
        purgeExpiredNotices();
    }, [purgeExpiredSections, purgeExpiredNotices]);

    const rows = useMemo<UnifiedTrashRow[]>(() => {
        const sectionRows: UnifiedTrashRow[] = sectionId
            ? []
            : sectionEntries.map(e => ({
                  kind: 'section' as const,
                  deletedAt: e.deletedAt,
                  entry: e,
              }));

        const filteredNoticeEntries = sectionId
            ? noticeEntries.filter(e => e.sectionId === sectionId)
            : noticeEntries;
        const noticeRows: UnifiedTrashRow[] = filteredNoticeEntries.map(e => ({
            kind: 'notice' as const,
            deletedAt: e.deletedAt,
            entry: e,
        }));

        return [...sectionRows, ...noticeRows].sort(
            (a, b) => b.deletedAt - a.deletedAt,
        );
    }, [sectionEntries, noticeEntries, sectionId]);

    return { rows, totalCount: rows.length };
}
