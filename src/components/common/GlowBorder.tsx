import React from 'react';
import { StyleSheet } from 'react-native';
import {
    Canvas,
    RoundedRect,
    BlurMask,
    LinearGradient,
    vec,
} from '@shopify/react-native-skia';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';

interface Props {
    width: number;
    height: number;
    radius: number;
    /** glow on / off */
    active: boolean;
}

/**
 * Skia 로 렌더되는 알람 ON 글로우 보더.
 * 부드럽게 호흡하는 빛 + 외곽선의 컬러 그라디언트.
 */
export default function GlowBorder({ width, height, radius, active }: Props) {
    const breathe = useSharedValue(0.55);

    React.useEffect(() => {
        if (active) {
            breathe.value = withRepeat(
                withTiming(1, {
                    duration: 1800,
                    easing: Easing.inOut(Easing.quad),
                }),
                -1,
                true,
            );
        } else {
            cancelAnimation(breathe);
            breathe.value = withTiming(0, { duration: 240 });
        }
        return () => cancelAnimation(breathe);
    }, [active, breathe]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: breathe.value,
    }));

    if (!width || !height) return null;

    return (
        <Animated.View
            pointerEvents="none"
            style={[styles.layer, { width, height }, containerStyle]}
        >
            <Canvas style={{ width, height }}>
                <RoundedRect
                    x={2}
                    y={2}
                    width={width - 4}
                    height={height - 4}
                    r={radius}
                    style="stroke"
                    strokeWidth={1.5}
                >
                    <LinearGradient
                        start={vec(0, 0)}
                        end={vec(width, height)}
                        colors={['#7C5CFF', '#6FE5FF', '#7C5CFF']}
                    />
                    <BlurMask blur={10} style="solid" />
                </RoundedRect>
                <RoundedRect
                    x={2}
                    y={2}
                    width={width - 4}
                    height={height - 4}
                    r={radius}
                    style="stroke"
                    strokeWidth={0.8}
                    color="rgba(255,255,255,0.55)"
                />
            </Canvas>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    layer: {
        ...StyleSheet.absoluteFillObject,
    },
});
