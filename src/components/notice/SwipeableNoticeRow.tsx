import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, spacing } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import { useScrollRef } from '../../contexts/ScrollRefContext';

interface Props {
    children: React.ReactNode;
    onDelete: () => void;
    activeRowId?: string | null;
    rowId: string;
    onActivate: (id: string) => void;
}

/**
 * 고급 스와이프-삭제 행.
 *
 * 핵심 해결:
 *  - ScrollView.setNativeProps({ scrollEnabled: false/true })로
 *    수직 스크롤 제스처와의 충돌 차단.
 *  - 가로 의도(dx/dy 비율)가 명확할 때만 제스처를 가로챔.
 */

const ACTION_WIDTH = 88;
const OPEN_X = -ACTION_WIDTH;
const HAPTIC_THRESHOLD = -ACTION_WIDTH * 0.65;
const COMMIT_THRESHOLD = -180;

export default function SwipeableNoticeRow({
    children,
    onDelete,
    activeRowId,
    rowId,
    onActivate,
}: Props) {
    const scrollRef = useScrollRef();
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const [collapseHeight, setCollapseHeight] = useState<number | null>(null);
    const collapseAnim = useRef(new Animated.Value(1)).current;
    const measuredHeight = useRef(0);

    const isOpen = useRef(false);
    const hapticArmed = useRef(true);

    // 다른 행이 열리면 닫힘
    useEffect(() => {
        if (activeRowId && activeRowId !== rowId && isOpen.current) {
            close();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeRowId, rowId]);

    const enableScroll = () =>
        scrollRef?.current?.setNativeProps({ scrollEnabled: true });

    const disableScroll = () =>
        scrollRef?.current?.setNativeProps({ scrollEnabled: false });

    const close = () => {
        isOpen.current = false;
        enableScroll();
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 9,
            tension: 80,
        }).start();
    };

    const openSnap = () => {
        isOpen.current = true;
        onActivate(rowId);
        Animated.spring(translateX, {
            toValue: OPEN_X,
            useNativeDriver: true,
            friction: 9,
            tension: 90,
        }).start();
    };

    const commitDelete = () => {
        haptics.confirm();
        enableScroll();
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: -600,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (measuredHeight.current > 0) {
                setCollapseHeight(measuredHeight.current);
                collapseAnim.setValue(1);
                Animated.timing(collapseAnim, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.inOut(Easing.cubic),
                    useNativeDriver: false,
                }).start(() => onDelete());
            } else {
                onDelete();
            }
        });
    };

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                // 탭은 Pressable에 넘기고 이동에서만 제스처 경쟁
                onStartShouldSetPanResponder: () => false,
                onStartShouldSetPanResponderCapture: () => false,

                // 가로 의도가 명확하면(dx > dy × 1.5) 즉시 가로채기
                onMoveShouldSetPanResponder: (_, g) =>
                    Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,

                onPanResponderGrant: () => {
                    hapticArmed.current = true;
                    // ScrollView 스크롤 즉시 차단 → 카드가 부드럽게 따라옴
                    disableScroll();
                    onActivate(rowId);
                },

                onPanResponderMove: (_, g) => {
                    const base = isOpen.current ? OPEN_X : 0;
                    let next = base + g.dx;

                    if (next > 0) next = next * 0.2;
                    if (next < -ACTION_WIDTH * 1.7) {
                        const overflow = next + ACTION_WIDTH * 1.7;
                        next = -ACTION_WIDTH * 1.7 + overflow * 0.3;
                    }
                    translateX.setValue(next);

                    if (hapticArmed.current && next < HAPTIC_THRESHOLD) {
                        haptics.warn();
                        hapticArmed.current = false;
                    } else if (!hapticArmed.current && next > HAPTIC_THRESHOLD) {
                        hapticArmed.current = true;
                    }
                },

                onPanResponderRelease: (_, g) => {
                    const base = isOpen.current ? OPEN_X : 0;
                    const finalX = base + g.dx;

                    if (finalX < COMMIT_THRESHOLD) {
                        commitDelete();
                    } else if (finalX < OPEN_X / 2) {
                        // OPEN_X의 절반(-44) 이상 밀면 snap-open
                        openSnap();
                    } else {
                        close();
                    }
                },

                onPanResponderTerminate: () => close(),

                onShouldBlockNativeResponder: () => true,
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [rowId],
    );

    // 휴지통 등장 애니메이션
    const trashOpacity = translateX.interpolate({
        inputRange: [OPEN_X, OPEN_X * 0.4, 0],
        outputRange: [1, 0.7, 0],
        extrapolate: 'clamp',
    });
    const trashTranslateX = translateX.interpolate({
        inputRange: [OPEN_X, 0],
        outputRange: [0, ACTION_WIDTH * 0.45],
        extrapolate: 'clamp',
    });
    const trashScale = translateX.interpolate({
        inputRange: [OPEN_X * 1.15, OPEN_X, OPEN_X * 0.5, 0],
        outputRange: [1.08, 1, 0.92, 0.8],
        extrapolate: 'clamp',
    });

    const wrapperStyle =
        collapseHeight != null
            ? {
                  height: collapseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, collapseHeight],
                  }),
                  marginBottom: collapseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, spacing.md],
                  }),
                  overflow: 'hidden' as const,
                  opacity,
              }
            : { opacity };

    return (
        <Animated.View style={[styles.wrapper, wrapperStyle]}>
            {/* 우측 휴지통 — 카드가 밀리면 드러남 */}
            <Animated.View
                style={[
                    styles.action,
                    {
                        opacity: trashOpacity,
                        transform: [{ translateX: trashTranslateX }],
                    },
                ]}
                pointerEvents="box-none"
            >
                <Pressable
                    onPress={commitDelete}
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
                    <Animated.View
                        style={[styles.trashInner, { transform: [{ scale: trashScale }] }]}
                    >
                        <Ionicons name="trash-outline" size={22} color="#fff" />
                        <Text style={styles.trashLabel}>삭제</Text>
                    </Animated.View>
                </Pressable>
            </Animated.View>

            {/* 카드 본체 */}
            <Animated.View
                {...panResponder.panHandlers}
                onLayout={e => {
                    if (!measuredHeight.current) {
                        measuredHeight.current = e.nativeEvent.layout.height;
                    }
                }}
                style={{ transform: [{ translateX }] }}
            >
                {children}
            </Animated.View>
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
