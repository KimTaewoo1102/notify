import type { NoticeCategoryId } from '../types/notice';

export interface CategoryMeta {
    label: string;
    /** 카테고리 칩의 잔잔한 액센트 (배경의 그림자 톤) */
    accent: string;
}

/**
 * 블랙 테마에서도 고급스러워 보이도록
 * 채도 낮은 파스텔/네온 액센트만 사용한다.
 */
export const CATEGORY_META: Record<NoticeCategoryId, CategoryMeta> = {
    academic:    { label: '학사',     accent: 'rgba(120,180,255,0.30)' },
    scholarship: { label: '장학',     accent: 'rgba(255,210,120,0.30)' },
    recruit:     { label: '채용',     accent: 'rgba(150,255,200,0.28)' },
    event:       { label: '행사',     accent: 'rgba(220,160,255,0.30)' },
    general:     { label: '일반',     accent: 'rgba(255,255,255,0.18)' },
    library:     { label: '도서관',   accent: 'rgba(180,220,255,0.26)' },
    dorm:        { label: '기숙사',   accent: 'rgba(255,180,170,0.28)' },
};
