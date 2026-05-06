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
import { colors, radius, spacing, typography } from '../../constants/theme';
import { haptics } from '../../utils/haptics';
import { useSectionsStore } from '../../store/sectionsStore';
import type { NoticeFeed } from '../../types/notice';

interface Props {
    onClose?: () => void;
}

const PRESETS: Array<{
    feed: NoticeFeed;
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
    { feed: 'today', title: '최신 공지', icon: 'time-outline' },
    { feed: 'hot', title: 'HOT 공지', icon: 'flame-outline' },
    { feed: 'keyword', title: '키워드 공지', icon: 'key-outline' },
];

const Backdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.65}
        pressBehavior="close"
    />
);

const AddSectionSheet = forwardRef<BottomSheet, Props>(({ onClose }, ref) => {
    const snapPoints = useMemo(() => ['55%', '90%'], []);
    const addSection = useSectionsStore(s => s.addSection);

    const [title, setTitle] = useState('');
    const [pickedFeed, setPickedFeed] = useState<NoticeFeed>('today');
    const [pickedIcon, setPickedIcon] =
        useState<React.ComponentProps<typeof Ionicons>['name']>('time-outline');

    const reset = useCallback(() => {
        setTitle('');
        setPickedFeed('today');
        setPickedIcon('time-outline');
    }, []);

    const handleSubmit = useCallback(() => {
        const finalTitle = title.trim();
        if (!finalTitle) {
            haptics.warn();
            return;
        }
        haptics.confirm();
        addSection({
            id: `${pickedFeed}-${Date.now()}`,
            title: finalTitle,
            icon: pickedIcon,
            feed: pickedFeed,
            alarmOn: false,
        });
        reset();
        // close
        (ref as React.RefObject<BottomSheet>)?.current?.close();
    }, [title, pickedFeed, pickedIcon, addSection, ref, reset]);

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

                <Text style={styles.title}>새 섹션 추가</Text>
                <Text style={styles.subtitle}>
                    원하는 공지를 모아둘 새 섹션을 만들어보세요.
                </Text>

                <Text style={styles.label}>이름</Text>
                <BottomSheetTextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="예: 졸업 관련 공지"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                />

                <Text style={styles.label}>피드 종류</Text>
                <View style={styles.row}>
                    {PRESETS.map(p => {
                        const active = p.feed === pickedFeed;
                        return (
                            <Pressable
                                key={p.feed}
                                onPress={() => {
                                    haptics.tap();
                                    setPickedFeed(p.feed);
                                    setPickedIcon(p.icon);
                                }}
                                style={({ pressed }) => [
                                    styles.chip,
                                    active && styles.chipActive,
                                    pressed && styles.chipPressed,
                                ]}
                            >
                                <Ionicons
                                    name={p.icon}
                                    size={14}
                                    color={active ? '#0B0B0E' : colors.textPrimary}
                                />
                                <Text
                                    style={[
                                        styles.chipLabel,
                                        active && styles.chipLabelActive,
                                    ]}
                                >
                                    {p.title}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable
                    onPress={handleSubmit}
                    style={({ pressed }) => [
                        styles.cta,
                        pressed && styles.ctaPressed,
                    ]}
                >
                    <Text style={styles.ctaLabel}>섹션 추가하기</Text>
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
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        color: colors.textPrimary,
        fontSize: 15,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
    },
    chipPressed: { opacity: 0.75 },
    chipActive: { backgroundColor: '#FFFFFF' },
    chipLabel: { ...typography.label, color: colors.textPrimary, fontSize: 12 },
    chipLabelActive: { color: '#0B0B0E' },
    cta: {
        marginTop: spacing.xxl,
        backgroundColor: '#FFFFFF',
        borderRadius: radius.md,
        paddingVertical: 16,
        alignItems: 'center',
    },
    ctaPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    ctaLabel: { ...typography.title, color: '#0A0A0C', fontSize: 15 },
});
