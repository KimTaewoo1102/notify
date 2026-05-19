import { create } from 'zustand';
import type { ID } from '../types/domain';

/**
 * 휘발성 UI 상태. persist 하지 않는다.
 * - addSectionSheetOpen: 섹션 추가 바텀시트
 * - keywordSheetSectionId: 키워드 편집 바텀시트 (편집 대상 섹션 id)
 */
interface UIState {
    addSectionSheetOpen: boolean;
    keywordSheetSectionId: ID | null;

    openAddSection: () => void;
    closeAddSection: () => void;
    openKeywordEdit: (sectionId: ID) => void;
    closeKeywordEdit: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    addSectionSheetOpen: false,
    keywordSheetSectionId: null,

    openAddSection: () => set({ addSectionSheetOpen: true }),
    closeAddSection: () => set({ addSectionSheetOpen: false }),
    openKeywordEdit: (sectionId) => set({ keywordSheetSectionId: sectionId }),
    closeKeywordEdit: () => set({ keywordSheetSectionId: null }),
}));
