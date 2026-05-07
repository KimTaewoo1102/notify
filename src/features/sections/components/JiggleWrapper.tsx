import React, { useEffect } from 'react';
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface Props {
    active: boolean;
    /** 인덱스에 따라 위상을 어긋나게 해 더 자연스러운 군집 흔들림을 만든다. */
    index?: number;
    children?: React.ReactNode;
}

/**
 * iOS 홈스크린식 Jiggle.
 * - active 가 false → 즉시 부드럽게 0deg 로 복귀
 * - active 가 true → ±1deg 사이를 90ms 단위로 무한 반복, 짝/홀 인덱스에 따라 반전
 */
export function JiggleWrapper({ active, index = 0, children }: Props) {
    const rotation = useSharedValue(0);

    useEffect(() => {
        if (active) {
            const phase = index % 2 === 0 ? 1 : -1;
            rotation.value = withDelay(
                index * 30,
                withRepeat(
                    withSequence(
                        withTiming(-1.0 * phase, { duration: 90 }),
                        withTiming(1.0 * phase, { duration: 90 }),
                    ),
                    -1,
                    true,
                ),
            );
        } else {
            cancelAnimation(rotation);
            rotation.value = withTiming(0, { duration: 140 });
        }
    }, [active, index, rotation]);

    const style = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return <Animated.View style={style}>{children}</Animated.View>;
}
