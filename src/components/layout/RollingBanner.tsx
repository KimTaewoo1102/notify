import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import {
    selectActiveSections,
    useSectionsStore,
    type Section,
} from '../../store/sectionsStore';
import { colors, typography } from '../../constants/theme';
import { haptics } from '../../utils/haptics';

interface Props {
    /** 배너 탭 시 해당 섹션으로 진입 */
    onItemPress: (sectionId: string) => void;
    /** 회전 주기 (ms). 기본 4000. */
    intervalMs?: number;
}

/**
 * 사용자 섹션 이름이 아날로그 플립 시계처럼 한 줄씩 넘어가는 헤더 배너.
 *
 * 디자인 결정
 *  - 글씨체/크기/letterSpacing/color 는 기존 eyebrow 와 동일 (typography.label)
 *  - 시스템 'pinned-default' 섹션은 이미 화면에 항상 보이므로 제외
 *  - 휴지통 섹션 제외
 *  - 사용자 정의 섹션이 0개일 땐 정적 폴백 텍스트
 *  - 탭 → 해당 섹션으로 라우팅
 *
 * 모션
 *  - flipProgress 0→1 한 사이클 동안 두 줄을 교차 회전 (perspective + rotateX)
 *  - 0~0.5: current 가 위로 접히며 사라짐 (rotateX 0→-90)
 *  - 0.5~1: next 가 아래에서 펼쳐짐 (rotateX 90→0)
 *  - 절제된 모션 — 단조로운 cubic-out + 4초 간격
 */
export default function RollingBanner({ onItemPress, intervalMs = 4000 }: Props) {
    const sections = useSectionsStore(selectActiveSections);

    // 시스템 핀 섹션 제외 — 배너에 노출할 섹션만 추림
    const items = useMemo(
        () => sections.filter(s => s.isSystem !== 'pinned-default'),
        [sections],
    );

    const flip = useSharedValue(0);
    const idxRef = useRef(0);
    const [pair, setPair] = useState<{ current: Section | null; next: Section | null }>(() => ({
        current: items[0] ?? null,
        next: items[1 % Math.max(items.length, 1)] ?? null,
    }));

    // items 가 바뀌면(추가/삭제) 인덱스 안전하게 리셋
    useEffect(() => {
        if (items.length === 0) {
            idxRef.current = 0;
            setPair({ current: null, next: null });
            cancelAnimation(flip);
            flip.value = 0;
            return;
        }
        // 현재 인덱스가 범위를 벗어났으면 보정
        if (idxRef.current >= items.length) idxRef.current = 0;
        const cur = items[idxRef.current];
        const nxt = items[(idxRef.current + 1) % items.length];
        setPair({ current: cur, next: nxt });
    }, [items, flip]);

    const advance = () => {
        idxRef.current = (idxRef.current + 1) % Math.max(items.length, 1);
        const nextIdx = (idxRef.current + 1) % Math.max(items.length, 1);
        setPair({
            current: items[idxRef.current] ?? null,
            next: items[nextIdx] ?? null,
        });
        flip.value = 0;
    };

    // 자동 회전 — 항목 2개 미만이면 회전 정지
    useEffect(() => {
        if (items.length < 2) return;
        const id = setInterval(() => {
            flip.value = withTiming(
                1,
                { duration: 720, easing: Easing.inOut(Easing.cubic) },
                finished => {
                    if (finished) runOnJS(advance)();
                },
            );
        }, intervalMs);
        return () => {
            clearInterval(id);
            cancelAnimation(flip);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, intervalMs]);

    const currentStyle = useAnimatedStyle(() => {
        const rotateX = interpolate(
            flip.value,
            [0, 0.5],
            [0, -90],
            Extrapolation.CLAMP,
        );
        const opacity = interpolate(
            flip.value,
            [0, 0.42, 0.5],
            [1, 1, 0],
            Extrapolation.CLAMP,
        );
        return {
            opacity,
            transform: [{ perspective: 600 }, { rotateX: `${rotateX}deg` }],
        };
    });

    const nextStyle = useAnimatedStyle(() => {
        const rotateX = interpolate(
            flip.value,
            [0.5, 1],
            [90, 0],
            Extrapolation.CLAMP,
        );
        const opacity = interpolate(
            flip.value,
            [0.5, 0.58, 1],
            [0, 1, 1],
            Extrapolation.CLAMP,
        );
        return {
            opacity,
            transform: [{ perspective: 600 }, { rotateX: `${rotateX}deg` }],
        };
    });

    const handlePress = () => {
        if (!pair.current) return;
        haptics.tap();
        onItemPress(pair.current.id);
    };

    if (items.length === 0 || !pair.current) {
        return (
            <View style={styles.wrap}>
                <Text style={styles.fallback}>맞춤 섹션을 추가해보세요</Text>
            </View>
        );
    }

    return (
        <Pressable onPress={handlePress} hitSlop={6} style={styles.wrap}>
            <View style={styles.flipBox}>
                <Animated.Text
                    style={[styles.text, currentStyle]}
                    numberOfLines={1}
                >
                    {pair.current.title}
                </Animated.Text>
                {pair.next && (
                    <Animated.Text
                        style={[styles.text, styles.absolute, nextStyle]}
                        numberOfLines={1}
                    >
                        {pair.next.title}
                    </Animated.Text>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginBottom: 4,
    },
    flipBox: {
        height: 16,
        justifyContent: 'center',
    },
    text: {
        ...typography.label,
        color: colors.textTertiary,
        // backface 가 보이지 않게 — 회전 중 뒤쪽 글자가 비치는 현상 방지
        backfaceVisibility: 'hidden',
    },
    absolute: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    fallback: {
        ...typography.label,
        color: colors.textTertiary,
    },
});
