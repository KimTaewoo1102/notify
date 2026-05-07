import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, spacing, typography } from '../ui/theme';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Trash'>;

export default function TrashScreen({}: Props) {
    return (
        <View style={styles.root}>
            <Text style={styles.value}>휴지통 (placeholder)</Text>
            <Text style={styles.sub}>
                삭제된 섹션 / 공지가 여기에 표시될 예정입니다.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase, padding: spacing.lg, gap: spacing.sm },
    value: { ...typography.h2, color: colors.textPrimary },
    sub: { ...typography.bodySm, color: colors.textSecondary },
});
