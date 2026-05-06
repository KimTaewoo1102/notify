import type { Notice } from '../../types/notice';
import { mockNotices } from '../../data/mockNotices';
import type { UniversityAdapter } from './types';

/**
 * 서울시립대 어댑터.
 * 현재는 mock에서 필터링하지만, 추후 아래 함수들 본문만
 * fetch('/api/uos/...')로 교체하면 UI 코드는 손댈 필요 없다.
 */
export const uosAdapter: UniversityAdapter = {
    id: 'uos',
    name: '서울시립대학교',
    shortName: '시립대',

    async fetchToday(): Promise<Notice[]> {
        return mockNotices
            .filter(n => n.universityId === 'uos')
            .sort((a, b) =>
                Number(!!b.isPinned) - Number(!!a.isPinned) ||
                +new Date(b.publishedAt) - +new Date(a.publishedAt),
            );
    },

    async fetchHot(): Promise<Notice[]> {
        return mockNotices
            .filter(n => n.universityId === 'uos' && (n.viewCount ?? 0) > 0)
            .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
            .slice(0, 5);
    },

    async fetchByKeywords(keywords: string[]): Promise<Notice[]> {
        if (keywords.length === 0) return [];
        const lowered = keywords.map(k => k.toLowerCase());
        const result: Notice[] = [];
        for (const n of mockNotices) {
            if (n.universityId !== 'uos') continue;
            const matched = lowered.filter(k => n.title.toLowerCase().includes(k));
            if (matched.length) result.push({ ...n, matchedKeywords: matched });
        }
        return result;
    },
};
