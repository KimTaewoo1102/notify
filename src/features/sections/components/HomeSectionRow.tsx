import React, { useMemo } from 'react';

import { colors } from '../../../ui/theme';
import { useNoticeCacheStore } from '../../../stores/noticeCacheStore';
import { useSectionsStore } from '../../../stores/sectionsStore';
import { useDeletedNoticeIdSet } from '../../../stores/noticesStore';
import type { Section } from '../../../types/domain';

import {
    SwipeableSectionRow,
    type SwipeableSectionRowHandle,
} from './SwipeableSectionRow';
import { SectionCard } from './SectionCard';
import { UnreadPreview } from './UnreadPreview';
import { UnreadPreviewSkeleton } from './UnreadPreviewSkeleton';
import type { SwipeRowManager } from '../../notices/hooks/useSwipeRowManager';

interface Props {
    section: Section;
    swipe: SwipeRowManager<SwipeableSectionRowHandle>;
    onPress: () => void;
    onLongPress: () => void;
    onDelete: () => void;
    onToggleNotify: () => void;
    onEditKeywords: () => void;
    onRename: () => void;
}

/**
 * 홈 화면 user 섹션 1줄.
 *  - SwipeableSectionRow 로 좌측 스와이프 액션(알림 토글 + 삭제) 제공.
 *  - SectionCard 본체 + 하단 미리보기(UnreadPreview) 슬롯.
 *
 * 데이터 의존성을 *내부에서* fine-grained selector 로 직접 구독해
 * 부모(HomeScreen) 의 prop drilling 을 줄인다. 특정 섹션의 캐시가 바뀔 때만
 * 이 row 만 리렌더된다 (zustand selector 의 referential identity 활용).
 */
export function HomeSectionRow({
    section,
    swipe,
    onPress,
    onLongPress,
    onDelete,
    onToggleNotify,
    onEditKeywords,
    onRename,
}: Props) {
    const cache = useNoticeCacheStore(s => s.cache[section.id]);
    const totalNoticeCount = useSectionsStore(s => s.noticeCountCache[section.id]);
    const deletedIds = useDeletedNoticeIdSet();

    // cache === undefined: prefetch 아직 실행 전 (skeleton 노출 조건)
    // cache === []      : 응답 받음, 결과 없음 (skeleton 미노출, preview 도 미노출)
    const isLoading = cache === undefined && section.keywords.length > 0;

    const { unread, previews, total } = useMemo(() => {
        const allVisible = (cache ?? []).filter(n => !deletedIds.has(n.id));
        const lv = section.lastVisitedAt;
        const unreadCount = lv === null
            ? 0
            : allVisible.filter(n => new Date(n.publishedAt).getTime() > lv).length;
        // 미리보기: unread 무관, 전체 캐시 중 최신 2개 고정
        const previewList = [...allVisible]
            .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
            .slice(0, 2);
        return { unread: unreadCount, previews: previewList, total: allVisible.length };
    }, [cache, deletedIds, section.lastVisitedAt]);

    return (
        <SwipeableSectionRow
            ref={handle => swipe.registerHandle(section.id, handle)}
            onDelete={onDelete}
            onToggleNotify={onToggleNotify}
            notifyOn={section.notifyOn}
            onOpen={() => swipe.handleReveal(section.id)}
        >
            <SectionCard
                section={section}
                totalNoticeCount={totalNoticeCount}
                unreadCount={unread}
                onPress={onPress}
                onLongPress={onLongPress}
                onToggleNotify={onToggleNotify}
                onEditKeywords={onEditKeywords}
                onRename={onRename}
                onDelete={onDelete}
                previewSlot={
                    isLoading ? (
                        <UnreadPreviewSkeleton accent={colors.accent} />
                    ) : previews.length > 0 ? (
                        <UnreadPreview
                            notices={previews}
                            totalCount={total}
                            accent={colors.accent}
                        />
                    ) : undefined
                }
            />
        </SwipeableSectionRow>
    );
}
