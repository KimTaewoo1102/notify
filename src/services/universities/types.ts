import type { Notice } from '../../types/notice';

/**
 * 학교별 어댑터 인터페이스.
 * - 새 학교 지원: 이 인터페이스를 구현해 registry에 등록만 하면 끝.
 * - 백엔드가 생기면 fetchToday/Hot/Keyword가 실제 HTTP 호출로 바뀐다.
 */
export interface UniversityAdapter {
    id: string;            // 'uos'
    name: string;          // '서울시립대학교'
    shortName: string;     // '시립대'

    fetchToday(): Promise<Notice[]>;
    fetchHot(): Promise<Notice[]>;
    fetchByKeywords(keywords: string[]): Promise<Notice[]>;
}
