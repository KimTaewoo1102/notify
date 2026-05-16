/**
 * 애니메이션 매직 상수 모음.
 *
 * 이 파일의 수치는 **모두 의도(intent)를 가진 값**이다.
 *  - 임의로 둥글게 깎거나 통일하지 말 것 (UI 톤이 즉시 어색해진다).
 *  - 시각적 튜닝이 필요하면 디자인 단계에서 별도로 검토.
 */

/**
 * iOS 홈스크린식 jiggle (편집 모드 카드 흔들림).
 *  - ±1° 사이를 90ms 단위로 무한 반복.
 *  - 카드별로 위상이 어긋나도록 `index * phaseStepMs` 만큼 지연.
 *  - 비활성화 시 140ms 동안 0deg 로 부드럽게 복귀.
 */
export const JIGGLE = {
    angleDeg: 1.0,
    tickMs: 90,
    phaseStepMs: 30,
    exitMs: 140,
} as const;

/**
 * 섹션 알림 ON 전환 시 흔들림(shake) 시퀀스. (translateX in px)
 *
 * 감쇠 시퀀스이므로 진폭/duration 의 비율을 유지해야 자연스럽다.
 * 종 모양 흔들림 → 정지 패턴.
 */
export const SHAKE_NOTIFY_ON_SEQUENCE: ReadonlyArray<{
    dx: number;
    duration: number;
}> = [
    { dx: -7, duration: 50 },
    { dx: 7, duration: 60 },
    { dx: -6, duration: 60 },
    { dx: 5, duration: 55 },
    { dx: -3, duration: 55 },
    { dx: 0, duration: 70 },
];
