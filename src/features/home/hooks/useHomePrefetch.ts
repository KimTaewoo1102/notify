import { useEffect, useState } from 'react';

import { useNoticeCacheStore } from '../../../stores/noticeCacheStore';
import { useSectionsStore } from '../../../stores/sectionsStore';
import { uosAdapter } from '../../../services/universities/uos';
import type { Notice, Section } from '../../../types/domain';

/**
 * 홈 마운트 시 데이터 워밍업:
 *  1) HOT 공지 1건 fetch → 화면 상단 카드용 state 반환.
 *  2) 모든 user 섹션의 키워드 기반 공지를 백그라운드로 fetch → 캐시/카운트 동기화.
 *
 * 의도(intent):
 *  - section list re-order 만으로 재실행되지 않도록 deps 는 id 배열의 join 으로 캡쳐.
 *    (userSections 배열 자체는 sort 마다 새 reference 라 deps 로 직접 쓰면 무한 fetch.)
 *  - 개별 섹션 prefetch 실패는 조용히 무시 — UX 영향 최소화.
 *  - cancelled 토큰으로 화면 언마운트 / 섹션 변경 시 stale write 차단.
 */
export function useHomePrefetch(userSections: Section[]): Notice | null {
    const setNoticeCache = useNoticeCacheStore(s => s.setCache);
    const updateNoticeCount = useSectionsStore(s => s.updateNoticeCount);

    const [hotNotice, setHotNotice] = useState<Notice | null>(null);

    useEffect(() => {
        uosAdapter.fetchHot().then(list => {
            if (list.length > 0) setHotNotice(list[0]);
        });
    }, []);

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
        }
        prefetchAll();
        return () => {
            cancelled = true;
        };
        // userSections 배열 자체가 아닌 id 시퀀스로 deps 캡쳐 — 정렬 변화에는 재실행하지 않음.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userSections.map(s => s.id).join(','), setNoticeCache, updateNoticeCount]);

    return hotNotice;
}
