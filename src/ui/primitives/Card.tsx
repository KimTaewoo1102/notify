import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
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
        <View style={[styles.shadowShell, shadows[shadow], style]}>
            <View style={styles.clip}>
                <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
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
        </View>
    );
}

const styles = StyleSheet.create({
    shadowShell: {
        borderRadius: radius.lg,
    },
    clip: {
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        borderTopColor: colors.edgeHighlight,
        overflow: 'hidden',
    },
    glassOverlay: {
        backgroundColor: 'rgba(18, 18, 30, 0.60)',
    },
    accentLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1.5,
    },
});
