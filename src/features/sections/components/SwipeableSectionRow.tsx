import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, typography } from '../../../ui/theme';
import { haptic } from '../../../ui/feedback/haptics';

const BTN_W = 72;
const ACTION_WIDTH = BTN_W * 2;
const EASE_OUT = Easing.out(Easing.cubic);
const ANIM = { duration: 180, easing: EASE_OUT } as const;

export interface SwipeableSectionRowHandle {
    close: () => void;
}

interface Props {
    onDelete: () => void;
    onToggleNotify: () => void;
    notifyOn: boolean;
    /** row가 snap-open 위치에 도달했을 때 호출 — 다른 row 닫기에 사용 */
    onOpen?: () => void;
    children: React.ReactNode;
}

export const SwipeableSectionRow = React.forwardRef<SwipeableSectionRowHandle, Props>(
    function SwipeableSectionRow({ onDelete, onToggleNotify, notifyOn, onOpen, children }, ref) {
        const translateX = useSharedValue(0);

        // JS 콜백을 ref로 봉인 → gesture closure stale 방지
        const onDeleteRef = useRef(onDelete);
        const onToggleNotifyRef = useRef(onToggleNotify);
        const onOpenRef = useRef(onOpen);
        useEffect(() => { onDeleteRef.current = onDelete; }, [onDelete]);
        useEffect(() => { onToggleNotifyRef.current = onToggleNotify; }, [onToggleNotify]);
        useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);

        const closeAnim = () => {
            translateX.value = withTiming(0, ANIM);
        };

        useImperativeHandle(ref, () => ({ close: closeAnim }));

        const callDelete = () => {
            closeAnim();
            onDeleteRef.current();
        };

        const callToggleNotify = () => {
            closeAnim();
            onToggleNotifyRef.current();
        };

        const pan = useMemo(
            () =>
                Gesture.Pan()
                    .activeOffsetX([-10, 999])
                    .failOffsetY([-8, 8])
                    .onUpdate((e) => {
                        // 이동 범위를 ACTION_WIDTH로 hard clamp — 오버슈트 없음
                        const dx = Math.min(0, e.translationX);
                        translateX.value = Math.max(-ACTION_WIDTH, dx);
                    })
                    .onEnd(() => {
                        const opened = -translateX.value >= ACTION_WIDTH * 0.5;
                        if (opened) {
                            translateX.value = withTiming(-ACTION_WIDTH, ANIM);
                            runOnJS(haptic)('selection');
                            runOnJS(() => onOpenRef.current?.())();
                        } else {
                            translateX.value = withTiming(0, ANIM);
                        }
                    }),
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [],
        );

        const cardStyle = useAnimatedStyle(() => ({
            transform: [{ translateX: translateX.value }],
        }));

        return (
            <View style={styles.wrap}>
                {/* 액션 버튼 배경 — 알림 토글(좌) + 삭제(우) */}
                <View style={styles.actionsBg}>
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

                    <Pressable
                        onPress={() => runOnJS(callDelete)()}
                        style={[styles.actionBtn, styles.deleteBtn]}
                    >
                        <Ionicons name="trash" size={20} color="#fff" />
                        <Text style={styles.actionLabel}>삭제</Text>
                    </Pressable>
                </View>

                <GestureDetector gesture={pan}>
                    <Animated.View style={cardStyle}>{children}</Animated.View>
                </GestureDetector>
            </View>
        );
    },
);

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
        backgroundColor: colors.accentAlt,
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
