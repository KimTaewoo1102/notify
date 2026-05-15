/**
 * 시간/날짜 포맷팅 유틸.
 *
 * 화면별로 미묘하게 다른 표기를 그대로 유지하기 위해 3종을 별도 함수로 제공한다.
 * (출력 포맷을 통합하면 UI 회귀가 생기므로 함부로 합치지 말 것.)
 *  - `timeAgo(iso)`        — '방금' / 'N시간 전' / 'N일 전'  (Notice 상세/HOT 리스트)
 *  - `timeAgoShort(iso)`   — '방금' / 'Nh' / 'Nd'           (홈 미리보기 영역)
 *  - `timeAgoFromMs(ms)`   — '방금 전' / 'N시간 전' / 'N일 전' (휴지통 — '방금 전'에 '전' 포함)
 */

interface RelativeFormat {
    now: string;
    hours: (h: number) => string;
    days: (d: number) => string;
}

function formatRelative(diffMs: number, fmt: RelativeFormat): string {
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    if (hours < 1) return fmt.now;
    if (hours < 24) return fmt.hours(hours);
    return fmt.days(Math.floor(hours / 24));
}

export function timeAgo(iso: string): string {
    return formatRelative(Date.now() - new Date(iso).getTime(), {
        now: '방금',
        hours: h => `${h}시간 전`,
        days: d => `${d}일 전`,
    });
}

export function timeAgoShort(iso: string): string {
    return formatRelative(Date.now() - new Date(iso).getTime(), {
        now: '방금',
        hours: h => `${h}h`,
        days: d => `${d}d`,
    });
}

export function timeAgoFromMs(ms: number): string {
    return formatRelative(Date.now() - ms, {
        now: '방금 전',
        hours: h => `${h}시간 전`,
        days: d => `${d}일 전`,
    });
}
