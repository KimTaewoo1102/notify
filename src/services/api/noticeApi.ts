import { Share } from 'react-native';
import type { Notice, NoticeFeed } from '../../types/notice';
import { getUniversityAdapter } from '../universities';
import {
    decorateWithMeta,
    selectPinnedNotices,
    selectTrashList,
    useNoticesStore,
} from '../../store/noticesStore';
import {
    selectSectionById,
    useSectionsStore,
    type SectionId,
} from '../../store/sectionsStore';

/**
 * 화면이 호출하는 단일 API 표면.
 *
 * 두 종류 함수가 섞여 있다:
 *  1. 소스 fetch (today/hot/byKeywords/bySection) — 대학 어댑터로 위임,
 *     백엔드 도입 시 `fetch('/api/notices/...')` 로 교체.
 *  2. 사용자 메타 mutate (pin/unpin/dismiss/restore/...) — 클라이언트
 *     `noticesStore` 에 즉시 반영하고, 백엔드 도입 후엔 동일 mutation 을
 *     서버에도 동기화 (Optimistic + 롤백).
 *
 * 화면은 모든 데이터/액션을 이 한 모듈로만 호출한다.
 */

const sourcePool = async (universityId: string): Promise<Notice[]> => {
    // "전체 풀" 은 today + hot 합집합이라고 가정 (mock 한정).
    // 실제 백엔드에선 universityId 단일 endpoint 가 별도로 존재.
    const adapter = getUniversityAdapter(universityId);
    const [today, hot] = await Promise.all([
        adapter.fetchToday(),
        adapter.fetchHot(),
    ]);
    const seen = new Set<string>();
    const merged: Notice[] = [];
    for (const n of [...today, ...hot]) {
        if (seen.has(n.id)) continue;
        seen.add(n.id);
        merged.push(n);
    }
    return merged;
};

export const noticeApi = {
    // ── 소스 fetch ────────────────────────────────────────────
    today: async (universityId: string): Promise<Notice[]> => {
        const list = await getUniversityAdapter(universityId).fetchToday();
        return decorateWithMeta(list, useNoticesStore.getState());
    },

    hot: async (universityId: string): Promise<Notice[]> => {
        const list = await getUniversityAdapter(universityId).fetchHot();
        return decorateWithMeta(list, useNoticesStore.getState());
    },

    byKeywords: async (universityId: string, keywords: string[]): Promise<Notice[]> => {
        const list = await getUniversityAdapter(universityId).fetchByKeywords(keywords);
        return decorateWithMeta(list, useNoticesStore.getState());
    },

    /**
     * 섹션 id 기준 통합 페치.
     * - 'pinned-default' 시스템 섹션 → 사용자 핀 공지 모음
     * - feed='keyword' 섹션 → 해당 섹션 keywords 로 매칭
     * - feed='hot'/'today' → 시스템 피드
     */
    bySection: async (
        universityId: string,
        sectionId: SectionId,
    ): Promise<Notice[]> => {
        const section = selectSectionById(sectionId)(useSectionsStore.getState());
        if (!section) return [];

        if (section.isSystem === 'pinned-default') {
            const pool = await sourcePool(universityId);
            return selectPinnedNotices(useNoticesStore.getState(), pool);
        }

        const adapter = getUniversityAdapter(universityId);
        let list: Notice[];
        switch (section.feed) {
            case 'today':
                list = await adapter.fetchToday();
                break;
            case 'hot':
                list = await adapter.fetchHot();
                break;
            case 'keyword':
                list = await adapter.fetchByKeywords(
                    section.keywords ?? useSectionsStore.getState().keywords,
                );
                break;
            default:
                list = [];
        }
        return decorateWithMeta(list, useNoticesStore.getState());
    },

    // ── 사용자 메타 mutate ────────────────────────────────────
    pin: async (notice: Notice, fromSectionId?: SectionId): Promise<void> => {
        useNoticesStore.getState().pin(notice, fromSectionId);
    },

    unpin: async (id: string): Promise<void> => {
        useNoticesStore.getState().unpin(id);
    },

    dismiss: async (notice: Notice, sectionId?: SectionId): Promise<void> => {
        useNoticesStore.getState().dismiss(notice, sectionId);
    },

    dismissAll: async (notices: Notice[], sectionId?: SectionId): Promise<void> => {
        useNoticesStore.getState().dismissMany(notices, sectionId);
    },

    /**
     * 휴지통에서 복구. 복구된 공지는 다시 소스 fetch 결과에 자연스럽게 노출됨.
     * 반환값은 원래 섹션 id (호출자가 스크롤 / 알림 등에 활용).
     */
    restore: async (id: string): Promise<{ originalSectionId?: SectionId } | undefined> => {
        const meta = useNoticesStore.getState().restore(id);
        return meta ? { originalSectionId: meta.originalSectionId } : undefined;
    },

    purge: async (id: string): Promise<void> => {
        useNoticesStore.getState().purge(id);
    },

    listTrash: async (): Promise<Notice[]> =>
        selectTrashList(useNoticesStore.getState()),

    listPinned: async (universityId: string): Promise<Notice[]> => {
        const pool = await sourcePool(universityId);
        return selectPinnedNotices(useNoticesStore.getState(), pool);
    },

    share: async (notice: Notice): Promise<void> => {
        await Share.share({
            message: `${notice.title}\n${notice.sourceUrl}`,
            url: notice.sourceUrl,
            title: notice.title,
        });
    },
};

export type NoticeApi = typeof noticeApi;
export type { NoticeFeed };
