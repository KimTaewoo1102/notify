import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Card } from '../../../ui/primitives/Card';
import { PressableScale } from '../../../ui/primitives/PressableScale';
import { colors, radius, spacing, typography } from '../../../ui/theme';
import { timeAgoFromMs } from '../../../utils/time';

import type { UnifiedTrashRow } from '../hooks/useUnifiedTrashRows';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** 삭제 후 남은 영구 보관 일수. 0 이면 곧 자동 삭제. */
function daysLeft(deletedAt: number): number {
    const expiry = deletedAt + THIRTY_DAYS_MS;
    return Math.max(0, Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000)));
}

interface Props {
    row: UnifiedTrashRow;
    onRestore: () => void;
    onPurge: () => void;
}

/**
 * 휴지통의 단일 카드 — section / notice 두 종류를 단일 컴포넌트로 처리.
 *  - kind 별 leading 영역 / kind 뱃지 / 메타 라인만 분기.
 *  - 액션(복구 + 영구삭제) 영역은 공통.
 *  - 만료 3일 이내(`urgent`) 면 메타 일수에 강조색 적용.
 */
export function TrashCardRow({ row, onRestore, onPurge }: Props) {
    const remaining = daysLeft(row.deletedAt);
    const urgent = remaining <= 3;
    const isSection = row.kind === 'section';

    // accent — section 은 섹션 자체 accentColor, notice 는 카드 자체 강조 없음
    const accent = isSection ? row.entry.payload.accentColor : undefined;
    const title = row.entry.payload.title;

    return (
        <Card accent={accent} showAccentLine={false} shadow="md" style={styles.card}>
            <View style={styles.cardRow}>
                <View
                    style={[
                        styles.leading,
                        {
                            backgroundColor: isSection
                                ? (accent ?? colors.bgRaisedAlt) + '22'
                                : colors.bgRaisedAlt,
                        },
                    ]}
                >
                    {isSection ? (
                        row.entry.payload.emoji ? (
                            <Text style={styles.emoji}>{row.entry.payload.emoji}</Text>
                        ) : (
                            <View
                                style={[
                                    styles.dot,
                                    { backgroundColor: accent ?? colors.textSecondary },
                                ]}
                            />
                        )
                    ) : (
                        <Ionicons
                            name="document-text-outline"
                            size={18}
                            color={colors.textSecondary}
                        />
                    )}
                </View>

                <View style={styles.body}>
                    <View style={styles.titleRow}>
                        <View
                            style={[
                                styles.kindBadge,
                                !isSection && styles.kindBadgeNotice,
                            ]}
                        >
                            <Text style={styles.kindBadgeText}>
                                {isSection ? '섹션' : '공지'}
                            </Text>
                        </View>
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                    </View>
                    <Text style={styles.meta} numberOfLines={1}>
                        {isSection
                            ? `키워드 ${row.entry.payload.keywords.length}`
                            : row.entry.payload.department}
                        <Text style={styles.metaDim}> · </Text>
                        {timeAgoFromMs(row.deletedAt)} 삭제
                        <Text style={styles.metaDim}> · </Text>
                        <Text style={urgent ? styles.metaUrgent : styles.metaDim}>
                            {remaining}일 후 만료
                        </Text>
                    </Text>
                </View>

                <View style={styles.actions}>
                    {/*
                     * 햅틱은 액션 콜백(handleRestore→success, handlePurge→confirm 후 warning)
                     * 에서 발화. 버튼 탭 자체에는 별도 진동 없음.
                     */}
                    <PressableScale onPress={onRestore} style={styles.restoreBtn}>
                        <Ionicons name="arrow-undo" size={16} color={colors.success} />
                    </PressableScale>
                    <PressableScale onPress={onPurge} style={styles.purgeBtn}>
                        <Ionicons name="trash" size={16} color={colors.danger} />
                    </PressableScale>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
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
});
