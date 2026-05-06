import React, {
    forwardRef,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    NativeSyntheticEvent,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TextInputKeyPressEventData,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetTextInput,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import { sectionsApi } from '../../services/api/sectionsApi';

interface Props {
    onClose?: () => void;
}

const Backdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.65}
        pressBehavior="close"
    />
);

const buildAutoLabel = (keywords: string[]) => {
    if (keywords.length === 0) return '';
    if (keywords.length === 1) return keywords[0];
    const head = keywords.slice(0, 2).join(', ');
    return keywords.length > 2 ? `${head} 외` : head;
};

/**
 * 새 섹션 만들기 시트.
 *
 * 입력
 *  1. 수집할 키워드 (칩 입력, 1개 이상 필수)
 *     - 콤마 / 엔터로 확정, 백스페이스로 직전 칩 제거, 중복은 햅틱 warn 후 무시
 *  2. 섹션 이름 (선택) — 비우면 키워드 기반 자동 라벨
 *
 * 제출은 sectionsApi.create 로 위임 → 백엔드 도입 시 시트 코드는 무변경.
 */
const AddSectionSheet = forwardRef<BottomSheet, Props>(({ onClose }, ref) => {
    const snapPoints = useMemo(() => ['68%', '92%'], []);
    const inputRef = useRef<TextInput>(null);

    const [keywords, setKeywords] = useState<string[]>([]);
    const [draft, setDraft] = useState('');
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const reset = useCallback(() => {
        setKeywords([]);
        setDraft('');
        setName('');
    }, []);

    const addKeyword = useCallback(
        (raw: string) => {
            const v = raw.trim();
            if (!v) return false;
            if (keywords.includes(v)) {
                haptics.warn();
                return false;
            }
            haptics.tap();
            setKeywords(prev => [...prev, v]);
            return true;
        },
        [keywords],
    );

    const handleDraftChange = useCallback(
        (text: string) => {
            // 콤마는 칩 구분자로 사용
            if (text.includes(',')) {
                const parts = text.split(',');
                const last = parts.pop() ?? '';
                const fresh = parts
                    .map(p => p.trim())
                    .filter(p => p && !keywords.includes(p));
                if (fresh.length) {
                    haptics.tap();
                    setKeywords(prev => Array.from(new Set([...prev, ...fresh])));
                }
                setDraft(last);
                return;
            }
            setDraft(text);
        },
        [keywords],
    );

    const handleKeyPress = useCallback(
        (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
            // 빈 입력 상태에서 백스페이스 → 마지막 칩 제거
            if (
                e.nativeEvent.key === 'Backspace' &&
                draft.length === 0 &&
                keywords.length > 0
            ) {
                haptics.tap();
                setKeywords(prev => prev.slice(0, -1));
            }
        },
        [draft, keywords.length],
    );

    const removeKeyword = useCallback((k: string) => {
        haptics.tap();
        setKeywords(prev => prev.filter(x => x !== k));
    }, []);

    const previewLabel = useMemo(() => buildAutoLabel(keywords), [keywords]);

    const finalKeywords = useMemo(() => {
        const trimmed = draft.trim();
        if (trimmed && !keywords.includes(trimmed)) return [...keywords, trimmed];
        return keywords;
    }, [draft, keywords]);

    const canSubmit = finalKeywords.length > 0 && !submitting;

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) {
            haptics.warn();
            return;
        }
        setSubmitting(true);
        try {
            await sectionsApi.create({
                title: name.trim() || undefined,
                keywords: finalKeywords,
                icon: 'pricetag-outline',
            });
            haptics.confirm();
            reset();
            (ref as React.RefObject<BottomSheet>)?.current?.close();
        } catch {
            haptics.warn();
        } finally {
            setSubmitting(false);
        }
    }, [canSubmit, name, finalKeywords, reset, ref]);

    return (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            backdropComponent={Backdrop}
            handleStyle={styles.handle}
            handleIndicatorStyle={styles.handleIndicator}
            backgroundStyle={styles.bg}
            onClose={() => {
                reset();
                onClose?.();
            }}
        >
            <BottomSheetView style={styles.container}>
                <BlurView
                    intensity={70}
                    tint={'systemUltraThinMaterialDark' as any}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.fill} />

                <Text style={styles.title}>새 섹션 만들기</Text>
                <Text style={styles.subtitle}>
                    수집할 키워드를 1개 이상 입력하세요. 일치하는 공지가 자동으로 모입니다.
                </Text>

                {/* 키워드 칩 입력 */}
                <Text style={styles.label}>수집할 키워드</Text>
                <Pressable
                    onPress={() => inputRef.current?.focus()}
                    style={styles.chipField}
                >
                    {keywords.map(k => (
                        <Animated.View
                            key={k}
                            entering={FadeIn.duration(160)}
                            exiting={FadeOut.duration(140)}
                            layout={LinearTransition.springify().damping(20)}
                        >
                            <Pressable
                                onPress={() => removeKeyword(k)}
                                style={({ pressed }) => [
                                    styles.chip,
                                    pressed && styles.chipPressed,
                                ]}
                            >
                                <Text style={styles.chipLabel}>{k}</Text>
                                <Ionicons
                                    name="close-circle"
                                    size={15}
                                    color={colors.textTertiary}
                                />
                            </Pressable>
                        </Animated.View>
                    ))}

                    <BottomSheetTextInput
                        ref={inputRef as any}
                        value={draft}
                        onChangeText={handleDraftChange}
                        onKeyPress={handleKeyPress}
                        onSubmitEditing={() => {
                            if (addKeyword(draft)) setDraft('');
                        }}
                        blurOnSubmit={false}
                        placeholder={
                            keywords.length === 0 ? '예: AI, 장학금, 인턴' : ''
                        }
                        placeholderTextColor={colors.textMuted}
                        style={styles.chipInput}
                        returnKeyType="done"
                    />
                </Pressable>
                <Text style={styles.helper}>
                    엔터 또는 콤마(,) 로 키워드를 추가, 백스페이스로 직전 키워드 삭제
                </Text>

                {/* 섹션 이름 */}
                <Text style={styles.label}>섹션 이름 (선택)</Text>
                <BottomSheetTextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={previewLabel || '비워두면 키워드로 자동 설정'}
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                />
                {keywords.length > 0 && !name.trim() && (
                    <Text style={styles.helper}>
                        자동 이름: <Text style={styles.helperHighlight}>{previewLabel}</Text>
                    </Text>
                )}

                {/* CTA */}
                <Pressable
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    style={({ pressed }) => [
                        styles.cta,
                        !canSubmit && styles.ctaDisabled,
                        pressed && canSubmit && styles.ctaPressed,
                    ]}
                >
                    <Text
                        style={[
                            styles.ctaLabel,
                            !canSubmit && styles.ctaLabelDisabled,
                        ]}
                    >
                        {submitting ? '추가 중…' : '섹션 추가하기'}
                    </Text>
                </Pressable>
            </BottomSheetView>
        </BottomSheet>
    );
});

export default AddSectionSheet;

const styles = StyleSheet.create({
    bg: {
        backgroundColor: '#0A0A0C',
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
    },
    handle: { paddingTop: 10 },
    handleIndicator: { backgroundColor: 'rgba(255,255,255,0.22)', width: 42 },
    container: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
    fill: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.03)' },

    title: { ...typography.title, color: colors.textPrimary, fontSize: 20 },
    subtitle: { ...typography.caption, color: colors.textTertiary, marginTop: 4 },

    label: {
        ...typography.label,
        color: colors.textTertiary,
        marginTop: spacing.xl,
        marginBottom: spacing.sm,
    },

    chipField: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 52,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 7,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
    },
    chipPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
    chipLabel: { ...typography.label, color: colors.textPrimary, fontSize: 13 },
    chipInput: {
        flex: 1,
        minWidth: 100,
        paddingVertical: 4,
        color: colors.textPrimary,
        fontSize: 15,
    },

    helper: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 6,
        fontSize: 11,
    },
    helperHighlight: { color: colors.textSecondary, fontWeight: '600' },

    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        color: colors.textPrimary,
        fontSize: 15,
    },

    cta: {
        marginTop: spacing.xxl,
        backgroundColor: '#FFFFFF',
        borderRadius: radius.md,
        paddingVertical: 16,
        alignItems: 'center',
    },
    ctaPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    ctaDisabled: { backgroundColor: 'rgba(255,255,255,0.12)' },
    ctaLabel: { ...typography.title, color: '#0A0A0C', fontSize: 15 },
    ctaLabelDisabled: { color: colors.textTertiary },
});
