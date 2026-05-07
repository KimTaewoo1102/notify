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
import { useNoticeCacheStore, useUnreadCount } from '../stores/noticeCacheStore';
import { useTrashStore } from '../stores/trashStore';
import { useUIStore } from '../stores/uiStore';
import type { Section } from '../types/domain';
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
    const reorder = useSectionsStore(s => s.reorderSections);
    const removeSection = useSectionsStore(s => s.removeSection);
    const renameSection = useSectionsStore(s => s.renameSection);
    const toggleNotify = useSectionsStore(s => s.toggleNotify);
    const openKeywordEdit = useUIStore(s => s.openKeywordEdit);
    const pushToTrash = useTrashStore(s => s.pushSection);
    const deletedIds = useDeletedNoticeIdSet();
    const noticeCache = useNoticeCacheStore(s => s.cache);

    const [renameTarget, setRenameTarget] = useState<Section | null>(null);

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
    // unreadCount는 캐시된 notices에서 lastVisitedAt 기준으로 계산.
    const renderUserRow = (item: Section) => {
        const cached = noticeCache[item.id] ?? [];
        const lv = item.lastVisitedAt;
        const unread = lv === null
            ? 0
            : cached.filter(
                n => !deletedIds.has(n.id) && new Date(n.publishedAt).getTime() > lv,
            ).length;
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
