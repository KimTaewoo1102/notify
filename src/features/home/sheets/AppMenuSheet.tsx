import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, spacing, typography } from '../../../ui/theme';
import { runAfterFrame } from '../../../utils/nextFrame';

export interface AppMenuSheetHandle {
    present: () => void;
    dismiss: () => void;
}

interface Props {
    onTrash: () => void;
}

interface MenuItemConfig {
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
}

/**
 * 홈 화면 좌측 상단 메뉴 버튼이 띄우는 바텀시트.
 *
 *  - 현재 항목: 휴지통 1개 (확장 대비 BottomSheet 패턴 사용).
 *  - 향후 확장 예시: 설정 / 도움말 / 피드백 / 로그아웃 등.
 *  - 항목 탭 → dismiss() + runAfterFrame(onPress) 로 시트 닫기 후 다음 프레임에
 *    실제 액션 발화 (z-index 충돌 방지).
 *
 * Sheet host (SheetHost) 가 아닌 HomeScreen 에서 직접 마운트한다 — navigation
 * context 가 필요해서이며, 메뉴 트리거가 home-only 이라 글로벌화 이점이 적기 때문.
 */
export const AppMenuSheet = forwardRef<AppMenuSheetHandle, Props>(function AppMenuSheet(
    { onTrash },
    ref,
) {
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
        present: () => sheetRef.current?.present(),
        dismiss: () => sheetRef.current?.dismiss(),
    }));

    const dismissThen = useCallback((cb: () => void) => {
        sheetRef.current?.dismiss();
        runAfterFrame(cb);
    }, []);

    const items: MenuItemConfig[] = useMemo(
        () => [
            {
                key: 'trash',
                icon: 'trash-outline',
                label: '휴지통',
                onPress: () => dismissThen(onTrash),
            },
            // 향후 확장 예시:
            // { key: 'settings', icon: 'settings-outline', label: '설정', onPress: ... },
            // { key: 'help',     icon: 'help-circle-outline', label: '도움말', onPress: ... },
            // { key: 'feedback', icon: 'chatbubble-outline', label: '피드백 보내기', onPress: ... },
        ],
        [dismissThen, onTrash],
    );

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.55}
            />
        ),
        [],
    );

    return (
        <BottomSheetModal
            ref={sheetRef}
            enableDynamicSizing
            backdropComponent={renderBackdrop}
            handleIndicatorStyle={styles.handle}
            backgroundStyle={styles.background}
        >
            <BottomSheetView style={styles.content}>
                {items.map((it, i) => (
                    <Pressable
                        key={it.key}
                        onPress={it.onPress}
                        style={({ pressed }) => [
                            styles.item,
                            i > 0 && styles.itemDivider,
                            pressed && styles.itemPressed,
                        ]}
                    >
                        <Ionicons name={it.icon} size={20} color={colors.textPrimary} />
                        <Text style={styles.label}>{it.label}</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.textDisabled}
                        />
                    </Pressable>
                ))}
            </BottomSheetView>
        </BottomSheetModal>
    );
});

const styles = StyleSheet.create({
    background: {
        backgroundColor: colors.bgRaisedAlt,
    },
    handle: {
        backgroundColor: colors.borderStrong,
        width: 40,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        borderRadius: radius.md,
    },
    itemDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    itemPressed: {
        backgroundColor: colors.bgRaised,
    },
    label: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
});
