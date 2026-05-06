import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { haptics } from '../../utils/haptics';

interface MenuItemDef {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress: () => void;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    items: MenuItemDef[];
}

export default function MenuModal({ visible, onClose, items }: Props) {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.94)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 90 }),
            ]).start();
        } else {
            opacity.setValue(0);
            scale.setValue(0.94);
        }
    }, [visible, opacity, scale]);

    const handleClose = () => {
        haptics.tap();
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <Animated.View style={[styles.overlay, { opacity }]}>
                <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose}>
                    <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.overlay }]} />
                </Pressable>

                <Animated.View style={[styles.sheet, { transform: [{ scale }] }]}>
                    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
                    <View style={[StyleSheet.absoluteFillObject, styles.sheetFill]} />
                    <View style={styles.sheetHighlight} pointerEvents="none" />

                    <Text style={styles.sheetTitle}>메뉴</Text>
                    {items.map((item, idx) => (
                        <Item
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            isLast={idx === items.length - 1}
                            onPress={() => {
                                haptics.tap();
                                onClose();
                                item.onPress();
                            }}
                        />
                    ))}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

function Item({
    icon, label, onPress, isLast,
}: MenuItemDef & { isLast: boolean }) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[styles.item, !isLast && styles.itemBorder]}
        >
            <View style={styles.itemIcon}>
                <Ionicons name={icon} size={18} color={colors.textPrimary} />
            </View>
            <Text style={styles.itemLabel}>{label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    sheet: {
        borderRadius: radius.xl,
        overflow: 'hidden',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorder,
    },
    sheetFill: { backgroundColor: 'rgba(15,15,18,0.7)' },
    sheetHighlight: {
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 1,
        backgroundColor: colors.glassHighlight,
    },
    sheetTitle: {
        ...typography.label,
        color: colors.textTertiary,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
    },
    itemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    itemIcon: {
        width: 32, height: 32,
        borderRadius: 10,
        marginRight: spacing.md,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.glassFill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
    },
    itemLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
});
