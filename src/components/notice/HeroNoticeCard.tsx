import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../common/GlassCard';
import CategoryTag from '../common/CategoryTag';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { formatRelativeDate } from '../../utils/format';
import { haptics } from '../../utils/haptics';
import type { Notice } from '../../types/notice';

interface Props {
    notice: Notice;
}

/**
 * "오늘의 한 건" — 화면에 떠 있는 메인 공지.
 * 큰 타이틀 + 카테고리만 단순하게.
 */
export default function HeroNoticeCard({ notice }: Props) {
    const handlePress = async () => {
        haptics.select();
        try {
            await Linking.openURL(notice.sourceUrl);
        } catch {
            /* noop */
        }
    };

    return (
        <Pressable onPress={handlePress}>
            {({ pressed }) => (
                <GlassCard
                    radiusSize="xl"
                    variant="strong"
                    style={[styles.card, pressed && styles.pressed]}
                >
                    {/* 카드 안쪽에 살짝 도는 색감 — 답답함 방지 */}
                    <LinearGradient
                        colors={['rgba(120,150,255,0.10)', 'rgba(120,150,255,0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                    />

                    <View style={styles.body}>
                        <View style={styles.topRow}>
                            <View style={styles.eyebrow}>
                                <Ionicons name="sparkles" size={12} color={colors.textSecondary} />
                                <Text style={styles.eyebrowText}>오늘의 공지</Text>
                            </View>
                            <Text style={styles.time}>
                                {formatRelativeDate(notice.publishedAt)}
                            </Text>
                        </View>

                        <Text style={styles.title} numberOfLines={3}>
                            {notice.title}
                        </Text>

                        <View style={styles.bottomRow}>
                            <CategoryTag category={notice.category} size="md" />
                            <View style={styles.cta}>
                                <Text style={styles.ctaText}>원문 보기</Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={14}
                                    color={colors.textPrimary}
                                />
                            </View>
                        </View>
                    </View>
                </GlassCard>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: spacing.xl,
        marginBottom: spacing.xl,
    },
    pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
    body: {
        padding: spacing.xl,
        minHeight: 200,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    eyebrow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eyebrowText: {
        ...typography.label,
        color: colors.textSecondary,
    },
    time: { ...typography.caption, color: colors.textTertiary },
    title: {
        ...typography.hero,
        color: colors.textPrimary,
        marginVertical: spacing.lg,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.glassFillStrong,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorder,
    },
    ctaText: {
        ...typography.label,
        color: colors.textPrimary,
        fontSize: 12,
    },
});
