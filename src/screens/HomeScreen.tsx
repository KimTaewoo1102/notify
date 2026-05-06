import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
    type RenderItemParams,
    ScaleDecorator,
} from 'react-native-draggable-flatlist';
import BottomSheet from '@gorhom/bottom-sheet';

import ScreenBackground from '../components/layout/ScreenBackground';
import AppHeader from '../components/layout/AppHeader';
import SectionCard from '../components/notice/SectionCard';
import MenuSheet from '../components/sheets/MenuSheet';
import AddSectionSheet from '../components/sheets/AddSectionSheet';
import KeywordEditSheet from '../components/sheets/KeywordEditSheet';

import { useNotices } from '../hooks/useNotices';
import { getUniversityAdapter } from '../services/universities';
import { colors, spacing, typography } from '../constants/theme';
import { haptics } from '../utils/haptics';
import {
    selectActiveSections,
    useSectionsStore,
    type Section,
} from '../store/sectionsStore';
import type { Notice, NoticeFeed } from '../types/notice';
import type { RootStackScreenProps } from '../navigation/types';

const buildSubtitle = (
    feed: NoticeFeed,
    count: number,
    keywords: string[],
) => {
    if (feed === 'keyword') {
        return keywords.length === 0
            ? '키워드를 등록하면 맞춤 공지가 나타나요'
            : `"${keywords.join('", "')}" · ${count}건`;
    }
    if (feed === 'hot') return `조회수 급상승 · ${count}건`;
    return `오늘 들어온 공지 · ${count}건`;
};

export default function HomeScreen({ navigation }: RootStackScreenProps<'Home'>) {
    const [universityId] = useState('uos');
    const adapter = useMemo(() => getUniversityAdapter(universityId), [universityId]);

    const sections = useSectionsStore(selectActiveSections);
    const keywords = useSectionsStore(s => s.keywords);
    const reorder = useSectionsStore(s => s.reorder);
    const moveToTrash = useSectionsStore(s => s.moveToTrash);
    const allSections = useSectionsStore(s => s.sections);

    const { today, keyword, hot, loading } = useNotices({
        universityId,
        keywords,
    });

    const [jiggleMode, setJiggleMode] = useState(false);

    const menuRef = useRef<BottomSheet>(null);
    const addRef = useRef<BottomSheet>(null);
    const keywordRef = useRef<BottomSheet>(null);

    const noticesByFeed: Record<NoticeFeed, Notice[]> = {
        keyword,
        hot,
        today,
    };

    const enterJiggle = useCallback(() => {
        setJiggleMode(true);
    }, []);

    const exitJiggle = useCallback(() => {
        if (!jiggleMode) return;
        haptics.tap();
        setJiggleMode(false);
    }, [jiggleMode]);

    const handleReorder = useCallback(
        (next: Section[]) => {
            haptics.tap();
            // 휴지통에 있는 섹션은 보존하고, 활성 섹션 순서만 교체.
            const trashed = allSections.filter(s => !!s.trashedAt);
            reorder([...next, ...trashed]);
        },
        [allSections, reorder],
    );

    const renderItem = useCallback(
        ({ item, drag, isActive }: RenderItemParams<Section>) => {
            const list = noticesByFeed[item.feed] ?? [];
            return (
                <ScaleDecorator activeScale={1.04}>
                    <View style={styles.sectionWrap}>
                        <SectionCard
                            title={item.title}
                            subtitle={buildSubtitle(item.feed, list.length, keywords)}
                            icon={item.icon as any}
                            notices={list}
                            showViews={item.showViews}
                            alarmOn={item.alarmOn}
                            pinned={item.pinned}
                            jiggling={jiggleMode && !isActive}
                            onTrash={() => moveToTrash(item.id)}
                            onLongPress={() => {
                                enterJiggle();
                                drag();
                            }}
                            onPress={() =>
                                navigation.navigate('SectionDetail', {
                                    sectionId: item.id,
                                })
                            }
                        />
                    </View>
                </ScaleDecorator>
            );
        },
        [noticesByFeed, keywords, jiggleMode, enterJiggle, moveToTrash, navigation],
    );

    return (
        <View style={styles.root}>
            <ScreenBackground />

            <SafeAreaView style={styles.safe}>
                <AppHeader
                    universityName={adapter.name}
                    onMenuPress={() => menuRef.current?.snapToIndex(0)}
                    onBannerItemPress={sectionId =>
                        navigation.navigate('SectionDetail', { sectionId })
                    }
                />

                {jiggleMode && (
                    <View style={styles.jiggleBar}>
                        <Text style={styles.jiggleText}>
                            섹션을 끌어 순서를 바꾸거나 ⊖ 로 휴지통에 보내세요
                        </Text>
                        <Pressable
                            onPress={exitJiggle}
                            style={({ pressed }) => [
                                styles.doneBtn,
                                pressed && { opacity: 0.85 },
                            ]}
                        >
                            <Text style={styles.doneLabel}>완료</Text>
                        </Pressable>
                    </View>
                )}

                {loading && today.length === 0 ? (
                    <View style={styles.loader}>
                        <ActivityIndicator color={colors.textSecondary} />
                    </View>
                ) : (
                    <DraggableFlatList<Section>
                        data={sections}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        onDragEnd={({ data }) => handleReorder(data)}
                        contentContainerStyle={styles.listContent}
                        activationDistance={jiggleMode ? 5 : 20}
                        ListFooterComponent={
                            <Pressable
                                onPress={() => {
                                    haptics.tap();
                                    addRef.current?.snapToIndex(0);
                                }}
                                style={({ pressed }) => [
                                    styles.addCard,
                                    pressed && styles.addCardPressed,
                                ]}
                            >
                                <Ionicons name="add" size={20} color={colors.textPrimary} />
                                <Text style={styles.addLabel}>섹션 추가</Text>
                            </Pressable>
                        }
                    />
                )}
            </SafeAreaView>

            <MenuSheet
                ref={menuRef}
                items={[
                    {
                        icon: 'log-in-outline',
                        label: '로그인',
                        onPress: () => menuRef.current?.close(),
                    },
                    {
                        icon: 'school-outline',
                        label: '학교 설정',
                        onPress: () => menuRef.current?.close(),
                    },
                    {
                        icon: 'key-outline',
                        label: '내 키워드 설정',
                        onPress: () => {
                            menuRef.current?.close();
                            setTimeout(() => keywordRef.current?.snapToIndex(0), 220);
                        },
                    },
                    {
                        icon: 'trash-outline',
                        label: '휴지통',
                        onPress: () => {
                            menuRef.current?.close();
                            setTimeout(() => navigation.navigate('Trash'), 220);
                        },
                    },
                ]}
            />
            <AddSectionSheet ref={addRef} />
            <KeywordEditSheet ref={keywordRef} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgTop },
    safe: { flex: 1 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxl * 2,
        gap: spacing.lg,
    },
    sectionWrap: {
        marginBottom: spacing.lg,
    },
    jiggleBar: {
        marginHorizontal: spacing.xl,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: 'rgba(124,92,255,0.10)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(124,92,255,0.32)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    jiggleText: {
        ...typography.caption,
        color: colors.textSecondary,
        flex: 1,
        fontSize: 12,
    },
    doneBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#FFFFFF',
    },
    doneLabel: { ...typography.label, color: '#0A0A0C', fontSize: 12 },
    addCard: {
        marginTop: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 18,
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
        backgroundColor: 'rgba(255,255,255,0.025)',
    },
    addCardPressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
    addLabel: { ...typography.label, color: colors.textPrimary, fontSize: 13 },
});
