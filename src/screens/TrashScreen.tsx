import React, { useCallback, useEffect } from 'react';
import {
    Alert,
    Pressable,
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
import { useTrashStore, type TrashEntry } from '../stores/trashStore';
import { useSectionsStore } from '../stores/sectionsStore';

import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Trash'>;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function daysLeft(deletedAt: number): number {
    const expiry = deletedAt + THIRTY_DAYS_MS;
    return Math.max(0, Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000)));
}

function timeAgo(deletedAt: number): string {
    const diff = Date.now() - deletedAt;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
}

export default function TrashScreen({ navigation }: Props) {
    const entries = useTrashStore(s => s.entries);
    const restore = useTrashStore(s => s.restore);
    const purge = useTrashStore(s => s.purge);
    const purgeAll = useTrashStore(s => s.purgeAll);
    const purgeExpired = useTrashStore(s => s.purgeExpired);
    const restoreSection = useSectionsStore(s => s.restoreSection);

    useEffect(() => {
        purgeExpired();
    }, [purgeExpired]);

    const handleRestore = useCallback(
        (entry: TrashEntry) => {
            const section = restore(entry.id);
            if (!section) return;
            restoreSection(section);
            haptic('success');
        },
        [restore, restoreSection],
    );

    const handlePurge = useCallback(
        (entry: TrashEntry) => {
            Alert.alert(
                '영구 삭제',
                `"${entry.payload.title}" 섹션을 영구 삭제할까요?\n복구할 수 없습니다.`,
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '삭제',
                        style: 'destructive',
                        onPress: () => {
                            purge(entry.id);
                            haptic('warning');
                        },
                    },
                ],
            );
        },
        [purge],
    );

    const handlePurgeAll = useCallback(() => {
        if (entries.length === 0) return;
        Alert.alert(
            '전체 영구 삭제',
            `휴지통의 섹션 ${entries.length}개를 모두 영구 삭제할까요?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '모두 삭제',
                    style: 'destructive',
                    onPress: () => {
                        purgeAll();
                        haptic('warning');
                    },
                },
            ],
        );
    }, [entries.length, purgeAll]);

    return (
        <View style={styles.root}>
            {entries.length === 0 ? (
                <EmptyTrash />
            ) : (
                <>
                    <View style={styles.topBar}>
                        <Text style={styles.hint}>
                            30일 후 자동으로 영구 삭제됩니다.
                        </Text>
                        <Pressable onPress={handlePurgeAll} hitSlop={10}>
                            <Text style={styles.purgeAll}>전체 삭제</Text>
                        </Pressable>
                    </View>
                    <ScrollView
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    >
                        {entries.map(entry => (
                            <TrashCard
                                key={entry.id}
                                entry={entry}
                                onRestore={() => handleRestore(entry)}
                                onPurge={() => handlePurge(entry)}
                            />
                        ))}
                    </ScrollView>
                </>
            )}
        </View>
    );
}

/* ─────────────────────── TrashCard ────────────────────────── */

function TrashCard({
    entry,
    onRestore,
    onPurge,
}: {
    entry: TrashEntry;
    onRestore: () => void;
    onPurge: () => void;
}) {
    const { payload } = entry;
    const accent = payload.accentColor;
    const remaining = daysLeft(entry.deletedAt);
    const urgent = remaining <= 3;

    return (
        <Card accent={accent} showAccentLine={false} shadow="md" style={styles.card}>
            <View style={styles.cardRow}>
                <View
                    style={[
                        styles.leading,
                        { backgroundColor: accent + '22' },
                    ]}
                >
                    {payload.emoji ? (
                        <Text style={styles.emoji}>{payload.emoji}</Text>
                    ) : (
                        <View
                            style={[
                                styles.dot,
                                { backgroundColor: accent },
                            ]}
                        />
                    )}
                </View>

                <View style={styles.body}>
                    <Text style={styles.title} numberOfLines={1}>
                        {payload.title}
                    </Text>
                    <Text style={styles.meta}>
                        키워드 {payload.keywords.length}
                        <Text style={styles.metaDim}> · </Text>
                        {timeAgo(entry.deletedAt)} 삭제
                        <Text style={styles.metaDim}> · </Text>
                        <Text style={urgent ? styles.metaUrgent : styles.metaDim}>
                            {remaining}일 후 만료
                        </Text>
                    </Text>
                </View>

                <View style={styles.actions}>
                    <PressableScale
                        onPress={onRestore}
                        hapticKind="light"
                        style={styles.restoreBtn}
                    >
                        <Ionicons
                            name="arrow-undo"
                            size={16}
                            color={colors.success}
                        />
                    </PressableScale>
                    <PressableScale
                        onPress={onPurge}
                        hapticKind="warning"
                        style={styles.purgeBtn}
                    >
                        <Ionicons
                            name="trash"
                            size={16}
                            color={colors.danger}
                        />
                    </PressableScale>
                </View>
            </View>
        </Card>
    );
}

/* ──────────────────────── EmptyTrash ──────────────────────── */

function EmptyTrash() {
    return (
        <View style={styles.empty}>
            <View style={styles.emptyIcon}>
                <Ionicons
                    name="trash-outline"
                    size={40}
                    color={colors.textMuted}
                />
            </View>
            <Text style={styles.emptyTitle}>휴지통이 비어 있어요</Text>
            <Text style={styles.emptySub}>
                삭제된 섹션은 30일간 이곳에 보관됩니다.
            </Text>
        </View>
    );
}

/* ─────────────────────────── styles ───────────────────────── */

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    hint: { ...typography.caption, color: colors.textMuted },
    purgeAll: {
        ...typography.caption,
        color: colors.danger,
        fontWeight: '600',
    },

    list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 60 },

    card: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    leading: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: { fontSize: 20 },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    body: { flex: 1 },
    title: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
    meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    metaDim: { color: colors.textMuted },
    metaUrgent: { color: colors.warning, fontWeight: '600' },

    actions: { flexDirection: 'row', gap: spacing.sm },
    restoreBtn: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        backgroundColor: colors.success + '1A',
        borderWidth: 1,
        borderColor: colors.success + '44',
        alignItems: 'center',
        justifyContent: 'center',
    },
    purgeBtn: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        backgroundColor: colors.danger + '1A',
        borderWidth: 1,
        borderColor: colors.danger + '44',
        alignItems: 'center',
        justifyContent: 'center',
    },

    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        padding: spacing.xl,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.bgRaised,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    emptyTitle: { ...typography.h2, color: colors.textPrimary },
    emptySub: {
        ...typography.bodySm,
        color: colors.textMuted,
        textAlign: 'center',
    },
});
