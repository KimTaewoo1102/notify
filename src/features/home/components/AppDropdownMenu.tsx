import React, { useEffect } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { radius, spacing, typography } from '../../../ui/theme';

export interface MenuAnchor {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Props {
    visible: boolean;
    anchor: MenuAnchor | null;
    onClose: () => void;
    onAddSchool: () => void;
    onChangeSchool: () => void;
}

const DROPDOWN_WIDTH = 188;
const BLUR_INTENSITY = 78;

/**
 * 홈 헤더 메뉴 버튼 기준으로 아래에 펼쳐지는 드롭다운.
 * expo-blur BlurView + 반투명 오버레이로 글래스모피즘 구현.
 * 애니메이션: translateY(-10→0) + opacity(0→1), 220ms ease-out.
 */
export function AppDropdownMenu({
    visible,
    anchor,
    onClose,
    onAddSchool,
    onChangeSchool,
}: Props) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(visible ? 1 : 0, {
            duration: visible ? 220 : 160,
            easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        });
    }, [visible, progress]);

    const animStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [
            { translateY: (progress.value - 1) * 10 },
            { scaleX: 0.97 + progress.value * 0.03 },
        ],
    }));

    if (!anchor) return null;

    const top = anchor.y + anchor.height + 6;
    const left = anchor.x;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {/* Backdrop — 외부 탭 시 닫기 */}
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                {/* Outer wrapper — shadow 전담 (overflow: hidden 없음) */}
                <Animated.View style={[styles.shadow, { top, left }, animStyle]}>
                    {/* Inner clip — border-radius 클리핑 */}
                    <View style={styles.clip}>
                        <BlurView
                            intensity={BLUR_INTENSITY}
                            tint="dark"
                            style={StyleSheet.absoluteFill}
                        />
                        {/* 반투명 어두운 레이어 */}
                        <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
                        {/* 상단 엣지 하이라이트 */}
                        <View style={styles.topHighlight} />

                        {/* 메뉴 아이템 */}
                        <View style={styles.menu}>
                            <MenuItem
                                icon="add-circle-outline"
                                label="학교 추가"
                                onPress={() => { onClose(); onAddSchool(); }}
                            />
                            <View style={styles.divider} />
                            <MenuItem
                                icon="swap-horizontal-outline"
                                label="학교 변경"
                                onPress={() => { onClose(); onChangeSchool(); }}
                            />
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        >
            <Ionicons name={icon} size={18} color="rgba(245,245,247,0.88)" />
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    shadow: {
        position: 'absolute',
        width: DROPDOWN_WIDTH,
        borderRadius: radius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.55,
        shadowRadius: 24,
        elevation: 24,
    },
    clip: {
        borderRadius: radius.lg,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.13)',
    },
    glassOverlay: {
        backgroundColor: 'rgba(10, 10, 16, 0.70)',
    },
    topHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.18)',
        zIndex: 1,
    },
    menu: {
        paddingVertical: spacing.xs,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 13,
    },
    itemPressed: {
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.09)',
        marginHorizontal: spacing.sm,
    },
    label: {
        ...typography.body,
        fontSize: 15,
        fontWeight: '500',
        color: 'rgba(245,245,247,0.92)',
        letterSpacing: -0.1,
    },
});
