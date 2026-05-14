import React, { useCallback, useEffect, useMemo } from 'react';
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
import {
    useAllDeletedNotices,
    useNoticesStore,
    type DeletedNoticeEntry,
} from '../stores/noticesStore';
import { SwipeToRestoreRow } from '../features/notices/components/SwipeToRestoreRow';
import { timeAgoFromMs } from '../utils/time';

import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Trash'>;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function daysLeft(deletedAt: number): number {
    const expiry = deletedAt + THIRTY_DAYS_MS;
    return Math.max(0, Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000)));
}

/* 통합 Trash row 모델 — section 과 notice 를 하나의 리스트로 정렬해 보여준다. */
type UnifiedRow =
    | { kind: 'section'; deletedAt: number; entry: TrashEntry }
    | { kind: 'notice'; deletedAt: number; entry: DeletedNoticeEntry };

export default function TrashScreen({}: Props) {
    /* sections trash */
    const sectionEntries = useTrashStore(s => s.entries);
    const restoreSectionEntry = useTrashStore(s => s.restore);
    const purgeSectionEntry = useTrashStore(s => s.purge);
    const purgeAllSections = useTrashStore(s => s.purgeAll);
    const purgeExpiredSections = useTrashStore(s => s.purgeExpired);
    const restoreSection = useSectionsStore(s => s.restoreSection);

    /* notices trash */
    const noticeEntries = useAllDeletedNotices();
    const restoreNoticeEntry = useNoticesStore(s => s.restore);
    const purgeNoticeEntry = useNoticesStore(s => s.purge);
    const purgeAllNotices = useNoticesStore(s => s.purgeAll);
    const purgeExpiredNotices = useNoticesStore(s => s.purgeExpired);

    useEffect(() => {
        purgeExpiredSections();
        purgeExpiredNotices();
    }, [purgeExpiredSections, purgeExpiredNotices]);

    /* 통합 정렬: 가장 최근에 삭제된 항목 우선. */
    const rows: UnifiedRow[] = useMemo(() => {
        const sectionRows: UnifiedRow[] = sectionEntries.map(e => ({
            kind: 'section',
            deletedAt: e.deletedAt,
            entry: e,
        }));
        const noticeRows: UnifiedRow[] = noticeEntries.map(e => ({
            kind: 'notice',
            deletedAt: e.deletedAt,
            entry: e,
        }));
        return [...sectionRows, ...noticeRows].sort(
            (a, b) => b.deletedAt - a.deletedAt,
        );
    }, [sectionEntries, noticeEntries]);

    const totalCount = rows.length;

    /* ─── handlers ─────────────────────────────────────────── */
    const handleRestoreSection = useCallback(
        (entry: TrashEntry) => {
            const section = restoreSectionEntry(entry.id);
            if (!section) return;
            restoreSection(section);
            haptic('success');
        },
        [restoreSectionEntry, restoreSection],
    );

    const handleRestoreNotice = useCallback(
        (entry: DeletedNoticeEntry) => {
            restoreNoticeEntry(entry.noticeId);
            haptic('success');
        },
        [restoreNoticeEntry],
    );

    const handlePurgeSection = useCallback(
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
                            purgeSectionEntry(entry.id);
                            haptic('warning');
                        },
                    },
                ],
            );
        },
        [purgeSectionEntry],
    );

    const handlePurgeNotice = useCallback(
        (entry: DeletedNoticeEntry) => {
            Alert.alert(
                '영구 삭제',
                `"${entry.payload.title}" 공지를 영구 삭제할까요?\n복구할 수 없습니다.`,
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '삭제',
                        style: 'destructive',
                        onPress: () => {
                            purgeNoticeEntry(entry.noticeId);
                            haptic('warning');
                        },
                    },
                ],
            );
        },
        [purgeNoticeEntry],
    );

    const handlePurgeAll = useCallback(() => {
        if (totalCount === 0) return;
        Alert.alert(
            '전체 영구 삭제',
            `휴지통의 항목 ${totalCount}개를 모두 영구 삭제할까요?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '모두 삭제',
                    style: 'destructive',
                    onPress: () => {
                        purgeAllSections();
                        purgeAllNotices();
                        haptic('warning');
                    },
                },
            ],
        );
    }, [totalCount, purgeAllSections, purgeAllNotices]);

    return (
        <View style={styles.root}>
            {totalCount === 0 ? (
                <EmptyTrash />
            ) : (
                <>
                    <View style={styles.topBar}>
                        <Text style={styles.hint}>
                            오른쪽으로 밀어 복구 · 30일 후 자동 삭제
                        </Text>
                        <Pressable onPress={handlePurgeAll} hitSlop={10}>
                            <Text style={styles.purgeAll}>전체 삭제</Text>
                        </Pressable>
                    </View>
                    <ScrollView
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    >
                        {rows.map(row =>
                            row.kind === 'section' ? (
                                <SwipeToRestoreRow
                                    key={`s:${row.entry.id}`}
                                    onRestore={() => handleRestoreSection(row.entry)}
                                >
                                    <SectionTrashCard
                                        entry={row.entry}
                                        onRestore={() => handleRestoreSection(row.entry)}
                                        onPurge={() => handlePurgeSection(row.entry)}
                                    />
                                </SwipeToRestoreRow>
                            ) : (
                                <SwipeToRestoreRow
                                    key={`n:${row.entry.noticeId}`}
                                    onRestore={() => handleRestoreNotice(row.entry)}
                                >
                                    <NoticeTrashCard
                                        entry={row.entry}
                                        onRestore={() => handleRestoreNotice(row.entry)}
                                        onPurge={() => handlePurgeNotice(row.entry)}
                                    />
                                </SwipeToRestoreRow>
                            ),
                        )}
                    </ScrollView>
                </>
            )}
        </View>
    );
}

/* ─────────────────────── SectionTrashCard ───────────────────── */

function SectionTrashCard({
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
                    <View style={styles.titleRow}>
                        <View style={styles.kindBadge}>
                            <Text style={styles.kindBadgeText}>섹션</Text>
                        </View>
                        <Text style={styles.title} numberOfLines={1}>
                            {payload.title}
                        </Text>
                    </View>
                    <Text style={styles.meta} numberOfLines={1}>
                        키워드 {payload.keywords.length}
                        <Text style={styles.metaDim}> · </Text>
                        {timeAgoFromMs(entry.deletedAt)} 삭제
                        <Text style={styles.metaDim}> · </Text>
                        <Text style={urgent ? styles.metaUrgent : styles.metaDim}>
                            {remaining}일 후 만료
                        </Text>
                    </Text>
                </View>

                <CardActions onRestore={onRestore} onPurge={onPurge} />
            </View>
        </Card>
    );
}

/* ─────────────────────── NoticeTrashCard ────────────────────── */

function NoticeTrashCard({
    entry,
    onRestore,
    onPurge,
}: {
    entry: DeletedNoticeEntry;
    onRestore: () => void;
    onPurge: () => void;
}) {
    const { payload } = entry;
    const remaining = daysLeft(entry.deletedAt);
    const urgent = remaining <= 3;

    return (
        <Card showAccentLine={false} shadow="md" style={styles.card}>
            <View style={styles.cardRow}>
                <View
                    style={[
                        styles.leading,
                        { backgroundColor: colors.bgRaisedAlt },
                    ]}
                >
                    <Ionicons
                        name="document-text-outline"
                        size={18}
                        color={colors.textSecondary}
                    />
                </View>

                <View style={styles.body}>
                    <View style={styles.titleRow}>
                        <View style={[styles.kindBadge, styles.kindBadgeNotice]}>
                            <Text style={styles.kindBadgeText}>공지</Text>
                        </View>
                        <Text style={styles.title} numberOfLines={1}>
                            {payload.title}
                        </Text>
                    </View>
                    <Text style={styles.meta} numberOfLines={1}>
                        {payload.department}
                        <Text style={styles.metaDim}> · </Text>
                        {timeAgoFromMs(entry.deletedAt)} 삭제
                        <Text style={styles.metaDim}> · </Text>
                        <Text style={urgent ? styles.metaUrgent : styles.metaDim}>
                            {remaining}일 후 만료
                        </Text>
                    </Text>
                </View>

                <CardActions onRestore={onRestore} onPurge={onPurge} />
            </View>
        </Card>
    );
}

/* ─────────────────────── shared actions ─────────────────────── */

function CardActions({
    onRestore,
    onPurge,
}: {
    onRestore: () => void;
    onPurge: () => void;
}) {
    return (
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
                삭제된 항목은 30일간 이곳에 보관됩니다.
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
    hint: { ...typography.caption, color: colors.textMuted, flex: 1 },
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    title: {
        ...typography.body,
        color: colors.textPrimary,
        flexShrink: 1,
    },
    kindBadge: {
        backgroundColor: colors.bgRaisedAlt,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        borderRadius: radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    kindBadgeNotice: {
        backgroundColor: colors.bgBase,
    },
    kindBadgeText: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
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
