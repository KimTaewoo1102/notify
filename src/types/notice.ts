/**
 * 공지사항 도메인 타입.
 * 목(mock) → 백엔드 → AI 큐레이션 단계로 교체될 때
 * 화면 코드는 이 타입만 바라본다.
 *
 * 필드는 두 종류:
 *  1. 소스(대학 사이트 / 피드)에서 내려오는 원본 필드
 *  2. 사용자 메타 — 클라이언트 + 앱 백엔드가 관리하는 부가 상태
 *     (핀, 휴지통, 매칭 키워드 등)
 */

export type NoticeCategoryId =
    | 'academic'      // 학사
    | 'scholarship'   // 장학
    | 'recruit'       // 채용/인턴
    | 'event'         // 행사/특강
    | 'general'       // 일반
    | 'library'       // 도서관
    | 'dorm';         // 기숙사

export interface NoticeCategory {
    id: NoticeCategoryId;
    label: string;
}

export interface Notice {
    // ── 소스 원본 ─────────────────────────────────────────────
    id: string;
    universityId: string;        // 'uos' | 'snu' | ...
    category: NoticeCategoryId;
    title: string;
    department: string;          // 작성 부서
    publishedAt: string;         // ISO 8601
    sourceUrl: string;           // 원본 링크 (탭 시 이동)
    viewCount?: number;          // HOT 산정용
    /** 원본(대학 측)에서 강조 처리한 공지 — 사용자 핀과 별개 */
    isSourcePinned?: boolean;

    // ── 사용자 메타 (클라이언트 + 앱 백엔드) ──────────────────
    /** AI 가 매칭한 회원 키워드 */
    matchedKeywords?: string[];
    /** 사용자 직접 핀 — 섹션 내부 LongPress → "고정" */
    isUserPinned?: boolean;
    /** 사용자가 핀 한 시점 (ms) — 핀 정렬용 */
    userPinnedAt?: number;
    /** 휴지통 이동 시점 (ms). 있으면 휴지통에 있음. */
    deletedAt?: number;
    /** 휴지통 복구 시 되돌아갈 섹션 id */
    originalSectionId?: string;
}

/**
 * 시스템(디폴트) 피드 종류.
 * 백엔드가 생기면 사용자 정의 섹션은 keyword feed 로 통합되고
 * today/hot 만 시스템 피드로 남는다.
 */
export type NoticeFeed =
    | 'today'      // 오늘의 공지
    | 'keyword'    // 키워드 매칭 (사용자 정의 섹션)
    | 'hot';       // 조회수 급상승
