import React from 'react';
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius } from '../../constants/theme';

interface Props extends ViewProps {
    intensity?: number;
    variant?: 'soft' | 'strong';
    radiusSize?: keyof typeof radius;
    children?: React.ReactNode;
    contentStyle?: ViewStyle;
}

/**
 * 글래스모피즘 베이스.
 * - iOS: systemUltraThinMaterialDark 틴트로 네이티브 유리 질감.
 * - fill은 거의 0에 가깝게 → blur 자체가 배경과 섞이게 둔다.
 * - 1px 상단 하이라이트로 유리 단면 표현.
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

    // iOS: 네이티브 UltraThin → 배경이 그대로 비치는 맑은 유리
    // Android: dark (블러 지원 제한적이라 fill로 보완)
    const blurTint = Platform.OS === 'ios'
        ? 'systemUltraThinMaterialDark'
        : 'dark';
    const blurIntensity = intensity ?? (isStrong ? 80 : 60);

    // Android fallback fill: iOS보다 살짝 더 불투명하게
    const fillOpacity = Platform.OS === 'ios'
        ? (isStrong ? 0.04 : 0.03)
        : (isStrong ? 0.14 : 0.10);

    return (
        <View
            style={[
                styles.container,
                {
                    borderRadius,
                    borderColor: isStrong ? colors.glassBorder : colors.glassBorderSoft,
                },
                style,
            ]}
            {...rest}
        >
            <BlurView
                intensity={blurIntensity}
                tint={blurTint as any}
                style={[StyleSheet.absoluteFillObject, { borderRadius }]}
            />
            {/* 극소량의 fill — blur 위에 살짝 덮어 경계 부드럽게 */}
            <View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFillObject,
                    { borderRadius, backgroundColor: `rgba(255,255,255,${fillOpacity})` },
                ]}
            />
            {/* 상단 1px 하이라이트 — 유리 단면 굴절 */}
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
        backgroundColor: 'rgba(255,255,255,0.30)',
    },
    // flex: 1 추가 — SectionCard 등 내부가 flex를 쓸 때 높이가 붕괴되지 않도록
    content: { flex: 1 },
});
