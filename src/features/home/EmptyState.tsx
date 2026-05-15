import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PressableScale } from '../../ui/primitives/PressableScale';
import { colors, shadows, spacing, typography } from '../../ui/theme';

interface Props {
    onAdd: () => void;
}

/**
 * 홈 화면에 user 섹션이 0개일 때 표시되는 빈 상태.
 * 호흡(breathing) 애니메이션이 들어간 큰 + 버튼이 핵심.
 */
export function EmptyState({ onAdd }: Props) {
    const breath = useSharedValue(1);

    useEffect(() => {
        breath.value = withRepeat(
            withSequence(
                withTiming(1.06, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
                withTiming(1.0, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
            ),
            -1,
            false,
        );
    }, [breath]);

    const breathStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breath.value }],
    }));

    return (
        <View style={styles.empty}>
            <View style={styles.emptyOrb}>
                <Animated.View style={breathStyle}>
                    <PressableScale
                        onPress={onAdd}
                        hapticKind="medium"
                        scaleTo={0.92}
                        style={styles.emptyBtn}
                    >
                        <Ionicons name="add" size={36} color={colors.textPrimary} />
                    </PressableScale>
                </Animated.View>
            </View>
            <Text style={styles.emptyText}>관심 있는 키워드를 추가해 보세요</Text>
            <Text style={styles.emptyHint}>장학금 · 인턴 · AI — 무엇이든 좋아요</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.lg,
        marginTop: spacing.xxxl,
    },
    emptyOrb: {
        width: 152,
        height: 152,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    emptyBtn: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: colors.bgRaised,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
    },
    emptyText: {
        ...typography.h2,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    emptyHint: {
        ...typography.bodySm,
        color: colors.textMuted,
        textAlign: 'center',
    },
});
