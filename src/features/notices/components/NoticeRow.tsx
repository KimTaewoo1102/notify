import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PressableScale } from '../../../ui/primitives/PressableScale';
import { colors, radius, spacing, typography } from '../../../ui/theme';
import { CATEGORY_LABEL } from '../../../constants/categories';
import {
    LONG_PRESS_DELAY_MS,
    MAX_MATCHED_KEYWORDS_DISPLAYED,
} from '../../../constants/ui';
import { timeAgo } from '../../../utils/time';
import type { Notice } from '../../../types/domain';

import type { NoticeMenuAnchor } from './NoticeContextMenu';

/** 시스템 '고정' 섹션과 동일 톤의 핀 컬러. */
const PIN_COLOR = colors.warning;

interface Props {
    notice: Notice;
    /** 섹션 accent 컬러. 선택/태그/매치 칩 등 동적 강조에 사용. */
    accent: string;
    pinned: boolean;
    selectionMode: boolean;
    isSelected: boolean;
    /** 화면 진입 시 스냅샷된 lastVisitedAt 기준으로 판정된 '신규' 공지 여부. */
    isNew: boolean;
    /** 카드 본문 탭 — selection / 스와이프 닫기 / URL 열기 등 (호출 측 결정) */
    onPress: () => void;
    onLongPress: (anchor: NoticeMenuAnchor) => void;
}

/**
 * 단일 공지 카드.
 *  - 카드 본문 탭 = 외부 URL 열기 (호출 측에서 onPress 안에 처리).
 *    우측 chevron-forward 가 affordance 를 시각적으로 표현.
 *  - 카드 위치 측정 → 컨텍스트 메뉴 anchor 계산.
 *  - selectionMode 일 때 좌측 체크박스 노출, 우측 chevron 숨김.
 *  - 신규/핀/선택 상태에 따라 카드 배경/테두리 톤 변경.
 *  - '신규' 표시는 미니멀한 컬러 dot (accentAlt) — 텍스트 뱃지 대신.
 */
export function NoticeRow({
    notice,
    accent,
    pinned,
    selectionMode,
    isSelected,
    isNew,
    onPress,
    onLongPress,
}: Props) {
    const ref = useRef<View>(null);

    const handleLongPress = () => {
        ref.current?.measureInWindow((x, y, width, height) => {
            onLongPress({ top: y, left: x, width, height });
        });
    };

    return (
        <View ref={ref} collapsable={false}>
            <PressableScale
                onPress={onPress}
                onLongPress={handleLongPress}
                delayLongPress={LONG_PRESS_DELAY_MS}
                scaleTo={0.985}
                style={[
                    styles.card,
                    isNew && !selectionMode && !pinned && styles.cardNew,
                    pinned && !selectionMode && {
                        borderColor: PIN_COLOR + '66',
                        backgroundColor: PIN_COLOR + '0E',
                    },
                    selectionMode && isSelected && {
                        borderColor: accent,
                        backgroundColor: accent + '14',
                    },
                ]}
            >
                {selectionMode && (
                    <View
                        style={[
                            styles.checkbox,
                            isSelected && {
                                backgroundColor: accent,
                                borderColor: accent,
                            },
                        ]}
                    >
                        {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                    </View>
                )}

                <View style={styles.bodyWrap}>
                    <View style={styles.top}>
                        <View style={[styles.tag, { backgroundColor: accent + '22' }]}>
                            <Text style={[styles.tagText, { color: accent }]}>
                                {CATEGORY_LABEL[notice.category] ?? notice.category}
                            </Text>
                        </View>
                        {/* 신규 공지 — 미니멀 컬러 dot (accentAlt) */}
                        {isNew && !selectionMode && !pinned && (
                            <View style={styles.newDot} />
                        )}
                        {notice.isSourcePinned && (
                            <Ionicons
                                name="pin"
                                size={11}
                                color={accent}
                                style={styles.pinIcon}
                            />
                        )}
                        <Text style={styles.time}>{timeAgo(notice.publishedAt)}</Text>
                    </View>

                    <View style={styles.titleRow}>
                        {pinned && (
                            <Ionicons
                                name="pin"
                                size={13}
                                color={PIN_COLOR}
                                style={styles.userPinIcon}
                            />
                        )}
                        <Text style={styles.title} numberOfLines={2}>
                            {notice.title}
                        </Text>
                    </View>

                    <View style={styles.bottom}>
                        <Text style={styles.dept}>{notice.department}</Text>
                        {notice.matchedKeywords && notice.matchedKeywords.length > 0 && (
                            <View style={styles.matchedRow}>
                                {notice.matchedKeywords
                                    .slice(0, MAX_MATCHED_KEYWORDS_DISPLAYED)
                                    .map(kw => (
                                        <View
                                            key={kw}
                                            style={[
                                                styles.matchChip,
                                                { backgroundColor: accent + '18' },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.matchChipText,
                                                    { color: accent },
                                                ]}
                                            >
                                                {kw}
                                            </Text>
                                        </View>
                                    ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* 우측 chevron — '탭하여 열기' 의 affordance. selection mode 에서는 숨김. */}
                {!selectionMode && (
                    <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textDisabled}
                        style={styles.chevron}
                    />
                )}
            </PressableScale>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: colors.bgRaised,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
    },
    cardNew: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.12)',
    },
    bodyWrap: { flex: 1, gap: spacing.xs },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.borderStrong,
        backgroundColor: colors.bgRaisedAlt,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: 2,
    },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
    userPinIcon: { marginRight: 5, marginTop: 5 },
    tag: {
        borderRadius: radius.sm,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    tagText: { ...typography.caption, fontWeight: '600', fontSize: 11 },
    /* 신규 공지 dot — 6px circle, accentAlt (시안) */
    newDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accentAlt,
    },
    pinIcon: { marginLeft: 2 },
    time: {
        ...typography.caption,
        color: colors.textMuted,
        marginLeft: 'auto',
    },
    title: {
        ...typography.body,
        color: colors.textPrimary,
        lineHeight: 22,
        flex: 1,
    },
    bottom: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: 4,
    },
    dept: { ...typography.caption, color: colors.textMuted, flex: 1 },
    matchedRow: { flexDirection: 'row', gap: 4 },
    matchChip: {
        borderRadius: radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    matchChipText: { fontSize: 11, fontWeight: '600' },
    chevron: {
        alignSelf: 'center',
    },
});
