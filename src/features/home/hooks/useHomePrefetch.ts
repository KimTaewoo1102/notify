import { useCallback, useEffect, useState } from 'react';

import { useNoticeCacheStore } from '../../../stores/noticeCacheStore';
import { useSectionsStore } from '../../../stores/sectionsStore';
import { uosAdapter } from '../../../services/universities/uos';
import type { Notice, Section } from '../../../types/domain';

interface Result {
    hotNotice: Notice | null;
    /** pull-to-refresh / 수동 호출 시 prefetch 를 다시 실행. */
    refresh: () => void;
    /** RefreshControl 의 `refreshing` 에 그대로 바인딩. */
    isRefreshing: boolean;
}

/**
 * 홈 마운트 시 데이터 워밍업:
 *  1) HOT 공지 1건 fetch → 화면 상단 카드용 state 반환.
 *  2) 모든 user 섹션의 키워드 기반 공지를 백그라운드로 fetch → 캐시/카운트 동기화.
 *
 * 의도(intent):
 *  - section list re-order 만으로 재실행되지 않도록 deps 는 id 배열의 join 으로 캡쳐.
 *  - 개별 섹션 prefetch 실패는 조용히 무시 — UX 영향 최소화.
 *  - cancelled 토큰으로 화면 언마운트 / 섹션 변경 시 stale write 차단.
 *
 * 수동 refresh:
 *  - `refresh()` 호출 → refreshTick 증가 → 두 prefetch useEffect 가 모두 재실행.
 *  - `isRefreshing` 은 section prefetch 완료 시 false (대표값 — hot 은 보통 더 빠름).
 */
export function useHomePrefetch(userSections: Section[]): Result {
    const setNoticeCache = useNoticeCacheStore(s => s.setCache);
    const updateNoticeCount = useSectionsStore(s => s.updateNoticeCount);

    const [hotNotice, setHotNotice] = useState<Notice | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // HOT 공지 fetch — refreshTick 증가 시 재실행
    useEffect(() => {
        uosAdapter.fetchHot().then(list => {
            if (list.length > 0) setHotNotice(list[0]);
        });
    }, [refreshTick]);

    // 섹션 prefetch — id 시퀀스 또는 refreshTick 변화 시 재실행
    useEffect(() => {
        let cancelled = false;
        async function prefetchAll() {
            for (const sec of userSections) {
                if (cancelled) break;
                if (sec.keywords.length === 0) continue;
                try {
                    const notices = await uosAdapter.fetchByKeywords(
                        sec.keywords.map(k => k.text),
                    );
                    if (!cancelled) {
                        setNoticeCache(sec.id, notices);
                        updateNoticeCount(sec.id, notices.length);
                    }
                } catch {
                    // 개별 섹션 실패는 조용히 무시
                }
            }
            if (!cancelled) setIsRefreshing(false);
        }
        prefetchAll();
        return () => {
            cancelled = true;
        };
        // userSections 배열 자체가 아닌 id 시퀀스 + refreshTick 으로 deps 캡쳐.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        userSections.map(s => s.id).join(','),
        refreshTick,
        setNoticeCache,
        updateNoticeCount,
    ]);

    const refresh = useCallback(() => {
        setIsRefreshing(true);
        setRefreshTick(t => t + 1);
    }, []);

    return { hotNotice, refresh, isRefreshing };
}
