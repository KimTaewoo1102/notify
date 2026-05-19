import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Card } from '../ui/primitives/Card';
import { PressableScale } from '../ui/primitives/PressableScale';
import { ActionPill } from '../ui/primitives/ActionPill';
import { haptic } from '../ui/feedback/haptics';
import { colors, radius, spacing, typography } from '../ui/theme';
import { shareNotice } from '../utils/share';
import { openExternalUrl } from '../utils/openExternal';
import { useSectionsStore } from '../stores/sectionsStore';
import { useUIStore } from '../stores/uiStore';
import {
    useDeletedNoticeCountForSection,
    useDeletedNoticeIdSet,
    useNoticesStore,
    usePinnedNoticeIdSet,
    useAllPinnedNotices,
} from '../stores/noticesStore';
import { SectionTrashButton } from '../features/notices/components/SectionTrashButton';
import { SelectionActionBar } from '../features/notices/components/SelectionActionBar';
import { NoticeBulkDeleteModal } from '../features/notices/components/NoticeBulkDeleteModal';
import { SwipeableNoticeRow, type SwipeableNoticeRowHandle } from '../features/notices/components/SwipeableNoticeRow';
import {
    NoticeContextMenu,
    type NoticeMenuItem,
} from '../features/notices/components/NoticeContextMenu';
import { NoticeRow } from '../features/notices/components/NoticeRow';
import { SelectionHeaderTitle } from '../features/notices/components/SelectionHeaderTitle';
import { useSwipeRowManager } from '../features/notices/hooks/useSwipeRowManager';
import { useNewNoticeDetection } from '../features/notices/hooks/useNewNoticeDetection';
import { useNoticeSelection } from '../features/notices/hooks/useNoticeSelection';
import { useNoticeMenu } from '../features/notices/hooks/useNoticeMenu';
import { useNoticeCacheStore } from '../stores/noticeCacheStore';
import { uosAdapter } from '../services/universities/uos';
import type { Notice } from '../types/domain';
import { SYSTEM_PIN_SECTION_ID } from '../types/domain';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'SectionDetail'>;

export default function SectionDetailScreen({ navigation, route }: Props) {
    const { sectionId } = route.params;
    const isSystemPin = sectionId === SYSTEM_PIN_SECTION_ID;

    const section = useSectionsStore(s => s.sections[sectionId]);
    const toggleNotify = useSectionsStore(s => s.toggleNotify);
    const markVisited = useSectionsStore(s => s.markVisited);
    const updateNoticeCount = useSectionsStore(s => s.updateNoticeCount);
    const openKeywordEdit = useUIStore(s => s.openKeywordEdit);
    const setNoticeCache = useNoticeCacheStore(s => s.setCache);

    const markManyDeleted = useNoticesStore(s => s.markManyDeleted);
    const togglePinNotice = useNoticesStore(s => s.togglePin);
    const unpinNotice = useNoticesStore(s => s.unpin);
    const deletedIds = useDeletedNoticeIdSet();
    const pinnedIds = usePinnedNoticeIdSet();
    const pinnedEntries = useAllPinnedNotices();
    const deletedCount = useDeletedNoticeCountForSection(sectionId);

    const [allNotices, setAllNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isNewNotice = useNewNoticeDetection(section);
    const swipe = useSwipeRowManager<SwipeableNoticeRowHandle>();
    const {
        selectionMode,
        selected,
        toggleSelected,
        enterSelection,
        exitSelection,
    } = useNoticeSelection();
    const { menuTarget, openMenu, closeMenu } = useNoticeMenu();

    /* 시스템 '고정' 섹션 — pinned 공지를 그대로 사용. 일반 섹션 — 어댑터 fetch. */
    const pinnedNoticesForSystem = useMemo(
        () => pinnedEntries.map(e => e.payload),
        [pinnedEntries],
    );

    const baseNotices = isSystemPin ? pinnedNoticesForSystem : allNotices;
    const notices = useMemo(
        () => baseNotices.filter(n => !deletedIds.has(n.id)),
        [baseNotices, deletedIds],
    );

    const fetchNotices = useCallback(async () => {
        if (isSystemPin) return;
        if (!section || section.keywords.length === 0) {
            setAllNotices([]);
            return;
        }
        setLoading(true);
        try {
            const results = await uosAdapter.fetchByKeywords(
                section.keywords.map(k => k.text),
            );
            setAllNotices(results);
            // 캐시 & 카운트 동기화 → 홈화면 미리보기/뱃지 즉시 반영
            setNoticeCache(sectionId, results);
            updateNoticeCount(sectionId, results.length);
        } finally {
            setLoading(false);
        }
    }, [section, isSystemPin, sectionId, setNoticeCache, updateNoticeCount]);

    // 화면을 떠날 때 lastVisitedAt 갱신 → 홈화면 복귀 시 unread 즉시 초기화
    useEffect(() => {
        return () => {
            if (!isSystemPin) {
                markVisited(sectionId);
            }
        };
    }, [sectionId, isSystemPin, markVisited]);

    const onRefresh = useCallback(async () => {
        // pull-to-refresh trigger 햅틱은 RefreshControl 자체가 native 로 처리.
        // 완료 시점만 명시적 success 로 알림.
        setIsRefreshing(true);
        await fetchNotices();
        setIsRefreshing(false);
        haptic('success');
    }, [fetchNotices]);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    useEffect(() => {
        if (selectionMode && notices.length === 0) exitSelection();
    }, [selectionMode, notices.length, exitSelection]);

    useLayoutEffect(() => {
        const baseTitle = isSystemPin ? '고정' : section?.title ?? '';
        navigation.setOptions({
            // SelectionActionBar slide-up 과 같은 ease curve 로 헤더도 cross-fade.
            // 기존 즉시 변경(useLayoutEffect 의 title) 보다 시각적 연결성 강함.
            headerTitle: () => (
                <SelectionHeaderTitle
                    selectionMode={selectionMode}
                    selectedCount={selected.size}
                    baseTitle={baseTitle}
                />
            ),
            headerRight: () =>
                selectionMode || isSystemPin ? null : (
                    <SectionTrashButton
                        count={deletedCount}
                        onPress={() => navigation.navigate('Trash')}
                    />
                ),
        });
    }, [
        navigation,
        section?.title,
        selectionMode,
        selected.size,
        deletedCount,
        isSystemPin,
    ]);

    const onPressNotice = useCallback(
        (n: Notice) => {
            // 스와이프가 열려 있으면 닫고 탭을 소비 (이동하지 않음)
            if (swipe.isAnyOpen()) {
                swipe.closeOpenRow();
                return;
            }
            if (selectionMode) {
                haptic('selection');
                toggleSelected(n.id);
                return;
            }
            // 카드 본문 탭 → 인앱 브라우저로 외부 URL 열기 (chevron-forward 가 affordance).
            // expo-web-browser 가 iOS SFSafariViewController / Android Custom Tabs 로
            // 시트형 표시 — 앱 컨텍스트 유지 (Linking 처럼 Safari 로 새지 않음).
            openExternalUrl(n.sourceUrl);
        },
        [selectionMode, toggleSelected, swipe],
    );

    const onLongPressNotice = useCallback(
        (notice: Notice, anchor: Parameters<typeof openMenu>[1]) => {
            if (selectionMode) return;
            swipe.closeOpenRow();
            haptic('medium');
            openMenu(notice, anchor);
        },
        [selectionMode, swipe, openMenu],
    );

    /* ─── 개별 공지 스와이프 삭제 ──────────────────────── */
    const deleteNotice = useCallback(
        (notice: Notice) => {
            const src = isSystemPin
                ? notice.originalSectionId ?? SYSTEM_PIN_SECTION_ID
                : sectionId;
            markManyDeleted([notice], src);
            haptic('warning');
        },
        [isSystemPin, sectionId, markManyDeleted],
    );

    /* ─── Bulk delete ─────────────────────────────────── */
    const confirmDelete = useCallback(() => {
        const targets = baseNotices.filter(n => selected.has(n.id));
        if (targets.length === 0) {
            setConfirmOpen(false);
            return;
        }
        const sourceSectionId = isSystemPin ? SYSTEM_PIN_SECTION_ID : sectionId;
        markManyDeleted(targets, sourceSectionId);
        haptic('success');
        setConfirmOpen(false);
        exitSelection();
    }, [
        baseNotices,
        selected,
        markManyDeleted,
        sectionId,
        isSystemPin,
        exitSelection,
    ]);

    /* ─── Context menu items ──────────────────────────── */
    const menuItems: NoticeMenuItem[] = useMemo(() => {
        if (!menuTarget) return [];
        const notice = menuTarget.notice;
        const isPinned = pinnedIds.has(notice.id);
        return [
            {
                key: 'pin',
                label: isPinned ? '고정 해제' : '고정',
                icon: isPinned ? 'pin' : 'pin-outline',
                iconColor: isPinned ? colors.warning : colors.textSecondary,
                onPress: () => {
                    if (isPinned) unpinNotice(notice.id);
                    else togglePinNotice(notice, sectionId);
                    // 토글 상태 변화 → selection 햅틱 (양방향 동일)
                    haptic('selection');
                },
            },
            {
                key: 'share',
                label: '공유',
                icon: 'share-outline',
                onPress: () => shareNotice(notice),
            },
            {
                key: 'select',
                label: '선택',
                icon: 'checkmark-circle-outline',
                onPress: () => enterSelection(notice.id),
            },
            {
                key: 'delete',
                label: '휴지통으로 이동',
                icon: 'trash',
                destructive: true,
                onPress: () => {
                    const src = isSystemPin
                        ? notice.originalSectionId ?? SYSTEM_PIN_SECTION_ID
                        : sectionId;
                    markManyDeleted([notice], src);
                    haptic('warning');
                },
            },
        ];
    }, [
        menuTarget,
        pinnedIds,
        togglePinNotice,
        unpinNotice,
        markManyDeleted,
        sectionId,
        isSystemPin,
        enterSelection,
    ]);

    if (!section) {
        return (
            <View style={styles.root}>
                <Text style={styles.muted}>섹션을 찾을 수 없습니다.</Text>
            </View>
        );
    }

    const accent = section.accentColor;
    const showSectionControls = !isSystemPin;

    const renderNoticeItem = (notice: Notice, isNew: boolean) => (
        <SwipeableNoticeRow
            key={notice.id}
            ref={handle => swipe.registerHandle(notice.id, handle)}
            onDelete={() => deleteNotice(notice)}
            onReveal={() => swipe.handleReveal(notice.id)}
        >
            <NoticeRow
                notice={notice}
                accent={accent}
                pinned={pinnedIds.has(notice.id)}
                selectionMode={selectionMode}
                isSelected={selected.has(notice.id)}
                isNew={isNew}
                onPress={() => onPressNotice(notice)}
                onLongPress={anchor => onLongPressNotice(notice, anchor)}
            />
        </SwipeableNoticeRow>
    );

    return (
        <View style={styles.root}>
            <ScrollView
                contentContainerStyle={styles.content}
                onScrollBeginDrag={swipe.closeOpenRow}
                refreshControl={
                    !isSystemPin ? (
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            tintColor={accent}
                            colors={[accent]}
                        />
                    ) : undefined
                }
            >
                {/*
                 * 빈 공간 탭 → 열린 스와이프 row 닫기.
                 * onPressIn 으로 즉시 발화 (touch down) — onPress 의 ~150ms lag 제거.
                 * 자식 Pressable(NoticeRow) 이 먼저 responder 를 잡으므로 카드 탭에는 미발동.
                 */}
                <Pressable onPressIn={swipe.closeOpenRow} style={styles.tapToDismiss}>
                {/* 시스템 섹션(고정)은 상단 요약 카드만 표시 */}
                {isSystemPin && (
                    <Card accent={accent} shadow="md" style={styles.summary}>
                        <View style={styles.summaryHead}>
                            <Ionicons name="pin" size={16} color={accent} />
                            <Text style={styles.summaryTitle}>고정한 공지</Text>
                        </View>
                        <Text style={styles.summaryMeta}>
                            {`${pinnedNoticesForSystem.length}개 공지 · 길게 눌러 해제`}
                        </Text>
                    </Card>
                )}

                {showSectionControls && (
                    <>
                        {/* 알림 ON/OFF 버튼 */}
                        <View style={styles.pills}>
                            <ActionPill
                                icon={section.notifyOn ? 'notifications' : 'notifications-off'}
                                label={section.notifyOn ? '알림 ON' : '알림 OFF'}
                                accent={accent}
                                on={section.notifyOn}
                                onPress={() => toggleNotify(section.id)}
                            />
                        </View>

                        {/* 키워드 편집 카드 — 현재 키워드 칩 표시 */}
                        <PressableScale
                            onPress={() => openKeywordEdit(section.id)}
                            style={[styles.editBtn, { borderColor: accent + '55' }]}
                        >
                            <View style={styles.editBtnTop}>
                                <Ionicons name="pricetag" size={16} color={accent} />
                                <Text style={styles.editLabel}>키워드 편집</Text>
                                <View style={[styles.editBadge, { backgroundColor: accent + '22' }]}>
                                    <Text style={[styles.editBadgeText, { color: accent }]}>
                                        {section.keywords.length}
                                    </Text>
                                </View>
                            </View>
                            {section.keywords.length > 0 ? (
                                <View style={styles.chipRow}>
                                    {section.keywords.map(kw => (
                                        <View
                                            key={kw.id}
                                            style={[styles.chip, { backgroundColor: accent + '20', borderColor: accent + '44' }]}
                                        >
                                            <Text style={[styles.chipText, { color: accent }]}>
                                                {kw.text}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.noKeywordHint}>
                                    + 키워드를 추가해 관련 공지를 받아보세요
                                </Text>
                            )}
                        </PressableScale>
                    </>
                )}

                {/* Notices */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {isSystemPin ? '고정 공지' : '관련 공지'}
                        </Text>
                        {!isSystemPin && (
                            <PressableScale
                                onPress={fetchNotices}
                                style={styles.refreshBtn}
                                disabled={loading}
                            >
                                <Ionicons
                                    name="refresh"
                                    size={15}
                                    color={loading ? colors.textDisabled : colors.textMuted}
                                />
                            </PressableScale>
                        )}
                    </View>

                    {loading ? (
                        <View style={styles.loader}>
                            <ActivityIndicator color={accent} size="small" />
                        </View>
                    ) : isSystemPin ? (
                        notices.length === 0 ? (
                            <View style={styles.noKeywords}>
                                <Ionicons
                                    name="pin-outline"
                                    size={24}
                                    color={colors.textMuted}
                                />
                                <Text style={styles.noKeywordsText}>
                                    공지를 길게 눌러 고정하면 여기에 모입니다.
                                </Text>
                            </View>
                        ) : (
                            notices.map(notice => renderNoticeItem(notice, false))
                        )
                    ) : section.keywords.length === 0 ? (
                        <View style={styles.noKeywords}>
                            <Ionicons
                                name="pricetag-outline"
                                size={24}
                                color={colors.textMuted}
                            />
                            <Text style={styles.noKeywordsText}>
                                키워드를 추가하면 관련 공지를 찾아드려요.
                            </Text>
                        </View>
                    ) : notices.length === 0 ? (
                        <View style={styles.noKeywords}>
                            <Ionicons
                                name="search-outline"
                                size={24}
                                color={colors.textMuted}
                            />
                            <Text style={styles.noKeywordsText}>
                                {allNotices.length > 0
                                    ? '표시할 공지가 없습니다. (휴지통 확인)'
                                    : '매칭되는 공지가 없습니다.'}
                            </Text>
                        </View>
                    ) : (
                        notices.map(notice =>
                            renderNoticeItem(notice, isNewNotice(notice.publishedAt)),
                        )
                    )}
                </View>
                </Pressable>
            </ScrollView>

            <SelectionActionBar
                visible={selectionMode}
                selectedCount={selected.size}
                onCancel={exitSelection}
                onDelete={() => setConfirmOpen(true)}
            />

            <NoticeBulkDeleteModal
                visible={confirmOpen}
                count={selected.size}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDelete}
            />

            <NoticeContextMenu
                visible={!!menuTarget}
                anchor={menuTarget?.anchor ?? null}
                items={menuItems}
                onClose={closeMenu}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    // gap: HomeScreen / TrashScreen list 와 정합 (spacing.sm). 이전 spacing.md(12px) 는
    // 다른 화면(8px) 대비 살짝 헐거웠음 — 8px 로 통일해 Premium 톤 강화.
    content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 120 },
    tapToDismiss: { flex: 1, gap: spacing.sm },
    muted: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xxxl,
    },

    summary: { padding: spacing.lg, gap: spacing.xs },
    summaryHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    summaryTitle: { ...typography.h2, color: colors.textPrimary },
    summaryMeta: { ...typography.caption, color: colors.textSecondary },

    pills: { flexDirection: 'row', gap: spacing.sm },

    editBtn: {
        backgroundColor: colors.bgRaised,
        borderWidth: 1,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    editBtnTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    editLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
    editBadge: {
        borderRadius: radius.sm,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    editBadgeText: { ...typography.caption, fontWeight: '700' },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    chip: {
        borderRadius: radius.pill,
        borderWidth: 1,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
    },
    chipText: {
        ...typography.caption,
        fontWeight: '600',
    },
    noKeywordHint: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },

    section: { gap: spacing.sm },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, flex: 1 },
    refreshBtn: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loader: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    noKeywords: {
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xl,
        backgroundColor: colors.bgRaised,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    noKeywordsText: {
        ...typography.bodySm,
        color: colors.textMuted,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },
});
