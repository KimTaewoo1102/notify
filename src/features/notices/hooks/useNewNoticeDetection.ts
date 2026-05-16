import { useCallback, useEffect, useRef } from 'react';

import type { Section } from '../../../types/domain';

/**
 * 화면 진입 시점의 `section.lastVisitedAt` 을 ref 에 1회 고정하고,
 * 이 시점 기준으로 공지의 "신규" 여부를 판정하는 헬퍼를 반환한다.
 *
 * 의도(intent) — 함부로 일반 state 로 바꾸지 말 것:
 * 페치 도중 store 가 갱신되어도 "새 공지" 기준선이 흔들리지 않게 하기 위해
 * 화면 진입 시점에 ref 로 스냅샷한다. state 로 바꾸면 새 공지 뱃지가
 * fetch / refresh 동안 깜박이는 버그가 발생한다.
 *
 *  - 반환된 `isNewNotice(publishedAt)` 는 안정적인 identity 를 가진다.
 *  - section 이 처음 로드되기 전(undefined) 인 첫 렌더에서는 false 만 반환.
 */
export function useNewNoticeDetection(
    section: Section | undefined,
): (publishedAt: string) => boolean {
    const entryLastVisitedAt = useRef<number | null>(null);

    useEffect(() => {
        if (entryLastVisitedAt.current === null && section) {
            entryLastVisitedAt.current = section.lastVisitedAt ?? null;
        }
    }, [section]);

    return useCallback((publishedAt: string) => {
        const lv = entryLastVisitedAt.current;
        return lv !== null && new Date(publishedAt).getTime() > lv;
    }, []);
}
