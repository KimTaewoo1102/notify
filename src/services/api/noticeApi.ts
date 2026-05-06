import type { Notice } from '../../types/notice';
import { getUniversityAdapter } from '../universities';

/**
 * 화면이 호출하는 단일 API 표면.
 * 지금은 어댑터의 mock을 그대로 통과시키지만,
 * 백엔드 도입 후에는 이 함수가 fetch(...)로 바뀌고
 * 어댑터는 서버 라우팅 키로만 쓰여도 된다.
 */
export const noticeApi = {
    today: (universityId: string): Promise<Notice[]> =>
        getUniversityAdapter(universityId).fetchToday(),

    hot: (universityId: string): Promise<Notice[]> =>
        getUniversityAdapter(universityId).fetchHot(),

    byKeywords: (universityId: string, keywords: string[]): Promise<Notice[]> =>
        getUniversityAdapter(universityId).fetchByKeywords(keywords),
};
