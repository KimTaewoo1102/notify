import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../common/GlassCard';
import NoticePreviewRow from './NoticePreviewRow';
import { colors, spacing, typography } from '../../constants/theme';
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
}

/**
 * 홈 화면의 고정 섹션 미리보기.
 * - 헤더 탭 → 디테일 진입
 * - 본문에 미리보기 N개만 노출, 나머지는 "+N"으로 표기
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
}: Props) {
    const previews = notices.slice(0, previewCount);
    const remaining = Math.max(0, notices.length - previewCount);

    const handleEnter = () => {
        haptics.select();
        onPress();
    };

    return (
        <GlassCard radiusSize="lg" variant="strong" style={styles.card}>
            {/* 헤더(탭하면 디테일 진입) */}
            <Pressable
                onPress={handleEnter}
                style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
            >
                <View style={styles.iconWrap}>
                    <Ionicons name={icon} size={14} color={colors.textPrimary} />
                </View>
                <View style={styles.titleBlock}>
                    <Text style={styles.title}>{title}</Text>
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

            {/* 미리보기 본문 */}
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
    );
}

const styles = StyleSheet.create({
    card: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
    },
    headerPressed: { opacity: 0.75 },
    iconWrap: {
        width: 28, height: 28,
        borderRadius: 14,
        marginRight: spacing.sm,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    titleBlock: { flex: 1 },
    title: { ...typography.title, color: colors.textPrimary, fontSize: 15 },
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
});
