import { create } from 'zustand';
import type { ID } from '../types/domain';

/**
 * 휘발성 UI 상태. persist 하지 않는다.
 * - editMode: 섹션 편집 모드 (jiggle + drag + delete)
 * - addSectionSheetOpen: 섹션 추가 바텀시트
 * - keywordSheetSectionId: 키워드 편집 바텀시트 (편집 대상 섹션 id)
 */
interface UIState {
    editMode: boolean;
    addSectionSheetOpen: boolean;
    keywordSheetSectionId: ID | null;

    setEditMode: (v: boolean) => void;
    toggleEditMode: () => void;
    openAddSection: () => void;
    closeAddSection: () => void;
    openKeywordEdit: (sectionId: ID) => void;
    closeKeywordEdit: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    editMode: false,
    addSectionSheetOpen: false,
    keywordSheetSectionId: null,

    setEditMode: (v) => set({ editMode: v }),
    toggleEditMode: () => set(s => ({ editMode: !s.editMode })),
    openAddSection: () => set({ addSectionSheetOpen: true }),
    closeAddSection: () => set({ addSectionSheetOpen: false }),
    openKeywordEdit: (sectionId) => set({ keywordSheetSectionId: sectionId }),
    closeKeywordEdit: () => set({ keywordSheetSectionId: null }),
}));
