import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import DraggableFlatList, {
    ScaleDecorator,
    type RenderItemParams,
} from 'react-native-draggable-flatlist';
import Ionicons from '@expo/vector-icons/Ionicons';

import { haptic } from '../ui/feedback/haptics';
import { colors, spacing } from '../ui/theme';
import { EditDoneButton } from '../features/home/EditDoneButton';
import { HotNoticeCard } from '../features/home/HotNoticeCard';
import { EmptyState } from '../features/home/EmptyState';
import { useHomePrefetch } from '../features/home/hooks/useHomePrefetch';
import { AppMenuSheet, type AppMenuSheetHandle } from '../features/home/sheets/AppMenuSheet';
import { JiggleWrapper } from '../features/sections/components/JiggleWrapper';
import { SectionCard } from '../features/sections/components/SectionCard';
import { HomeSectionRow } from '../features/sections/components/HomeSectionRow';
import { AddSectionSlot } from '../features/sections/components/AddSectionSlot';
import { RenameSectionModal } from '../features/sections/components/RenameSectionModal';
import { useSectionSort } from '../features/sections/hooks/useSectionSort';
import { useSwipeRowManager } from '../features/notices/hooks/useSwipeRowManager';
import type { SwipeableSectionRowHandle } from '../features/sections/components/SwipeableSectionRow';
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

    const sectionsMap = useSectionsStore(s => s.sections);
    const reorder = useSectionsStore(s => s.reorderSections);
    const removeSection = useSectionsStore(s => s.removeSection);
    const renameSection = useSectionsStore(s => s.renameSection);
    const toggleNotify = useSectionsStore(s => s.toggleNotify);
    const openKeywordEdit = useUIStore(s => s.openKeywordEdit);
    const pushToTrash = useTrashStore(s => s.pushSection);
    const deletedIds = useDeletedNoticeIdSet();
    const noticeCache = useNoticeCacheStore(s => s.cache);

    const [renameTarget, setRenameTarget] = useState<Section | null>(null);

    const appMenuRef = useRef<AppMenuSheetHandle>(null);

    const { hotNotice, refresh, isRefreshing } = useHomePrefetch(userSections);
    const swipe = useSwipeRowManager<SwipeableSectionRowHandle>();
    const displaySections = useSectionSort(userSections, editMode, noticeCache, deletedIds);

    const deleteSection = useCallback(
        (id: string) => {
            const sec = sectionsMap[id];
            if (!sec || sec.kind === 'system') return; // 시스템 섹션 보호
            pushToTrash(sec);
            removeSection(id);
        },
        [sectionsMap, pushToTrash, removeSection],
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
            headerLeft: () => (
                <Pressable
                    onPress={() => appMenuRef.current?.present()}
                    hitSlop={12}
                    style={({ pressed }) => [
                        headerBtnStyles.btn,
                        pressed && headerBtnStyles.pressed,
                    ]}
                >
                    <Ionicons name="apps-outline" size={22} color={colors.textPrimary} />
                </Pressable>
            ),
            headerRight: () => (
                <View style={headerBtnStyles.rightRow}>
                    <Pressable
                        onPress={() => navigation.navigate('Trash')}
                        hitSlop={12}
                        style={({ pressed }) => [
                            headerBtnStyles.btn,
                            pressed && headerBtnStyles.pressed,
                        ]}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                    </Pressable>
                    {userSections.length > 0 && (
                        <EditDoneButton
                            editMode={editMode}
                            onToggle={() => setEditMode(!editMode)}
                        />
                    )}
                </View>
            ),
        });
    }, [navigation, editMode, userSections.length, setEditMode]);

    const onPressSection = useCallback(
        (s: Section) => {
            // 편집 모드에서 카드 본문 탭 = "편집 종료" (iOS Springboard 패턴).
            // 카드의 '−' 삭제 버튼은 자식 Pressable 이라 이 핸들러로 새지 않음.
            if (editMode) {
                setEditMode(false);
                return;
            }
            navigation.navigate('SectionDetail', { sectionId: s.id });
        },
        [editMode, navigation, setEditMode],
    );

    const onLongPressSection = useCallback(() => {
        if (!editMode) {
            haptic('medium');
            setEditMode(true);
        }
    }, [editMode, setEditMode]);

    // 시스템 섹션은 항상 최상단에 자리하며, 편집 모드와 무관하게 jiggle/drag/'-' 가
    // 절대 노출되지 않도록 ListHeaderComponent 슬롯에 분리해 렌더한다.
    const renderPinHeader = () => (
        <>
            {hotNotice && (
                <HotNoticeCard
                    notice={hotNotice}
                    onPress={() => navigation.navigate('HotNotices')}
                />
            )}
            {pinSection && (
                <View style={styles.pinHeader}>
                    <SectionCard
                        section={pinSection}
                        pinnedCount={pinnedCount}
                        onPress={() => onPressSection(pinSection)}
                    />
                </View>
            )}
        </>
    );

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
        <View
            style={styles.root}
            onTouchStart={() => {
                // 빈 공간 또는 카드 외부 탭 시 열린 row 닫기
                if (swipe.isAnyOpen()) swipe.closeOpenRow();
            }}
        >
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
                                    {/*
                                     * 편집 모드 카드 wrapper:
                                     *   - onLongPress(140ms) → drag 시작
                                     *   - onPress (단순 탭) → 편집 모드 종료
                                     *   카드 내부 '−' 삭제 버튼은 자식 Pressable 이라
                                     *   이 onPress 로 새지 않음 (RN Pressable 중첩 규칙)
                                     */}
                                    <Pressable
                                        onLongPress={drag}
                                        delayLongPress={140}
                                        onPress={() => setEditMode(false)}
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
                    data={displaySections}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={renderPinHeader}
                    ListFooterComponent={renderAddSlot}
                    onScrollBeginDrag={swipe.closeOpenRow}
                    refreshControl={
                        // 편집 모드에서는 P2R 미제공 (드래그-리오더와 혼동 방지).
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={refresh}
                            tintColor={colors.accent}
                        />
                    }
                    renderItem={({ item }) => (
                        <HomeSectionRow
                            section={item}
                            swipe={swipe}
                            onPress={() => onPressSection(item)}
                            onLongPress={onLongPressSection}
                            onDelete={() => confirmDelete(item)}
                            onToggleNotify={() => toggleNotify(item.id)}
                            onEditKeywords={() => openKeywordEdit(item.id)}
                            onRename={() => setRenameTarget(item)}
                        />
                    )}
                />
            )}

            <RenameSectionModal
                visible={!!renameTarget}
                initial={renameTarget?.title ?? ''}
                onClose={() => setRenameTarget(null)}
                onSubmit={handleRename}
            />

            <AppMenuSheet
                ref={appMenuRef}
                onTrash={() => navigation.navigate('Trash')}
            />
        </View>
    );
}

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
});

const headerBtnStyles = StyleSheet.create({
    rightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    btn: {
        padding: spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: { opacity: 0.5 },
});
