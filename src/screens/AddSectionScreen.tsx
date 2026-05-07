import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { colors, spacing, radius, typography } from '../ui/theme';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'AddSection'>;

export default function AddSectionScreen({ navigation }: Props) {
    return (
        <View style={styles.root}>
            <Text style={styles.value}>새 섹션 추가 (placeholder)</Text>
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
