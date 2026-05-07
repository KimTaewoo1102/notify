import React, { useEffect, useMemo, useRef } from 'react';
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

const ACTION_WIDTH = 96;
const TRIGGER = 88;
const RUBBER = 0.35;
const SWIPE_OUT_X = 600;

interface Props {
    onRestore: () => void;
    children: React.ReactNode;
}

/**
 * 우측 Pan 스와이프 → 초록 복구 액션 노출.
 * 휴지통 카드 전용. SwipeableSectionRow 와 좌우 대칭으로 동작.
 *
 * - activeOffsetX 는 양수 영역만(오른쪽으로만 활성)
 * - TRIGGER 임계값을 넘기면 selection 햅틱(한 번)
 * - onEnd 에서 임계값 통과 시 right-out 애니메이션 → callback
 */
export function SwipeToRestoreRow({ onRestore, children }: Props) {
    const translateX = useSharedValue(0);
    const triggered = useSharedValue(false);

    const onRestoreRef = useRef(onRestore);
    useEffect(() => {
        onRestoreRef.current = onRestore;
    }, [onRestore]);

    const callOnRestore = () => onRestoreRef.current();

    const pan = useMemo(
        () =>
            Gesture.Pan()
                .activeOffsetX([-999, 12])
                .failOffsetY([-14, 14])
                .onUpdate((e) => {
                    const dx = Math.max(0, e.translationX);
                    const overshoot = Math.max(0, dx - ACTION_WIDTH);
                    translateX.value = Math.min(
                        dx,
                        ACTION_WIDTH + overshoot * RUBBER,
                    );

                    const past = translateX.value > TRIGGER;
                    if (past !== triggered.value) {
                        triggered.value = past;
                        runOnJS(haptic)('selection');
                    }
                })
                .onEnd(() => {
                    if (translateX.value > TRIGGER) {
                        runOnJS(haptic)('success');
                        translateX.value = withTiming(
                            SWIPE_OUT_X,
                            { duration: 220 },
                            (finished) => {
                                if (finished) runOnJS(callOnRestore)();
                            },
                        );
                    } else {
                        translateX.value = withSpring(0, {
                            damping: 16,
                            stiffness: 220,
                        });
                        triggered.value = false;
                    }
                }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const actionStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [0, ACTION_WIDTH],
            [0.4, 1],
            Extrapolation.CLAMP,
        ),
        transform: [
            {
                scale: interpolate(
                    translateX.value,
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
                    <Ionicons name="arrow-undo" size={20} color="#fff" />
                    <Text style={styles.actionLabel}>복구</Text>
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
        top: 0,
        bottom: 0,
        left: 0,
        width: ACTION_WIDTH,
        backgroundColor: colors.success,
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
