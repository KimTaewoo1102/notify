import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, shadows, spacing, typography } from '../../../ui/theme';

interface Props {
    visible: boolean;
    count: number;
    onClose: () => void;
    onConfirm: () => void;
}

/**
 * 선택 삭제 확인 다이얼로그.
 * - "{N}개 공지를 휴지통으로 옮길까요?"
 * - 취소 / 삭제(destructive) 버튼 + 30일 보관 안내.
 */
export function NoticeBulkDeleteModal({
    visible,
    count,
    onClose,
    onConfirm,
}: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.box} onPress={() => {}}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="trash" size={22} color={colors.danger} />
                    </View>
                    <Text style={styles.title}>
                        {count}개 공지를 휴지통으로 옮길까요?
                    </Text>
                    <Text style={styles.body}>
                        휴지통에서 30일간 복구할 수 있어요.
                    </Text>
                    <View style={styles.actions}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [
                                styles.btn,
                                styles.btnGhost,
                                pressed && { opacity: 0.6 },
                            ]}
                        >
                            <Text style={styles.btnGhostLabel}>취소</Text>
                        </Pressable>
                        <Pressable
                            onPress={onConfirm}
                            style={({ pressed }) => [
                                styles.btn,
                                styles.btnDanger,
                                pressed && { opacity: 0.85 },
                            ]}
                        >
                            <Text style={styles.btnDangerLabel}>휴지통으로 이동</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    box: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: colors.bgRaisedAlt,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        padding: spacing.lg,
        gap: spacing.sm,
        alignItems: 'flex-start',
        ...shadows.lg,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.danger + '1A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    body: {
        ...typography.bodySm,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
        marginTop: spacing.xs,
        alignSelf: 'stretch',
    },
    btn: {
        paddingHorizontal: spacing.lg,
        paddingVertical: 10,
        borderRadius: radius.md,
        minWidth: 72,
        alignItems: 'center',
    },
    btnGhost: { backgroundColor: 'transparent' },
    btnGhostLabel: {
        ...typography.bodySm,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    btnDanger: { backgroundColor: colors.danger },
    btnDangerLabel: {
        ...typography.bodySm,
        color: '#fff',
        fontWeight: '700',
    },
});
