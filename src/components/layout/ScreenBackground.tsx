import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * 블랙 배경 + 극소량의 중립 밝기 변화.
 * 색이 아닌 명도 차이만 줘서 BlurView가 블렌딩할 소스를 제공한다.
 * 눈에 보이지 않아도 글래스 질감이 살아나는 것이 목적.
 */
export default function ScreenBackground() {
    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {/* 기본 배경 */}
            <View style={[StyleSheet.absoluteFillObject, styles.base]} />

            {/* 상단에서 내려오는 극소 밝기 → 카드들이 뜨는 느낌 */}
            <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.55 }}
                style={StyleSheet.absoluteFillObject}
            />
            {/* 하단 딥 다크 */}
            <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
                start={{ x: 0.5, y: 0.6 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    base: { backgroundColor: '#050505' },
});
