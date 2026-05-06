import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SectionHeader from '../common/SectionHeader';
import NoticeListItem from './NoticeListItem';
import SwipeableNoticeRow from './SwipeableNoticeRow';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';
import type { Notice } from '../../types/notice';

interface Props {
    title: string;
    subtitle?: string;
    icon?: React.ComponentProps<typeof Ionicons>['name'];
    notices: Notice[];
    showViews?: boolean;
    onDelete: (id: string) => void;
    emptyText?: string;
}

/**
 * 섹션 = 헤더 + 스와이프 가능한 리스트.
 * 한 번에 하나의 행만 열리도록 activeRowId를 섹션 내부에서 관리.
 */
export default function NoticeSection({
    title,
    subtitle,
    icon,
    notices,
    showViews,
    onDelete,
    emptyText = '아직 표시할 공지가 없어요.',
}: Props) {
    const [activeRowId, setActiveRowId] = useState<string | null>(null);

    return (
        <View style={styles.section}>
            <SectionHeader title={title} subtitle={subtitle} icon={icon} />
            {notices.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>{emptyText}</Text>
                </View>
            ) : (
                notices.map(notice => (
                    <SwipeableNoticeRow
                        key={notice.id}
                        rowId={notice.id}
                        activeRowId={activeRowId}
                        onActivate={setActiveRowId}
                        onDelete={() => onDelete(notice.id)}
                    >
                        <NoticeListItem notice={notice} showViews={showViews} />
                    </SwipeableNoticeRow>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
    },
    empty: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    emptyText: { ...typography.caption, color: colors.textTertiary },
});
