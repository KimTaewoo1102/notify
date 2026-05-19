import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
} from 'react-native';
import Animated from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, shadows, spacing, typography } from '../../../ui/theme';
import { runAfterFrame } from '../../../utils/nextFrame';
import { useMenuEntrance } from '../../../ui/animations/entrance';

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
 *  - Modal 의 transparent 배경 한 장으로 외부 탭 = 닫기 처리.
 *  - 엔트런스: `useMenuEntrance` 공용 hook 사용 (spring scale 0.88→1 +
 *    timing opacity + translateY -6→0). 이전 Modal 의 단순 fade 대비 깊이감.
 *  - 항목 탭 시 메뉴를 먼저 닫고 다음 frame 에 onPress 실행 (`runAfterFrame`) →
 *    Modal/Sheet 가 동시에 떠서 z-index 충돌 나는 것을 방지.
 */
export function SectionCardMenu({ visible, anchor, items, onClose }: Props) {
    const { menuStyle, backdropStyle } = useMenuEntrance(visible);

    return (
        <Modal
            visible={visible && !!anchor}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable style={styles.fill} onPress={onClose}>
                <Animated.View style={[styles.backdrop, backdropStyle]} />
                {anchor ? (
                    <Animated.View
                        style={[
                            styles.menu,
                            { top: anchor.top, right: anchor.right },
                            menuStyle,
                        ]}
                    >
                        <Pressable onPress={() => {}}>
                            {items.map((it, i) => (
                                <Pressable
                                    key={it.key}
                                    onPress={() => {
                                        onClose();
                                        runAfterFrame(it.onPress);
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
                    </Animated.View>
                ) : null}
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
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
        // 상단 가장자리 highlight — 이중 depth (shadow + edge)
        borderTopColor: colors.edgeHighlightStrong,
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
