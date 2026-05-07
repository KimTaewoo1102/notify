import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PressableScale } from '../../../ui/primitives/PressableScale';
import { colors, radius, spacing, typography } from '../../../ui/theme';

/**
 * 메인 스크롤 끝에 자리하는 "빈 섹션 박스".
 * - 일반 SectionCard 의 ~66% 높이 (요구: 60–70%).
 * - 점선 테두리 + 중앙 '+' → 새 섹션 추가 시트 호출.
 *
 * 디자인: 검정 배경 위에서 너무 튀지 않도록 dim 한 톤,
 * 호버 대신 PressableScale 의 쫀득한 압축으로 affordance 표현.
 */

interface Props {
    onPress: () => void;
}

export function AddSectionSlot({ onPress }: Props) {
    return (
        <PressableScale
            onPress={onPress}
            hapticKind="medium"
            scaleTo={0.97}
            style={styles.wrap}
        >
            <View style={styles.inner}>
                <View style={styles.iconCircle}>
                    <Ionicons
                        name="add"
                        size={18}
                        color={colors.textSecondary}
                    />
                </View>
                <Text style={styles.label}>새 섹션 추가</Text>
            </View>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginVertical: 6,
    },
    inner: {
        // SectionCard 본문(약 64–68px)의 ~66%.
        minHeight: 44,
        borderRadius: radius.lg,
        borderWidth: 1.2,
        borderStyle: 'dashed',
        borderColor: colors.borderStrong,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    iconCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bgRaised,
    },
    label: {
        ...typography.bodySm,
        color: colors.textSecondary,
        fontWeight: '600',
        letterSpacing: 0.1,
    },
});
