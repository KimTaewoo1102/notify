/** "2시간 전", "어제", "5월 3일" 같은 상대 시간 */
export function formatRelativeDate(iso: string, now: Date = new Date()): string {
    const then = new Date(iso);
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHr < 24) return `${diffHr}시간 전`;
    if (diffDay < 2) return '어제';
    if (diffDay < 7) return `${diffDay}일 전`;
    return `${then.getMonth() + 1}월 ${then.getDate()}일`;
}

/** 1234 → "1.2k", 12345 → "12k" */
export function formatViewCount(n: number): string {
    if (n < 1000) return String(n);
    if (n < 10_000) return `${(n / 1000).toFixed(1)}k`;
    return `${Math.round(n / 1000)}k`;
}
