import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput } from 'react-native';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { PressableScale } from '../../../ui/primitives/PressableScale';
import { haptic } from '../../../ui/feedback/haptics';
import { colors, radius, spacing, typography } from '../../../ui/theme';
import { useSectionsStore } from '../../../stores/sectionsStore';
import { useUIStore } from '../../../stores/uiStore';

export function AddSectionSheet() {
    const ref = useRef<BottomSheetModal>(null);
    const open = useUIStore(s => s.addSectionSheetOpen);
    const close = useUIStore(s => s.closeAddSection);
    const addSection = useSectionsStore(s => s.addSection);

    const [title, setTitle] = useState('');

    useEffect(() => {
        if (open) ref.current?.present();
        else ref.current?.dismiss();
    }, [open]);

    const snapPoints = useMemo(() => ['44%'], []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={0.6}
            />
        ),
        [],
    );

    const submit = useCallback(() => {
        const t = title.trim();
        if (!t) {
            haptic('warning');
            return;
        }
        addSection({ title: t });
        haptic('success');
        setTitle('');
        Keyboard.dismiss();
        close();
    }, [title, addSection, close]);

    return (
        <BottomSheetModal
            ref={ref}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enablePanDownToClose
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            onDismiss={() => {
                setTitle('');
                close();
            }}
            backgroundStyle={styles.sheetBg}
            handleIndicatorStyle={styles.handle}
            backdropComponent={renderBackdrop}
        >
            <BottomSheetView style={styles.content}>
                <Text style={styles.title}>새 섹션 추가</Text>
                <Text style={styles.sub}>
                    관심 있는 키워드 묶음의 이름을 정해주세요.
                </Text>

                <TextInput
                    autoFocus
                    value={title}
                    onChangeText={setTitle}
                    placeholder="예) AI 인턴"
                    placeholderTextColor={colors.textMuted}
                    selectionColor={colors.accent}
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={submit}
                />

                <PressableScale
                    onPress={submit}
                    hapticKind="medium"
                    style={styles.cta}
                >
                    <Text style={styles.ctaLabel}>추가하기</Text>
                </PressableScale>
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    sheetBg: {
        backgroundColor: colors.bgRaised,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
    },
    handle: { backgroundColor: colors.borderStrong, width: 36 },
    content: {
        padding: spacing.xl,
        gap: spacing.md,
    },
    title: { ...typography.h2, color: colors.textPrimary },
    sub: {
        ...typography.bodySm,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: colors.bgRaisedAlt,
        color: colors.textPrimary,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cta: {
        marginTop: spacing.md,
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    ctaLabel: { ...typography.body, color: '#fff', fontWeight: '700' },
});
