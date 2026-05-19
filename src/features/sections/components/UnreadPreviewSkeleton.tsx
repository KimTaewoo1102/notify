import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { colors, spacing } from '../../../ui/theme';

interface Props {
    accent: string;
}

/**
 * `UnreadPreview` 와 동일한 외곽 레이아웃의 skeleton placeholder.
 *
 * 사용처: 섹션 캐시가 아직 로드되지 않은 (`cache === undefined`) 그러나
 * 키워드가 있는 섹션 카드 하단. 단순 스피너 대신 콘텐츠 모양 그대로 두 줄
 * shimmer 를 보여줘 "곧 채워질 자리" 임을 명시.
 *
 * Premium 톤 — opacity 0.3 ↔ 0.6 의 미세한 shimmer (1.4s cycle).
 * Toss / Linear 의 skeleton 패턴.
 */
export function UnreadPreviewSkeleton({ accent }: Props) {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 700, easing: Easing.inOut(Easing.quad) }),
                withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.quad) }),
            ),
            -1,
            true,
        );
    }, [opacity]);

    const shimmerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <View style={[styles.bar, { backgroundColor: accent + '55' }]} />
            <View style={styles.list}>
                <Animated.View style={[styles.bone, styles.boneFull, shimmerStyle]} />
                <Animated.View style={[styles.bone, styles.boneHalf, shimmerStyle]} />
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
        gap: 8,
    },
    bone: {
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.borderStrong,
    },
    boneFull: { width: '85%' },
    boneHalf: { width: '55%' },
});
