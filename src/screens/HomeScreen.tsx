import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import DraggableFlatList, {
    ScaleDecorator,
    type RenderItemParams,
} from 'react-native-draggable-flatlist';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PressableScale } from '../ui/primitives/PressableScale';
import { haptic } from '../ui/feedback/haptics';
import { colors, shadows, spacing, typography } from '../ui/theme';
import { EditDoneButton } from '../features/home/EditDoneButton';
import { JiggleWrapper } from '../features/sections/components/JiggleWrapper';
import { SectionCard } from '../features/sections/components/SectionCard';
import { AddSectionSlot } from '../features/sections/components/AddSectionSlot';
import { RenameSectionModal } from '../features/sections/components/RenameSectionModal';
import {
    useOrderedUserSections,
    usePinSystemSection,
    useSectionsStore,
} from '../stores/sectionsStore';
import {
    usePinnedNoticeCount,
    useDeletedNoticeIdSet,
} from '../stores/noticesStore';
import { useNoticeCacheStore } from '../stores/noticeCacheStore';
import { useTrashStore } from '../stores/trashStore';
import { useUIStore } from '../stores/uiStore';
import { uosAdapter } from '../services/universities/uos';
import type { Notice, Section } from '../types/domain';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
    const userSections = useOrderedUserSections();
    const pinSection = usePinSystemSection();
    const pinnedCount = usePinnedNoticeCount();
    const editMode = useUIStore(s => s.editMode);
    const setEditMode = useUIStore(s => s.setEditMode);
    const openAdd = useUIStore(s => s.openAddSection);

    const sections_map = useSectionsStore(s => s.sections);
    const noticeCountCache = useSectionsStore(s => s.noticeCountCache);
    const updateNoticeCount = useSectionsStore(s => s.updateNoticeCount);
    const reorder = useSectionsStore(s => s.reorderSections);
    const removeSection = useSectionsStore(s => s.removeSection);
    const renameSection = useSectionsStore(s => s.renameSection);
    const toggleNotify = useSectionsStore(s => s.toggleNotify);
    const openKeywordEdit = useUIStore(s => s.openKeywordEdit);
    const pushToTrash = useTrashStore(s => s.pushSection);
    const deletedIds = useDeletedNoticeIdSet();
    const noticeCache = useNoticeCacheStore(s => s.cache);
    const setNoticeCache = useNoticeCacheStore(s => s.setCache);

    const [renameTarget, setRenameTarget] = useState<Section | null>(null);

    /* ─── 홈 마운트 시 모든 user 섹션 공지 백그라운드 fetch ── */
    useEffect(() => {
        let cancelled = false;
        async function prefetchAll() {
            for (const sec of userSections) {
                if (cancelled) break;
                if (sec.keywords.length === 0) continue;
                try {
                    const notices = await uosAdapter.fetchByKeywords(
                        sec.keywords.map(k => k.text),
                    );
                    if (!cancelled) {
                        setNoticeCache(sec.id, notices);
                        updateNoticeCount(sec.id, notices.length);
                    }
                } catch {
                    // 개별 섹션 실패는 조용히 무시 (UX 영향 최소화)
                }
            }
        }
        prefetchAll();
        return () => { cancelled = true; };
        // userSections 자체가 바뀔 때(섹션 추가/삭제)만 재실행.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userSections.map(s => s.id).join(','), setNoticeCache, updateNoticeCount]);

    const deleteSection = useCallback(
        (id: string) => {
            const sec = sections_map[id];
            if (!sec || sec.kind === 'system') return; // 시스템 섹션 보호
            pushToTrash(sec);
            removeSection(id);
        },
        [sections_map, pushToTrash, removeSection],
    );

    const confirmDelete = useCallback(
        (sec: Section) => {
            Alert.alert(
                '섹션 삭제',
                `"${sec.title}" 섹션을 삭제할까요?\n휴지통에서 30일간 복구할 수 있어요.`,
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '삭제',
                        style: 'destructive',
                        onPress: () => {
                            haptic('warning');
                            deleteSection(sec.id);
                        },
                    },
                ],
            );
        },
        [deleteSection],
    );

    const handleRename = useCallback(
        (next: string) => {
            if (!renameTarget) return;
            renameSection(renameTarget.id, next);
            haptic('success');
            setRenameTarget(null);
        },
        [renameTarget, renameSection],
    );

    // user 섹션이 0이 되면 자동으로 편집 모드 해제.
    useEffect(() => {
        if (editMode && userSections.length === 0) setEditMode(false);
    }, [editMode, userSections.length, setEditMode]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () =>
                userSections.length > 0 ? (
                    <EditDoneButton
                        editMode={editMode}
                        onToggle={() => setEditMode(!editMode)}
                    />
                ) : null,
        });
    }, [navigation, editMode, userSections.length, setEditMode]);

    const onPressSection = useCallback(
        (s: Section) => {
            if (editMode) return;
            navigation.navigate('SectionDetail', { sectionId: s.id });
        },
        [editMode, navigation],
    );

    const onLongPressSection = useCallback(() => {
        if (!editMode) {
            haptic('medium');
            setEditMode(true);
        }
    }, [editMode, setEditMode]);

    // 시스템 섹션은 항상 최상단에 자리하며, 편집 모드와 무관하게 jiggle/drag/'-' 가
    // 절대 노출되지 않도록 ListHeaderComponent 슬롯에 분리해 렌더한다.
    const renderPinHeader = () =>
        pinSection ? (
            <View style={styles.pinHeader}>
                <SectionCard
                    section={pinSection}
                    pinnedCount={pinnedCount}
                    onPress={() => onPressSection(pinSection)}
                />
            </View>
        ) : null;

    // 일반(비편집) 모드에서 user 섹션 1개를 렌더하는 공통 핸들러.
    // unreadCount/previewSlot은 캐시된 notices에서 lastVisitedAt 기준으로 계산.
    const renderUserRow = (item: Section) => {
        const cached = noticeCache[item.id] ?? [];
        const lv = item.lastVisitedAt;
        const unreadNotices = lv === null
            ? []
            : cached.filter(
                n => !deletedIds.has(n.id) && new Date(n.publishedAt).getTime() > lv,
            );
        const unread = unreadNotices.length;

        // 최신 2개만 미리보기로 표시 (최신순 정렬 후 slice).
        const previews = [...unreadNotices]
            .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
            .slice(0, 2);

        return (
            <SectionCard
                section={item}
                totalNoticeCount={noticeCountCache[item.id]}
                unreadCount={unread}
                onPress={() => onPressSection(item)}
                onLongPress={onLongPressSection}
                onToggleNotify={() => toggleNotify(item.id)}
                onEditKeywords={() => openKeywordEdit(item.id)}
                onRename={() => setRenameTarget(item)}
                onDelete={() => confirmDelete(item)}
                previewSlot={
                    previews.length > 0 ? (
                        <UnreadPreview
                            notices={previews}
                            totalUnread={unread}
                            accent={item.accentColor}
                        />
                    ) : undefined
                }
            />
        );
    };

    if (userSections.length === 0) {
        return (
            <View style={styles.root}>
                <FlatList
                    data={[]}
                    keyExtractor={() => 'noop'}
                    renderItem={null as any}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={renderPinHeader}
                    ListFooterComponent={<EmptyState onAdd={openAdd} />}
                />
            </View>
        );
    }

    const renderAddSlot = () => <AddSectionSlot onPress={openAdd} />;

    return (
        <View style={styles.root}>
            {editMode ? (
                <DraggableFlatList<Section>
                    data={userSections}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    activationDistance={6}
                    ListHeaderComponent={renderPinHeader}
                    ListFooterComponent={renderAddSlot}
                    onDragBegin={() => haptic('light')}
                    onDragEnd={({ data }) => {
                        haptic('medium');
                        reorder(data.map(d => d.id));
                    }}
                    renderItem={(params: RenderItemParams<Section>) => {
                        const { item, drag, isActive, getIndex } = params;
                        const idx = getIndex() ?? 0;
                        return (
                            <ScaleDecorator>
                                <JiggleWrapper active={!isActive} index={idx}>
                                    <Pressable
                                        onLongPress={drag}
                                        delayLongPress={140}
                                    >
                                        <SectionCard
                                            section={item}
                                            editMode
                                            isDragActive={isActive}
                                            onDelete={() => {
                                                haptic('warning');
                                                deleteSection(item.id);
                                            }}
                                        />
                                    </Pressable>
                                </JiggleWrapper>
                            </ScaleDecorator>
                        );
                    }}
                />
            ) : (
                <FlatList
                    data={userSections}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={renderPinHeader}
                    ListFooterComponent={renderAddSlot}
                    renderItem={({ item }) => renderUserRow(item)}
                />
            )}

            <RenameSectionModal
                visible={!!renameTarget}
                initial={renameTarget?.title ?? ''}
                onClose={() => setRenameTarget(null)}
                onSubmit={handleRename}
            />
        </View>
    );
}

/* ──────────────────────────── Empty State ─────────────────────────── */

/* ──────────────────── UnreadPreview ───────────────────────── */

function timeAgoShort(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 1) return '방금';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
}

function UnreadPreview({
    notices,
    totalUnread,
    accent,
}: {
    notices: Notice[];
    totalUnread: number;
    accent: string;
}) {
    return (
        <View style={previewStyles.container}>
            <View style={[previewStyles.bar, { backgroundColor: accent + '55' }]} />
            <View style={previewStyles.list}>
                {notices.map(n => (
                    <View key={n.id} style={previewStyles.row}>
                        <Text
                            style={previewStyles.title}
                            numberOfLines={1}
                        >
                            {n.title}
                        </Text>
                        <Text style={previewStyles.time}>
                            {timeAgoShort(n.publishedAt)}
                        </Text>
                    </View>
                ))}
                {totalUnread > 2 && (
                    <Text style={[previewStyles.more, { color: accent }]}>
                        +{totalUnread - 2}개 더보기
                    </Text>
                )}
            </View>
        </View>
    );
}

const previewStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginTop: 0,
        marginHorizontal: 4,
        backgroundColor: colors.bgRaised,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    bar: {
        width: 3,
        borderBottomLeftRadius: 12,
    },
    list: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    title: {
        ...typography.caption,
        color: colors.textSecondary,
        flex: 1,
    },
    time: {
        ...typography.caption,
        color: colors.textMuted,
        fontSize: 11,
    },
    more: {
        ...typography.caption,
        fontWeight: '600',
        marginTop: 2,
    },
});

/* ──────────────────────────── Empty State ─────────────────────────── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
    const breath = useSharedValue(1);
    const glow = useSharedValue(0.5);

    useEffect(() => {
        breath.value = withRepeat(
            withSequence(
                withTiming(1.06, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
                withTiming(1.0, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
            ),
            -1,
            false,
        );
        glow.value = withRepeat(
            withSequence(
                withTiming(0.95, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
                withTiming(0.45, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
            ),
            -1,
            false,
        );
    }, [breath, glow]);

    const breathStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breath.value }],
    }));
    const glowStyle = useAnimatedStyle(() => ({
        opacity: glow.value,
    }));

    return (
        <View style={styles.empty}>
            <View style={styles.emptyOrb}>
                <Animated.View style={[styles.glowRing, glowStyle]} />
                <Animated.View style={breathStyle}>
                    <PressableScale
                        onPress={onAdd}
                        hapticKind="medium"
                        scaleTo={0.92}
                        style={styles.emptyBtn}
                    >
                        <Ionicons
                            name="add"
                            size={36}
                            color={colors.textPrimary}
                        />
                    </PressableScale>
                </Animated.View>
            </View>
            <Text style={styles.emptyText}>관심 있는 키워드를 추가해 보세요</Text>
            <Text style={styles.emptyHint}>
                장학금 · 인턴 · AI — 무엇이든 좋아요
            </Text>
        </View>
    );
}

/* ───────────────────────────── styles ─────────────────────────────── */

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    list: { padding: spacing.lg, paddingBottom: 140 },

    // 시스템 섹션 — user 영역과 시각 분리. 아래에 얇은 디바이더.
    pinHeader: {
        marginBottom: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },

    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.lg,
        marginTop: spacing.xxxl,
    },
    emptyOrb: {
        width: 152,
        height: 152,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    glowRing: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 76,
        borderWidth: 1,
        borderColor: colors.accent + '55',
        shadowColor: colors.accent,
        shadowOpacity: 0.6,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 0 },
    },
    emptyBtn: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: colors.bgRaised,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
    },
    emptyText: {
        ...typography.h2,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    emptyHint: {
        ...typography.bodySm,
        color: colors.textMuted,
        textAlign: 'center',
    },
});
