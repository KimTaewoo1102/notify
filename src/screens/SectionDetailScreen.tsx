import React, { useMemo, useRef, useState } from 'react';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

import ScreenBackground from '../components/layout/ScreenBackground';
import NoticeListItem from '../components/notice/NoticeListItem';
import SwipeableNoticeRow from '../components/notice/SwipeableNoticeRow';
import { ScrollRefProvider } from '../contexts/ScrollRefContext';
import { useNotices } from '../hooks/useNotices';
import { useSectionsStore } from '../store/sectionsStore';
import { colors, radius, spacing, typography } from '../constants/theme';
import { haptics } from '../utils/haptics';
import type { RootStackScreenProps } from '../navigation/types';
import type { Notice } from '../types/notice';

export default function SectionDetailScreen({
    route,
    navigation,
}: RootStackScreenProps<'SectionDetail'>) {
    const { sectionId } = route.params;

    const section = useSectionsStore(s =>
        s.sections.find(x => x.id === sectionId),
    );
    const keywords = useSectionsStore(s => s.keywords);
    const toggleAlarm = useSectionsStore(s => s.toggleAlarm);
    const togglePin = useSectionsStore(s => s.togglePin);

    const { today, keyword, hot, pinned, dismiss } = useNotices({
        universityId: 'uos',
        keywords,
    });

    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const scrollRef = useRef<ScrollView>(null);

    const list = useMemo<Notice[]>(() => {
        if (!section) return [];
        // 시스템 '고정' 섹션은 사용자 핀 공지 합집합을 데이터로 사용
        if (section.isSystem === 'pinned-default') return pinned;
        switch (section.feed) {
            case 'today':
                return today;
            case 'hot':
                return hot;
            case 'keyword':
                return keyword;
            default:
                return [];
        }
    }, [section, today, hot, keyword, pinned]);

    const subtitle = useMemo(() => {
        if (!section) return '';
        if (section.isSystem === 'pinned-default') {
            return list.length === 0
                ? '공지를 길게 눌러 고정해보세요'
                : `고정된 공지 · ${list.length}건`;
        }
        if (section.feed === 'keyword') {
            return keywords.length === 0
                ? '키워드를 등록하면 맞춤 공지가 나타나요'
                : `"${keywords.join('", "')}" · ${list.length}건`;
        }
        return section.feed === 'hot'
            ? `조회수 급상승 · ${list.length}건`
            : `오늘 들어온 공지 · ${list.length}건`;
    }, [section, keywords, list.length]);

    if (!section) {
        return (
            <View style={styles.root}>
                <ScreenBackground />
                <SafeAreaView style={styles.safe}>
                    <Text style={styles.notFound}>섹션을 찾을 수 없어요.</Text>
                </SafeAreaView>
            </View>
        );
    }

    const handleClose = () => {
        haptics.tap();
        navigation.goBack();
    };

    return (
        <View style={styles.root}>
            <ScreenBackground />

            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <Pressable
                        onPress={handleClose}
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.iconPressed,
                        ]}
                        hitSlop={10}
                    >
                        <BlurView
                            intensity={40}
                            tint="dark"
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.iconFill} />
                        <Ionicons
                            name="chevron-back"
                            size={22}
                            color={colors.textPrimary}
                        />
                    </Pressable>

                    <View style={styles.titleBlock}>
                        <View style={styles.titleRow}>
                            <Ionicons
                                name={section.icon as any}
                                size={16}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.title}>{section.title}</Text>
                        </View>
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    </View>

                    {section.isSystem !== 'pinned-default' && (
                        <Pressable
                            onPress={() => {
                                haptics.tap();
                                togglePin(section.id);
                            }}
                            style={({ pressed }) => [
                                styles.iconButton,
                                pressed && styles.iconPressed,
                            ]}
                            hitSlop={10}
                        >
                            <BlurView
                                intensity={40}
                                tint="dark"
                                style={StyleSheet.absoluteFillObject}
                            />
                            <View style={styles.iconFill} />
                            <Ionicons
                                name={section.pinned ? 'pin' : 'pin-outline'}
                                size={18}
                                color={section.pinned ? '#FFB570' : colors.textPrimary}
                            />
                        </Pressable>
                    )}

                    <Pressable
                        onPress={() => {
                            haptics.tap();
                            toggleAlarm(section.id);
                        }}
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.iconPressed,
                        ]}
                        hitSlop={10}
                    >
                        <BlurView
                            intensity={40}
                            tint="dark"
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.iconFill} />
                        <Ionicons
                            name={
                                section.alarmOn
                                    ? 'notifications'
                                    : 'notifications-outline'
                            }
                            size={18}
                            color={
                                section.alarmOn ? '#7C5CFF' : colors.textPrimary
                            }
                        />
                    </Pressable>
                </View>

                <ScrollRefProvider value={scrollRef}>
                    <ScrollView
                        ref={scrollRef}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        directionalLockEnabled
                    >
                        {list.length === 0 ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>
                                    표시할 공지가 없어요.
                                </Text>
                            </View>
                        ) : (
                            list.map(notice => (
                                <Animated.View
                                    key={notice.id}
                                    entering={FadeIn.duration(180)}
                                    exiting={FadeOut.duration(160)}
                                    layout={Layout.springify().damping(20)}
                                >
                                    <SwipeableNoticeRow
                                        rowId={notice.id}
                                        activeRowId={activeRowId}
                                        onActivate={setActiveRowId}
                                        onDelete={() => dismiss(notice.id)}
                                    >
                                        <NoticeListItem
                                            notice={notice}
                                            showViews={section.showViews}
                                        />
                                    </SwipeableNoticeRow>
                                </Animated.View>
                            ))
                        )}
                    </ScrollView>
                </ScrollRefProvider>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgTop },
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,
        gap: spacing.sm,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorder,
    },
    iconFill: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.glassFill,
    },
    iconPressed: { opacity: 0.7 },
    titleBlock: { flex: 1, marginHorizontal: spacing.sm },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { ...typography.title, color: colors.textPrimary, fontSize: 18 },
    subtitle: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl * 2,
    },
    empty: { paddingVertical: spacing.xxl * 2, alignItems: 'center' },
    emptyText: { ...typography.caption, color: colors.textTertiary },
    notFound: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xxl,
    },
});
