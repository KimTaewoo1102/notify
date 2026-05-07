import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Card } from '../../../ui/primitives/Card';
import { PressableScale } from '../../../ui/primitives/PressableScale';
import { haptic } from '../../../ui/feedback/haptics';
import { colors, radius, spacing, typography } from '../../../ui/theme';
import type { Section } from '../../../types/domain';
import {
    SectionCardMenu,
    type MenuAnchor,
    type SectionMenuItem,
} from './SectionCardMenu';

const SCREEN_W = Dimensions.get('window').width;

interface Props {
    section: Section;
    editMode?: boolean;
    isDragActive?: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
    onDelete?: () => void;
    /* Phase C 추가 핸들러 — 케밥 메뉴 항목용 */
    onToggleNotify?: () => void;
    onEditKeywords?: () => void;
    onRename?: () => void;
    /** 시스템 '고정' 섹션 카드에서만 사용 — 핀된 공지 수. */
    pinnedCount?: number;
}

export function SectionCard({
    section,
    editMode,
    isDragActive,
    onPress,
    onLongPress,
    onDelete,
    onToggleNotify,
    onEditKeywords,
    onRename,
    pinnedCount,
}: Props) {
    const isSystem = section.kind === 'system';

    /* ─── 워크릿용 SharedValue ─────────────────────────────
     *  prop/state 를 useAnimatedStyle 안에서 직접 참조하지 않도록
     *  모든 동적 값은 SharedValue 로만 다룬다.
     */
    const dragScale = useSharedValue(1);
    const dragOpacity = useSharedValue(1);
    const shake = useSharedValue(0);
    const glow = useSharedValue(section.notifyOn && !isSystem ? 0.7 : 0);

    /* ─── 드래그 상태 ↔ 스케일/투명도 ──────────────────── */
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

    /* ─── 알람 ON 펄스 Glow ──────────────────────────────
     *  notifyOn 동안 무한 펄스, 꺼지면 cancel + fade.
     *  시스템 섹션은 자체 정적 glow 그림자를 갖고 있어 적용하지 않음.
     */
    useEffect(() => {
        if (isSystem) return;
        if (section.notifyOn) {
            cancelAnimation(glow);
            glow.value = withRepeat(
                withSequence(
                    withTiming(1, {
                        duration: 1100,
                        easing: Easing.inOut(Easing.quad),
                    }),
                    withTiming(0.4, {
                        duration: 1100,
                        easing: Easing.inOut(Easing.quad),
                    }),
                ),
                -1,
                true,
            );
        } else {
            cancelAnimation(glow);
            glow.value = withTiming(0, { duration: 240 });
        }
    }, [section.notifyOn, isSystem, glow]);

    /* ─── 알람 OFF → ON 으로 바뀐 순간만 '부르르' + 햅틱 ── */
    const prevNotify = useRef(section.notifyOn);
    useEffect(() => {
        const wasOff = !prevNotify.current;
        const isOn = section.notifyOn;
        if (wasOff && isOn && !isSystem) {
            haptic('heavy');
            shake.value = withSequence(
                withTiming(-7, { duration: 50 }),
                withTiming(7, { duration: 60 }),
                withTiming(-6, { duration: 60 }),
                withTiming(5, { duration: 55 }),
                withTiming(-3, { duration: 55 }),
                withTiming(0, { duration: 70 }),
            );
        }
        prevNotify.current = section.notifyOn;
    }, [section.notifyOn, isSystem, shake]);

    /* ─── 합쳐진 wrapper transform ───────────────────────── */
    const wrapperStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: shake.value },
            { scale: dragScale.value },
        ],
        opacity: dragOpacity.value,
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glow.value,
    }));

    /* ─── 케밥 메뉴 ──────────────────────────────────────── */
    const kebabRef = useRef<View>(null);
    const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);

    const openMenu = () => {
        haptic('selection');
        kebabRef.current?.measureInWindow((x, y, w, h) => {
            setMenuAnchor({
                top: y + h + 6,
                right: Math.max(spacing.lg, SCREEN_W - (x + w)),
            });
        });
    };
    const closeMenu = () => setMenuAnchor(null);

    const menuItems: SectionMenuItem[] = [
        {
            key: 'notify',
            label: section.notifyOn ? '알람 끄기' : '알람 켜기',
            icon: section.notifyOn ? 'notifications-off' : 'notifications',
            onPress: () => onToggleNotify?.(),
        },
        {
            key: 'kw',
            label: '키워드 편집',
            icon: 'pricetag',
            onPress: () => onEditKeywords?.(),
        },
        {
            key: 'rename',
            label: '이름 변경',
            icon: 'create-outline',
            onPress: () => onRename?.(),
        },
        {
            key: 'delete',
            label: '섹션 삭제',
            icon: 'trash',
            destructive: true,
            onPress: () => onDelete?.(),
        },
    ];

    /* ─── 트레일링 영역(케밥 vs '-' vs chevron) 렌더링 ─── */
    const showKebab = !isSystem && !editMode;
    const showDelete = !isSystem && editMode;

    return (
        <Animated.View style={[styles.wrapper, wrapperStyle]}>
            {/* 알람 ON 동안 펄스하는 glow ring (시스템 섹션은 미적용) */}
            {!isSystem && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.glowRing,
                        {
                            borderColor: section.accentColor + 'AA',
                            shadowColor: section.accentColor,
                        },
                        glowStyle,
                    ]}
                />
            )}

            <PressableScale
                onPress={onPress}
                onLongPress={
                    isSystem
                        ? undefined
                        : () => {
                              haptic('medium');
                              onLongPress?.();
                          }
                }
                disabled={editMode && !isSystem}
                hapticKind={editMode || isSystem ? null : 'light'}
                scaleTo={isSystem ? 0.99 : 0.98}
            >
                <Card
                    accent={section.accentColor}
                    showAccentLine={
                        isSystem || section.notifyOn || section.pinned
                    }
                    shadow={isSystem || section.pinned ? 'lg' : 'md'}
                    style={[
                        styles.card,
                        // 시스템 섹션 — 살짝 밝은 배경 + accent 정적 glow
                        isSystem && {
                            backgroundColor: colors.bgRaisedAlt,
                            borderColor: section.accentColor + '33',
                            shadowColor: section.accentColor,
                            shadowOpacity: 0.22,
                        },
                        !isSystem && section.pinned && {
                            shadowColor: section.accentColor,
                            shadowOpacity: 0.35,
                        },
                    ]}
                >
                    <View style={styles.row}>
                        <View
                            style={[
                                styles.leading,
                                {
                                    backgroundColor:
                                        section.accentColor +
                                        (isSystem ? '2A' : '22'),
                                },
                            ]}
                        >
                            {isSystem ? (
                                <Ionicons
                                    name="pin"
                                    size={18}
                                    color={section.accentColor}
                                    style={styles.systemLeadingIcon}
                                />
                            ) : section.emoji ? (
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
                                {!isSystem && section.pinned && (
                                    <Ionicons
                                        name="pin"
                                        size={13}
                                        color={section.accentColor}
                                        style={styles.pinIcon}
                                    />
                                )}
                                <Text
                                    style={[
                                        styles.title,
                                        isSystem && styles.systemTitle,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {section.title}
                                </Text>
                            </View>
                            <Text style={styles.meta} numberOfLines={1}>
                                {isSystem ? (
                                    pinnedCount && pinnedCount > 0 ? (
                                        <>
                                            고정 {pinnedCount}개
                                            <Text style={styles.metaDim}> · </Text>
                                            길게 눌러 공지 고정
                                        </>
                                    ) : (
                                        '공지를 길게 눌러 고정해 보세요'
                                    )
                                ) : (
                                    <>
                                        키워드 {section.keywords.length}
                                        <Text style={styles.metaDim}> · </Text>
                                        {section.notifyOn ? '알림 ON' : '알림 OFF'}
                                    </>
                                )}
                            </Text>
                        </View>

                        {showDelete ? (
                            <Pressable
                                onPress={onDelete}
                                hitSlop={14}
                                style={({ pressed }) => [
                                    styles.deleteBtn,
                                    pressed && { opacity: 0.6 },
                                ]}
                            >
                                <Ionicons
                                    name="remove"
                                    size={18}
                                    color="#fff"
                                />
                            </Pressable>
                        ) : (
                            <View style={styles.trailing}>
                                {!isSystem && section.notifyOn && (
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
                                {showKebab ? (
                                    <Pressable
                                        ref={kebabRef}
                                        onPress={openMenu}
                                        hitSlop={12}
                                        style={({ pressed }) => [
                                            styles.kebabBtn,
                                            pressed && { opacity: 0.6 },
                                        ]}
                                    >
                                        <Ionicons
                                            name="ellipsis-vertical"
                                            size={16}
                                            color={colors.textSecondary}
                                        />
                                    </Pressable>
                                ) : (
                                    <Ionicons
                                        name="chevron-forward"
                                        size={18}
                                        color={colors.textMuted}
                                    />
                                )}
                            </View>
                        )}
                    </View>
                </Card>
            </PressableScale>

            <SectionCardMenu
                visible={!!menuAnchor}
                anchor={menuAnchor}
                items={menuItems}
                onClose={closeMenu}
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: { marginVertical: 6 },
    // 카드 둘레에 살짝 더 큰 사이즈로 떠오르는 glow ring (notifyOn 일 때 펄스).
    glowRing: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: radius.lg + 2,
        borderWidth: 1.5,
        shadowOpacity: 0.7,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
        // elevation 은 Animated opacity 와 함께 펄스되도록 일부러 작게 둠.
        elevation: 4,
    },
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
    systemLeadingIcon: { marginTop: -1 },
    title: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
    systemTitle: { letterSpacing: 0.2 },
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
    kebabBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
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
