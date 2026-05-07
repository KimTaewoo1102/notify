import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { colors, spacing, radius, typography } from '../ui/theme';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'KeywordEdit'>;

export default function KeywordEditScreen({ navigation, route }: Props) {
    const { sectionId } = route.params;

    return (
        <View style={styles.root}>
            <Text style={styles.label}>편집 대상 섹션</Text>
            <Text style={styles.value}>{sectionId}</Text>
            <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
                <Text style={styles.buttonLabel}>닫기</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase, padding: spacing.lg, gap: spacing.md },
    label: { ...typography.caption, color: colors.textMuted },
    value: { ...typography.h2, color: colors.textPrimary },
    button: {
        marginTop: spacing.lg,
        backgroundColor: colors.bgRaised,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    pressed: { opacity: 0.7 },
    buttonLabel: { ...typography.body, color: colors.textPrimary },
});
