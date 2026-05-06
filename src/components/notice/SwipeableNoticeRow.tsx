import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { radius, spacing } from '../../constants/theme';
import { haptics } from '../../utils/haptics';

interface Props {
    children: React.ReactNode;
    onDelete: () => void;
    activeRowId?: string | null;
    rowId: string;
    onActivate: (id: string | null) => void;
}

const ACTION_WIDTH = 88;
const OPEN_X = -ACTION_WIDTH;
const HAPTIC_THRESHOLD = -ACTION_WIDTH * 0.65;
const COMMIT_THRESHOLD = -180;

const SPRING = { damping: 18, stiffness: 240, mass: 0.8 };

/**
 * Reanimated v3 + Gesture Handler 기반 고성능 스와이프 행.
 * - 모든 애니메이션이 UI thread 에서 동작 (120fps).
 * - 가로 의도가 명확할 때만 활성화 (수직 스크롤과 충돌 방지).
 */
export default function SwipeableNoticeRow({
    children,
    onDelete,
    activeRowId,
    rowId,
    onActivate,
}: Props) {
    const translateX = useSharedValue(0);
    const itemOpacity = useSharedValue(1);
    const itemHeight = useSharedValue(1);
    const hapticArmed = useSharedValue(true);
    const isOpen = useSharedValue(false);

    // 다른 행이 열리면 자동 닫힘
    React.useEffect(() => {
        if (activeRowId && activeRowId !== rowId && isOpen.value) {
            translateX.value = withSpring(0, SPRING);
            isOpen.value = false;
        }
    }, [activeRowId, rowId, isOpen, translateX]);

    const triggerHaptic = useCallback((kind: 'warn' | 'confirm') => {
        if (kind === 'warn') haptics.warn();
        else haptics.confirm();
    }, []);

    const triggerActivate = useCallback(
        (id: string | null) => onActivate(id),
        [onActivate],
    );

    const triggerDelete = useCallback(() => onDelete(), [onDelete]);

    const pan = Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-12, 12])
        .onBegin(() => {
            hapticArmed.value = true;
            runOnJS(triggerActivate)(rowId);
        })
        .onUpdate(e => {
            const base = isOpen.value ? OPEN_X : 0;
            let next = base + e.translationX;
            if (next > 0) next = next * 0.2;
            if (next < -ACTION_WIDTH * 1.7) {
                const overflow = next + ACTION_WIDTH * 1.7;
                next = -ACTION_WIDTH * 1.7 + overflow * 0.3;
            }
            translateX.value = next;

            if (hapticArmed.value && next < HAPTIC_THRESHOLD) {
                hapticArmed.value = false;
                runOnJS(triggerHaptic)('warn');
            } else if (!hapticArmed.value && next > HAPTIC_THRESHOLD) {
                hapticArmed.value = true;
            }
        })
        .onEnd(e => {
            const base = isOpen.value ? OPEN_X : 0;
            const final = base + e.translationX;

            if (final < COMMIT_THRESHOLD) {
                runOnJS(triggerHaptic)('confirm');
                translateX.value = withTiming(-600, {
                    duration: 220,
                    easing: Easing.out(Easing.cubic),
                });
                itemOpacity.value = withTiming(0, { duration: 200 });
                itemHeight.value = withTiming(
                    0,
                    { duration: 220, easing: Easing.inOut(Easing.cubic) },
                    finished => {
                        if (finished) runOnJS(triggerDelete)();
                    },
                );
            } else if (final < OPEN_X / 2) {
                isOpen.value = true;
                translateX.value = withSpring(OPEN_X, SPRING);
            } else {
                isOpen.value = false;
                translateX.value = withSpring(0, SPRING);
            }
        });

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const wrapperStyle = useAnimatedStyle(() => ({
        opacity: itemOpacity.value,
        transform: [{ scaleY: itemHeight.value }],
        // collapse via maxHeight surrogate: vertical scale collapses height visually
    }));

    const trashStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [OPEN_X, OPEN_X * 0.4, 0],
            [1, 0.7, 0],
            Extrapolation.CLAMP,
        );
        const tx = interpolate(
            translateX.value,
            [OPEN_X, 0],
            [0, ACTION_WIDTH * 0.45],
            Extrapolation.CLAMP,
        );
        const scale = interpolate(
            translateX.value,
            [OPEN_X * 1.15, OPEN_X, OPEN_X * 0.5, 0],
            [1.08, 1, 0.92, 0.8],
            Extrapolation.CLAMP,
        );
        return {
            opacity,
            transform: [{ translateX: tx }, { scale }],
        };
    });

    return (
        <Animated.View style={[styles.wrapper, wrapperStyle]}>
            <Animated.View style={[styles.action, trashStyle]} pointerEvents="box-none">
                <Pressable
                    onPress={() => {
                        haptics.confirm();
                        onDelete();
                    }}
                    style={({ pressed }) => [
                        styles.trashButton,
                        pressed && styles.trashPressed,
                    ]}
                    hitSlop={8}
                >
                    <LinearGradient
                        colors={['#FF6A5A', '#E03A2C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Animated.View style={styles.trashInner}>
                        <Ionicons name="trash-outline" size={22} color="#fff" />
                        <Text style={styles.trashLabel}>삭제</Text>
                    </Animated.View>
                </Pressable>
            </Animated.View>

            <GestureDetector gesture={pan}>
                <Animated.View style={cardStyle}>{children}</Animated.View>
            </GestureDetector>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    action: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 4,
    },
    trashButton: {
        width: ACTION_WIDTH - spacing.sm,
        height: '88%',
        borderRadius: radius.lg,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    trashPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
    trashInner: { alignItems: 'center', justifyContent: 'center' },
    trashLabel: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 4,
        textAlign: 'center',
    },
});
