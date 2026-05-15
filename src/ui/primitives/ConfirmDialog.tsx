import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, shadows, spacing, typography } from '../theme';

interface ConfirmDialogProps {
    visible: boolean;
    /** 좌상단 원형 영역에 표시할 Ionicons 아이콘 (생략 시 미표시). */
    icon?: keyof typeof Ionicons.glyphMap;
    /** 아이콘/원형 배경의 강조색. 미지정 시 danger (`destructive`) 또는 accent 사용. */
    iconColor?: string;
    title: string;
    body?: string;
    cancelLabel?: string;
    confirmLabel: string;
    /** true → confirm 버튼이 danger 컬러로 채워지고 label 이 흰색. */
    destructive?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/**
 * 공통 confirm 다이얼로그.
 *  - 백드롭 탭 → onClose
 *  - 내부 박스 탭은 backdrop 으로 새지 않도록 noop Pressable 로 흡수
 *  - 좌측 정렬 아이콘 + 타이틀 + 본문 + (취소 / 확인) 두 버튼
 *
 * 화면별 커스텀이 필요한 경우 이 컴포넌트를 사용하지 말고 별도 Modal 작성.
 * (e.g. TextInput 이 포함된 Rename 다이얼로그 — 키보드 타이밍 워크어라운드 필요)
 */
export function ConfirmDialog({
    visible,
    icon,
    iconColor,
    title,
    body,
    cancelLabel = '취소',
    confirmLabel,
    destructive = false,
    onClose,
    onConfirm,
}: ConfirmDialogProps) {
    const accent = iconColor ?? (destructive ? colors.danger : colors.accent);
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
                    {icon && (
                        <View
                            style={[
                                styles.iconWrap,
                                { backgroundColor: accent + '1A' },
                            ]}
                        >
                            <Ionicons name={icon} size={22} color={accent} />
                        </View>
                    )}
                    <Text style={styles.title}>{title}</Text>
                    {body && <Text style={styles.body}>{body}</Text>}
                    <View style={styles.actions}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [
                                styles.btn,
                                styles.btnGhost,
                                pressed && { opacity: 0.6 },
                            ]}
                        >
                            <Text style={styles.btnGhostLabel}>{cancelLabel}</Text>
                        </Pressable>
                        <Pressable
                            onPress={onConfirm}
                            style={({ pressed }) => [
                                styles.btn,
                                destructive
                                    ? styles.btnDanger
                                    : styles.btnPrimary,
                                pressed && { opacity: 0.85 },
                            ]}
                        >
                            <Text
                                style={
                                    destructive
                                        ? styles.btnDangerLabel
                                        : styles.btnPrimaryLabel
                                }
                            >
                                {confirmLabel}
                            </Text>
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
    btnPrimary: { backgroundColor: colors.accent },
    btnPrimaryLabel: {
        ...typography.bodySm,
        color: colors.bgBase,
        fontWeight: '700',
    },
});
