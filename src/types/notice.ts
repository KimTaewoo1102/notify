/**
 * 공지사항 도메인 타입.
 * 목(mock) → 백엔드 → AI 큐레이션 단계로 교체될 때
 * 화면 코드는 이 타입만 바라본다.
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
    id: string;
    universityId: string;        // 'uos' | 'snu' | ...
    category: NoticeCategoryId;
    title: string;
    department: string;          // 작성 부서
    publishedAt: string;         // ISO 8601
    sourceUrl: string;           // 원본 링크 (탭 시 이동)
    viewCount?: number;          // HOT 산정용
    isPinned?: boolean;
    matchedKeywords?: string[];  // AI가 매칭한 회원 키워드
}

export type NoticeFeed =
    | 'today'      // 오늘의 중요 공지 (Hero)
    | 'keyword'    // 내 키워드 매칭
    | 'hot';       // 조회수 급상승
