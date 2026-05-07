import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

import ScreenBackground from '../components/layout/ScreenBackground';
import GlassCard from '../components/common/GlassCard';
import { colors, radius, spacing, typography } from '../constants/theme';
import { haptics } from '../utils/haptics';
import { useShallow } from 'zustand/react/shallow';
import {
    selectTrashedSections,
    useSectionsStore,
} from '../store/sectionsStore';
import type { RootStackScreenProps } from '../navigation/types';

export default function TrashScreen({ navigation }: RootStackScreenProps<'Trash'>) {
    const trashed = useSectionsStore(useShallow(selectTrashedSections));
    const restore = useSectionsStore(s => s.restore);
    const purge = useSectionsStore(s => s.purge);

    return (
        <View style={styles.root}>
            <ScreenBackground />
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <Pressable
                        onPress={() => {
                            haptics.tap();
                            navigation.goBack();
                        }}
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.iconPressed,
                        ]}
                        hitSlop={10}
                    >
                        <BlurView
                            intensity={40}
                            tint="dark"
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.iconFill} />
                        <Ionicons name="close" size={22} color={colors.textPrimary} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>휴지통</Text>
                        <Text style={styles.subtitle}>
                            삭제된 섹션은 복원하거나 영구 삭제할 수 있어요.
                        </Text>
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {trashed.length === 0 ? (
                        <View style={styles.empty}>
                            <Ionicons
                                name="trash-outline"
                                size={28}
                                color={colors.textTertiary}
                            />
                            <Text style={styles.emptyText}>휴지통이 비어 있어요.</Text>
                        </View>
                    ) : (
                        trashed.map(item => (
                            <Animated.View
                                key={item.id}
                                entering={FadeIn.duration(180)}
                                exiting={FadeOut.duration(160)}
                                layout={Layout.springify().damping(20)}
                                style={{ marginBottom: spacing.md }}
                            >
                                <GlassCard radiusSize="lg" style={styles.row}>
                                    <View style={styles.rowInner}>
                                        <View style={styles.iconWrap}>
                                            <Ionicons
                                                name={item.icon as any}
                                                size={16}
                                                color={colors.textPrimary}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.rowTitle}>{item.title}</Text>
                                            <Text style={styles.rowMeta}>
                                                {item.trashedAt
                                                    ? new Date(item.trashedAt).toLocaleDateString()
                                                    : ''}
                                            </Text>
                                        </View>
                                        <Pressable
                                            onPress={() => {
                                                haptics.tap();
                                                restore(item.id);
                                            }}
                                            style={({ pressed }) => [
                                                styles.actionBtn,
                                                pressed && { opacity: 0.7 },
                                            ]}
                                        >
                                            <Ionicons
                                                name="arrow-undo"
                                                size={16}
                                                color={colors.textPrimary}
                                            />
                                        </Pressable>
                                        <Pressable
                                            onPress={() => {
                                                haptics.confirm();
                                                purge(item.id);
                                            }}
                                            style={({ pressed }) => [
                                                styles.dangerBtn,
                                                pressed && { opacity: 0.8 },
                                            ]}
                                        >
                                            <Ionicons
                                                name="trash"
                                                size={16}
                                                color="#FF6A5A"
                                            />
                                        </Pressable>
                                    </View>
                                </GlassCard>
                            </Animated.View>
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgTop },
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,
        gap: spacing.md,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorder,
    },
    iconFill: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.glassFill,
    },
    iconPressed: { opacity: 0.7 },
    title: { ...typography.title, color: colors.textPrimary, fontSize: 20 },
    subtitle: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl * 2,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: spacing.xxl * 2,
        gap: spacing.md,
    },
    emptyText: { ...typography.caption, color: colors.textTertiary },
    row: { padding: 0 },
    rowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        gap: spacing.sm,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        marginRight: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.glassFill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
    },
    rowTitle: { ...typography.body, color: colors.textPrimary, fontSize: 14 },
    rowMeta: { ...typography.caption, color: colors.textTertiary, fontSize: 11 },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.glassFill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
    },
    dangerBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,90,80,0.10)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,90,80,0.30)',
    },
});
