import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, radius, typography } from '../ui/theme';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
    return (
        <SafeAreaView edges={['bottom']} style={styles.root}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.heading}>Step 2 — Routing skeleton</Text>
                <Text style={styles.sub}>
                    화면 이동만 동작하는 뼈대입니다. UI/애니메이션은 Step 3에서.
                </Text>

                <NavButton
                    label="섹션 상세 (예시 sectionId=demo-1)"
                    onPress={() =>
                        navigation.navigate('SectionDetail', { sectionId: 'demo-1' })
                    }
                />
                <NavButton
                    label="키워드 편집 (modal)"
                    onPress={() =>
                        navigation.navigate('KeywordEdit', { sectionId: 'demo-1' })
                    }
                />
                <NavButton
                    label="섹션 추가 (modal)"
                    onPress={() => navigation.navigate('AddSection')}
                />
                <NavButton
                    label="휴지통"
                    onPress={() => navigation.navigate('Trash')}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

function NavButton({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
            <Text style={styles.buttonLabel}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    content: { padding: spacing.lg, gap: spacing.md },
    heading: { ...typography.h1, color: colors.textPrimary },
    sub: {
        ...typography.bodySm,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    button: {
        backgroundColor: colors.bgRaised,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.lg,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    buttonPressed: { opacity: 0.7 },
    buttonLabel: { ...typography.body, color: colors.textPrimary },
});
