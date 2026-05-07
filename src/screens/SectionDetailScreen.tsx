import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Card } from '../ui/primitives/Card';
import { PressableScale } from '../ui/primitives/PressableScale';
import { haptic } from '../ui/feedback/haptics';
import { colors, radius, spacing, typography } from '../ui/theme';
import { useSectionsStore } from '../stores/sectionsStore';
import { useUIStore } from '../stores/uiStore';
import { uosAdapter } from '../services/universities/uos';
import type { Notice } from '../types/domain';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'SectionDetail'>;

const CATEGORY_LABEL: Record<string, string> = {
    academic: '학사',
    scholarship: '장학',
    recruit: '채용',
    event: '행사',
    library: '도서관',
    dorm: '생활관',
    general: '일반',
};

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 1) return '방금';
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
}

export default function SectionDetailScreen({ navigation, route }: Props) {
    const { sectionId } = route.params;
    const section = useSectionsStore(s => s.sections[sectionId]);
    const toggleNotify = useSectionsStore(s => s.toggleNotify);
    const togglePin = useSectionsStore(s => s.togglePin);
    const openKeywordEdit = useUIStore(s => s.openKeywordEdit);

    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({ title: section?.title ?? '' });
    }, [navigation, section?.title]);

    const fetchNotices = useCallback(async () => {
        if (!section || section.keywords.length === 0) {
            setNotices([]);
            return;
        }
        setLoading(true);
        try {
            const results = await uosAdapter.fetchByKeywords(
                section.keywords.map(k => k.text),
            );
            setNotices(results);
        } finally {
            setLoading(false);
        }
    }, [section]);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    if (!section) {
        return (
            <View style={styles.root}>
                <Text style={styles.muted}>섹션을 찾을 수 없습니다.</Text>
            </View>
        );
    }

    const accent = section.accentColor;

    return (
        <ScrollView style={styles.root} contentContainerStyle={styles.content}>
            {/* Summary card */}
            <Card accent={accent} showAccentLine shadow="md" style={styles.summary}>
                <View style={styles.summaryHead}>
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <Text style={styles.summaryTitle}>{section.title}</Text>
                </View>
                <Text style={styles.summaryMeta}>
                    키워드 {section.keywords.length} · {section.universityId.toUpperCase()}
                </Text>
            </Card>

            {/* Action pills */}
            <View style={styles.pills}>
                <ActionPill
                    icon={section.notifyOn ? 'notifications' : 'notifications-off'}
                    label={section.notifyOn ? '알림 ON' : '알림 OFF'}
                    accent={accent}
                    on={section.notifyOn}
                    onPress={() => toggleNotify(section.id)}
                />
                <ActionPill
                    icon={section.pinned ? 'pin' : 'pin-outline'}
                    label={section.pinned ? '고정 됨' : '고정'}
                    accent={accent}
                    on={section.pinned}
                    onPress={() => togglePin(section.id)}
                />
            </View>

            {/* Keyword edit button */}
            <PressableScale
                onPress={() => openKeywordEdit(section.id)}
                hapticKind="light"
                style={[styles.editBtn, { borderColor: accent + '55' }]}
            >
                <Ionicons name="pricetag" size={16} color={accent} />
                <Text style={styles.editLabel}>키워드 편집</Text>
                <View style={[styles.editBadge, { backgroundColor: accent + '22' }]}>
                    <Text style={[styles.editBadgeText, { color: accent }]}>
                        {section.keywords.length}
                    </Text>
                </View>
            </PressableScale>

            {/* Notices */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>관련 공지</Text>
                    <PressableScale
                        onPress={fetchNotices}
                        hapticKind="light"
                        style={styles.refreshBtn}
                        disabled={loading}
                    >
                        <Ionicons
                            name="refresh"
                            size={15}
                            color={loading ? colors.textDisabled : colors.textMuted}
                        />
                    </PressableScale>
                </View>

                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator color={accent} size="small" />
                    </View>
                ) : section.keywords.length === 0 ? (
                    <View style={styles.noKeywords}>
                        <Ionicons
                            name="pricetag-outline"
                            size={24}
                            color={colors.textMuted}
                        />
                        <Text style={styles.noKeywordsText}>
                            키워드를 추가하면 관련 공지를 찾아드려요.
                        </Text>
                    </View>
                ) : notices.length === 0 ? (
                    <View style={styles.noKeywords}>
                        <Ionicons
                            name="search-outline"
                            size={24}
                            color={colors.textMuted}
                        />
                        <Text style={styles.noKeywordsText}>
                            매칭되는 공지가 없습니다.
                        </Text>
                    </View>
                ) : (
                    notices.map(notice => (
                        <NoticeRow
                            key={notice.id}
                            notice={notice}
                            accent={accent}
                        />
                    ))
                )}
            </View>
        </ScrollView>
    );
}

/* ────────────────────── NoticeRow ─────────────────────────── */

function NoticeRow({
    notice,
    accent,
}: {
    notice: Notice;
    accent: string;
}) {
    const openUrl = useCallback(() => {
        haptic('light');
        Linking.openURL(notice.sourceUrl).catch(() => {});
    }, [notice.sourceUrl]);

    return (
        <PressableScale
            onPress={openUrl}
            hapticKind={null}
            scaleTo={0.985}
            style={styles.noticeCard}
        >
            <View style={styles.noticeTop}>
                <View style={[styles.tag, { backgroundColor: accent + '22' }]}>
                    <Text style={[styles.tagText, { color: accent }]}>
                        {CATEGORY_LABEL[notice.category] ?? notice.category}
                    </Text>
                </View>
                {notice.isSourcePinned && (
                    <Ionicons name="pin" size={11} color={accent} style={styles.pinIcon} />
                )}
                <Text style={styles.noticeTime}>{timeAgo(notice.publishedAt)}</Text>
            </View>

            <Text style={styles.noticeTitle} numberOfLines={2}>
                {notice.title}
            </Text>

            <View style={styles.noticeBottom}>
                <Text style={styles.noticeDept}>{notice.department}</Text>
                {notice.matchedKeywords && notice.matchedKeywords.length > 0 && (
                    <View style={styles.matchedRow}>
                        {notice.matchedKeywords.slice(0, 3).map(kw => (
                            <View
                                key={kw}
                                style={[
                                    styles.matchChip,
                                    { backgroundColor: accent + '18' },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.matchChipText,
                                        { color: accent },
                                    ]}
                                >
                                    {kw}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
                <Ionicons
                    name="open-outline"
                    size={13}
                    color={colors.textMuted}
                    style={styles.externalIcon}
                />
            </View>
        </PressableScale>
    );
}

/* ────────────────────── ActionPill ────────────────────────── */

function ActionPill({
    icon,
    label,
    accent,
    on,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    accent: string;
    on: boolean;
    onPress: () => void;
}) {
    return (
        <PressableScale
            onPress={onPress}
            hapticKind="selection"
            style={[
                styles.pill,
                on
                    ? { backgroundColor: accent + '22', borderColor: accent + '99' }
                    : { borderColor: colors.border },
            ]}
        >
            <Ionicons
                name={icon}
                size={16}
                color={on ? accent : colors.textSecondary}
            />
            <Text
                style={[
                    styles.pillLabel,
                    { color: on ? colors.textPrimary : colors.textSecondary },
                ]}
            >
                {label}
            </Text>
        </PressableScale>
    );
}

/* ───────────────────────── styles ─────────────────────────── */

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
    muted: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xxxl,
    },

    summary: { padding: spacing.lg, gap: spacing.xs },
    summaryHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    summaryTitle: { ...typography.h2, color: colors.textPrimary },
    summaryMeta: { ...typography.caption, color: colors.textSecondary },

    pills: { flexDirection: 'row', gap: spacing.sm },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: radius.pill,
        borderWidth: 1,
        backgroundColor: colors.bgRaised,
    },
    pillLabel: { ...typography.bodySm },

    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.bgRaised,
        borderWidth: 1,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    editLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
    editBadge: {
        borderRadius: radius.sm,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    editBadgeText: { ...typography.caption, fontWeight: '700' },

    section: { gap: spacing.sm },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, flex: 1 },
    refreshBtn: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loader: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    noKeywords: {
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xl,
        backgroundColor: colors.bgRaised,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    noKeywordsText: {
        ...typography.bodySm,
        color: colors.textMuted,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },

    noticeCard: {
        backgroundColor: colors.bgRaised,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.xs,
    },
    noticeTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: 2,
    },
    tag: {
        borderRadius: radius.sm,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    tagText: { ...typography.caption, fontWeight: '600', fontSize: 11 },
    pinIcon: { marginLeft: 2 },
    noticeTime: { ...typography.caption, color: colors.textMuted, marginLeft: 'auto' },

    noticeTitle: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
    noticeBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: 4,
    },
    noticeDept: { ...typography.caption, color: colors.textMuted, flex: 1 },
    matchedRow: { flexDirection: 'row', gap: 4 },
    matchChip: {
        borderRadius: radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    matchChipText: { fontSize: 11, fontWeight: '600' },
    externalIcon: { marginLeft: spacing.xs },
});
