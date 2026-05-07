import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PressableScale } from '../../../ui/primitives/PressableScale';
import { haptic } from '../../../ui/feedback/haptics';
import { colors, radius, spacing, typography } from '../../../ui/theme';
import { useSectionsStore } from '../../../stores/sectionsStore';
import { useUIStore } from '../../../stores/uiStore';

export function KeywordEditSheet() {
    const ref = useRef<BottomSheetModal>(null);
    const sectionId = useUIStore(s => s.keywordSheetSectionId);
    const close = useUIStore(s => s.closeKeywordEdit);

    const section = useSectionsStore(s =>
        sectionId ? s.sections[sectionId] : undefined,
    );
    const addKeyword = useSectionsStore(s => s.addKeyword);
    const removeKeyword = useSectionsStore(s => s.removeKeyword);

    const [text, setText] = useState('');

    useEffect(() => {
        if (sectionId) ref.current?.present();
        else ref.current?.dismiss();
    }, [sectionId]);

    const snapPoints = useMemo(() => ['65%'], []);

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
        if (!sectionId) return;
        const t = text.trim();
        if (!t) {
            haptic('warning');
            return;
        }
        addKeyword(sectionId, t);
        haptic('light');
        setText('');
    }, [sectionId, text, addKeyword]);

    const accent = section?.accentColor ?? colors.accent;

    return (
        <BottomSheetModal
            ref={ref}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enablePanDownToClose
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            onDismiss={() => {
                setText('');
                close();
            }}
            backgroundStyle={styles.sheetBg}
            handleIndicatorStyle={styles.handle}
            backdropComponent={renderBackdrop}
        >
            <BottomSheetView style={styles.header}>
                <View style={styles.headerRow}>
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <Text style={styles.title}>키워드 편집</Text>
                </View>
                <Text style={styles.sub} numberOfLines={1}>
                    {section?.title ?? ''}
                </Text>

                <View style={styles.inputRow}>
                    <TextInput
                        value={text}
                        onChangeText={setText}
                        placeholder="키워드 입력 후 추가"
                        placeholderTextColor={colors.textMuted}
                        selectionColor={accent}
                        style={styles.input}
                        returnKeyType="done"
                        onSubmitEditing={submit}
                    />
                    <PressableScale
                        onPress={submit}
                        hapticKind="medium"
                        style={[styles.addBtn, { backgroundColor: accent }]}
                    >
                        <Ionicons name="add" size={22} color="#fff" />
                    </PressableScale>
                </View>
            </BottomSheetView>

            <BottomSheetScrollView contentContainerStyle={styles.chips}>
                {section && section.keywords.length > 0 ? (
                    section.keywords.map(k => (
                        <PressableScale
                            key={k.id}
                            hapticKind="medium"
                            onPress={() => removeKeyword(section.id, k.id)}
                            style={[styles.chip, { borderColor: accent + '66' }]}
                        >
                            <Text style={styles.chipText}>{k.text}</Text>
                            <Ionicons
                                name="close"
                                size={14}
                                color={colors.textSecondary}
                                style={styles.chipClose}
                            />
                        </PressableScale>
                    ))
                ) : (
                    <Text style={styles.empty}>
                        아직 추가된 키워드가 없어요.
                    </Text>
                )}
            </BottomSheetScrollView>
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

    header: { padding: spacing.xl, paddingBottom: spacing.md, gap: spacing.sm },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    title: { ...typography.h2, color: colors.textPrimary },
    sub: { ...typography.bodySm, color: colors.textSecondary },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    input: {
        flex: 1,
        backgroundColor: colors.bgRaisedAlt,
        color: colors.textPrimary,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },

    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        padding: spacing.xl,
        paddingTop: spacing.md,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgRaisedAlt,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: radius.pill,
    },
    chipText: { ...typography.bodySm, color: colors.textPrimary },
    chipClose: { marginLeft: 6 },
    empty: { ...typography.bodySm, color: colors.textMuted },
});
