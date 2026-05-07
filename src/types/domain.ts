export type ID = string;

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
