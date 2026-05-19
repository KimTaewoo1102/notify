export const colors = {
    bgTop: '#0A0A0B',
    bgBase: '#0E0E10',
    bgRaised: '#16161A',
    bgRaisedAlt: '#1C1C22',

    border: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.12)',
    /**
     * 카드 / 메뉴 / 다이얼로그 상단 가장자리 highlight.
     * 다크 모드에서는 검정 shadow 만으로는 depth 가 약하므로 "위에서 빛이 든" 느낌의
     * 1px 톱-에지 highlight 를 더해 이중 depth 를 만든다.
     */
    edgeHighlight: 'rgba(255,255,255,0.10)',
    edgeHighlightStrong: 'rgba(255,255,255,0.18)',

    textPrimary: '#F5F5F7',
    textSecondary: 'rgba(245,245,247,0.66)',
    textMuted: 'rgba(245,245,247,0.42)',
    textDisabled: 'rgba(245,245,247,0.24)',

    accent: '#FFFFFF',
    accentAlt: '#5BC0FF',
    success: '#3DDC97',
    danger: '#FF5C7A',
    warning: '#FFC857',

    overlay: 'rgba(0,0,0,0.6)',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * 동적 accent 색상에 얹는 알파 채널 토큰.
 *
 * accent 컬러는 섹션마다 달라지므로 (e.g. `section.accentColor`) 알파 변형을 한
 * 토큰으로 박을 수 없다. 대신 8-bit 알파 hex 접미사를 토큰화해 재사용한다.
 *  - 사용 예: `backgroundColor: accent + alpha.fill`
 *  - 기존 인라인 값(`accent + '22'` 등) 과 호환되도록 명도/이름을 매핑했다.
 *
 * (퍼센트는 0xFF 기준 근사치)
 */
export const alpha = {
    /** 5%  — 매우 은은한 배경 틴트 (핀 카드 등) */
    veil: '0E',
    /** 8%  — 선택된 공지 카드 배경 */
    soft: '14',
    /** 9%  — 매치 키워드 칩 배경 */
    chipSoft: '18',
    /** 12% — 키워드 칩 배경 */
    chip: '20',
    /** 13% — 일반 fill (pill, badge, tag 배경) */
    fill: '22',
    /** 27% — 키워드 칩 테두리 */
    chipBorder: '44',
    /** 33% — 미리보기 바, 편집 버튼 테두리 */
    accentBorder: '55',
    /** 40% — 핀 카드 테두리 */
    pinBorder: '66',
    /** 60% — 활성 pill 테두리 */
    strong: '99',
} as const;
