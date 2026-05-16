/**
 * 큰 숫자를 짧은 라벨로. (조회수, 좋아요 등에 공통 사용)
 *  - 1만 이상 → 'N.N만'
 *  - 1천 이상 → 'N.Nk'
 *  - 그 외 → 그대로 (정수 문자열)
 */
export function formatViewCount(n: number): string {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}
