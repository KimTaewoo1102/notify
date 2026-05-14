import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PressableScale } from '../../../ui/primitives/PressableScale';
import { haptic } from '../../../ui/feedback/haptics';
import { colors, radius, shadows, spacing, typography } from '../../../ui/theme';

/** 모든 user 섹션에 동일하게 적용되는 통일 accent. 시스템 섹션은 자체 accentColor 유지. */
const USER_ACCENT = colors.accent;
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
    /** 카드 아래에 렌더할 미리보기 영역. */
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
    const effectiveAccent = isSystem ? section.accentColor : USER_ACCENT;

    const dragScale = useSharedValue(1);
    const dragOpacity = useSharedValue(1);
    const shake = useSharedValue(0);

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
    const showAccentLine = false;
    const shadowSize = isSystem ? 'lg' : 'md';

    /* ─── 좌측 leading 내용 ─────────────────────────────── */
    const renderLeading = () => {
        if (isSystem) {
            const count = pinnedCount ?? null;
            return (
                <Text
                    style={[styles.countText, { color: effectiveAccent }]}
                    numberOfLines={1}
                >
                    {count !== null ? String(count) : '—'}
                </Text>
            );
        }
        if (section.emoji) {
            return <Text style={styles.emoji}>{section.emoji}</Text>;
        }
        const count = totalNoticeCount ?? null;
        return (
            <Text
                style={[styles.countText, { color: effectiveAccent }]}
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
            {/* 통합 카드 셸 — 카드 헤더와 미리보기를 하나의 둥근 덩어리로 감싼다 */}
            <View
                style={[
                    styles.unifiedShell,
                    shadows[shadowSize],
                    isSystem && {
                        backgroundColor: colors.bgRaisedAlt,
                    },
                ]}
            >
                {/* 상단 accent 그라데이션 라인 */}
                {showAccentLine ? (
                    <LinearGradient
                        colors={['transparent', effectiveAccent + 'CC', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.accentLine}
                        pointerEvents="none"
                    />
                ) : null}

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
                    <View style={styles.cardContent}>
                        <View style={styles.row}>
                            <View
                                style={[
                                    styles.leading,
                                    {
                                        backgroundColor:
                                            effectiveAccent +
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
                                            color={effectiveAccent}
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
                                    {/* 알림 OFF일 때만 타이틀 옆에 뮤트 아이콘 표시 */}
                                    {!isSystem && !section.notifyOn && (
                                        <Ionicons
                                            name="notifications-off"
                                            size={12}
                                            color={colors.textDisabled}
                                            style={styles.mutedIcon}
                                        />
                                    )}
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
                                    ) : section.keywords.length === 0 ? (
                                        <Text style={styles.metaDim}>키워드 없음</Text>
                                    ) : (
                                        <>
                                            {section.keywords.slice(0, 3).map(k => k.text).join(' · ')}
                                            {section.keywords.length > 3 && (
                                                <Text style={styles.metaDim}>
                                                    {` 외 ${section.keywords.length - 3}개`}
                                                </Text>
                                            )}
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
                    </View>
                </PressableScale>

                {/* 미리보기 슬롯 — 통합 셸 내부에서 구분선 아래 렌더 */}
                {previewSlot && (
                    <>
                        <View style={styles.internalDivider} />
                        {previewSlot}
                    </>
                )}
            </View>

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
    /* 카드 헤더 + 미리보기를 하나의 시각 단위로 묶는 외곽 셸 */
    unifiedShell: {
        backgroundColor: colors.bgRaised,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    /* 시스템 카드 좌측 2px accent 스트라이프 */
    sideStripe: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 2.5,
        opacity: 0.7,
        zIndex: 1,
    },
    /* 상단 1.5px 그라데이션 accent 라인 */
    accentLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1.5,
        zIndex: 1,
    },
    cardContent: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    /* 카드 헤더와 미리보기 사이의 얇은 구분선 */
    internalDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.borderStrong,
        marginHorizontal: spacing.md,
    },
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
    countText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    body: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    pinIcon: { marginRight: 4 },
    mutedIcon: { marginLeft: 4, flexShrink: 0 },
    systemLeadingIcon: { marginTop: -1 },
    title: { ...typography.body, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
    systemTitle: { letterSpacing: 0.2 },
    meta: {
        fontSize: 10,
        fontWeight: '500',
        color: 'rgba(245,245,247,0.50)',
        marginTop: 2,
    },
    metaDim: { color: colors.textMuted },
    trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
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
