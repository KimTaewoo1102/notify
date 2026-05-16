import { Share } from 'react-native';

import type { Notice } from '../types/domain';

/**
 * 공지 공유 시트.
 * 사용자가 공유 시트를 취소해도 에러로 전파하지 않는다 (silent catch).
 */
export async function shareNotice(notice: Notice): Promise<void> {
    try {
        await Share.share({
            message: `${notice.title}\n${notice.sourceUrl}`,
            url: notice.sourceUrl,
            title: notice.title,
        });
    } catch {
        /* 사용자가 공유 시트 취소 — silent. */
    }
}
