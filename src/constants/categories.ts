import type { NoticeCategoryId } from '../types/domain';

/**
 * 공지 카테고리 한국어 라벨.
 * 누락된 카테고리는 호출 측에서 fallback (`?? notice.category`) 으로 처리한다.
 */
export const CATEGORY_LABEL: Record<NoticeCategoryId, string> = {
    academic: '학사',
    scholarship: '장학',
    recruit: '채용',
    event: '행사',
    library: '도서관',
    dorm: '생활관',
    general: '일반',
};
