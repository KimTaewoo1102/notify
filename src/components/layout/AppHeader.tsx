import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import RollingBanner from './RollingBanner';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { haptics } from '../../utils/haptics';

interface Props {
    universityName: string;
    onMenuPress: () => void;
    /** 롤링 배너 항목 탭 → 해당 섹션 진입 */
    onBannerItemPress: (sectionId: string) => void;
}

export default function AppHeader({
    universityName,
    onMenuPress,
    onBannerItemPress,
}: Props) {
    const handleMenu = () => {
        haptics.tap();
        onMenuPress();
    };

    return (
        <View style={styles.container}>
            <View style={styles.brandBlock}>
                <RollingBanner onItemPress={onBannerItemPress} />
                <Text style={styles.school}>{universityName}</Text>
            </View>

            <TouchableOpacity onPress={handleMenu} activeOpacity={0.85}>
                <View style={styles.iconButton}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
                    <View style={styles.iconFill} />
                    <Ionicons name="apps-outline" size={20} color={colors.textPrimary} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,
    },
    brandBlock: { flex: 1 },
    school: {
        ...typography.title,
        color: colors.textPrimary,
        fontSize: 18,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: radius.md,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    iconFill: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
});
