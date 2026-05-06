import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * 순수 블랙 그라디언트 배경.
 * "SIMPLE IS BEST" — 컬러 오브 없이 깊이는 미세한 명도 차로만 표현.
 */
export default function ScreenBackground() {
    return (
        <LinearGradient
            colors={['#0A0A0A', '#000000', '#0C0C0E', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            locations={[0, 0.3, 0.7, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
        />
    );
}
