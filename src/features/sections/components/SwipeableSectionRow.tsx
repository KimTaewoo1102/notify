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

const ACTION_WIDTH = 88;
const TRIGGER = 80;
const RUBBER = 0.35;
const SWIPE_OUT_X = -600;

interface Props {
    onDelete: () => void;
    children: React.ReactNode;
}

/**
 * 좌측 Pan 스와이프 → 빨간 삭제 액션 노출.
 *
 * Reanimated 4 + RNGH 2.x 정석 패턴
 * ────────────────────────────────────
 * 1. gesture 콜백은 babel plugin 이 자동 워크릿화 → 'worklet' 지시자 불필요.
 * 2. UI 스레드(워크릿) ↔ JS 스레드 경계는 모두 runOnJS 경유.
 * 3. JS 측 콜백(onDelete)은 ref 로 미러링해 gesture 객체를 한 번만 생성.
 *    SharedValue 는 stable identity 라 deps 에 넣어도 재생성되지 않음.
 */
export function SwipeableSectionRow({ onDelete, children }: Props) {
    const translateX = useSharedValue(0);
    const triggered = useSharedValue(false);

    // onDelete prop 을 ref 로 봉인 → gesture closure 가 stale 해지지 않음.
    const onDeleteRef = useRef(onDelete);
    useEffect(() => {
        onDeleteRef.current = onDelete;
    }, [onDelete]);

    // JS 스레드에서 호출될 wrapper. 워크릿 closure 가 캡쳐할 stable reference.
    const callOnDelete = () => onDeleteRef.current();

    const pan = useMemo(
        () =>
            Gesture.Pan()
                .activeOffsetX([-10, 999])
                .failOffsetY([-8, 8])
                .onUpdate((e) => {
                    const dx = Math.min(0, e.translationX);
                    const overshoot = Math.max(0, -dx - ACTION_WIDTH);
                    translateX.value = -Math.min(
                        -dx,
                        ACTION_WIDTH + overshoot * RUBBER,
                    );

                    const past = -translateX.value > TRIGGER;
                    if (past !== triggered.value) {
                        triggered.value = past;
                        runOnJS(haptic)('selection');
                    }
                })
                .onEnd(() => {
                    if (-translateX.value > TRIGGER) {
                        runOnJS(haptic)('medium');
                        translateX.value = withTiming(
                            SWIPE_OUT_X,
                            { duration: 220 },
                            (finished) => {
                                if (finished) runOnJS(callOnDelete)();
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
        // SharedValue + ref-stable callback 만 사용 → 1회 생성으로 충분
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

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
