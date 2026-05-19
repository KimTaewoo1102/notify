import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { haptic } from '../ui/feedback/haptics';
import { colors, spacing } from '../ui/theme';
import { HotNoticeCard } from '../features/home/HotNoticeCard';
import { EmptyState } from '../features/home/EmptyState';
import { useHomePrefetch } from '../features/home/hooks/useHomePrefetch';
import { AppDropdownMenu, type MenuAnchor } from '../features/home/components/AppDropdownMenu';
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
    const openAdd = useUIStore(s => s.openAddSection);

    const sectionsMap = useSectionsStore(s => s.sections);
    const removeSection = useSectionsStore(s => s.removeSection);
    const renameSection = useSectionsStore(s => s.renameSection);
    const toggleNotify = useSectionsStore(s => s.toggleNotify);
    const openKeywordEdit = useUIStore(s => s.openKeywordEdit);
    const pushToTrash = useTrashStore(s => s.pushSection);
    const deletedIds = useDeletedNoticeIdSet();
    const noticeCache = useNoticeCacheStore(s => s.cache);

    const [renameTarget, setRenameTarget] = useState<Section | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);

    const menuBtnRef = useRef<View>(null);

    const openMenu = useCallback(() => {
        menuBtnRef.current?.measureInWindow((x, y, w, h) => {
            setMenuAnchor({ x, y, width: w, height: h });
            setMenuVisible(true);
            haptic('light');
        });
    }, []);

    const onAddSchool = useCallback(() => {
        Alert.alert('학교 추가', '준비 중입니다.');
    }, []);

    const onChangeSchool = useCallback(() => {
        Alert.alert('학교 변경', '준비 중입니다.');
    }, []);

    const { hotNotice, refresh, isRefreshing } = useHomePrefetch(userSections);
    const swipe = useSwipeRowManager<SwipeableSectionRowHandle>();
    const displaySections = useSectionSort(userSections, noticeCache, deletedIds);

    const deleteSection = useCallback(
        (id: string) => {
            const sec = sectionsMap[id];
            if (!sec || sec.kind === 'system') return;
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

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <View ref={menuBtnRef} collapsable={false}>
                    <Pressable
                        onPress={openMenu}
                        hitSlop={12}
                        style={({ pressed }) => [
                            headerBtnStyles.btn,
                            pressed && headerBtnStyles.pressed,
                        ]}
                    >
                        <Ionicons name="apps-outline" size={22} color={colors.textPrimary} />
                    </Pressable>
                </View>
            ),
            headerRight: () => (
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
            ),
        });
    }, [navigation, openMenu]);

    const onPressSection = useCallback(
        (s: Section) => {
            navigation.navigate('SectionDetail', { sectionId: s.id });
        },
        [navigation],
    );

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
                <AppDropdownMenu
                    visible={menuVisible}
                    anchor={menuAnchor}
                    onClose={() => setMenuVisible(false)}
                    onAddSchool={onAddSchool}
                    onChangeSchool={onChangeSchool}
                />
            </View>
        );
    }

    const renderAddSlot = () => <AddSectionSlot onPress={openAdd} />;

    return (
        <View
            style={styles.root}
            onTouchStart={() => {
                if (swipe.isAnyOpen()) swipe.closeOpenRow();
            }}
        >
            <FlatList
                data={displaySections}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={renderPinHeader}
                ListFooterComponent={renderAddSlot}
                onScrollBeginDrag={swipe.closeOpenRow}
                refreshControl={
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
                        onDelete={() => confirmDelete(item)}
                        onToggleNotify={() => toggleNotify(item.id)}
                        onEditKeywords={() => openKeywordEdit(item.id)}
                        onRename={() => setRenameTarget(item)}
                    />
                )}
            />

            <RenameSectionModal
                visible={!!renameTarget}
                initial={renameTarget?.title ?? ''}
                onClose={() => setRenameTarget(null)}
                onSubmit={handleRename}
            />

            <AppDropdownMenu
                visible={menuVisible}
                anchor={menuAnchor}
                onClose={() => setMenuVisible(false)}
                onAddSchool={onAddSchool}
                onChangeSchool={onChangeSchool}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    list: { padding: spacing.lg, paddingBottom: 140 },

    pinHeader: {
        marginBottom: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
});

const headerBtnStyles = StyleSheet.create({
    btn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: { opacity: 0.5 },
});
