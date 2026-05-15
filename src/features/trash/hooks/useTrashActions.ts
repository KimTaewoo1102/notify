import { useCallback } from 'react';
import { Alert } from 'react-native';

import { haptic } from '../../../ui/feedback/haptics';
import { useTrashStore } from '../../../stores/trashStore';
import { useSectionsStore } from '../../../stores/sectionsStore';
import { useNoticesStore } from '../../../stores/noticesStore';

import type { UnifiedTrashRow } from './useUnifiedTrashRows';

interface TrashActions {
    /** SwipeToRestoreRow 의 onRestore 에 그대로 전달 가능. confirm 없이 즉시 복구. */
    handleRestore: (row: UnifiedTrashRow) => void;
    /** confirm dialog (Alert.alert, native) 띄운 뒤 영구 삭제. */
    handlePurge: (row: UnifiedTrashRow) => void;
    /** 전체 삭제 — confirm 후 양쪽 store purgeAll. totalCount 0 이면 no-op. */
    handlePurgeAll: () => void;
}

/**
 * 휴지통 화면의 4개 액션 (복구/영구삭제/전체삭제) 을 단일 hook 으로 묶는다.
 *  - section 과 notice trash 의 비대칭 API 를 row.kind 분기로 흡수.
 *  - confirm UI 는 Alert.alert 유지 (native look 보존 — ConfirmDialog 로 바꾸면
 *    iOS/Android 시스템 다이얼로그가 커스텀 Modal 로 바뀌어 UX 톤이 달라짐).
 */
export function useTrashActions(totalCount: number): TrashActions {
    const restoreSectionEntry = useTrashStore(s => s.restore);
    const purgeSectionEntry = useTrashStore(s => s.purge);
    const purgeAllSections = useTrashStore(s => s.purgeAll);
    const restoreSection = useSectionsStore(s => s.restoreSection);

    const restoreNoticeEntry = useNoticesStore(s => s.restore);
    const purgeNoticeEntry = useNoticesStore(s => s.purge);
    const purgeAllNotices = useNoticesStore(s => s.purgeAll);

    const handleRestore = useCallback(
        (row: UnifiedTrashRow) => {
            if (row.kind === 'section') {
                const section = restoreSectionEntry(row.entry.id);
                if (!section) return;
                restoreSection(section);
            } else {
                restoreNoticeEntry(row.entry.noticeId);
            }
            haptic('success');
        },
        [restoreSectionEntry, restoreSection, restoreNoticeEntry],
    );

    const handlePurge = useCallback(
        (row: UnifiedTrashRow) => {
            const isSection = row.kind === 'section';
            const title = row.entry.payload.title;
            // 한국어 조사: '섹션을' / '공지를' — 끝 받침 유무 차이로 분기 보존
            const obj = isSection ? '섹션을' : '공지를';
            Alert.alert(
                '영구 삭제',
                `"${title}" ${obj} 영구 삭제할까요?\n복구할 수 없습니다.`,
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '삭제',
                        style: 'destructive',
                        onPress: () => {
                            if (row.kind === 'section') {
                                purgeSectionEntry(row.entry.id);
                            } else {
                                purgeNoticeEntry(row.entry.noticeId);
                            }
                            haptic('warning');
                        },
                    },
                ],
            );
        },
        [purgeSectionEntry, purgeNoticeEntry],
    );

    const handlePurgeAll = useCallback(() => {
        if (totalCount === 0) return;
        Alert.alert(
            '전체 영구 삭제',
            `휴지통의 항목 ${totalCount}개를 모두 영구 삭제할까요?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '모두 삭제',
                    style: 'destructive',
                    onPress: () => {
                        purgeAllSections();
                        purgeAllNotices();
                        haptic('warning');
                    },
                },
            ],
        );
    }, [totalCount, purgeAllSections, purgeAllNotices]);

    return { handleRestore, handlePurge, handlePurgeAll };
}
