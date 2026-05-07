import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../../../ui/theme';
import { haptic } from '../../../ui/feedback/haptics';

interface Props {
    visible: boolean;
    initial: string;
    onClose: () => void;
    onSubmit: (next: string) => void;
}

/**
 * 섹션 이름 변경용 작은 다이얼로그.
 * Alert.prompt 가 iOS 전용이라 두 OS 모두에서 동일하게 보이도록 직접 구현.
 */
export function RenameSectionModal({
    visible,
    initial,
    onClose,
    onSubmit,
}: Props) {
    const [value, setValue] = useState(initial);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible) {
            setValue(initial);
            // Modal 의 fade 애니메이션이 끝난 뒤 focus 해야 키보드가 안정적으로 올라옴.
            const t = setTimeout(() => inputRef.current?.focus(), 120);
            return () => clearTimeout(t);
        }
    }, [visible, initial]);

    const submit = () => {
        const next = value.trim();
        if (!next) {
            haptic('warning');
            return;
        }
        if (next === initial) {
            onClose();
            return;
        }
        onSubmit(next);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <Pressable style={styles.backdrop} onPress={onClose}>
                    <Pressable style={styles.box} onPress={() => {}}>
                        <Text style={styles.title}>섹션 이름 변경</Text>
                        <TextInput
                            ref={inputRef}
                            value={value}
                            onChangeText={setValue}
                            placeholder="섹션 이름"
                            placeholderTextColor={colors.textMuted}
                            selectionColor={colors.accent}
                            style={styles.input}
                            returnKeyType="done"
                            onSubmitEditing={submit}
                            maxLength={40}
                        />
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
                                onPress={submit}
                                style={({ pressed }) => [
                                    styles.btn,
                                    styles.btnPrimary,
                                    pressed && { opacity: 0.85 },
                                ]}
                            >
                                <Text style={styles.btnPrimaryLabel}>저장</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
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
        gap: spacing.md,
        ...shadows.lg,
    },
    title: { ...typography.h3, color: colors.textPrimary },
    input: {
        backgroundColor: colors.bgRaised,
        color: colors.textPrimary,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
        marginTop: spacing.xs,
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
    btnPrimary: { backgroundColor: colors.accent },
    btnPrimaryLabel: {
        ...typography.bodySm,
        color: '#fff',
        fontWeight: '700',
    },
});
