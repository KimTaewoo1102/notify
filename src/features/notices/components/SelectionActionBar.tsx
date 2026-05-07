import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, shadows, spacing, typography } from '../../../ui/theme';
import { haptic } from '../../../ui/feedback/haptics';

interface Props {
    visible: boolean;
    selectedCount: number;
    onCancel: () => void;
    onDelete: () => void;
}

/**
 * 선택 모드 동안 화면 하단에 떠오르는 액션 바.
 * - 좌측: 취소(선택 해제)
 * - 중앙: "{N}개 선택"
 * - 우측: 휴지통 이동 (destructive 버튼)
 *
 * 진입/이탈은 translateY + opacity 애니메이션. 선택 0개일 땐 삭제 버튼 비활성.
 */
export function SelectionActionBar({
    visible,
    selectedCount,
    onCancel,
    onDelete,
}: Props) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(visible ? 1 : 0, {
            duration: 220,
            easing: Easing.out(Easing.cubic),
        });
    }, [visible, progress]);

    const wrapperStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ translateY: (1 - progress.value) * 28 }],
    }));

    const canDelete = selectedCount > 0;

    return (
        <Animated.View
            pointerEvents={visible ? 'auto' : 'none'}
            style={[styles.wrapper, wrapperStyle]}
        >
            <View style={styles.bar}>
                <Pressable
                    onPress={() => {
                        haptic('light');
                        onCancel();
                    }}
                    hitSlop={10}
                    style={({ pressed }) => [
                        styles.ghostBtn,
                        pressed && { opacity: 0.6 },
                    ]}
                >
                    <Ionicons
                        name="close"
                        size={18}
                        color={colors.textSecondary}
                    />
                    <Text style={styles.ghostLabel}>취소</Text>
                </Pressable>

                <Text style={styles.count}>
                    {selectedCount > 0 ? `${selectedCount}개 선택` : '선택 안 됨'}
                </Text>

                <Pressable
                    onPress={() => {
                        if (!canDelete) return;
                        haptic('warning');
                        onDelete();
                    }}
                    hitSlop={10}
                    disabled={!canDelete}
                    style={({ pressed }) => [
                        styles.dangerBtn,
                        !canDelete && styles.dangerBtnDisabled,
                        pressed && canDelete && { opacity: 0.85 },
                    ]}
                >
                    <Ionicons name="trash" size={16} color="#fff" />
                    <Text style={styles.dangerLabel}>휴지통</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: spacing.lg,
        right: spacing.lg,
        bottom: spacing.lg,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.bgRaisedAlt,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        ...shadows.lg,
    },
    ghostBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: radius.sm,
    },
    ghostLabel: {
        ...typography.bodySm,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    count: {
        ...typography.bodySm,
        color: colors.textPrimary,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    dangerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.danger,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: radius.md,
    },
    dangerBtnDisabled: {
        opacity: 0.4,
    },
    dangerLabel: {
        ...typography.bodySm,
        color: '#fff',
        fontWeight: '700',
    },
});
