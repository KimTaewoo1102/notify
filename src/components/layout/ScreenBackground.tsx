import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';

/**
 * 블랙 배경에 깊이를 주는 그라디언트 + 두 개의 빛망울(orb).
 * 답답함을 없애고 글래스카드 뒤로 색이 비치게 만든다.
 */
export default function ScreenBackground() {
    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <LinearGradient
                colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            {/* 좌상단 푸른 빛 */}
            <LinearGradient
                colors={['rgba(80,120,255,0.18)', 'rgba(80,120,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.orb, styles.orbTopLeft]}
            />
            {/* 우하단 보라 빛 */}
            <LinearGradient
                colors={['rgba(170,90,255,0.16)', 'rgba(170,90,255,0)']}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={[styles.orb, styles.orbBottomRight]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    orb: {
        position: 'absolute',
        width: 480,
        height: 480,
        borderRadius: 240,
    },
    orbTopLeft: { top: -180, left: -160 },
    orbBottomRight: { bottom: -200, right: -180 },
});
