import React from 'react';

import { AddSectionSheet } from '../../features/sections/sheets/AddSectionSheet';
import { KeywordEditSheet } from '../../features/keywords/sheets/KeywordEditSheet';

/**
 * 모든 글로벌 바텀시트를 한 곳에서 마운트.
 * 시트는 uiStore 상태로 제어되므로 어떤 화면에서든 open/close 호출만 하면 된다.
 * BottomSheetModalProvider 의 자식이어야 하므로 RootNavigator 와 같은 트리에 있어야 함.
 */
export function SheetHost() {
    return (
        <>
            <AddSectionSheet />
            <KeywordEditSheet />
        </>
    );
}
