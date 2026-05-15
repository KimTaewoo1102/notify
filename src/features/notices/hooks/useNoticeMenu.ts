import { useCallback, useState } from 'react';

import type { Notice } from '../../../types/domain';
import type { NoticeMenuAnchor } from '../components/NoticeContextMenu';

export interface NoticeMenuTarget {
    notice: Notice;
    anchor: NoticeMenuAnchor;
}

/**
 * 공지 long-press 컨텍스트 메뉴의 표시 대상(target) 상태.
 *  - `openMenu(notice, anchor)` — long-press 핸들러에서 호출.
 *  - `closeMenu()` — 메뉴 배경 탭 / 항목 선택 직후 호출.
 */
export function useNoticeMenu() {
    const [menuTarget, setMenuTarget] = useState<NoticeMenuTarget | null>(null);

    const openMenu = useCallback((notice: Notice, anchor: NoticeMenuAnchor) => {
        setMenuTarget({ notice, anchor });
    }, []);

    const closeMenu = useCallback(() => setMenuTarget(null), []);

    return { menuTarget, openMenu, closeMenu };
}
