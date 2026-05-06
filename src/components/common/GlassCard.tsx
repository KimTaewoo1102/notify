import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius } from '../../constants/theme';

interface Props extends ViewProps {
    intensity?: number;
    /** 'soft' = 배경에 녹는 표면, 'strong' = 떠 있는 표면 (메뉴/모달용) */
    variant?: 'soft' | 'strong';
    radiusSize?: keyof typeof radius;
    children?: React.ReactNode;
    contentStyle?: ViewStyle;
}

/**
 * 글래스모피즘 베이스.
 * BlurView + 반투명 fill + 1px 테두리 + 상단 하이라이트로
 * "유리 단면" 느낌을 균일하게 제공한다.
 */
export default function GlassCard({
    intensity,
    variant = 'soft',
    radiusSize = 'lg',
    children,
    contentStyle,
    style,
    ...rest
}: Props) {
    const isStrong = variant === 'strong';
    const borderRadius = radius[radiusSize];

    return (
        <View
            style={[
                styles.container,
                { borderRadius, borderColor: isStrong ? colors.glassBorder : colors.glassBorderSoft },
                style,
            ]}
            {...rest}
        >
            <BlurView
                intensity={intensity ?? (isStrong ? 50 : 30)}
                tint="dark"
                style={[StyleSheet.absoluteFillObject, { borderRadius }]}
            />
            <View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        borderRadius,
                        backgroundColor: isStrong ? colors.glassFillStrong : colors.glassFill,
                    },
                ]}
            />
            {/* 상단 1px 하이라이트 — 진짜 유리의 상면 굴절 */}
            <View
                pointerEvents="none"
                style={[
                    styles.topHighlight,
                    { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius },
                ]}
            />
            <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },
    topHighlight: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1,
        backgroundColor: colors.glassHighlight,
        opacity: 0.6,
    },
    content: { padding: 0 },
});
