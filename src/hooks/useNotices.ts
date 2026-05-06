import { useCallback, useEffect, useState } from 'react';
import { noticeApi } from '../services/api/noticeApi';
import type { Notice } from '../types/notice';

interface UseNoticesArgs {
    universityId: string;
    keywords: string[];
}

interface UseNoticesResult {
    today: Notice[];
    keyword: Notice[];
    hot: Notice[];
    loading: boolean;
    refresh: () => Promise<void>;
    /** 클라이언트 측 즉시 제거. 백엔드 도입 시 mutation으로 교체. */
    dismiss: (id: string) => void;
}

/**
 * 화면이 의존하는 단일 훅.
 * 데이터 소스가 mock → REST → GraphQL로 바뀌어도 시그니처 유지.
 */
export function useNotices({ universityId, keywords }: UseNoticesArgs): UseNoticesResult {
    const [today, setToday] = useState<Notice[]>([]);
    const [keyword, setKeyword] = useState<Notice[]>([]);
    const [hot, setHot] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [t, k, h] = await Promise.all([
                noticeApi.today(universityId),
                noticeApi.byKeywords(universityId, keywords),
                noticeApi.hot(universityId),
            ]);
            setToday(t);
            setKeyword(k);
            setHot(h);
        } finally {
            setLoading(false);
        }
    }, [universityId, keywords]);

    useEffect(() => {
        load();
    }, [load]);

    const dismiss = useCallback((id: string) => {
        const reject = (n: Notice) => n.id !== id;
        setToday(prev => prev.filter(reject));
        setKeyword(prev => prev.filter(reject));
        setHot(prev => prev.filter(reject));
    }, []);

    return { today, keyword, hot, loading, refresh: load, dismiss };
}
