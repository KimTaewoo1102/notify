import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, spacing, typography } from '../ui/theme';
import { SwipeToRestoreRow } from '../features/notices/components/SwipeToRestoreRow';
import { TrashCardRow } from '../features/trash/components/TrashCardRow';
import { useUnifiedTrashRows } from '../features/trash/hooks/useUnifiedTrashRows';
import { useTrashActions } from '../features/trash/hooks/useTrashActions';

import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Trash'>;

export default function TrashScreen({ route }: Props) {
    const sectionId = route.params?.sectionId;
    const { rows, totalCount } = useUnifiedTrashRows(sectionId);
    const { handleRestore, handlePurge, handlePurgeAll } = useTrashActions(totalCount, sectionId);

    if (totalCount === 0) {
        return (
            <View style={styles.root}>
                <EmptyTrash />
            </View>
        );
    }

    return (
        <View style={styles.root}>
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
                {rows.map(row => {
                    const key =
                        row.kind === 'section'
                            ? `s:${row.entry.id}`
                            : `n:${row.entry.noticeId}`;
                    return (
                        <SwipeToRestoreRow
                            key={key}
                            onRestore={() => handleRestore(row)}
                        >
                            <TrashCardRow
                                row={row}
                                onRestore={() => handleRestore(row)}
                                onPurge={() => handlePurge(row)}
                            />
                        </SwipeToRestoreRow>
                    );
                })}
            </ScrollView>
        </View>
    );
}

function EmptyTrash() {
    return (
        <View style={styles.empty}>
            <View style={styles.emptyIcon}>
                <Ionicons name="trash-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>휴지통이 비어 있어요</Text>
            <Text style={styles.emptySub}>
                삭제된 항목은 30일간 이곳에 보관됩니다.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },

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
