import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CATEGORY_META } from '../../constants/categories';
import { colors, radius, typography } from '../../constants/theme';
import type { NoticeCategoryId } from '../../types/notice';

interface Props {
    category: NoticeCategoryId;
    size?: 'sm' | 'md';
}

export default function CategoryTag({ category, size = 'sm' }: Props) {
    const meta = CATEGORY_META[category];
    const isMd = size === 'md';

    return (
        <View
            style={[
                styles.base,
                isMd ? styles.md : styles.sm,
                { backgroundColor: meta.accent },
            ]}
        >
            <View style={styles.dot} />
            <Text style={[styles.text, isMd && styles.textMd]}>{meta.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderRadius: radius.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    sm: { paddingHorizontal: 10, paddingVertical: 4 },
    md: { paddingHorizontal: 12, paddingVertical: 6 },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginRight: 6,
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    text: {
        ...typography.label,
        color: colors.textPrimary,
        fontSize: 11,
    },
    textMd: { fontSize: 12 },
});
