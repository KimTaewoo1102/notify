import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';

interface Props {
    title: string;
    subtitle?: string;
    icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export default function SectionHeader({ title, subtitle, icon }: Props) {
    return (
        <View style={styles.row}>
            {icon && (
                <View style={styles.iconWrap}>
                    <Ionicons name={icon} size={14} color={colors.textPrimary} />
                </View>
            )}
            <View style={styles.textBlock}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.xs,
    },
    iconWrap: {
        width: 26, height: 26,
        borderRadius: 13,
        marginRight: spacing.sm,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.glassFillStrong,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorderSoft,
    },
    textBlock: { flex: 1 },
    title: { ...typography.title, color: colors.textPrimary },
    subtitle: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 2,
    },
});
