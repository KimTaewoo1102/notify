import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '../../../ui/theme';
import { timeAgoShort } from '../../../utils/time';
import type { Notice } from '../../../types/domain';

interface Props {
    notices: Notice[];
    /** 삭제되지 않은 전체 공지 수 — 2개 초과 시 '+N개 더보기' 표시. */
    totalCount: number;
    accent: string;
}

/**
 * SectionCard 하단 (previewSlot) 에 끼워지는 최신 공지 미리보기.
 * - 좌측 accent 컬러 바 + 우측 제목/시각 2줄 (최신 2건 고정).
 * - 통합 셸(SectionCard) 안쪽에 렌더되므로 자체 bg/border/radius 없음.
 */
export function UnreadPreview({ notices, totalCount, accent }: Props) {
    return (
        <View style={styles.container}>
            <View style={[styles.bar, { backgroundColor: accent + '55' }]} />
            <View style={styles.list}>
                {notices.map(n => (
                    <View key={n.id} style={styles.row}>
                        <Text style={styles.title} numberOfLines={1}>
                            {n.title}
                        </Text>
                        <Text style={styles.time}>{timeAgoShort(n.publishedAt)}</Text>
                    </View>
                ))}
                {totalCount > 2 && (
                    <Text style={[styles.more, { color: accent }]}>
                        +{totalCount - 2}개 더보기
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    bar: {
        width: 3,
    },
    list: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    title: {
        ...typography.caption,
        fontWeight: '600',
        color: 'rgba(245,245,247,0.75)',
        flex: 1,
    },
    time: {
        ...typography.caption,
        fontWeight: '500',
        color: 'rgba(245,245,247,0.50)',
        fontSize: 11,
    },
    more: {
        ...typography.caption,
        fontWeight: '600',
        marginTop: 2,
    },
});
