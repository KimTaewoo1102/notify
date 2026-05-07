import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Card } from '../../../ui/primitives/Card';
import { PressableScale } from '../../../ui/primitives/PressableScale';
import { haptic } from '../../../ui/feedback/haptics';
import { colors, radius, spacing, typography } from '../../../ui/theme';
import type { Section } from '../../../types/domain';

interface Props {
    section: Section;
    editMode?: boolean;
    isDragActive?: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
    onDelete?: () => void;
}

export function SectionCard({
    section,
    editMode,
    isDragActive,
    onPress,
    onLongPress,
    onDelete,
}: Props) {
    // 워크릿 안에서 JS prop 직접 참조 금지 → shared value 로 미러링
    const dragScale = useSharedValue(1);
    const dragOpacity = useSharedValue(1);

    useEffect(() => {
        dragScale.value = withSpring(isDragActive ? 1.04 : 1, {
            damping: 14,
            stiffness: 200,
        });
        dragOpacity.value = withSpring(isDragActive ? 0.96 : 1, {
            damping: 18,
            stiffness: 240,
        });
    }, [isDragActive, dragScale, dragOpacity]);

    const dragStyle = useAnimatedStyle(() => ({
        transform: [{ scale: dragScale.value }],
        opacity: dragOpacity.value,
    }));

    return (
        <Animated.View style={[styles.wrapper, dragStyle]}>
            <PressableScale
                onPress={onPress}
                onLongPress={() => {
                    haptic('medium');
                    onLongPress?.();
                }}
                disabled={editMode}
                hapticKind={editMode ? null : 'light'}
                scaleTo={0.98}
            >
                <Card
                    accent={section.accentColor}
                    showAccentLine={section.notifyOn || section.pinned}
                    shadow={section.pinned ? 'lg' : 'md'}
                    style={[
                        styles.card,
                        section.pinned && {
                            shadowColor: section.accentColor,
                            shadowOpacity: 0.35,
                        },
                    ]}
                >
                    <View style={styles.row}>
                        <View
                            style={[
                                styles.leading,
                                { backgroundColor: section.accentColor + '22' },
                            ]}
                        >
                            {section.emoji ? (
                                <Text style={styles.emoji}>{section.emoji}</Text>
                            ) : (
                                <View
                                    style={[
                                        styles.dot,
                                        {
                                            backgroundColor: section.accentColor,
                                            shadowColor: section.accentColor,
                                        },
                                    ]}
                                />
                            )}
                        </View>

                        <View style={styles.body}>
                            <View style={styles.titleRow}>
                                {section.pinned && (
                                    <Ionicons
                                        name="pin"
                                        size={13}
                                        color={section.accentColor}
                                        style={styles.pinIcon}
                                    />
                                )}
                                <Text style={styles.title} numberOfLines={1}>
                                    {section.title}
                                </Text>
                            </View>
                            <Text style={styles.meta} numberOfLines={1}>
                                키워드 {section.keywords.length}
                                <Text style={styles.metaDim}> · </Text>
                                {section.notifyOn ? '알림 ON' : '알림 OFF'}
                            </Text>
                        </View>

                        {editMode ? (
                            <Pressable
                                onPress={onDelete}
                                hitSlop={14}
                                style={({ pressed }) => [
                                    styles.deleteBtn,
                                    pressed && { opacity: 0.6 },
                                ]}
                            >
                                <Ionicons name="remove" size={18} color="#fff" />
                            </Pressable>
                        ) : (
                            <View style={styles.trailing}>
                                {section.notifyOn && (
                                    <View
                                        style={[
                                            styles.glowDot,
                                            {
                                                backgroundColor: section.accentColor,
                                                shadowColor: section.accentColor,
                                            },
                                        ]}
                                    />
                                )}
                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={colors.textMuted}
                                />
                            </View>
                        )}
                    </View>
                </Card>
            </PressableScale>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: { marginVertical: 6 },
    card: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    leading: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: { fontSize: 20 },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        shadowOpacity: 0.7,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 0 },
    },
    body: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    pinIcon: { marginRight: 4 },
    title: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
    meta: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    metaDim: { color: colors.textMuted },
    trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    glowDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        shadowOpacity: 0.9,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
        marginRight: 2,
    },
    deleteBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
