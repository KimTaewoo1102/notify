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

interface Props {
    children: React.ReactNode;
    onDelete: () => void;
    /** 다른 행을 열 때 이 행을 닫기 위한 외부 신호 */
    activeRowId?: string | null;
    rowId: string;
    onActivate: (id: string) => void;
}

/**
 * 고급 스와이프-삭제 행.
 *
 * 인터랙션:
 *  1) 좌로 드래그 → 우측에서 휴지통이 비례해서 따라 나옴(parallax + scale).
 *  2) 임계치 진입 시 햅틱(warn) 한 번.
 *  3) 임계치 미만 release → spring으로 닫힘.
 *  4) 임계치 이상 release → snap-open (휴지통 노출 상태 유지).
 *  5) 큰 폭으로 끌고 release → 즉시 commitDelete.
 *  6) 휴지통 탭 → slide-out + height collapse → onDelete().
 *  7) 다른 행이 열리면 자동으로 닫힘(activeRowId 동기화).
 */

const ACTION_WIDTH = 88;
const OPEN_X = -ACTION_WIDTH;
const PEEK_THRESHOLD = -28;
const HAPTIC_THRESHOLD = -ACTION_WIDTH * 0.7;
const COMMIT_THRESHOLD = -180;

export default function SwipeableNoticeRow({
    children,
    onDelete,
    activeRowId,
    rowId,
    onActivate,
}: Props) {
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    // 삭제 시퀀스에서만 사용. 평소 wrapper의 height는 'auto'.
    const [collapseHeight, setCollapseHeight] = useState<number | null>(null);
    const collapseAnim = useRef(new Animated.Value(1)).current;
    const measuredHeight = useRef(0);

    const isOpen = useRef(false);
    const hapticArmed = useRef(true);

    useEffect(() => {
        if (activeRowId && activeRowId !== rowId && isOpen.current) {
            close();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeRowId, rowId]);

    const close = () => {
        isOpen.current = false;
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
        // 1단계: 좌로 슬라이드 + 페이드
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: -600,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // 2단계: 측정된 높이를 잠가둔 뒤 0으로 줄여 리스트가 닫히게 함
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
                onMoveShouldSetPanResponder: (_, g) =>
                    Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
                onPanResponderGrant: () => {
                    hapticArmed.current = true;
                    onActivate(rowId);
                },
                onPanResponderMove: (_, g) => {
                    const base = isOpen.current ? OPEN_X : 0;
                    let next = base + g.dx;

                    // 우측 고무줄 (당겨도 잘 안 늘어남)
                    if (next > 0) next = next * 0.25;
                    // 좌측 과도한 드래그도 고무줄
                    if (next < -ACTION_WIDTH * 1.6) {
                        const overflow = next + ACTION_WIDTH * 1.6;
                        next = -ACTION_WIDTH * 1.6 + overflow * 0.35;
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
                    } else if (finalX < PEEK_THRESHOLD) {
                        openSnap();
                    } else {
                        close();
                    }
                },
                onPanResponderTerminate: () => close(),
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [rowId],
    );

    const trashTranslate = translateX.interpolate({
        inputRange: [OPEN_X, 0],
        outputRange: [0, ACTION_WIDTH * 0.4],
        extrapolate: 'clamp',
    });
    const trashOpacity = translateX.interpolate({
        inputRange: [OPEN_X, OPEN_X / 2, 0],
        outputRange: [1, 0.6, 0],
        extrapolate: 'clamp',
    });
    const trashScale = translateX.interpolate({
        inputRange: [OPEN_X * 1.2, OPEN_X, 0],
        outputRange: [1.06, 1, 0.85],
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
                  opacity,
              }
            : { opacity };

    return (
        <Animated.View style={[styles.wrapper, wrapperStyle]}>
            {/* 우측 액션 — 카드가 밀리면 드러남 */}
            <Animated.View
                style={[
                    styles.action,
                    {
                        opacity: trashOpacity,
                        transform: [{ translateX: trashTranslate }],
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
                    hitSlop={6}
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
        position: 'absolute',
        top: 0, bottom: 0, right: 0,
        width: ACTION_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
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
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    trashPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
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
