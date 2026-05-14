import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { colors, typography } from '../../ui/theme';
import { haptic } from '../../ui/feedback/haptics';

// 두 상태의 명확한 시각 차이를 위해 양 끝 박스 사이즈는 고정값으로 둔다.
// (Reanimated 의 width/height 보간은 'auto' 를 지원하지 않음.)
const EDIT_W = 44;
const EDIT_H = 30;
const DONE_W = 72;
const DONE_H = 26;

const SPRING = { damping: 20, stiffness: 260, mass: 0.7 } as const;

interface Props {
    editMode: boolean;
    onToggle: () => void;
}

/**
 * 헤더 우상단 액션.
 * - editMode=false → '편집' 텍스트 (투명 배경 / accent 글자)
 * - editMode=true  → '완료' 알약 (accent 배경 / 흰 글자, 가로 길고 세로 짧게)
 *
 * 단일 SharedValue(progress) 로 width/height/borderRadius/배경/텍스트 opacity
 * 모두 보간. useAnimatedStyle 내부에서 React prop/state 직접 참조하지 않음.
 */
export function EditDoneButton({ editMode, onToggle }: Props) {
    const progress = useSharedValue(editMode ? 1 : 0);

    useEffect(() => {
        progress.value = withSpring(editMode ? 1 : 0, SPRING);
    }, [editMode, progress]);

    const containerStyle = useAnimatedStyle(() => ({
        width: interpolate(progress.value, [0, 1], [EDIT_W, DONE_W]),
        height: interpolate(progress.value, [0, 1], [EDIT_H, DONE_H]),
        borderRadius: interpolate(
            progress.value,
            [0, 1],
            [8, DONE_H / 2],
        ),
        backgroundColor: interpolateColor(
            progress.value,
            [0, 1],
            ['rgba(0,0,0,0)', colors.accent],
        ),
    }));

    const editTextStyle = useAnimatedStyle(() => ({
        // 0 → 0.45 사이에 페이드아웃 (회전 도중 두 텍스트가 진하게 겹치지 않도록).
        opacity: interpolate(progress.value, [0, 0.45], [1, 0]),
    }));
    const doneTextStyle = useAnimatedStyle(() => ({
        // 0.55 → 1 사이에 페이드인.
        opacity: interpolate(progress.value, [0.55, 1], [0, 1]),
    }));

    return (
        <Pressable
            onPress={() => {
                haptic('selection');
                onToggle();
            }}
            hitSlop={12}
        >
            <Animated.View style={[styles.base, containerStyle]}>
                <Animated.Text
                    style={[styles.label, styles.editText, editTextStyle]}
                >
                    편집
                </Animated.Text>
                <Animated.Text
                    style={[styles.label, styles.doneText, doneTextStyle]}
                >
                    완료
                </Animated.Text>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    // 두 텍스트는 컨테이너 위에 절대 겹쳐 둠 → 폭이 달라도 중앙 정렬 유지.
    label: {
        ...typography.bodySm,
        position: 'absolute',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    editText: {
        color: colors.accent,
    },
    doneText: {
        color: colors.bgBase,
    },
});
