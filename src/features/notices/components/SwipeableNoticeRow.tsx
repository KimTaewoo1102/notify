import React, { useImperativeHandle, useRef } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { haptic } from '../../../ui/feedback/haptics';
import { colors, spacing } from '../../../ui/theme';

const SCREEN_W = Dimensions.get('window').width;
const FULL_SWIPE_THRESHOLD = SCREEN_W * 0.55;
const REVEAL_THRESHOLD = 72;

export interface SwipeableNoticeRowHandle {
    close: () => void;
}

interface Props {
    onDelete: () => void;
    /** 휴지통 버튼이 처음 노출(reveal)될 때 호출 — 다른 row 닫기에 사용 */
    onReveal?: () => void;
    children: React.ReactNode;
}

/**
 * 좌측 스와이프 → 휴지통 버튼 노출 → 탭 or Full-swipe 시 삭제.
 *
 * Expo Go 호환: PanResponder + React Native Animated.
 * forwardRef로 close() 메서드를 외부에 노출해 외부 터치 시 닫기 지원.
 */
export const SwipeableNoticeRow = React.forwardRef<SwipeableNoticeRowHandle, Props>(
    function SwipeableNoticeRow({ onDelete, onReveal, children }, ref) {
        const translateX = useRef(new Animated.Value(0)).current;
        const trashOpacity = useRef(new Animated.Value(0)).current;
        const isFullSwiped = useRef(false);
        const isRevealed = useRef(false);

        const reset = () => {
            isFullSwiped.current = false;
            isRevealed.current = false;
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 200,
            }).start();
            Animated.timing(trashOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        };

        useImperativeHandle(ref, () => ({ close: reset }));

        const triggerDelete = () => {
            haptic('heavy');
            Animated.timing(translateX, {
                toValue: -SCREEN_W,
                duration: 220,
                useNativeDriver: true,
            }).start(() => {
                onDelete();
            });
        };

        const panResponder = useRef(
            PanResponder.create({
                // dx가 명확히 수평 방향일 때만 제스처를 획득:
                //   · 수평 이동 최소 10px
                //   · 수평 이동이 수직의 2.5배 이상 (기울기 약 22°)
                //   · 수직 이동이 15px 미만 (수직 스크롤과 명확히 구분)
                onMoveShouldSetPanResponder: (_, g) =>
                    Math.abs(g.dx) > 10 &&
                    Math.abs(g.dx) > Math.abs(g.dy) * 2.5 &&
                    Math.abs(g.dy) < 15,
                onPanResponderGrant: () => {
                    isFullSwiped.current = false;
                },
                onPanResponderMove: (_, g) => {
                    const dx = Math.min(0, g.dx);
                    translateX.setValue(dx);

                    const ratio = Math.min(1, Math.abs(dx) / REVEAL_THRESHOLD);
                    trashOpacity.setValue(ratio);

                    if (Math.abs(dx) >= FULL_SWIPE_THRESHOLD && !isFullSwiped.current) {
                        isFullSwiped.current = true;
                        haptic('medium');
                    }
                },
                onPanResponderRelease: (_, g) => {
                    const dx = Math.min(0, g.dx);
                    if (Math.abs(dx) >= FULL_SWIPE_THRESHOLD) {
                        triggerDelete();
                    } else if (Math.abs(dx) >= REVEAL_THRESHOLD) {
                        if (!isRevealed.current) {
                            isRevealed.current = true;
                            onReveal?.();
                        }
                        Animated.spring(translateX, {
                            toValue: -REVEAL_THRESHOLD,
                            useNativeDriver: true,
                            damping: 20,
                            stiffness: 200,
                        }).start();
                        trashOpacity.setValue(1);
                    } else {
                        reset();
                    }
                },
                onPanResponderTerminate: () => reset(),
            }),
        ).current;

        return (
            <View style={styles.container}>
                {/* 배경 — 휴지통 버튼 영역 */}
                <Animated.View style={[styles.trashBg, { opacity: trashOpacity }]}>
                    <Pressable
                        onPress={triggerDelete}
                        style={styles.trashBtn}
                        hitSlop={8}
                    >
                        <Ionicons name="trash" size={20} color="#fff" />
                        <Text style={styles.trashLabel}>삭제</Text>
                    </Pressable>
                </Animated.View>

                {/* 공지 카드 (슬라이드되는 앞면) */}
                <Animated.View
                    style={{ transform: [{ translateX }] }}
                    {...panResponder.panHandlers}
                >
                    {children}
                </Animated.View>
            </View>
        );
    },
);

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
    trashBg: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: REVEAL_THRESHOLD + 24,
        backgroundColor: colors.danger,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trashBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        flex: 1,
        width: '100%',
    },
    trashLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
});
