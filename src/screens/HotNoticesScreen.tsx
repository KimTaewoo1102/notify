import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, shadows, spacing, typography } from '../ui/theme';
import { uosAdapter } from '../services/universities/uos';
import { timeAgo } from '../utils/time';
import { formatViewCount } from '../utils/format';
import { openExternalUrl } from '../utils/openExternal';
import { CATEGORY_LABEL } from '../constants/categories';
import type { Notice } from '../types/domain';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'HotNotices'>;

export default function HotNoticesScreen({ navigation }: Props) {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        navigation.setOptions({ title: 'HOT 공지' });
        uosAdapter.fetchHot().then(data => {
            setNotices(data);
            setLoading(false);
        });
    }, [navigation]);

    // 카드 탭 = 인앱 브라우저 (expo-web-browser, iOS SFSafariViewController /
    // Android Custom Tabs). Premium 톤 — 탭 자체엔 햅틱 없음.
    const openUrl = (url: string) => {
        openExternalUrl(url);
    };

    return (
        <View style={styles.root}>
            <ScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerRow}>
                    <View style={styles.hotBadge}>
                        <Text style={styles.hotBadgeText}>HOT</Text>
                    </View>
                    <Text style={styles.headerDesc}>조회수 높은 최신 공지</Text>
                </View>

                {loading ? (
                    <ActivityIndicator
                        color={colors.textMuted}
                        style={{ marginTop: spacing.xl }}
                    />
                ) : (
                    notices.map((n, idx) => (
                        <View key={n.id} style={styles.shadowShell}>
                        <Pressable
                            onPress={() => openUrl(n.sourceUrl)}
                            style={({ pressed }) => [
                                styles.card,
                                pressed && styles.cardPressed,
                            ]}
                        >
                            <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
                            <View style={styles.rankBadge}>
                                <Text
                                    style={[
                                        styles.rankText,
                                        idx === 0 && styles.rankTextTop,
                                    ]}
                                >
                                    {idx + 1}
                                </Text>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.cardMeta}>
                                    <View style={styles.categoryChip}>
                                        <Text style={styles.categoryText}>
                                            {CATEGORY_LABEL[n.category] ?? n.category}
                                        </Text>
                                    </View>
                                    <Text style={styles.metaTime}>
                                        {timeAgo(n.publishedAt)}
                                    </Text>
                                </View>
                                <Text style={styles.cardTitle} numberOfLines={2}>
                                    {n.title}
                                </Text>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.department} numberOfLines={1}>
                                        {n.department}
                                    </Text>
                                    {(n.viewCount ?? 0) > 0 && (
                                        <View style={styles.viewRow}>
                                            <Ionicons
                                                name="eye-outline"
                                                size={12}
                                                color={colors.textMuted}
                                            />
                                            <Text style={styles.viewCount}>
                                                {formatViewCount(n.viewCount!)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={colors.textDisabled}
                                style={styles.chevron}
                            />
                        </Pressable>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    list: { padding: spacing.lg, paddingBottom: 120, gap: spacing.sm },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    hotBadge: {
        backgroundColor: '#FF5C7A',
        borderRadius: radius.sm,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    hotBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.8,
    },
    headerDesc: {
        ...typography.bodySm,
        color: colors.textMuted,
    },

    shadowShell: {
        borderRadius: radius.lg,
        ...shadows.sm,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        overflow: 'hidden',
    },
    glassOverlay: {
        backgroundColor: 'rgba(18, 18, 30, 0.60)',
    },
    cardPressed: { opacity: 0.7 },

    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.bgRaisedAlt,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    rankText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMuted,
    },
    rankTextTop: {
        color: '#FF5C7A',
    },

    cardBody: { flex: 1, gap: 4 },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    categoryChip: {
        backgroundColor: colors.bgRaisedAlt,
        borderRadius: radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    metaTime: {
        ...typography.caption,
        color: colors.textMuted,
    },

    cardTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textPrimary,
    },

    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.xs,
    },
    department: {
        ...typography.caption,
        color: colors.textMuted,
        flex: 1,
    },
    viewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    viewCount: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.textMuted,
    },

    chevron: { flexShrink: 0 },
});
