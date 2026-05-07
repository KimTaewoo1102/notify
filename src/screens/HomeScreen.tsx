import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import DraggableFlatList, {
    ScaleDecorator,
    type RenderItemParams,
} from 'react-native-draggable-flatlist';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PressableScale } from '../ui/primitives/PressableScale';
import { haptic } from '../ui/feedback/haptics';
import { colors, radius, shadows, spacing, typography } from '../ui/theme';
import { JiggleWrapper } from '../features/sections/components/JiggleWrapper';
import { SectionCard } from '../features/sections/components/SectionCard';
import { SwipeableSectionRow } from '../features/sections/components/SwipeableSectionRow';
import {
    useOrderedSections,
    useSectionsStore,
} from '../stores/sectionsStore';
import { useUIStore } from '../stores/uiStore';
import type { Section } from '../types/domain';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
    const sections = useOrderedSections();
    const editMode = useUIStore(s => s.editMode);
    const setEditMode = useUIStore(s => s.setEditMode);
    const openAdd = useUIStore(s => s.openAddSection);

    const reorder = useSectionsStore(s => s.reorderSections);
    const removeSection = useSectionsStore(s => s.removeSection);

    // 섹션이 0이 되면 자동으로 편집 모드 해제.
    useEffect(() => {
        if (editMode && sections.length === 0) setEditMode(false);
    }, [editMode, sections.length, setEditMode]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () =>
                sections.length > 0 ? (
                    <Pressable
                        onPress={() => {
                            haptic('selection');
                            setEditMode(!editMode);
                        }}
                        hitSlop={12}
                    >
                        <Text style={styles.headerAction}>
                            {editMode ? '완료' : '편집'}
                        </Text>
                    </Pressable>
                ) : null,
        });
    }, [navigation, editMode, sections.length, setEditMode]);

    const onPressSection = useCallback(
        (s: Section) => {
            if (editMode) return;
            navigation.navigate('SectionDetail', { sectionId: s.id });
        },
        [editMode, navigation],
    );

    const onLongPressSection = useCallback(() => {
        if (!editMode) {
            haptic('medium');
            setEditMode(true);
        }
    }, [editMode, setEditMode]);

    if (sections.length === 0) {
        return (
            <View style={styles.root}>
                <EmptyState onAdd={openAdd} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            {editMode ? (
                <DraggableFlatList<Section>
                    data={sections}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    activationDistance={6}
                    onDragBegin={() => haptic('light')}
                    onDragEnd={({ data }) => {
                        haptic('medium');
                        reorder(data.map(d => d.id));
                    }}
                    renderItem={(params: RenderItemParams<Section>) => {
                        const { item, drag, isActive, getIndex } = params;
                        const idx = getIndex() ?? 0;
                        return (
                            <ScaleDecorator>
                                <JiggleWrapper active={!isActive} index={idx}>
                                    <Pressable
                                        onLongPress={drag}
                                        delayLongPress={140}
                                    >
                                        <SectionCard
                                            section={item}
                                            editMode
                                            isDragActive={isActive}
                                            onDelete={() => {
                                                haptic('warning');
                                                removeSection(item.id);
                                            }}
                                        />
                                    </Pressable>
                                </JiggleWrapper>
                            </ScaleDecorator>
                        );
                    }}
                />
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <SwipeableSectionRow
                            onDelete={() => removeSection(item.id)}
                        >
                            <SectionCard
                                section={item}
                                onPress={() => onPressSection(item)}
                                onLongPress={onLongPressSection}
                            />
                        </SwipeableSectionRow>
                    )}
                />
            )}
            <FAB onPress={openAdd} />
        </View>
    );
}

/* ──────────────────────────── Empty State ─────────────────────────── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
    const breath = useSharedValue(1);
    const glow = useSharedValue(0.5);

    useEffect(() => {
        breath.value = withRepeat(
            withSequence(
                withTiming(1.06, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
                withTiming(1.0, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
            ),
            -1,
            false,
        );
        glow.value = withRepeat(
            withSequence(
                withTiming(0.95, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
                withTiming(0.45, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
            ),
            -1,
            false,
        );
    }, [breath, glow]);

    const breathStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breath.value }],
    }));
    const glowStyle = useAnimatedStyle(() => ({
        opacity: glow.value,
    }));

    return (
        <View style={styles.empty}>
            <View style={styles.emptyOrb}>
                <Animated.View style={[styles.glowRing, glowStyle]} />
                <Animated.View style={breathStyle}>
                    <PressableScale
                        onPress={onAdd}
                        hapticKind="medium"
                        scaleTo={0.92}
                        style={styles.emptyBtn}
                    >
                        <Ionicons
                            name="add"
                            size={36}
                            color={colors.textPrimary}
                        />
                    </PressableScale>
                </Animated.View>
            </View>
            <Text style={styles.emptyText}>관심 있는 키워드를 추가해 보세요</Text>
            <Text style={styles.emptyHint}>
                장학금 · 인턴 · AI — 무엇이든 좋아요
            </Text>
        </View>
    );
}

/* ────────────────────────────── FAB ───────────────────────────────── */

function FAB({ onPress }: { onPress: () => void }) {
    return (
        <PressableScale
            onPress={onPress}
            hapticKind="medium"
            scaleTo={0.92}
            style={styles.fab}
        >
            <Ionicons name="add" size={28} color="#fff" />
        </PressableScale>
    );
}

/* ───────────────────────────── styles ─────────────────────────────── */

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    headerAction: {
        ...typography.body,
        color: colors.accent,
        fontWeight: '600',
    },
    list: { padding: spacing.lg, paddingBottom: 140 },

    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.lg,
    },
    emptyOrb: {
        width: 152,
        height: 152,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    glowRing: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 76,
        borderWidth: 1,
        borderColor: colors.accent + '55',
        shadowColor: colors.accent,
        shadowOpacity: 0.6,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 0 },
    },
    emptyBtn: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: colors.bgRaised,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
    },
    emptyText: {
        ...typography.h2,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    emptyHint: {
        ...typography.bodySm,
        color: colors.textMuted,
        textAlign: 'center',
    },

    fab: {
        position: 'absolute',
        right: spacing.xl,
        bottom: spacing.xl,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
        shadowColor: colors.accent,
        shadowOpacity: 0.55,
    },
});
