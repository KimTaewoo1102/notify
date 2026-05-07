import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, typography } from '../../ui/theme';
import { useAllOrderedSections } from '../../stores/sectionsStore';
import { uosAdapter } from '../../services/universities/uos';
import type { RootStackParamList } from '../../navigation/types';

const ROTATE_INTERVAL_MS = 4000;
const FADE_OUT_MS = 320;
const FADE_IN_MS = 360;
const SLIDE_PX = 6;
// 페이드용 이징. inOut.cubic — 슬롯머신 X, 우아한 호흡감 O
const EASING = Easing.bezier(0.4, 0.0, 0.2, 1.0);

/**
 * Home 스크린 전용 커스텀 헤더 타이틀.
 *
 *  ┌─ 섹션 이름 (4초 간격 페이드+미세 Y슬라이드 회전, 탭 → 해당 섹션 진입)
 *  └─ 서울시립대학교
 *
 * - SharedValue 만 useAnimatedStyle 에서 참조 (React state/prop 직접 참조 X)
 * - withTiming 콜백에서 runOnJS 로 인덱스 회전을 JS 스레드로 넘김
 */
export function HeaderBanner() {
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const sections = useAllOrderedSections();
    const [index, setIndex] = useState(0);

    // 사이클 한 번 진행 중인지 (재진입 가드).
    const animatingRef = useRef(false);

    const opacity = useSharedValue(1);
    const translateY = useSharedValue(0);

    // sections 가 줄어들면 index 가 범위를 넘을 수 있음 → 안전 보정.
    useEffect(() => {
        if (sections.length === 0) {
            setIndex(0);
            return;
        }
        if (index >= sections.length) setIndex(0);
    }, [sections.length, index]);

    // 다음 인덱스로 회전 — JS 스레드에서 호출되어야 안전.
    const advance = (total: number) => {
        animatingRef.current = false;
        setIndex(i => (total === 0 ? 0 : (i + 1) % total));
    };

    useEffect(() => {
        // 표시할 게 1개 이하면 굳이 회전 애니메이션 안 돌림.
        if (sections.length <= 1) return;

        const total = sections.length;

        const id = setInterval(() => {
            if (animatingRef.current) return;
            animatingRef.current = true;

            // OUT: 천천히 사라지면서 살짝 위로
            opacity.value = withTiming(0, {
                duration: FADE_OUT_MS,
                easing: EASING,
            });
            translateY.value = withTiming(
                -SLIDE_PX,
                { duration: FADE_OUT_MS, easing: EASING },
                (finished) => {
                    if (!finished) return;
                    // 스왑: 즉시 반대편(아래쪽)으로 점프시킨 뒤 IN 시작
                    translateY.value = SLIDE_PX;
                    runOnJS(advance)(total);
                    opacity.value = withTiming(1, {
                        duration: FADE_IN_MS,
                        easing: EASING,
                    });
                    translateY.value = withTiming(0, {
                        duration: FADE_IN_MS,
                        easing: EASING,
                    });
                },
            );
        }, ROTATE_INTERVAL_MS);

        return () => clearInterval(id);
    }, [sections.length, opacity, translateY]);

    const animatedTitleStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    const current = sections[index] ?? sections[0];

    const onPressTitle = () => {
        if (!current) return;
        navigation.navigate('SectionDetail', { sectionId: current.id });
    };

    return (
        <View style={styles.wrap}>
            <Text style={styles.university} numberOfLines={1}>
                {uosAdapter.name}
            </Text>
            <Pressable
                onPress={onPressTitle}
                hitSlop={6}
                disabled={!current}
                style={styles.titleSlot}
            >
                <Animated.View style={animatedTitleStyle}>
                    <Text style={styles.sectionName} numberOfLines={1}>
                        {current?.title ?? ''}
                    </Text>
                </Animated.View>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 1,
    },
    // 메인 타이틀 — 대학교명이 위계 최상위.
    university: {
        ...typography.h3,
        color: colors.textPrimary,
        textAlign: 'center',
        letterSpacing: 0.1,
    },
    titleSlot: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    // 롤링 섹션명 — 서브텍스트 느낌으로 작고 은은하게.
    sectionName: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        letterSpacing: 0.15,
        marginTop: 1,
    },
});
