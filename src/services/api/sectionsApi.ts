import { useSectionsStore, type Section, type SectionId } from '../../store/sectionsStore';

/**
 * 섹션 CRUD 서비스 표면.
 *
 * 현재는 zustand 스토어를 그대로 호출하지만, 백엔드 도입 후엔
 * 각 함수 본문이 fetch('/api/me/sections/...') 로 바뀌고
 * 응답에 따라 store 를 갱신하는 Optimistic 패턴으로 확장된다.
 *
 * 화면은 이 모듈만 임포트하므로, 어댑터 교체 시 화면 코드는 변하지 않는다.
 */

export interface CreateSectionInput {
    title?: string;             // 비우면 keywords 자동 라벨
    keywords: string[];         // 1개 이상 필수
    icon?: string;
}

const fallbackTitle = (keywords: string[]) =>
    keywords.length === 0
        ? '새 섹션'
        : keywords.length === 1
            ? keywords[0]
            : `${keywords.slice(0, 2).join(', ')}${keywords.length > 2 ? ' 외' : ''}`;

export const sectionsApi = {
    list: async (): Promise<Section[]> => useSectionsStore.getState().sections,

    create: async (input: CreateSectionInput): Promise<Section> => {
        if (input.keywords.length === 0) {
            throw new Error('키워드를 1개 이상 입력해야 합니다.');
        }
        const id = `kw-${Date.now()}`;
        const draft = {
            id,
            title: (input.title?.trim() || fallbackTitle(input.keywords)),
            icon: input.icon ?? 'pricetag-outline',
            feed: 'keyword' as const,
            alarmOn: false,
            keywords: Array.from(new Set(input.keywords.map(k => k.trim()).filter(Boolean))),
        };
        useSectionsStore.getState().addSection(draft);
        const created = useSectionsStore.getState().sections.find(s => s.id === id);
        if (!created) throw new Error('Section creation failed');
        return created;
    },

    rename: async (id: SectionId, title: string): Promise<void> => {
        useSectionsStore.getState().rename(id, title.trim());
    },

    updateKeywords: async (id: SectionId, keywords: string[]): Promise<void> => {
        const cleaned = Array.from(new Set(keywords.map(k => k.trim()).filter(Boolean)));
        useSectionsStore.getState().updateKeywords(id, cleaned);
    },

    reorder: async (next: Section[]): Promise<void> => {
        useSectionsStore.getState().reorder(next);
    },

    toggleAlarm: async (id: SectionId): Promise<void> => {
        useSectionsStore.getState().toggleAlarm(id);
        // TODO(backend): alarmOn 인 섹션 리스트로 push 토큰 등록/해제 호출
    },

    togglePin: async (id: SectionId): Promise<void> => {
        useSectionsStore.getState().togglePin(id);
    },

    moveToTrash: async (id: SectionId): Promise<void> => {
        useSectionsStore.getState().moveToTrash(id);
    },

    restore: async (id: SectionId): Promise<void> => {
        useSectionsStore.getState().restore(id);
    },

    purge: async (id: SectionId): Promise<void> => {
        useSectionsStore.getState().purge(id);
    },
};

export type SectionsApi = typeof sectionsApi;
