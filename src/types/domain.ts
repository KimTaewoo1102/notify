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
    /** 사용자가 이 섹션 상세 화면을 마지막으로 떠난 시각 (unread 판정 기준). */
    lastVisitedAt: number | null;
}

/**
 * Notice — 공지 도메인 모델.
 *
 * 현재 인터페이스에는 (a) 백엔드/소스에서 동기화되는 필드와
 * (b) 앱 내 UI 오버레이 메타데이터가 함께 들어있다.
 * Phase 8 (payload 정규화) 에서 분리 예정이나, persist 마이그레이션
 * 리스크가 크므로 이번 리팩토링에서는 **구조 유지**하고 JSDoc 으로만
 * 의도를 명시한다.
 *
 * - **백엔드 동기 필드**: id, universityId, category, title, department,
 *   publishedAt, sourceUrl, viewCount, isSourcePinned, matchedKeywords.
 * - **UI 오버레이 (앱 로컬 상태)**: sectionId, isUserPinned, userPinnedAt,
 *   deletedAt, originalSectionId, read, bookmarked.
 *   → 추후 별도 store entry meta 로 옮길 예정.
 */
export interface Notice {
    // ─── 백엔드 동기 필드 ───────────────────────────────────────────
    id: ID;
    universityId: string;
    category: NoticeCategoryId;
    title: string;
    department: string;
    publishedAt: string;
    sourceUrl: string;
    viewCount?: number;
    isSourcePinned?: boolean;
    matchedKeywords?: string[];

    // ─── UI 오버레이 (앱 로컬 상태) ─────────────────────────────────
    /** 어떤 섹션에서 fetch 되었는지 (시스템 '고정' 섹션 복원용). */
    sectionId?: ID;
    /** 사용자가 직접 고정한 공지인지. (시스템 'isSourcePinned' 와 구분) */
    isUserPinned?: boolean;
    userPinnedAt?: number;
    /** 휴지통 이동 시각. 30일 후 자동 영구 삭제 판정에 사용. */
    deletedAt?: number;
    /** 삭제 시점의 원본 섹션 id — '고정' 섹션에서 삭제했을 때 복원 위치. */
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
