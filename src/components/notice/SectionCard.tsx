import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import GlassCard from '../common/GlassCard';
import GlowBorder from '../common/GlowBorder';
import NoticePreviewRow from './NoticePreviewRow';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import type { Notice } from '../../types/notice';

interface Props {
    title: string;
    subtitle?: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    notices: Notice[];
    showViews?: boolean;
    onPress: () => void;
    emptyText?: string;
    previewCount?: number;
    /** 알림 ON 시 글로우 보더 표시 */
    alarmOn?: boolean;
    /** Pinned 표시 (작은 핀 아이콘) */
    pinned?: boolean;
    /** Jiggle (편집 모드) 진입 여부 */
    jiggling?: boolean;
    /** 편집 모드에서 좌상단 삭제 버튼 → 휴지통 */
    onTrash?: () => void;
    /** 길게 눌렀을 때 편집 모드 진입 */
    onLongPress?: () => void;
}

/**
 * 홈 화면의 고정 섹션 미리보기.
 * - 헤더 탭 → 디테일 진입
 * - 길게 누르기 → Jiggle 편집 모드 (Drag 정렬, 휴지통 이동)
 * - alarmOn → Skia glow 보더가 호흡
 */
export default function SectionCard({
    title,
    subtitle,
    icon,
    notices,
    showViews,
    onPress,
    emptyText = '표시할 공지가 없어요.',
    previewCount = 2,
    alarmOn = false,
    pinned = false,
    jiggling = false,
    onTrash,
    onLongPress,
}: Props) {
    const previews = notices.slice(0, previewCount);
    const remaining = Math.max(0, notices.length - previewCount);

    const rotate = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (jiggling) {
            // 살짝 스케일 부풀고 좌우로 흔들리는 모션
            scale.value = withSpring(1.015, { damping: 14, stiffness: 220 });
            rotate.value = withDelay(
                Math.random() * 80,
                withRepeat(
                    withSequence(
                        withTiming(-0.7, { duration: 110, easing: Easing.inOut(Easing.quad) }),
                        withTiming(0.7, { duration: 110, easing: Easing.inOut(Easing.quad) }),
                    ),
                    -1,
                    true,
                ),
            );
        } else {
            cancelAnimation(rotate);
            cancelAnimation(scale);
            rotate.value = withTiming(0, { duration: 160 });
            scale.value = withSpring(1, { damping: 20, stiffness: 200 });
        }
        return () => {
            cancelAnimation(rotate);
            cancelAnimation(scale);
        };
    }, [jiggling, rotate, scale]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotate.value}deg` },
            { scale: scale.value },
        ],
    }));

    const handleEnter = () => {
        if (jiggling) return;
        haptics.select();
        onPress();
    };

    return (
        <Animated.View style={[styles.outer, containerStyle]}>
            <GlassCard radiusSize="lg" variant="strong" style={styles.card}>
                <Pressable
                    onPress={handleEnter}
                    onLongPress={() => {
                        haptics.warn();
                        onLongPress?.();
                    }}
                    delayLongPress={350}
                    style={({ pressed }) => [
                        styles.header,
                        pressed && !jiggling && styles.headerPressed,
                    ]}
                >
                    <View style={styles.iconWrap}>
                        <Ionicons name={icon} size={14} color={colors.textPrimary} />
                    </View>
                    <View style={styles.titleBlock}>
                        <View style={styles.titleRow}>
                            {pinned && (
                                <Ionicons
                                    name="pin"
                                    size={11}
                                    color="#FFB570"
                                    style={{ marginRight: 4 }}
                                />
                            )}
                            <Text style={styles.title}>{title}</Text>
                            {alarmOn && (
                                <View style={styles.alarmDot}>
                                    <Ionicons
                                        name="notifications"
                                        size={9}
                                        color="#0A0A0C"
                                    />
                                </View>
                            )}
                        </View>
                        {subtitle && (
                            <Text style={styles.subtitle} numberOfLines={1}>
                                {subtitle}
                            </Text>
                        )}
                    </View>
                    <View style={styles.cta}>
                        {remaining > 0 && (
                            <Text style={styles.ctaCount}>+{remaining}</Text>
                        )}
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.textSecondary}
                        />
                    </View>
                </Pressable>

                <View style={styles.divider} />

                <View style={styles.body}>
                    {previews.length === 0 ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>{emptyText}</Text>
                        </View>
                    ) : (
                        previews.map((notice, idx) => (
                            <View key={notice.id}>
                                {idx > 0 && <View style={styles.rowDivider} />}
                                <NoticePreviewRow notice={notice} showViews={showViews} />
                            </View>
                        ))
                    )}
                </View>
            </GlassCard>

            {/* 알림 ON 글로우 보더 — Reanimated borderColor + shadow 호흡 */}
            <GlowBorder radius={radius.lg} active={alarmOn} />

            {/* Jiggle 모드 좌상단 삭제 버튼 */}
            {jiggling && onTrash && (
                <Animated.View style={styles.trashBubble}>
                    <Pressable
                        hitSlop={10}
                        onPress={() => {
                            haptics.confirm();
                            onTrash();
                        }}
                        style={({ pressed }) => [
                            styles.trashBubbleInner,
                            pressed && { transform: [{ scale: 0.92 }] },
                        ]}
                    >
                        <Ionicons name="remove" size={18} color="#0A0A0C" />
                    </Pressable>
                </Animated.View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    outer: { position: 'relative', flex: 1 },
    card: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
    },
    headerPressed: { opacity: 0.75 },
    iconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    titleBlock: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    title: { ...typography.title, color: colors.textPrimary, fontSize: 15 },
    alarmDot: {
        marginLeft: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#7C5CFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 2,
        fontSize: 11,
    },
    cta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ctaCount: {
        ...typography.label,
        color: colors.textSecondary,
        fontSize: 12,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.04)',
        marginHorizontal: spacing.lg,
    },
    body: { flex: 1, justifyContent: 'space-evenly' },
    rowDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.04)',
        marginHorizontal: spacing.lg,
    },
    empty: { paddingVertical: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.caption, color: colors.textTertiary },
    trashBubble: {
        position: 'absolute',
        top: -10,
        left: -10,
        zIndex: 10,
    },
    trashBubbleInner: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
    },
});
