import type { Notice } from '../../types/domain';

/**
 * 학교별 어댑터 인터페이스.
 * 새 학교를 지원할 때 이 인터페이스를 구현해 registry에 등록만 하면 끝.
 * 백엔드가 생기면 fetch 함수만 실제 HTTP 호출로 바뀌고 UI는 그대로.
 */
export interface UniversityAdapter {
    id: string;
    name: string;
    shortName: string;

    fetchToday(): Promise<Notice[]>;
    fetchHot(): Promise<Notice[]>;
    fetchByKeywords(keywords: string[]): Promise<Notice[]>;
}
