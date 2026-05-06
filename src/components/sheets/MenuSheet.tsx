import React, { forwardRef, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { haptics } from '../../utils/haptics';

export interface MenuItemDef {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress: () => void;
}

interface Props {
    items: MenuItemDef[];
    onClose?: () => void;
}

const Backdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
    />
);

const MenuSheet = forwardRef<BottomSheet, Props>(({ items, onClose }, ref) => {
    const snapPoints = useMemo(() => [Math.min(160 + items.length * 64, 520)], [items.length]);

    return (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={Backdrop}
            handleStyle={styles.handle}
            handleIndicatorStyle={styles.handleIndicator}
            backgroundStyle={styles.bg}
            onClose={onClose}
        >
            <BottomSheetView style={styles.container}>
                <BlurView
                    intensity={70}
                    tint={'systemUltraThinMaterialDark' as any}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.fill} />
                <Text style={styles.title}>메뉴</Text>
                {items.map((item, i) => (
                    <Pressable
                        key={item.label}
                        onPress={() => {
                            haptics.tap();
                            item.onPress();
                        }}
                        style={({ pressed }) => [
                            styles.item,
                            i !== items.length - 1 && styles.itemBorder,
                            pressed && styles.itemPressed,
                        ]}
                    >
                        <View style={styles.itemIcon}>
                            <Ionicons name={item.icon} size={18} color={colors.textPrimary} />
                        </View>
                        <Text style={styles.itemLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </Pressable>
                ))}
            </BottomSheetView>
        </BottomSheet>
    );
});
export default MenuSheet;

const styles = StyleSheet.create({
    bg: {
        backgroundColor: '#0A0A0C',
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
    },
    handle: { paddingTop: 10 },
    handleIndicator: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        width: 42,
    },
    container: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    fill: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    title: {
        ...typography.label,
        color: colors.textTertiary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: spacing.sm,
    },
    itemPressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
    itemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    itemIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        marginRight: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.glassFill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
    },
    itemLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
});
