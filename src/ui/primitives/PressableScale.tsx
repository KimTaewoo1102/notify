import React from 'react';
import {
    Pressable,
    type PressableProps,
    type StyleProp,
    type ViewStyle,
    type GestureResponderEvent,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { haptic, type HapticKind } from '../feedback/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_IN = { damping: 22, stiffness: 320, mass: 0.6 } as const;
const SPRING_OUT = { damping: 12, stiffness: 180, mass: 0.7 } as const;

export interface PressableScaleProps
    extends Omit<PressableProps, 'style' | 'children'> {
    scaleTo?: number;
    /** null 이면 햅틱 비활성. */
    hapticKind?: HapticKind | null;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

/**
 * 어디서나 쓸 수 있는 "쫀득한" 클릭 컴포넌트.
 * - onPressIn: 빠르게 0.965 까지 압축
 * - onPressOut: 부드럽게 1.0 으로 복귀 (반동 살짝)
 * - onPress: 햅틱 발사 + 외부 핸들러 호출
 */
export function PressableScale({
    scaleTo = 0.965,
    hapticKind = 'light',
    onPress,
    onPressIn,
    onPressOut,
    style,
    children,
    disabled,
    ...rest
}: PressableScaleProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            {...rest}
            disabled={disabled}
            onPressIn={(e: GestureResponderEvent) => {
                scale.value = withSpring(scaleTo, SPRING_IN);
                onPressIn?.(e);
            }}
            onPressOut={(e: GestureResponderEvent) => {
                scale.value = withSpring(1, SPRING_OUT);
                onPressOut?.(e);
            }}
            onPress={(e: GestureResponderEvent) => {
                if (hapticKind) haptic(hapticKind);
                onPress?.(e);
            }}
            style={[animatedStyle, style]}
        >
            {children}
        </AnimatedPressable>
    );
}
