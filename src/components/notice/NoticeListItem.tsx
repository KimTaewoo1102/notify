import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategoryTag from '../common/CategoryTag';
import GlassCard from '../common/GlassCard';
import { colors, spacing, typography } from '../../constants/theme';
import { formatRelativeDate, formatViewCount } from '../../utils/format';
import { haptics } from '../../utils/haptics';
import type { Notice } from '../../types/notice';

interface Props {
    notice: Notice;
    /** HOT 섹션처럼 조회수를 강조해서 보여줄지 */
    showViews?: boolean;
}

/**
 * 카테고리 + 제목 + 메타. 탭하면 원본 링크 이동.
 * SwipeableNoticeRow가 이 컴포넌트를 감싼다.
 */
export default function NoticeListItem({ notice, showViews }: Props) {
    const handlePress = async () => {
        haptics.select();
        try {
            await Linking.openURL(notice.sourceUrl);
        } catch {
            /* 링크 열기 실패는 조용히 무시 — 추후 토스트로 대체 */
        }
    };

    return (
        <Pressable onPress={handlePress} android_ripple={{ color: 'rgba(255,255,255,0.05)' }}>
            {({ pressed }) => (
                <GlassCard radiusSize="lg" style={[styles.card, pressed && styles.cardPressed]}>
                    <View style={styles.inner}>
                        <View style={styles.topRow}>
                            <CategoryTag category={notice.category} />
                            <Text style={styles.time}>
                                {formatRelativeDate(notice.publishedAt)}
                            </Text>
                        </View>

                        <Text style={styles.title} numberOfLines={2}>
                            {notice.title}
                        </Text>

                        <View style={styles.bottomRow}>
                            <Text style={styles.dept} numberOfLines={1}>
                                {notice.department}
                            </Text>
                            <View style={styles.metaRight}>
                                {showViews && notice.viewCount != null && (
                                    <View style={styles.viewBadge}>
                                        <Ionicons name="flame" size={11} color="#FFB570" />
                                        <Text style={styles.viewText}>
                                            {formatViewCount(notice.viewCount)}
                                        </Text>
                                    </View>
                                )}
                                <Ionicons
                                    name="arrow-forward"
                                    size={14}
                                    color={colors.textTertiary}
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
    card: { marginBottom: 0 },
    cardPressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
    inner: { paddingVertical: 16, paddingHorizontal: 18 },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    time: { ...typography.caption, color: colors.textTertiary },
    title: {
        ...typography.title,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dept: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    metaRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    viewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: 'rgba(255,150,80,0.12)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,150,80,0.25)',
    },
    viewText: { ...typography.caption, color: '#FFCFA5', fontWeight: '600' },
});
