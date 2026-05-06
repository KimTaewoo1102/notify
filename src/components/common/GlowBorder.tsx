import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface Props {
    radius: number;
    /** glow on / off */
    active: boolean;
}

/**
 * 알람 ON 섹션의 글로우 보더.
 *
 * Skia 의존을 제거하고 Reanimated 만으로 호흡 글로우를 구현 — Expo Go 호환.
 *  - borderColor 가 보라(7C5CFF) ↔ 시안(6FE5FF) 사이에서 부드럽게 보간
 *  - shadowOpacity / shadowRadius 가 함께 펄스 → 외곽으로 빛이 새어 나오는 효과
 *  - 호흡 주기 1.8s, mirrored repeat
 *
 * width/height 측정 없이 absoluteFill 만 깔면 부모(섹션 카드 outer) 영역을
 * 그대로 따라가므로, 호출자는 radius 만 알려주면 된다.
 */
export default function GlowBorder({ radius, active }: Props) {
    const t = useSharedValue(0);

    useEffect(() => {
        if (active) {
            t.value = withRepeat(
                withTiming(1, {
                    duration: 1800,
                    easing: Easing.inOut(Easing.quad),
                }),
                -1,
                true,
            );
        } else {
            cancelAnimation(t);
            t.value = withTiming(0, { duration: 260 });
        }
        return () => cancelAnimation(t);
    }, [active, t]);

    const animatedStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            t.value,
            [0, 0.5, 1],
            [
                'rgba(124,92,255,0.25)',
                'rgba(111,229,255,0.95)',
                'rgba(124,92,255,0.55)',
            ],
        );
        const shadowOpacity = interpolate(t.value, [0, 1], [0.15, 0.7]);
        const shadowRadius = interpolate(t.value, [0, 1], [6, 18]);
        return {
            borderColor,
            shadowOpacity,
            shadowRadius,
        };
    });

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                StyleSheet.absoluteFillObject,
                {
                    borderRadius: radius,
                    borderWidth: 1.5,
                    shadowColor: '#7C5CFF',
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 8,
                },
                animatedStyle,
            ]}
        />
    );
}
