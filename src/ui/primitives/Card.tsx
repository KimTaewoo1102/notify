import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius, shadows, type ShadowToken } from '../theme';

interface CardProps {
    /** Hex 색 (#RRGGBB). 상단 1.5px 그라데이션 라인에 사용. */
    accent?: string;
    showAccentLine?: boolean;
    shadow?: ShadowToken;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

/**
 * 프리미엄 다크 카드.
 * Skia 없이도 입체감을 살리기 위해 (1) 네이티브 그림자 (2) 1px 보더
 * (3) 상단 accent 그라데이션 라인 — 세 레이어를 겹친다.
 */
export function Card({
    accent,
    showAccentLine = false,
    shadow = 'md',
    style,
    children,
}: CardProps) {
    return (
        <View style={[styles.card, shadows[shadow], style]}>
            {showAccentLine && accent ? (
                <LinearGradient
                    colors={['transparent', accent + 'CC', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.accentLine}
                    pointerEvents="none"
                />
            ) : null}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.bgRaised,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        // 상단 가장자리 highlight — 이중 depth (shadow + edge)
        borderTopColor: colors.edgeHighlight,
        overflow: 'hidden',
    },
    accentLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1.5,
    },
});
