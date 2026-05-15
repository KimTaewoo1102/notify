import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <View style={styles.topRow}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>HOT</Text>
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
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.bgRaised,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        padding: spacing.md,
        marginBottom: spacing.md,
        gap: spacing.xs,
        ...shadows.sm,
    },
    pressed: { opacity: 0.75 },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    badge: {
        backgroundColor: colors.danger,
        borderRadius: radius.sm,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.8,
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
