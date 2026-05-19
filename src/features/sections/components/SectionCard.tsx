import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PressableScale } from '../../../ui/primitives/PressableScale';
import { colors, radius, shadows, spacing, typography } from '../../../ui/theme';
import { useSectionCardAnimation } from '../hooks/useSectionCardAnimation';
import { useSectionKebabMenu } from '../hooks/useSectionKebabMenu';
import type { Section } from '../../../types/domain';

import { SectionCardMenu } from './SectionCardMenu';

/** 모든 user 섹션에 동일하게 적용되는 통일 accent. 시스템 섹션은 자체 accentColor 유지. */
const USER_ACCENT = colors.accent;

interface Props {
    section: Section;
    onPress?: () => void;
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
    onPress,
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

    const wrapperStyle = useSectionCardAnimation({
        notifyOn: section.notifyOn,
        isSystem,
    });

    const { kebabRef, anchor, items, openMenu, closeMenu } = useSectionKebabMenu(
        section,
        { onToggleNotify, onEditKeywords, onRename, onDelete },
    );

    const showKebab = !isSystem;
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
    const showUnreadBadge = !isSystem && unreadCount > 0;
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
                    scaleTo={isSystem ? 0.99 : 0.98}
                >
                    <View style={styles.cardContent}>
                        <View style={styles.row}>
                            <View
                                style={[
                                    styles.leading,
                                    {
                                        backgroundColor:
                                            effectiveAccent + (isSystem ? '2A' : '22'),
                                    },
                                ]}
                            >
                                {renderLeading()}
                            </View>

                            <View style={styles.body}>
                                <View style={styles.titleRow}>
                                    {!isSystem && section.pinned && (
                                        <Ionicons
                                            name="star"
                                            size={12}
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
                                                스크랩 {pinnedCount}개
                                                <Text style={styles.metaDim}> · </Text>
                                                길게 눌러 공지 스크랩
                                            </>
                                        ) : (
                                            '공지를 길게 눌러 스크랩해 보세요'
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
                        </View>
                    </View>

                    {/* 미리보기 슬롯 — PressableScale 안에 포함시켜 터치 영역 통합 */}
                    {previewSlot && (
                        <>
                            <View style={styles.internalDivider} />
                            {previewSlot}
                        </>
                    )}
                </PressableScale>
            </View>

            <SectionCardMenu
                visible={!!anchor}
                anchor={anchor}
                items={items}
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
        // 상단 가장자리 highlight — 이중 depth (shadow + edge)
        borderTopColor: colors.edgeHighlight,
        overflow: 'hidden',
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
});
