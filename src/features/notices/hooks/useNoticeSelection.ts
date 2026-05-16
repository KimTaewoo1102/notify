import { useCallback, useState } from 'react';

import type { ID } from '../../../types/domain';

/**
 * 공지 멀티 선택 모드 상태.
 *  - `selectionMode` 가 true 인 동안 행 탭은 토글로 동작.
 *  - `enterSelection(initialId)` — 컨텍스트 메뉴 "선택" 항목에서 호출.
 *  - `exitSelection()` — 취소 / 일괄 삭제 완료 / 표시할 공지가 없을 때 자동.
 */
export function useNoticeSelection() {
    const [selectionMode, setSelectionMode] = useState(false);
    const [selected, setSelected] = useState<Set<ID>>(new Set());

    const toggleSelected = useCallback((id: ID) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const enterSelection = useCallback((initialId: ID) => {
        setSelectionMode(true);
        setSelected(new Set([initialId]));
    }, []);

    const exitSelection = useCallback(() => {
        setSelectionMode(false);
        setSelected(new Set());
    }, []);

    return {
        selectionMode,
        selected,
        toggleSelected,
        enterSelection,
        exitSelection,
    };
}
