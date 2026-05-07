import React, { useRef } from 'react';
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
/** 이 임계값 이상 스와이프되면 full-swipe 즉시 삭제. */
const FULL_SWIPE_THRESHOLD = SCREEN_W * 0.55;
/** 이 임계값 이상이면 휴지통 버튼 노출, 미만이면 복귀. */
const REVEAL_THRESHOLD = 72;

interface Props {
    onDelete: () => void;
    children: React.ReactNode;
}

/**
 * 좌측 스와이프 → 휴지통 버튼 노출 → 탭 or Full-swipe 시 삭제.
 *
 * Expo Go 호환: PanResponder + React Native Animated (Reanimated 불필요).
 * Full-swipe(화면 55% 이상) 시 햅틱 + 즉시 삭제.
 */
export function SwipeableNoticeRow({ onDelete, children }: Props) {
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
            onMoveShouldSetPanResponder: (_, g) =>
                Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
            onPanResponderGrant: () => {
                isFullSwiped.current = false;
            },
            onPanResponderMove: (_, g) => {
                const dx = Math.min(0, g.dx);
                translateX.setValue(dx);

                const ratio = Math.min(1, Math.abs(dx) / REVEAL_THRESHOLD);
                trashOpacity.setValue(ratio);

                // full-swipe 도달 시 한 번만 진동으로 피드백
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
                    isRevealed.current = true;
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
}

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
