/**
 * UI 인터랙션 관련 매직 상수.
 */

/** 컨텍스트 메뉴 long-press 인식 지연 (ms). 짧으면 스크롤/스와이프 중 오동작이 발생. */
export const LONG_PRESS_DELAY_MS = 320;

/**
 * 공지 카드 우하단 외부 링크 아이콘 hit slop.
 * 오른쪽은 작게 잡아 스와이프 제스처를 가리지 않도록 함.
 */
export const EXTERNAL_LINK_HIT_SLOP = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 4,
} as const;

/** 공지 카드 하단에 노출하는 매치 키워드 칩 최대 개수. */
export const MAX_MATCHED_KEYWORDS_DISPLAYED = 3;
