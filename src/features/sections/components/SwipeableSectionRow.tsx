import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, spacing, typography } from '../../../ui/theme';
import { haptic } from '../../../ui/feedback/haptics';

const ACTION_WIDTH = 88;
const TRIGGER = 80;
const RUBBER = 0.35;

interface Props {
    onDelete: () => void;
    children: React.ReactNode;
}

/**
 * Pan 으로 좌측 스와이프 → 빨간 삭제 액션 노출.
 * - TRIGGER 이상에서 손을 떼면: 화면 밖으로 슬라이드 + onDelete
 * - 미만이면: spring back
 * - 트리거 경계 진입 시 selection 햅틱으로 "딸깍" 감각.
 */
export function SwipeableSectionRow({ onDelete, children }: Props) {
    const translateX = useSharedValue(0);
    const triggered = useSharedValue(false);

    const pan = Gesture.Pan()
        .activeOffsetX([-12, 999])
        .failOffsetY([-14, 14])
        .onUpdate((e) => {
            'worklet';
            const dx = Math.min(0, e.translationX);
            const overshoot = Math.max(0, -dx - ACTION_WIDTH);
            translateX.value = -Math.min(-dx, ACTION_WIDTH + overshoot * RUBBER);

            const past = -translateX.value > TRIGGER;
            if (past !== triggered.value) {
                triggered.value = past;
                runOnJS(haptic)('selection');
            }
        })
        .onEnd(() => {
            'worklet';
            if (-translateX.value > TRIGGER) {
                runOnJS(haptic)('medium');
                translateX.value = withTiming(-600, { duration: 220 }, (finished) => {
                    if (finished) runOnJS(onDelete)();
                });
            } else {
                translateX.value = withSpring(0, { damping: 16, stiffness: 220 });
                triggered.value = false;
            }
        });

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const actionStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            -translateX.value,
            [0, ACTION_WIDTH],
            [0.4, 1],
            Extrapolation.CLAMP,
        ),
        transform: [
            {
                scale: interpolate(
                    -translateX.value,
                    [0, TRIGGER, TRIGGER + 1],
                    [0.85, 1, 1.1],
                    Extrapolation.CLAMP,
                ),
            },
        ],
    }));

    return (
        <View style={styles.wrap}>
            <View style={styles.actionsBg}>
                <Animated.View style={[styles.action, actionStyle]}>
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.actionLabel}>삭제</Text>
                </Animated.View>
            </View>
            <GestureDetector gesture={pan}>
                <Animated.View style={cardStyle}>{children}</Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { position: 'relative' },
    actionsBg: {
        position: 'absolute',
        top: 6,
        right: 0,
        bottom: 6,
        width: ACTION_WIDTH,
        backgroundColor: colors.danger,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    action: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    actionLabel: {
        ...typography.caption,
        color: '#fff',
        fontWeight: '600',
    },
});
