import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

const BTN_W = 72;
const ACTION_WIDTH = BTN_W * 2; // 알림 토글 + 삭제
const TRIGGER = ACTION_WIDTH * 0.85;
const RUBBER = 0.35;
const SWIPE_OUT_X = -600;

interface Props {
    onDelete: () => void;
    onToggleNotify: () => void;
    notifyOn: boolean;
    children: React.ReactNode;
}

export function SwipeableSectionRow({ onDelete, onToggleNotify, notifyOn, children }: Props) {
    const translateX = useSharedValue(0);
    const triggered = useSharedValue(false);

    const onDeleteRef = useRef(onDelete);
    const onToggleNotifyRef = useRef(onToggleNotify);
    useEffect(() => { onDeleteRef.current = onDelete; }, [onDelete]);
    useEffect(() => { onToggleNotifyRef.current = onToggleNotify; }, [onToggleNotify]);

    const callOnDelete = () => onDeleteRef.current();
    const callToggleNotify = () => {
        onToggleNotifyRef.current();
        // 알림 토글 후 row 닫기
        translateX.value = withSpring(0, { damping: 16, stiffness: 220 });
        triggered.value = false;
    };

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
                    } else if (-translateX.value > ACTION_WIDTH * 0.35) {
                        // 절반 이상 스와이프 시 버튼 노출 위치에 스냅
                        translateX.value = withSpring(-ACTION_WIDTH, {
                            damping: 16,
                            stiffness: 220,
                        });
                        triggered.value = false;
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

    const actionsOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            -translateX.value,
            [0, ACTION_WIDTH * 0.4, ACTION_WIDTH],
            [0, 0.6, 1],
            Extrapolation.CLAMP,
        ),
    }));

    return (
        <View style={styles.wrap}>
            {/* 액션 배경 — 알림 버튼(좌) + 삭제 버튼(우) */}
            <Animated.View style={[styles.actionsBg, actionsOpacity]}>
                {/* 알림 토글 버튼 */}
                <Pressable
                    onPress={() => runOnJS(callToggleNotify)()}
                    style={[styles.actionBtn, styles.notifyBtn]}
                >
                    <Ionicons
                        name={notifyOn ? 'notifications-off' : 'notifications'}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.actionLabel}>
                        {notifyOn ? '알림끄기' : '알림켜기'}
                    </Text>
                </Pressable>

                {/* 삭제 버튼 */}
                <Pressable
                    onPress={() => runOnJS(callOnDelete)()}
                    style={[styles.actionBtn, styles.deleteBtn]}
                >
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.actionLabel}>삭제</Text>
                </Pressable>
            </Animated.View>

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
        flexDirection: 'row',
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    actionBtn: {
        width: BTN_W,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    notifyBtn: {
        backgroundColor: colors.accentAlt, // 파란 계열
    },
    deleteBtn: {
        backgroundColor: colors.danger,
    },
    actionLabel: {
        ...typography.caption,
        color: '#fff',
        fontWeight: '600',
        fontSize: 10,
    },
});
