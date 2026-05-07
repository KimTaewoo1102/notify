export type ID = string;

export type SectionKind = 'system' | 'user';

/** 시스템 섹션의 reserved id. 영구 보장되며 사용자가 만든 섹션과 충돌하지 않는다. */
export const SYSTEM_PIN_SECTION_ID = 'system:pin';

export type NoticeCategoryId =
    | 'academic'
    | 'scholarship'
    | 'recruit'
    | 'event'
    | 'general'
    | 'library'
    | 'dorm';

export interface Keyword {
    id: ID;
    text: string;
    createdAt: number;
}

export interface Section {
    id: ID;
    /** 'system' = 앱 디폴트(고정 섹션 등). 사용자가 삭제/이동 불가. */
    kind: SectionKind;
    title: string;
    source: string;
    universityId: string;
    emoji?: string;
    accentColor: string;
    order: number;
    pinned: boolean;
    notifyOn: boolean;
    keywords: Keyword[];
    createdAt: number;
    updatedAt: number;
}

export interface Notice {
    id: ID;
    sectionId?: ID;
    universityId: string;
    category: NoticeCategoryId;
    title: string;
    department: string;
    publishedAt: string;
    sourceUrl: string;
    viewCount?: number;
    isSourcePinned?: boolean;
    matchedKeywords?: string[];
    isUserPinned?: boolean;
    userPinnedAt?: number;
    deletedAt?: number;
    originalSectionId?: ID;
    read?: boolean;
    bookmarked?: boolean;
}

export type TrashKind = 'section' | 'notice';

export interface TrashEntry {
    kind: TrashKind;
    payload: Section | Notice;
    deletedAt: number;
}
