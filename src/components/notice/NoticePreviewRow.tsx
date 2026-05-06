import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategoryTag from '../common/CategoryTag';
import { colors, spacing, typography } from '../../constants/theme';
import { formatRelativeDate, formatViewCount } from '../../utils/format';
import { haptics } from '../../utils/haptics';
import type { Notice } from '../../types/notice';

interface Props {
    notice: Notice;
    showViews?: boolean;
}

/**
 * 섹션 카드 안에 들어가는 가벼운 행 미리보기.
 * GlassCard 위에 다시 GlassCard를 얹지 않도록 배경 없이 텍스트만.
 */
export default function NoticePreviewRow({ notice, showViews }: Props) {
    const handlePress = async () => {
        haptics.select();
        try {
            await Linking.openURL(notice.sourceUrl);
        } catch {
            /* noop */
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
            <View style={styles.head}>
                <CategoryTag category={notice.category} />
                <View style={styles.metaRight}>
                    {showViews && notice.viewCount != null && (
                        <View style={styles.viewBadge}>
                            <Ionicons name="flame" size={10} color="#FFB570" />
                            <Text style={styles.viewText}>
                                {formatViewCount(notice.viewCount)}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.time}>
                        {formatRelativeDate(notice.publishedAt)}
                    </Text>
                </View>
            </View>
            <Text style={styles.title} numberOfLines={2}>
                {notice.title}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        paddingVertical: 12,
        paddingHorizontal: spacing.lg,
    },
    pressed: { opacity: 0.7 },
    head: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    metaRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    time: { ...typography.caption, color: colors.textTertiary, fontSize: 11 },
    viewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: 'rgba(255,150,80,0.10)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,150,80,0.22)',
    },
    viewText: { color: '#FFCFA5', fontSize: 10, fontWeight: '600' },
    title: {
        ...typography.body,
        color: colors.textPrimary,
        fontSize: 14,
        lineHeight: 19,
    },
});
