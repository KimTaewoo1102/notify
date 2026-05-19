import { useEffect } from 'react';
import {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

/**
 * 메뉴 entrance 애니메이션 — 컨텍스트 메뉴 / 케밥 드롭다운 공용.
 *
 *  - 진입: scale spring (0.88 → 1, 미세 오버슈트), opacity timing, translateY -6 → 0
 *  - 퇴장: scale/opacity/translateY 모두 timing 120ms (정리는 빠르게)
 *
 * Premium 톤 — iOS Mail 컨텍스트 메뉴를 참고한 "팝" 느낌. 단순한 fade-in 대비
 * 깊이감과 방향성이 명확해진다.
 *
 * 반환값: 메뉴 본체에 적용할 menuStyle 과 backdrop 에 적용할 backdropStyle.
 */
export function useMenuEntrance(visible: boolean) {
    const scale = useSharedValue(visible ? 1 : 0.88);
    const opacity = useSharedValue(visible ? 1 : 0);
    const translateY = useSharedValue(visible ? 0 : -6);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, {
                damping: 14,
                stiffness: 280,
                mass: 0.7,
            });
            opacity.value = withTiming(1, {
                duration: 180,
                easing: Easing.out(Easing.cubic),
            });
            translateY.value = withTiming(0, {
                duration: 180,
                easing: Easing.out(Easing.cubic),
            });
        } else {
            scale.value = withTiming(0.94, { duration: 120 });
            opacity.value = withTiming(0, { duration: 120 });
            translateY.value = withTiming(-6, { duration: 120 });
        }
    }, [visible, scale, opacity, translateY]);

    const menuStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
        ],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return { menuStyle, backdropStyle };
}

/**
 * 다이얼로그 entrance 애니메이션 — 중앙 정렬 confirm/alert 다이얼로그용.
 *
 *  - 진입: scale spring (0.9 → 1), opacity timing
 *  - 퇴장: timing 120ms
 *
 * 메뉴와 달리 translateY 없음 (중앙 정렬 박스에는 슬라이드보다 spring scale 만으로 충분).
 */
export function useDialogEntrance(visible: boolean) {
    const scale = useSharedValue(visible ? 1 : 0.9);
    const opacity = useSharedValue(visible ? 1 : 0);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, {
                damping: 16,
                stiffness: 260,
                mass: 0.7,
            });
            opacity.value = withTiming(1, {
                duration: 160,
                easing: Easing.out(Easing.cubic),
            });
        } else {
            scale.value = withTiming(0.94, { duration: 120 });
            opacity.value = withTiming(0, { duration: 120 });
        }
    }, [visible, scale, opacity]);

    const dialogStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return { dialogStyle, backdropStyle };
}
