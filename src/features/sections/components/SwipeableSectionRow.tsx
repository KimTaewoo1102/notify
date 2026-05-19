import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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

        const callOnOpen = () => {
            onOpenRef.current?.();
        };

        const pan = useMemo(
            () =>
                Gesture.Pan()
                    .activeOffsetX([-12, 999])
                    .failOffsetY([-10, 10])
                    .onUpdate((e) => {
                        const dx = Math.min(0, e.translationX);
                        translateX.value = Math.max(-ACTION_WIDTH, dx);
                    })
                    .onEnd(() => {
                        const opened = -translateX.value >= ACTION_WIDTH * 0.5;
                        if (opened) {
                            translateX.value = withTiming(-ACTION_WIDTH, ANIM);
                            runOnJS(haptic)('selection');
                            runOnJS(callOnOpen)();
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

        // 버튼 컨테이너 너비를 translateX와 동기화.
        // 카드가 LEFT로 이동한 거리만큼만 버튼이 노출된다.
        // 카드가 원위치일 때 width=0 → 버튼 완전 숨김, 유리 카드 뒤로 비치지 않음.
        const actionsRevealStyle = useAnimatedStyle(() => ({
            width: Math.max(0, Math.min(-translateX.value, ACTION_WIDTH)),
        }));

        return (
            <View style={styles.wrap}>
                {/* GestureDetector 먼저 → 카드가 낮은 z-index */}
                <GestureDetector gesture={pan}>
                    <Animated.View style={cardStyle}>{children}</Animated.View>
                </GestureDetector>

                {/* actionsReveal: 카드보다 높은 z-index, width 애니메이션으로 노출 제어.
                    BlurView는 카드 레이어 위에 있으므로 카드 유리면에 비치지 않는다. */}
                <Animated.View style={[styles.actionsReveal, actionsRevealStyle]}>
                    <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.actionsBg}>
                        <Pressable
                            onPress={callToggleNotify}
                            style={[styles.actionBtn, styles.notifyBtn]}
                        >
                            <View style={[StyleSheet.absoluteFill, styles.notifyOverlay]} />
                            <Ionicons
                                name={notifyOn ? 'notifications-off' : 'notifications'}
                                size={20}
                                color={colors.accentAlt}
                            />
                            <Text style={[styles.actionLabel, { color: colors.accentAlt }]}>
                                {notifyOn ? '알림끄기' : '알림켜기'}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={callDelete}
                            style={[styles.actionBtn, styles.deleteBtn]}
                        >
                            <View style={[StyleSheet.absoluteFill, styles.deleteOverlay]} />
                            <Ionicons name="trash" size={20} color={colors.danger} />
                            <Text style={[styles.actionLabel, { color: colors.danger }]}>삭제</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        );
    },
);

const styles = StyleSheet.create({
    wrap: { position: 'relative' },

    /* 카드 슬라이드 거리만큼 너비가 늘어나는 버튼 컨테이너.
       overflow:hidden + borderTopRightRadius/borderBottomRightRadius 로
       카드 우측 모서리와 정확히 일치. */
    actionsReveal: {
        position: 'absolute',
        top: 6,
        bottom: 6,
        right: 0,
        overflow: 'hidden',
        borderTopRightRadius: radius.lg,
        borderBottomRightRadius: radius.lg,
    },
    actionsBg: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: ACTION_WIDTH,
        flexDirection: 'row',
    },
    actionBtn: {
        width: BTN_W,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        overflow: 'hidden',
    },
    notifyOverlay: {
        backgroundColor: `${colors.accentAlt}22`,
    },
    deleteOverlay: {
        backgroundColor: `${colors.danger}22`,
    },
    notifyBtn: {},
    deleteBtn: {
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: 'rgba(255,255,255,0.08)',
    },
    actionLabel: {
        ...typography.caption,
        fontWeight: '600',
        fontSize: 10,
    },
});
