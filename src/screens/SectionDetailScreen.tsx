import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
    Dimensions,
    Easing,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import ScreenBackground from '../components/layout/ScreenBackground';
import NoticeListItem from '../components/notice/NoticeListItem';
import SwipeableNoticeRow from '../components/notice/SwipeableNoticeRow';
import { ScrollRefProvider } from '../contexts/ScrollRefContext';
import { colors, radius, spacing, typography } from '../constants/theme';
import { haptics } from '../utils/haptics';
import type { Notice } from '../types/notice';

interface Props {
    title: string;
    subtitle?: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    notices: Notice[];
    showViews?: boolean;
    onDismiss: (id: string) => void;
    onClose: () => void;
}

/**
 * 우측에서 슬라이드 인 되는 섹션 디테일.
 * - 자체 ScrollView + 자체 ScrollRefProvider 보유 (스와이프 잠금이 디테일 스크롤에만 적용)
 * - Android 하드웨어 백 버튼으로도 닫힘
 */
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SectionDetailScreen({
    title,
    subtitle,
    icon,
    notices,
    showViews,
    onDismiss,
    onClose,
}: Props) {
    const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
    const scrollRef = useRef<ScrollView>(null);
    const [activeRowId, setActiveRowId] = useState<string | null>(null);

    // 슬라이드 인
    useEffect(() => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 13,
            tension: 75,
        }).start();
    }, [translateX]);

    const handleClose = () => {
        haptics.tap();
        Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 240,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => onClose());
    };

    // Android 하드웨어 백
    useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            handleClose();
            return true;
        });
        return () => sub.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Animated.View
            style={[styles.overlay, { transform: [{ translateX }] }]}
        >
            <ScreenBackground />

            <SafeAreaView style={styles.safe}>
                {/* 디테일 헤더: 백 + 타이틀 + 카운트 */}
                <View style={styles.header}>
                    <Pressable
                        onPress={handleClose}
                        style={({ pressed }) => [
                            styles.backButton,
                            pressed && styles.backButtonPressed,
                        ]}
                        hitSlop={10}
                    >
                        <BlurView
                            intensity={40}
                            tint="dark"
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.backFill} />
                        <Ionicons
                            name="chevron-back"
                            size={22}
                            color={colors.textPrimary}
                        />
                    </Pressable>

                    <View style={styles.titleBlock}>
                        <View style={styles.titleRow}>
                            <Ionicons
                                name={icon}
                                size={16}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.title}>{title}</Text>
                        </View>
                        {subtitle && (
                            <Text style={styles.subtitle} numberOfLines={1}>
                                {subtitle}
                            </Text>
                        )}
                    </View>

                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{notices.length}</Text>
                    </View>
                </View>

                <ScrollRefProvider value={scrollRef}>
                    <ScrollView
                        ref={scrollRef}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        directionalLockEnabled
                    >
                        {notices.length === 0 ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>
                                    표시할 공지가 없어요.
                                </Text>
                            </View>
                        ) : (
                            notices.map(notice => (
                                <SwipeableNoticeRow
                                    key={notice.id}
                                    rowId={notice.id}
                                    activeRowId={activeRowId}
                                    onActivate={setActiveRowId}
                                    onDelete={() => onDismiss(notice.id)}
                                >
                                    <NoticeListItem
                                        notice={notice}
                                        showViews={showViews}
                                    />
                                </SwipeableNoticeRow>
                            ))
                        )}
                    </ScrollView>
                </ScrollRefProvider>
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.bgTop,
    },
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,
        gap: spacing.md,
    },
    backButton: {
        width: 40, height: 40,
        borderRadius: radius.md,
        overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorder,
    },
    backFill: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glassFill },
    backButtonPressed: { opacity: 0.7 },
    titleBlock: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { ...typography.title, color: colors.textPrimary, fontSize: 18 },
    subtitle: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 2,
    },
    countBadge: {
        minWidth: 32,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.glassFillStrong,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
        alignItems: 'center',
    },
    countText: {
        ...typography.label,
        color: colors.textPrimary,
        fontSize: 12,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl * 2,
    },
    empty: { paddingVertical: spacing.xxl * 2, alignItems: 'center' },
    emptyText: { ...typography.caption, color: colors.textTertiary },
});
