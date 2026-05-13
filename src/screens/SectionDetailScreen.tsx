import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Linking,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Card } from '../ui/primitives/Card';
import { PressableScale } from '../ui/primitives/PressableScale';
import { haptic } from '../ui/feedback/haptics';
import { colors, radius, spacing, typography } from '../ui/theme';
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
import {
    SwipeableNoticeRow,
    type SwipeableNoticeRowHandle,
} from '../features/notices/components/SwipeableNoticeRow';
import {
    NoticeContextMenu,
    type NoticeMenuAnchor,
    type NoticeMenuItem,
} from '../features/notices/components/NoticeContextMenu';
import { useNoticeCacheStore } from '../stores/noticeCacheStore';
import { uosAdapter } from '../services/universities/uos';
import type { Notice, ID } from '../types/domain';
import { SYSTEM_PIN_SECTION_ID } from '../types/domain';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'SectionDetail'>;

const CATEGORY_LABEL: Record<string, string> = {
    academic: '학사',
    scholarship: '장학',
    recruit: '채용',
    event: '행사',
    library: '도서관',
    dorm: '생활관',
    general: '일반',
};

/** 노란색 핀 — 시스템 '고정' 섹션과 동일한 톤. */
const PIN_COLOR = colors.warning;

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 1) return '방금';
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
}

async function shareNotice(notice: Notice) {
    try {
        await Share.share({
            message: `${notice.title}\n${notice.sourceUrl}`,
            url: notice.sourceUrl,
            title: notice.title,
        });
    } catch {
        /* 사용자가 공유 시트 취소 — silent. */
    }
}

export default function SectionDetailScreen({ navigation, route }: Props) {
    const { sectionId } = route.params;
    const isSystemPin = sectionId === SYSTEM_PIN_SECTION_ID;

    const section = useSectionsStore(s => s.sections[sectionId]);
    const toggleNotify = useSectionsStore(s => s.toggleNotify);
    const markVisited = useSectionsStore(s => s.markVisited);
    const updateNoticeCount = useSectionsStore(s => s.updateNoticeCount);
    const openKeywordEdit = useUIStore(s => s.openKeywordEdit);
    const setNoticeCache = useNoticeCacheStore(s => s.setCache);

    // 화면 진입 시점의 lastVisitedAt 스냅샷 — 이 시점 기준으로 "신규" 판별.
    // section이 처음 로드될 때 한 번만 캡처 (ref 사용).
    const entryLastVisitedAt = useRef<number | null>(null);
    useEffect(() => {
        if (entryLastVisitedAt.current === null && section) {
            entryLastVisitedAt.current = section.lastVisitedAt ?? null;
        }
    }, [section]);

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

    /* ─── 선택 모드 ───────────────────────────────────── */
    const [selectionMode, setSelectionMode] = useState(false);
    const [selected, setSelected] = useState<Set<ID>>(new Set());
    const [confirmOpen, setConfirmOpen] = useState(false);

    /* ─── Context menu (long-press) ──────────────────── */
    const [menuTarget, setMenuTarget] = useState<{
        notice: Notice;
        anchor: NoticeMenuAnchor;
    } | null>(null);

    /* ─── 스와이프 row 외부 터치 닫기 ──────────────────── */
    const rowHandles = useRef<Map<ID, SwipeableNoticeRowHandle>>(new Map());
    const openRowIdRef = useRef<ID | null>(null);

    const closeOpenRow = useCallback(() => {
        if (openRowIdRef.current) {
            rowHandles.current.get(openRowIdRef.current)?.close();
            openRowIdRef.current = null;
        }
    }, []);

    const exitSelection = useCallback(() => {
        setSelectionMode(false);
        setSelected(new Set());
    }, []);

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
        haptic('light');
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
        navigation.setOptions({
            title: selectionMode
                ? `${selected.size}개 선택`
                : isSystemPin
                ? '고정'
                : section?.title ?? '',
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

    /* ─── 선택 토글 ───────────────────────────────────── */
    const toggleSelected = useCallback((id: ID) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const onPressNotice = useCallback(
        (n: Notice) => {
            // 스와이프가 열려 있으면 닫고 탭을 소비 (이동하지 않음)
            if (openRowIdRef.current !== null) {
                closeOpenRow();
                return;
            }
            if (selectionMode) {
                haptic('selection');
                toggleSelected(n.id);
            }
        },
        [selectionMode, toggleSelected, closeOpenRow],
    );

    /** 외부 링크 아이콘 전용 핸들러 — 카드 전체 탭이 아닌 아이콘에서만 호출 */
    const onOpenNoticeUrl = useCallback(
        (n: Notice) => {
            closeOpenRow();
            haptic('light');
            Linking.openURL(n.sourceUrl).catch(() => {});
        },
        [closeOpenRow],
    );

    /* ─── Context menu trigger ───────────────────────── */
    const onLongPressNotice = useCallback(
        (notice: Notice, anchor: NoticeMenuAnchor) => {
            if (selectionMode) return;
            closeOpenRow();
            haptic('medium');
            setMenuTarget({ notice, anchor });
        },
        [selectionMode, closeOpenRow],
    );

    const closeMenu = useCallback(() => setMenuTarget(null), []);

    /* ─── 개별 공지 스와이프 삭제 (#6) ────────────────── */
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
        const items: NoticeMenuItem[] = [
            {
                key: 'pin',
                label: isPinned ? '고정 해제' : '고정',
                icon: isPinned ? 'pin' : 'pin-outline',
                iconColor: isPinned ? PIN_COLOR : colors.textSecondary,
                onPress: () => {
                    if (isPinned) {
                        unpinNotice(notice.id);
                        haptic('light');
                    } else {
                        togglePinNotice(notice, sectionId);
                        haptic('success');
                    }
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
                onPress: () => {
                    setSelectionMode(true);
                    setSelected(new Set([notice.id]));
                },
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
        return items;
    }, [
        menuTarget,
        pinnedIds,
        togglePinNotice,
        unpinNotice,
        markManyDeleted,
        sectionId,
        isSystemPin,
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

    return (
        <View style={styles.root}>
            <ScrollView
                contentContainerStyle={styles.content}
                onScrollBeginDrag={closeOpenRow}
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
                {/* 시스템 섹션(고정)은 상단 요약 카드만 표시 */}
                {isSystemPin && (
                    <Card accent={accent} showAccentLine shadow="md" style={styles.summary}>
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
                        {/* 알림 ON/OFF 버튼 (핀 버튼은 제거 #7) */}
                        <View style={styles.pills}>
                            <ActionPill
                                icon={section.notifyOn ? 'notifications' : 'notifications-off'}
                                label={section.notifyOn ? '알림 ON' : '알림 OFF'}
                                accent={accent}
                                on={section.notifyOn}
                                onPress={() => toggleNotify(section.id)}
                            />
                        </View>

                        {/* 키워드 편집 카드 — 현재 키워드 칩 표시 (#9) */}
                        <PressableScale
                            onPress={() => openKeywordEdit(section.id)}
                            hapticKind="light"
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
                                hapticKind="light"
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
                            notices.map(notice => (
                                <SwipeableNoticeRow
                                    key={notice.id}
                                    ref={(handle) => {
                                        if (handle) rowHandles.current.set(notice.id, handle);
                                        else rowHandles.current.delete(notice.id);
                                    }}
                                    onDelete={() => deleteNotice(notice)}
                                    onReveal={() => {
                                        if (openRowIdRef.current && openRowIdRef.current !== notice.id) {
                                            rowHandles.current.get(openRowIdRef.current)?.close();
                                        }
                                        openRowIdRef.current = notice.id;
                                    }}
                                >
                                    <NoticeRow
                                        notice={notice}
                                        accent={accent}
                                        pinned={pinnedIds.has(notice.id)}
                                        selectionMode={selectionMode}
                                        isSelected={selected.has(notice.id)}
                                        isNew={false}
                                        onPress={() => onPressNotice(notice)}
                                        onLongPress={(anchor) =>
                                            onLongPressNotice(notice, anchor)
                                        }
                                        onOpenUrl={() => onOpenNoticeUrl(notice)}
                                    />
                                </SwipeableNoticeRow>
                            ))
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
                        notices.map(notice => {
                            const lv = entryLastVisitedAt.current;
                            const isNew =
                                lv !== null &&
                                new Date(notice.publishedAt).getTime() > lv;
                            return (
                                <SwipeableNoticeRow
                                    key={notice.id}
                                    ref={(handle) => {
                                        if (handle) rowHandles.current.set(notice.id, handle);
                                        else rowHandles.current.delete(notice.id);
                                    }}
                                    onDelete={() => deleteNotice(notice)}
                                    onReveal={() => {
                                        if (openRowIdRef.current && openRowIdRef.current !== notice.id) {
                                            rowHandles.current.get(openRowIdRef.current)?.close();
                                        }
                                        openRowIdRef.current = notice.id;
                                    }}
                                >
                                    <NoticeRow
                                        notice={notice}
                                        accent={accent}
                                        pinned={pinnedIds.has(notice.id)}
                                        selectionMode={selectionMode}
                                        isSelected={selected.has(notice.id)}
                                        isNew={isNew}
                                        onPress={() => onPressNotice(notice)}
                                        onLongPress={(anchor) =>
                                            onLongPressNotice(notice, anchor)
                                        }
                                        onOpenUrl={() => onOpenNoticeUrl(notice)}
                                    />
                                </SwipeableNoticeRow>
                            );
                        })
                    )}
                </View>
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

/* ────────────────────── NoticeRow ─────────────────────────── */

function NoticeRow({
    notice,
    accent,
    pinned,
    selectionMode,
    isSelected,
    isNew,
    onPress,
    onLongPress,
    onOpenUrl,
}: {
    notice: Notice;
    accent: string;
    pinned: boolean;
    selectionMode: boolean;
    isSelected: boolean;
    isNew: boolean;
    onPress: () => void;
    onLongPress: (anchor: NoticeMenuAnchor) => void;
    /** 외부 링크 아이콘 전용 핸들러 — 카드 전체가 아닌 아이콘에서만 URL을 엽니다 */
    onOpenUrl: () => void;
}) {
    /** 카드 위치 측정 → 컨텍스트 메뉴 anchor. */
    const ref = useRef<View>(null);

    const handleLongPress = () => {
        ref.current?.measureInWindow((x, y, width, height) => {
            onLongPress({ top: y, left: x, width, height });
        });
    };

    return (
        <View ref={ref} collapsable={false}>
            <PressableScale
                onPress={onPress}
                onLongPress={handleLongPress}
                delayLongPress={320}
                hapticKind={null}
                scaleTo={0.985}
                style={[
                    styles.noticeCard,
                    pinned && !selectionMode && {
                        borderColor: PIN_COLOR + '66',
                        backgroundColor: PIN_COLOR + '0E',
                    },
                    selectionMode && isSelected && {
                        borderColor: accent,
                        backgroundColor: accent + '14',
                    },
                ]}
            >
                {selectionMode && (
                    <View
                        style={[
                            styles.checkbox,
                            isSelected && {
                                backgroundColor: accent,
                                borderColor: accent,
                            },
                        ]}
                    >
                        {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                    </View>
                )}

                <View style={styles.noticeBodyWrap}>
                    <View style={styles.noticeTop}>
                        <View style={[styles.tag, { backgroundColor: accent + '22' }]}>
                            <Text style={[styles.tagText, { color: accent }]}>
                                {CATEGORY_LABEL[notice.category] ?? notice.category}
                            </Text>
                        </View>
                        {/* 신규 공지 — 미니멀 'N' 뱃지 (테두리 대신 은은한 pill) */}
                        {isNew && !selectionMode && !pinned && (
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>N</Text>
                            </View>
                        )}
                        {notice.isSourcePinned && (
                            <Ionicons name="pin" size={11} color={accent} style={styles.pinIcon} />
                        )}
                        <Text style={styles.noticeTime}>{timeAgo(notice.publishedAt)}</Text>
                    </View>

                    <View style={styles.titleRow}>
                        {pinned && (
                            <Ionicons
                                name="pin"
                                size={13}
                                color={PIN_COLOR}
                                style={styles.userPinIcon}
                            />
                        )}
                        <Text style={styles.noticeTitle} numberOfLines={2}>
                            {notice.title}
                        </Text>
                    </View>

                    <View style={styles.noticeBottom}>
                        <Text style={styles.noticeDept}>{notice.department}</Text>
                        {notice.matchedKeywords && notice.matchedKeywords.length > 0 && (
                            <View style={styles.matchedRow}>
                                {notice.matchedKeywords.slice(0, 3).map(kw => (
                                    <View
                                        key={kw}
                                        style={[
                                            styles.matchChip,
                                            { backgroundColor: accent + '18' },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.matchChipText,
                                                { color: accent },
                                            ]}
                                        >
                                            {kw}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {!selectionMode && (
                            <Pressable
                                onPress={onOpenUrl}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
                                style={({ pressed }) => [
                                    styles.externalIconBtn,
                                    pressed && { opacity: 0.5 },
                                ]}
                            >
                                <Ionicons
                                    name="open-outline"
                                    size={13}
                                    color={colors.textMuted}
                                />
                            </Pressable>
                        )}
                    </View>
                </View>
            </PressableScale>
        </View>
    );
}

/* ────────────────────── ActionPill ────────────────────────── */

function ActionPill({
    icon,
    label,
    accent,
    on,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    accent: string;
    on: boolean;
    onPress: () => void;
}) {
    return (
        <PressableScale
            onPress={onPress}
            hapticKind="selection"
            style={[
                styles.pill,
                on
                    ? { backgroundColor: accent + '22', borderColor: accent + '99' }
                    : { borderColor: colors.border },
            ]}
        >
            <Ionicons
                name={icon}
                size={16}
                color={on ? accent : colors.textSecondary}
            />
            <Text
                style={[
                    styles.pillLabel,
                    { color: on ? colors.textPrimary : colors.textSecondary },
                ]}
            >
                {label}
            </Text>
        </PressableScale>
    );
}

/* ───────────────────────── styles ─────────────────────────── */

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
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
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: radius.pill,
        borderWidth: 1,
        backgroundColor: colors.bgRaised,
    },
    pillLabel: { ...typography.bodySm },

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
    // 키워드 칩 행
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

    noticeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: colors.bgRaised,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
    },
    noticeBodyWrap: { flex: 1, gap: spacing.xs },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.borderStrong,
        backgroundColor: colors.bgRaisedAlt,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    noticeTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: 2,
    },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
    userPinIcon: { marginRight: 5, marginTop: 5 },
    tag: {
        borderRadius: radius.sm,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    tagText: { ...typography.caption, fontWeight: '600', fontSize: 11 },
    /* 신규 공지 'N' 뱃지 — Premium Black 테마에 어울리는 은은한 pill */
    newBadge: {
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: 0.4,
    },
    pinIcon: { marginLeft: 2 },
    noticeTime: { ...typography.caption, color: colors.textMuted, marginLeft: 'auto' },

    noticeTitle: {
        ...typography.body,
        color: colors.textPrimary,
        lineHeight: 22,
        flex: 1,
    },
    noticeBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: 4,
    },
    noticeDept: { ...typography.caption, color: colors.textMuted, flex: 1 },
    matchedRow: { flexDirection: 'row', gap: 4 },
    matchChip: {
        borderRadius: radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    matchChipText: { fontSize: 11, fontWeight: '600' },
    externalIconBtn: {
        padding: 3,
        marginLeft: spacing.xs,
    },
});
