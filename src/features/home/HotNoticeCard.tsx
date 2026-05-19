import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, shadows, spacing, typography } from '../../ui/theme';
import { timeAgo } from '../../utils/time';
import { formatViewCount } from '../../utils/format';
import type { Notice } from '../../types/domain';

interface Props {
    notice: Notice;
    onPress: () => void;
}

/**
 * 홈 상단 HOT 공지 카드 (1건).
 * 탭하면 HOT 공지 전체 목록 화면으로 이동.
 */
export function HotNoticeCard({ notice, onPress }: Props) {
    const viewCount = notice.viewCount ?? 0;

    return (
        <View style={styles.shadowShell}>
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
            <View style={styles.topRow}>
                {/* Premium 톤 — 빨강 dot + 'Hot' 텍스트 (이전 강렬한 HOT 뱃지 대체) */}
                <View style={styles.hotIndicator}>
                    <View style={styles.hotDot} />
                    <Text style={styles.hotLabel}>Hot</Text>
                </View>
                <Text style={styles.seeAll}>전체 보기</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.textDisabled} />
            </View>
            <Text style={styles.title} numberOfLines={2}>
                {notice.title}
            </Text>
            <View style={styles.bottomRow}>
                <Text style={styles.dept} numberOfLines={1}>
                    {notice.department}
                </Text>
                <View style={styles.metaRight}>
                    {viewCount > 0 && (
                        <View style={styles.viewRow}>
                            <Ionicons name="eye-outline" size={11} color={colors.textMuted} />
                            <Text style={styles.viewText}>{formatViewCount(viewCount)}</Text>
                        </View>
                    )}
                    <Text style={styles.time}>{timeAgo(notice.publishedAt)}</Text>
                </View>
            </View>
        </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    shadowShell: {
        borderRadius: radius.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    card: {
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        borderTopColor: colors.edgeHighlightStrong,
        padding: spacing.md,
        gap: spacing.xs,
        overflow: 'hidden',
    },
    glassOverlay: {
        backgroundColor: 'rgba(18, 18, 30, 0.62)',
    },
    pressed: { opacity: 0.75 },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    hotIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    hotDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.danger,
    },
    hotLabel: {
        ...typography.caption,
        fontSize: 11,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    seeAll: {
        ...typography.caption,
        color: colors.textMuted,
        flex: 1,
    },
    title: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.xs,
    },
    dept: {
        ...typography.caption,
        color: colors.textMuted,
        flex: 1,
    },
    metaRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    viewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    viewText: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.textMuted,
    },
    time: {
        ...typography.caption,
        color: colors.textMuted,
    },
});
