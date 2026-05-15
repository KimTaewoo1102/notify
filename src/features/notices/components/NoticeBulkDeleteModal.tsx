import React from 'react';

import { ConfirmDialog } from '../../../ui/primitives/ConfirmDialog';
import { colors } from '../../../ui/theme';

interface Props {
    visible: boolean;
    count: number;
    onClose: () => void;
    onConfirm: () => void;
}

/**
 * 선택 삭제 확인 다이얼로그.
 * `ConfirmDialog` primitive 의 얇은 wrapper.
 */
export function NoticeBulkDeleteModal({ visible, count, onClose, onConfirm }: Props) {
    return (
        <ConfirmDialog
            visible={visible}
            icon="trash"
            iconColor={colors.danger}
            title={`${count}개 공지를 휴지통으로 옮길까요?`}
            body="휴지통에서 30일간 복구할 수 있어요."
            confirmLabel="휴지통으로 이동"
            destructive
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
}
