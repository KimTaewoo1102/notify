import React from 'react';
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { radius, shadows } from '../../constants/theme';

interface Props extends ViewProps {
    intensity?: number;
    /** 'soft' = 리스트 아이템 등 가벼운 카드, 'strong' = 메인 컨테이너 */
    variant?: 'soft' | 'strong';
    radiusSize?: keyof typeof radius;
    children?: React.ReactNode;
    contentStyle?: ViewStyle;
}

/**
 * 토스 스타일 글래스 카드.
 *
 * 디자인 결정:
 *  - 상단 1px 흰 선(highlight) 제거 → 경계는 그림자/블러로만.
 *  - fill 3~5%로 배경에 거의 녹는 투명도.
 *  - 큰 shadowRadius + 낮은 opacity로 "공중에 떠 있는" 느낌.
 *
 * 단일 View 구조: iOS의 layer shadow는 masksToBounds(overflow:hidden)에
 * 영향받지 않으므로 한 View에서 그림자와 클리핑을 동시에 처리한다.
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

    const isIOS = Platform.OS === 'ios';
    const blurTint = isIOS ? 'systemUltraThinMaterialDark' : 'dark';
    const blurIntensity = intensity ?? (isStrong ? 70 : 50);

    // 거의 보이지 않을 정도로만. blur가 깊이의 주역.
    const fillOpacity = isIOS
        ? (isStrong ? 0.05 : 0.035)
        : (isStrong ? 0.14 : 0.10);

    const borderColor = isStrong
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(255,255,255,0.05)';

    const elevation = isStrong ? shadows.elevated : shadows.soft;

    return (
        <View
            style={[
                elevation,
                { borderRadius, overflow: 'hidden' },
                style,
            ]}
            {...rest}
        >
            <BlurView
                intensity={blurIntensity}
                tint={blurTint as any}
                style={StyleSheet.absoluteFillObject}
            />
            <View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: `rgba(255,255,255,${fillOpacity})` },
                ]}
            />
            <View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        borderRadius,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor,
                    },
                ]}
            />
            <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { flex: 1 },
});
