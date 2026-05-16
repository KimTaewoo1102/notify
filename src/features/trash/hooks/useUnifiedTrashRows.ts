import { useEffect, useMemo } from 'react';

import { useTrashStore, type TrashEntry } from '../../../stores/trashStore';
import {
    useAllDeletedNotices,
    useNoticesStore,
    type DeletedNoticeEntry,
} from '../../../stores/noticesStore';

/**
 * 통합 Trash row — section trash 와 notice trash 를 하나의 정렬된 리스트로 합친다.
 * 가장 최근에 삭제된 항목이 위로 오도록 정렬.
 */
export type UnifiedTrashRow =
    | { kind: 'section'; deletedAt: number; entry: TrashEntry }
    | { kind: 'notice'; deletedAt: number; entry: DeletedNoticeEntry };

interface Result {
    rows: UnifiedTrashRow[];
    totalCount: number;
}

/**
 * 두 trash store (sectionsTrash, noticesDeleted) 를 합쳐 통합된 row 목록을 반환.
 * 마운트 시 만료 항목(30일 경과) 을 양쪽 모두 자동 정리한다.
 */
export function useUnifiedTrashRows(): Result {
    const sectionEntries = useTrashStore(s => s.entries);
    const noticeEntries = useAllDeletedNotices();

    const purgeExpiredSections = useTrashStore(s => s.purgeExpired);
    const purgeExpiredNotices = useNoticesStore(s => s.purgeExpired);

    useEffect(() => {
        purgeExpiredSections();
        purgeExpiredNotices();
    }, [purgeExpiredSections, purgeExpiredNotices]);

    const rows = useMemo<UnifiedTrashRow[]>(() => {
        const sectionRows: UnifiedTrashRow[] = sectionEntries.map(e => ({
            kind: 'section',
            deletedAt: e.deletedAt,
            entry: e,
        }));
        const noticeRows: UnifiedTrashRow[] = noticeEntries.map(e => ({
            kind: 'notice',
            deletedAt: e.deletedAt,
            entry: e,
        }));
        return [...sectionRows, ...noticeRows].sort(
            (a, b) => b.deletedAt - a.deletedAt,
        );
    }, [sectionEntries, noticeEntries]);

    return { rows, totalCount: rows.length };
}
