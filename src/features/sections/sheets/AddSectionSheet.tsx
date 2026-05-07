import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PressableScale } from '../../../ui/primitives/PressableScale';
import { haptic } from '../../../ui/feedback/haptics';
import { colors, radius, spacing, typography } from '../../../ui/theme';
import { useSectionsStore } from '../../../stores/sectionsStore';
import { useUIStore } from '../../../stores/uiStore';

const MAX_KEYWORDS = 8;

export function AddSectionSheet() {
    const ref = useRef<BottomSheetModal>(null);
    const open = useUIStore(s => s.addSectionSheetOpen);
    const close = useUIStore(s => s.closeAddSection);
    const addSection = useSectionsStore(s => s.addSection);
    const addKeyword = useSectionsStore(s => s.addKeyword);

    const [draft, setDraft] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [customName, setCustomName] = useState('');

    const reset = useCallback(() => {
        setDraft('');
        setKeywords([]);
        setCustomName('');
    }, []);

    useEffect(() => {
        if (open) ref.current?.present();
        else ref.current?.dismiss();
    }, [open]);

    const snapPoints = useMemo(() => ['68%'], []);

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

    const tryAddKeyword = useCallback(
        (raw: string) => {
            const t = raw.trim();
            if (!t) return false;
            if (keywords.length >= MAX_KEYWORDS) {
                haptic('warning');
                return false;
            }
            if (keywords.includes(t)) {
                haptic('warning');
                return false;
            }
            setKeywords(prev => [...prev, t]);
            haptic('selection');
            return true;
        },
        [keywords],
    );

    const onChangeDraft = (val: string) => {
        // 공백·쉼표를 키워드 구분자로 인정 — 한 번에 여러 개 빠르게 입력.
        if (/[,\n]/.test(val)) {
            const parts = val.split(/[,\n]/);
            const last = parts.pop() ?? '';
            for (const p of parts) tryAddKeyword(p);
            setDraft(last);
            return;
        }
        setDraft(val);
    };

    const onSubmitKeyword = () => {
        if (tryAddKeyword(draft)) setDraft('');
    };

    const removeKeyword = (kw: string) => {
        haptic('light');
        setKeywords(prev => prev.filter(k => k !== kw));
    };

    // 다중 키워드(2개 이상)일 때만 별도 이름 필드 노출.
    const showCustomName = keywords.length >= 2;

    // 자동 명명 규칙
    // - 0개: 빈 문자열 (CTA disabled)
    // - 1개: 그 키워드를 제목으로
    // - 2개+: 사용자가 customName 입력했으면 그 값, 아니면 키워드 ' · ' join
    const resolvedTitle = useMemo(() => {
        const trimmed = customName.trim();
        if (keywords.length === 0) return '';
        if (keywords.length === 1) return trimmed || keywords[0];
        return trimmed || keywords.join(' · ');
    }, [keywords, customName]);

    const canSubmit = keywords.length > 0 && resolvedTitle.length > 0;

    const submit = useCallback(() => {
        // 입력란에 미확정 키워드가 남아있으면 함께 추가.
        let pending = keywords;
        const t = draft.trim();
        if (t && !pending.includes(t) && pending.length < MAX_KEYWORDS) {
            pending = [...pending, t];
        }
        if (pending.length === 0) {
            haptic('warning');
            return;
        }
        const title =
            customName.trim() ||
            (pending.length === 1 ? pending[0] : pending.join(' · '));

        const section = addSection({ title });
        for (const k of pending) addKeyword(section.id, k);

        haptic('success');
        Keyboard.dismiss();
        reset();
        close();
    }, [keywords, draft, customName, addSection, addKeyword, reset, close]);

    return (
        <BottomSheetModal
            ref={ref}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enablePanDownToClose
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            onDismiss={() => {
                reset();
                close();
            }}
            backgroundStyle={styles.sheetBg}
            handleIndicatorStyle={styles.handle}
            backdropComponent={renderBackdrop}
        >
            <BottomSheetScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>새 섹션 추가</Text>
                <Text style={styles.sub}>
                    수집할 키워드를 입력하세요. 여러 개도 가능합니다.
                </Text>

                {/* 키워드 입력 + 칩 영역 */}
                <View style={styles.chipBox}>
                    {keywords.map(kw => (
                        <Pressable
                            key={kw}
                            onPress={() => removeKeyword(kw)}
                            style={({ pressed }) => [
                                styles.chip,
                                pressed && { opacity: 0.7 },
                            ]}
                        >
                            <Text style={styles.chipText}>{kw}</Text>
                            <Ionicons
                                name="close"
                                size={13}
                                color={colors.textSecondary}
                                style={styles.chipX}
                            />
                        </Pressable>
                    ))}
                    <TextInput
                        autoFocus
                        value={draft}
                        onChangeText={onChangeDraft}
                        placeholder={
                            keywords.length === 0
                                ? '예) AI, 인턴, 장학금'
                                : '키워드 추가'
                        }
                        placeholderTextColor={colors.textMuted}
                        selectionColor={colors.accent}
                        style={styles.chipInput}
                        returnKeyType="done"
                        onSubmitEditing={onSubmitKeyword}
                        blurOnSubmit={false}
                    />
                </View>
                <Text style={styles.helper}>
                    Enter 또는 쉼표(,)로 키워드를 분리합니다 ·{' '}
                    {keywords.length}/{MAX_KEYWORDS}
                </Text>

                {/* 다중 키워드일 때만 표시되는 커스텀 이름 필드 */}
                {showCustomName && (
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>섹션 이름</Text>
                        <TextInput
                            value={customName}
                            onChangeText={setCustomName}
                            placeholder={keywords.join(' · ')}
                            placeholderTextColor={colors.textMuted}
                            selectionColor={colors.accent}
                            style={styles.input}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                        />
                        <Text style={styles.helper}>
                            비워 두면 키워드를 합쳐 자동 생성합니다.
                        </Text>
                    </View>
                )}

                <PressableScale
                    onPress={submit}
                    hapticKind="medium"
                    disabled={!canSubmit}
                    style={[styles.cta, !canSubmit && styles.ctaDisabled]}
                >
                    <Text style={styles.ctaLabel}>
                        {resolvedTitle
                            ? `'${resolvedTitle}' 섹션 추가`
                            : '추가하기'}
                    </Text>
                </PressableScale>
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
    content: {
        padding: spacing.xl,
        gap: spacing.md,
        paddingBottom: spacing.xxl,
    },
    title: { ...typography.h2, color: colors.textPrimary },
    sub: {
        ...typography.bodySm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },

    chipBox: {
        backgroundColor: colors.bgRaisedAlt,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacing.xs,
        minHeight: 56,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: spacing.sm,
        paddingRight: 6,
        paddingVertical: 6,
        borderRadius: radius.pill,
        backgroundColor: colors.accent + '22',
        borderWidth: 1,
        borderColor: colors.accent + '55',
    },
    chipText: {
        ...typography.caption,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    chipX: { marginLeft: 2 },
    chipInput: {
        flex: 1,
        minWidth: 100,
        color: colors.textPrimary,
        fontSize: 15,
        paddingHorizontal: 4,
        paddingVertical: 6,
    },
    helper: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: -4,
    },

    fieldGroup: {
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    fieldLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    input: {
        backgroundColor: colors.bgRaisedAlt,
        color: colors.textPrimary,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },

    cta: {
        marginTop: spacing.lg,
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    ctaDisabled: {
        opacity: 0.4,
    },
    ctaLabel: { ...typography.body, color: '#fff', fontWeight: '700' },
});
