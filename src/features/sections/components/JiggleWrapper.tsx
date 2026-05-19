import React, { useEffect } from 'react';
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { JIGGLE } from '../../../constants/animation';

interface Props {
    active: boolean;
    /** 인덱스에 따라 위상을 어긋나게 해 더 자연스러운 군집 흔들림을 만든다. */
    index?: number;
    children?: React.ReactNode;
}

/**
 * iOS 홈스크린식 Jiggle.
 *  - active 가 false → 즉시 부드럽게 0deg / scale 1 로 복귀.
 *  - active 가 true → wake-up wobble (±wakeAngleDeg, 큰 한 사이클) + scale pump
 *    → 정상 jiggle (±angleDeg) 무한 반복 진입. 짝/홀 인덱스에 따라 phase 반전.
 *
 * Wake-up 의도: 즉시 정상 jiggle 로 시작하면 "갑자기 흔들림"이 부자연스럽다.
 * 큰 wobble + scale pump 가 "편집 모드 진입" 을 시각적으로 acknowledge 한다.
 */
export function JiggleWrapper({ active, index = 0, children }: Props) {
    const rotation = useSharedValue(0);
    const wakeScale = useSharedValue(1);

    useEffect(() => {
        if (active) {
            const phase = index % 2 === 0 ? 1 : -1;
            const delay = index * JIGGLE.phaseStepMs;

            rotation.value = withDelay(
                delay,
                withSequence(
                    // Wake-up: 큰 한 사이클 (±wakeAngleDeg)
                    withTiming(-JIGGLE.wakeAngleDeg * phase, { duration: JIGGLE.wakeMs }),
                    withTiming(JIGGLE.wakeAngleDeg * phase, { duration: JIGGLE.wakeMs }),
                    // 정상 jiggle 진입 — 무한 반복
                    withRepeat(
                        withSequence(
                            withTiming(-JIGGLE.angleDeg * phase, { duration: JIGGLE.tickMs }),
                            withTiming(JIGGLE.angleDeg * phase, { duration: JIGGLE.tickMs }),
                        ),
                        -1,
                        true,
                    ),
                ),
            );

            // Scale pump — 1 → wakeScalePeak → 1 (spring 으로 복귀)
            wakeScale.value = withDelay(
                delay,
                withSequence(
                    withTiming(JIGGLE.wakeScalePeak, {
                        duration: JIGGLE.wakeScalePeakMs,
                    }),
                    withSpring(1, { damping: 14, stiffness: 280, mass: 0.7 }),
                ),
            );
        } else {
            cancelAnimation(rotation);
            cancelAnimation(wakeScale);
            rotation.value = withTiming(0, { duration: JIGGLE.exitMs });
            wakeScale.value = withTiming(1, { duration: 80 });
        }
    }, [active, index, rotation, wakeScale]);

    const style = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotation.value}deg` },
            { scale: wakeScale.value },
        ],
    }));

    return <Animated.View style={style}>{children}</Animated.View>;
}
