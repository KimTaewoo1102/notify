import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, typography } from '../../../ui/theme';
import { haptic } from '../../../ui/feedback/haptics';

interface Props {
    count: number;
    onPress: () => void;
}

/**
 * 섹션 상세 헤더 우측 — 휴지통 진입.
 * 삭제된 공지가 있으면 우상단 배지로 갯수 표시 (10+ 캡).
 */
export function SectionTrashButton({ count, onPress }: Props) {
    const showBadge = count > 0;
    const display = count > 9 ? '9+' : String(count);
    return (
        <Pressable
            onPress={() => {
                haptic('light');
                onPress();
            }}
            hitSlop={10}
            style={({ pressed }) => [
                styles.btn,
                pressed && { opacity: 0.55 },
            ]}
        >
            <Ionicons
                name="trash-outline"
                size={20}
                color={colors.textPrimary}
            />
            {showBadge && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{display}</Text>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    btn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 2,
        minWidth: 16,
        height: 16,
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.bgTop,
    },
    badgeText: {
        ...typography.caption,
        color: '#fff',
        fontWeight: '700',
        fontSize: 10,
        lineHeight: 12,
    },
});
