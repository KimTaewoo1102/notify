import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetTextInput,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import { useSectionsStore } from '../../store/sectionsStore';

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

const KeywordEditSheet = forwardRef<BottomSheet, Props>(({ onClose }, ref) => {
    const snapPoints = useMemo(() => ['60%', '92%'], []);
    const keywords = useSectionsStore(s => s.keywords);
    const addKeyword = useSectionsStore(s => s.addKeyword);
    const removeKeyword = useSectionsStore(s => s.removeKeyword);

    const [draft, setDraft] = useState('');

    const handleAdd = useCallback(() => {
        const v = draft.trim();
        if (!v) {
            haptics.warn();
            return;
        }
        haptics.tap();
        addKeyword(v);
        setDraft('');
    }, [draft, addKeyword]);

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
            onClose={onClose}
        >
            <BottomSheetView style={styles.container}>
                <BlurView
                    intensity={70}
                    tint={'systemUltraThinMaterialDark' as any}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.fill} />

                <Text style={styles.title}>내 키워드</Text>
                <Text style={styles.subtitle}>
                    AI가 이 키워드와 일치하는 공지를 자동으로 모아드려요.
                </Text>

                <View style={styles.inputRow}>
                    <BottomSheetTextInput
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="키워드 입력 (예: 장학금)"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                        onSubmitEditing={handleAdd}
                    />
                    <Pressable
                        onPress={handleAdd}
                        style={({ pressed }) => [
                            styles.addBtn,
                            pressed && styles.addBtnPressed,
                        ]}
                    >
                        <Ionicons name="add" size={22} color="#0A0A0C" />
                    </Pressable>
                </View>

                <View style={styles.chipRow}>
                    {keywords.length === 0 ? (
                        <Text style={styles.empty}>등록된 키워드가 없어요.</Text>
                    ) : (
                        keywords.map(k => (
                            <Animated.View
                                key={k}
                                entering={FadeIn.duration(180)}
                                exiting={FadeOut.duration(160)}
                                layout={Layout.springify().damping(20)}
                            >
                                <Pressable
                                    onPress={() => {
                                        haptics.tap();
                                        removeKeyword(k);
                                    }}
                                    style={({ pressed }) => [
                                        styles.chip,
                                        pressed && styles.chipPressed,
                                    ]}
                                >
                                    <Text style={styles.chipLabel}>{k}</Text>
                                    <Ionicons
                                        name="close-circle"
                                        size={16}
                                        color={colors.textTertiary}
                                    />
                                </Pressable>
                            </Animated.View>
                        ))
                    )}
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
});

export default KeywordEditSheet;

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
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.xl,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        color: colors.textPrimary,
        fontSize: 15,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: radius.md,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.xl,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 14,
        paddingRight: 10,
        paddingVertical: 9,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
    },
    chipPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
    chipLabel: { ...typography.label, color: colors.textPrimary, fontSize: 13 },
    empty: { ...typography.caption, color: colors.textTertiary, paddingVertical: spacing.md },
});
