import { create } from 'zustand';

import type { ID, Notice } from '../types/domain';

/**
 * 섹션별 최신 공지 목록을 메모리에 캐시하는 volatile store.
 *
 * - 영구 저장 없음 — 앱 재시작 시 초기화.
 * - SectionDetailScreen 에서 fetch 완료 후 setCache() 호출.
 * - HomeScreen 의 HomeSectionRow 가 fine-grained selector
 *   (`cache[section.id]`) 로 직접 구독해 unread / preview 계산.
 */
interface NoticeCacheState {
    cache: Record<ID, Notice[]>;
}

interface NoticeCacheActions {
    /** fetch 완료된 공지 목록을 섹션 캐시에 저장. */
    setCache: (sectionId: ID, notices: Notice[]) => void;
}

export type NoticeCacheStore = NoticeCacheState & NoticeCacheActions;

export const useNoticeCacheStore = create<NoticeCacheStore>()((set) => ({
    cache: {},

    setCache: (sectionId, notices) =>
        set(s => ({ cache: { ...s.cache, [sectionId]: notices } })),
}));
