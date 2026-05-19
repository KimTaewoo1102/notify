import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { colors, typography } from '../../../ui/theme';

interface Props {
    selectionMode: boolean;
    selectedCount: number;
    /** selection mode off 일 때 표시할 기본 타이틀 (섹션명 또는 '고정' 등). */
    baseTitle: string;
}

/**
 * 헤더 타이틀 — selection mode 토글 시 cross-fade + 미세 translateY.
 *
 * 의도: 기존엔 useLayoutEffect 로 헤더 텍스트가 즉시(0ms) 바뀌었지만
 * SelectionActionBar 은 spring slide-up(200ms+) 으로 desync 발생.
 * 두 transition 의 ease curve 를 같은 톤으로 맞춰 시각적 연결성 확보.
 *
 *  - 220ms / Easing.out(cubic) — SelectionActionBar 과 같은 톤.
 *  - 두 텍스트가 절대 위치 겹치게 두고 opacity 와 ±4px translateY 로 부드럽게 교체.
 */
export function SelectionHeaderTitle({ selectionMode, selectedCount, baseTitle }: Props) {
    const progress = useSharedValue(selectionMode ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(selectionMode ? 1 : 0, {
            duration: 220,
            easing: Easing.out(Easing.cubic),
        });
    }, [selectionMode, progress]);

    const baseStyle = useAnimatedStyle(() => ({
        opacity: 1 - progress.value,
        transform: [{ translateY: progress.value * -4 }],
    }));
    const selectionStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ translateY: (1 - progress.value) * 4 }],
    }));

    return (
        <View style={styles.container}>
            <Animated.Text
                style={[styles.title, styles.layer, baseStyle]}
                numberOfLines={1}
            >
                {baseTitle}
            </Animated.Text>
            <Animated.Text
                style={[styles.title, styles.layer, selectionStyle]}
                numberOfLines={1}
            >
                {selectedCount}개 선택
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // 헤더 영역 내부 — 두 Animated.Text 가 겹쳐서 cross-fade 하도록 relative 컨테이너.
        minWidth: 120,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...typography.h3,
        color: colors.textPrimary,
        fontWeight: '600',
        textAlign: 'center',
    },
    layer: {
        position: 'absolute',
    },
});
