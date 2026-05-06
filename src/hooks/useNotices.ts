import { useCallback, useEffect, useMemo, useState } from 'react';
import { noticeApi } from '../services/api/noticeApi';
import {
    decorateWithMeta,
    selectPinnedNotices,
    useNoticesStore,
} from '../store/noticesStore';
import type { Notice } from '../types/notice';
import type { SectionId } from '../store/sectionsStore';

interface UseNoticesArgs {
    universityId: string;
    keywords: string[];
}

interface UseNoticesResult {
    today: Notice[];
    keyword: Notice[];
    hot: Notice[];
    /** 사용자 핀 공지 (메인 "고정" 섹션 데이터 소스) */
    pinned: Notice[];
    loading: boolean;
    refresh: () => Promise<void>;
    /**
     * 클라이언트 즉시 dismiss — 휴지통 이동.
     * 백엔드 도입 시 noticeApi.dismiss 가 서버 호출도 수행.
     */
    dismiss: (id: string, sectionId?: SectionId) => void;
    /** 핀 토글 */
    togglePin: (id: string, sectionId?: SectionId) => void;
}

/**
 * 화면이 의존하는 단일 훅.
 * - 소스 피드는 universities 어댑터에서 가져온 raw Notice[].
 * - 사용자 메타 (핀, 휴지통) 는 noticesStore 구독으로 항상 합성.
 *   따라서 핀/dismiss 가 일어나면 화면이 즉시 업데이트된다.
 */
export function useNotices({ universityId, keywords }: UseNoticesArgs): UseNoticesResult {
    // 소스 피드 (어댑터에서 받아오는 raw — 메타 미포함 원본 캐시)
    const [todayRaw, setTodayRaw] = useState<Notice[]>([]);
    const [hotRaw, setHotRaw] = useState<Notice[]>([]);
    const [keywordRaw, setKeywordRaw] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    // 메타 (구독 → 변경 시 자동 리렌더 + decorate 재계산)
    const pins = useNoticesStore(s => s.pins);
    const trash = useNoticesStore(s => s.trash);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const adapter = await import('../services/universities').then(m =>
                m.getUniversityAdapter(universityId),
            );
            const [t, h, k] = await Promise.all([
                adapter.fetchToday(),
                adapter.fetchHot(),
                adapter.fetchByKeywords(keywords),
            ]);
            setTodayRaw(t);
            setHotRaw(h);
            setKeywordRaw(k);
        } finally {
            setLoading(false);
        }
    }, [universityId, keywords]);

    useEffect(() => {
        load();
    }, [load]);

    // 메타 합성 — pins/trash 변경 시 자동 재계산
    const today = useMemo(
        () => decorateWithMeta(todayRaw, { pins, trash }),
        [todayRaw, pins, trash],
    );
    const hot = useMemo(
        () => decorateWithMeta(hotRaw, { pins, trash }),
        [hotRaw, pins, trash],
    );
    const keyword = useMemo(
        () => decorateWithMeta(keywordRaw, { pins, trash }),
        [keywordRaw, pins, trash],
    );

    // 핀된 공지는 today + hot + keyword 합집합에서 매칭
    const pinned = useMemo(() => {
        const seen = new Set<string>();
        const pool: Notice[] = [];
        for (const n of [...todayRaw, ...hotRaw, ...keywordRaw]) {
            if (seen.has(n.id)) continue;
            seen.add(n.id);
            pool.push(n);
        }
        return selectPinnedNotices({ pins, trash }, pool);
    }, [todayRaw, hotRaw, keywordRaw, pins, trash]);

    const dismiss = useCallback(
        (id: string, sectionId?: SectionId) => {
            const target =
                todayRaw.find(n => n.id === id) ??
                hotRaw.find(n => n.id === id) ??
                keywordRaw.find(n => n.id === id);
            if (!target) return;
            noticeApi.dismiss(target, sectionId);
        },
        [todayRaw, hotRaw, keywordRaw],
    );

    const togglePin = useCallback(
        (id: string, sectionId?: SectionId) => {
            const isPinned = !!pins[id];
            if (isPinned) {
                noticeApi.unpin(id);
                return;
            }
            const target =
                todayRaw.find(n => n.id === id) ??
                hotRaw.find(n => n.id === id) ??
                keywordRaw.find(n => n.id === id);
            if (!target) return;
            noticeApi.pin(target, sectionId);
        },
        [pins, todayRaw, hotRaw, keywordRaw],
    );

    return { today, keyword, hot, pinned, loading, refresh: load, dismiss, togglePin };
}
