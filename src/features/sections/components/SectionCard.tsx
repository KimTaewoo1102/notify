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
    onToggleNotify?: () => void;
    onEditKeywords?: () => void;
    onRename?: () => void;
    /** 시스템 '고정' 섹션 카드에서만 사용 — 핀된 공지 수. */
    pinnedCount?: number;
    /** 이 섹션의 전체 공지 개수 (noticeCountCache에서 조회). */
    totalNoticeCount?: number;
    /** 안 읽은 공지 개수 (lastVisitedAt 이후 신규 공지 수). */
    unreadCount?: number;
    /** 카드 아래에 렌더할 미리보기 영역 (Phase 3에서 주입). */
    previewSlot?: React.ReactNode;
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
    totalNoticeCount,
    unreadCount = 0,
    previewSlot,
}: Props) {
    const isSystem = section.kind === 'system';

    const dragScale = useSharedValue(1);
    const dragOpacity = useSharedValue(1);
    const shake = useSharedValue(0);
    const glow = useSharedValue(section.notifyOn && !isSystem ? 0.7 : 0);

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

    const showKebab = !isSystem && !editMode;
    const showDelete = !isSystem && editMode;

    /* ─── 좌측 leading 내용 ─────────────────────────────── */
    const renderLeading = () => {
        if (isSystem) {
            return (
                <Ionicons
                    name="pin"
                    size={18}
                    color={section.accentColor}
                    style={styles.systemLeadingIcon}
                />
            );
        }
        if (section.emoji) {
            return <Text style={styles.emoji}>{section.emoji}</Text>;
        }
        // dot → 전체 공지 개수 숫자
        const count = totalNoticeCount ?? null;
        return (
            <Text
                style={[styles.countText, { color: section.accentColor }]}
                numberOfLines={1}
            >
                {count !== null ? String(count) : '—'}
            </Text>
        );
    };

    /* ─── 우측 unread 뱃지 ──────────────────────────────── */
    const showUnreadBadge = !isSystem && !editMode && unreadCount > 0;
    const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

    return (
        <Animated.View style={[styles.outerWrapper, wrapperStyle]}>
            {/* 카드 영역 — glowRing은 여기서만 */}
            <View style={styles.cardWrapper}>
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
                                {renderLeading()}
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
                                    {/* 안 읽은 공지 뱃지 (카카오톡 스타일) */}
                                    {showUnreadBadge && (
                                        <View
                                            style={[
                                                styles.unreadBadge,
                                                { backgroundColor: colors.danger },
                                            ]}
                                        >
                                            <Text style={styles.unreadBadgeText}>
                                                {badgeLabel}
                                            </Text>
                                        </View>
                                    )}
                                    {/* notifyOn 글로우 도트 */}
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
            </View>

            {/* 미리보기 슬롯 — Phase 3에서 HomeScreen이 주입 */}
            {previewSlot}

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
    outerWrapper: { marginVertical: 6 },
    // 카드 + glowRing 만 감싸는 영역 (미리보기는 아래에 별도).
    cardWrapper: { position: 'relative' },
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
    // 전체 공지 개수 — dot 을 대체.
    countText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.3,
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
    // 카카오톡 스타일 unread 뱃지.
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 14,
    },
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
