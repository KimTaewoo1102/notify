import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, shadows, spacing, typography } from '../../../ui/theme';

export interface SectionMenuItem {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    destructive?: boolean;
    onPress: () => void;
}

export interface MenuAnchor {
    /** measureInWindow 결과로 계산한 화면 좌상단 기준 좌표 (top: 메뉴 상단, right: 메뉴 우측 여백). */
    top: number;
    right: number;
}

interface Props {
    visible: boolean;
    anchor: MenuAnchor | null;
    items: SectionMenuItem[];
    onClose: () => void;
}

/**
 * 케밥 버튼 위치 아래에 떠오르는 작은 popover.
 * - Modal 의 transparent 배경 한 장으로 외부 탭 = 닫기 처리.
 * - 항목 탭 시 메뉴를 먼저 닫고 다음 frame 에 onPress 실행 → Modal/Sheet 가
 *   동시에 떠서 z-index 충돌이 나는 것을 방지.
 */
export function SectionCardMenu({ visible, anchor, items, onClose }: Props) {
    return (
        <Modal
            visible={visible && !!anchor}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                {anchor ? (
                    <Pressable
                        style={[
                            styles.menu,
                            { top: anchor.top, right: anchor.right },
                        ]}
                        // 메뉴 영역 클릭이 backdrop 으로 새지 않도록 noop.
                        onPress={() => {}}
                    >
                        {items.map((it, i) => (
                            <Pressable
                                key={it.key}
                                onPress={() => {
                                    onClose();
                                    requestAnimationFrame(it.onPress);
                                }}
                                style={({ pressed }) => [
                                    styles.item,
                                    i > 0 && styles.itemDivider,
                                    pressed && styles.itemPressed,
                                ]}
                            >
                                <Ionicons
                                    name={it.icon}
                                    size={16}
                                    color={
                                        it.destructive
                                            ? colors.danger
                                            : colors.textSecondary
                                    }
                                />
                                <Text
                                    style={[
                                        styles.label,
                                        it.destructive && styles.destructive,
                                    ]}
                                >
                                    {it.label}
                                </Text>
                            </Pressable>
                        ))}
                    </Pressable>
                ) : null}
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        // 살짝 어둡게 — 시선이 메뉴로 모이도록.
        backgroundColor: 'rgba(0,0,0,0.18)',
    },
    menu: {
        position: 'absolute',
        minWidth: 176,
        backgroundColor: colors.bgRaisedAlt,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        paddingVertical: 4,
        ...shadows.lg,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 11,
    },
    itemDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    itemPressed: {
        backgroundColor: colors.bgRaised,
    },
    label: {
        ...typography.bodySm,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    destructive: {
        color: colors.danger,
        fontWeight: '600',
    },
});
