import { useCallback, useRef } from 'react';

import type { ID } from '../../../types/domain';

/**
 * 스와이프 가능한 row 핸들이 만족해야 하는 최소 인터페이스.
 * 모든 SwipeableXxxRow 는 forwardRef + useImperativeHandle 로 `close()` 만 노출하면 된다.
 */
export interface CloseableSwipeRowHandle {
    close: () => void;
}

/**
 * 한 번에 한 row 만 열려 있도록 스와이프 row 들을 관리한다.
 *
 * 의도(intent) — 함부로 제거하지 말 것:
 * gesture-handler 의 Swipeable 은 형제 row 를 자동으로 닫지 않는다.
 * 또한 ScrollView 외부 영역 탭에는 native gesture 가 닿지 않으므로
 * ref 기반 escape hatch 가 유일한 해법이다.
 *
 * Notice 와 Section 모두 동일 패턴을 사용하므로 핸들 타입을 generic 으로 받는다.
 * (`useSwipeRowManager<SwipeableNoticeRowHandle>()` 형태로 호출)
 *
 *  - `registerHandle(id, handle)` — `<SwipeableXxxRow ref={...} />` 에서 호출.
 *    null 이면 unmount 정리.
 *  - `handleReveal(id)` — row 가 열릴 때 호출. 다른 row 가 열려 있으면 자동으로 닫는다.
 *  - `closeOpenRow()` — 외부 탭/스크롤 시작 시 호출.
 *  - `isAnyOpen()` — 현재 열린 row 가 있는지. 카드 탭 소비 판정에 사용.
 */
export function useSwipeRowManager<H extends CloseableSwipeRowHandle>() {
    const rowHandles = useRef<Map<ID, H>>(new Map());
    const openRowIdRef = useRef<ID | null>(null);

    const closeOpenRow = useCallback(() => {
        if (openRowIdRef.current) {
            rowHandles.current.get(openRowIdRef.current)?.close();
            openRowIdRef.current = null;
        }
    }, []);

    const registerHandle = useCallback((id: ID, handle: H | null) => {
        if (handle) rowHandles.current.set(id, handle);
        else rowHandles.current.delete(id);
    }, []);

    const handleReveal = useCallback((id: ID) => {
        if (openRowIdRef.current && openRowIdRef.current !== id) {
            rowHandles.current.get(openRowIdRef.current)?.close();
        }
        openRowIdRef.current = id;
    }, []);

    const isAnyOpen = useCallback(() => openRowIdRef.current !== null, []);

    return { closeOpenRow, registerHandle, handleReveal, isAnyOpen };
}

export type SwipeRowManager<H extends CloseableSwipeRowHandle> = ReturnType<
    typeof useSwipeRowManager<H>
>;
