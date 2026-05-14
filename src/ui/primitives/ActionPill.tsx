import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PressableScale } from './PressableScale';
import { alpha, colors, radius, spacing, typography } from '../theme';

interface ActionPillProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    /** 동적 accent 컬러 (섹션마다 다름). */
    accent: string;
    /** on=true → fill 적용된 active 스타일, false → 외곽선만. */
    on: boolean;
    onPress: () => void;
}

/**
 * 토글 가능한 pill 형태의 액션 버튼.
 * SectionDetailScreen 의 "알림 ON/OFF" pill 등에서 사용.
 */
export function ActionPill({ icon, label, accent, on, onPress }: ActionPillProps) {
    return (
        <PressableScale
            onPress={onPress}
            hapticKind="selection"
            style={[
                styles.pill,
                on
                    ? {
                          backgroundColor: accent + alpha.fill,
                          borderColor: accent + alpha.strong,
                      }
                    : { borderColor: colors.border },
            ]}
        >
            <Ionicons
                name={icon}
                size={16}
                color={on ? accent : colors.textSecondary}
            />
            <Text
                style={[
                    styles.label,
                    { color: on ? colors.textPrimary : colors.textSecondary },
                ]}
            >
                {label}
            </Text>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: radius.pill,
        borderWidth: 1,
        backgroundColor: colors.bgRaised,
    },
    label: { ...typography.bodySm },
});
