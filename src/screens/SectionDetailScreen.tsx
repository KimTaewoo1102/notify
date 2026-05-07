import React, { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Card } from '../ui/primitives/Card';
import { PressableScale } from '../ui/primitives/PressableScale';
import { colors, radius, spacing, typography } from '../ui/theme';
import { useSectionsStore } from '../stores/sectionsStore';
import { useUIStore } from '../stores/uiStore';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'SectionDetail'>;

export default function SectionDetailScreen({ navigation, route }: Props) {
    const { sectionId } = route.params;
    const section = useSectionsStore(s => s.sections[sectionId]);
    const toggleNotify = useSectionsStore(s => s.toggleNotify);
    const togglePin = useSectionsStore(s => s.togglePin);
    const openKeywordEdit = useUIStore(s => s.openKeywordEdit);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: section?.title ?? '',
        });
    }, [navigation, section?.title]);

    if (!section) {
        return (
            <View style={styles.root}>
                <Text style={styles.muted}>섹션을 찾을 수 없습니다.</Text>
            </View>
        );
    }

    const accent = section.accentColor;

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={styles.content}
        >
            <Card
                accent={accent}
                showAccentLine
                shadow="md"
                style={styles.summary}
            >
                <View style={styles.summaryHead}>
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <Text style={styles.summaryTitle}>{section.title}</Text>
                </View>
                <Text style={styles.summaryMeta}>
                    키워드 {section.keywords.length} · {section.universityId}
                </Text>
            </Card>

            <View style={styles.actions}>
                <ActionPill
                    icon={section.notifyOn ? 'notifications' : 'notifications-off'}
                    label={section.notifyOn ? '알림 ON' : '알림 OFF'}
                    accent={accent}
                    on={section.notifyOn}
                    onPress={() => toggleNotify(section.id)}
                />
                <ActionPill
                    icon={section.pinned ? 'pin' : 'pin-outline'}
                    label={section.pinned ? '고정 됨' : '고정'}
                    accent={accent}
                    on={section.pinned}
                    onPress={() => togglePin(section.id)}
                />
            </View>

            <PressableScale
                onPress={() => openKeywordEdit(section.id)}
                hapticKind="light"
                style={[styles.editBtn, { borderColor: accent + '55' }]}
            >
                <Ionicons name="pricetag" size={16} color={accent} />
                <Text style={styles.editLabel}>키워드 편집</Text>
                <Text style={styles.editCount}>{section.keywords.length}</Text>
            </PressableScale>

            <Text style={styles.placeholder}>
                {'\n'}공지 리스트는 추후 단계에서 연동됩니다.
            </Text>
        </ScrollView>
    );
}

function ActionPill({
    icon,
    label,
    accent,
    on,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    accent: string;
    on: boolean;
    onPress: () => void;
}) {
    return (
        <PressableScale
            onPress={onPress}
            hapticKind="selection"
            style={[
                styles.pill,
                on
                    ? {
                          backgroundColor: accent + '22',
                          borderColor: accent + '99',
                      }
                    : { borderColor: colors.border },
            ]}
        >
            <Ionicons
                name={icon}
                size={16}
                color={on ? accent : colors.textSecondary}
            />
            <Text
                style={[
                    styles.pillLabel,
                    { color: on ? colors.textPrimary : colors.textSecondary },
                ]}
            >
                {label}
            </Text>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    content: { padding: spacing.lg, gap: spacing.md },

    summary: { padding: spacing.lg, gap: spacing.xs },
    summaryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    dot: { width: 10, height: 10, borderRadius: 5 },
    summaryTitle: { ...typography.h2, color: colors.textPrimary },
    summaryMeta: { ...typography.caption, color: colors.textSecondary },

    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: radius.pill,
        borderWidth: 1,
        backgroundColor: colors.bgRaised,
    },
    pillLabel: { ...typography.bodySm },

    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.bgRaised,
        borderWidth: 1,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        marginTop: spacing.sm,
    },
    editLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
    editCount: { ...typography.bodySm, color: colors.textMuted },

    placeholder: { ...typography.caption, color: colors.textMuted, marginTop: spacing.lg },
    muted: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xxxl,
    },
});
