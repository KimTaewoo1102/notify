/**
 * UI 인터랙션 관련 매직 상수.
 */

/**
 * 컨텍스트 메뉴 long-press 인식 지연 (ms).
 * iOS 표준(~500ms) 보다는 약간 빠르되, 스크롤/스와이프 중 오발화는 회피.
 * (이전 320ms 는 너무 짧아 빈번한 오발화)
 *
 * 보조 햅틱: PressableScale 가 자동으로 delayLongPress/2 시점에 light 햅틱 발사
 * (buildup 피드백 — "지금 누르고 있다" 신호).
 */
export const LONG_PRESS_DELAY_MS = 400;

/** 공지 카드 하단에 노출하는 매치 키워드 칩 최대 개수. */
export const MAX_MATCHED_KEYWORDS_DISPLAYED = 3;
