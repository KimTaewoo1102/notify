import React, { useEffect } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, shadows, spacing, typography } from '../../../ui/theme';

export interface NoticeMenuItem {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    destructive?: boolean;
    onPress: () => void;
}

export interface NoticeMenuAnchor {
    /** measureInWindow 결과 — 메뉴를 띄울 기준점(카드 중심 근처). */
    top: number;
    left: number;
    width: number;
    height: number;
}

interface Props {
    visible: boolean;
    anchor: NoticeMenuAnchor | null;
    items: NoticeMenuItem[];
    onClose: () => void;
}

const MENU_WIDTH = 220;
const MENU_PAD = 12;

/**
 * iOS 스타일의 long-press 컨텍스트 메뉴.
 * - backdrop 은 어둡게 페이드, 메뉴는 카드 아래에서 살짝 떠오름.
 * - 메뉴는 항상 카드의 좌하단 또는 우하단에 anchor → 화면 끝에선 자동 보정.
 */
export function NoticeContextMenu({ visible, anchor, items, onClose }: Props) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(visible ? 1 : 0, {
            duration: 180,
            easing: Easing.out(Easing.cubic),
        });
    }, [visible, progress]);

    const menuStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [
            { scale: 0.94 + 0.06 * progress.value },
            { translateY: (1 - progress.value) * -6 },
        ],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
    }));

    const pos = computeMenuPosition(anchor);

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
                {pos ? (
                    <Animated.View
                        style={[
                            styles.menu,
                            { top: pos.top, left: pos.left },
                            menuStyle,
                        ]}
                    >
                        <Pressable onPress={() => {}}>
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
                                        size={17}
                                        color={
                                            it.destructive
                                                ? colors.danger
                                                : it.iconColor ?? colors.textSecondary
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

function computeMenuPosition(
    anchor: NoticeMenuAnchor | null,
): { top: number; left: number } | null {
    if (!anchor) return null;
    const screen = require('react-native').Dimensions.get('window');
    const screenW: number = screen.width;
    const screenH: number = screen.height;
    const estHeight = 180;

    let top = anchor.top + anchor.height + 6;
    if (top + estHeight > screenH - MENU_PAD) {
        top = Math.max(MENU_PAD, anchor.top - estHeight - 6);
    }

    let left = anchor.left;
    if (left + MENU_WIDTH > screenW - MENU_PAD) {
        left = screenW - MENU_WIDTH - MENU_PAD;
    }
    if (left < MENU_PAD) left = MENU_PAD;

    return { top, left };
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.34)',
    },
    menu: {
        position: 'absolute',
        width: MENU_WIDTH,
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
        paddingVertical: 12,
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
