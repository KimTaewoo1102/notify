/**
 * 디자인 토큰. "SIMPLE IS BEST" — 블랙 + 글래스.
 * 컴포넌트는 항상 이 토큰만 참조한다 (하드코딩 금지).
 */

export const colors = {
    // 배경 그라디언트 스톱
    bgTop: '#000000',
    bgMid: '#0E0E10',
    bgBottom: '#000000',

    // 텍스트
    textPrimary: 'rgba(255,255,255,0.96)',
    textSecondary: 'rgba(255,255,255,0.64)',
    textTertiary: 'rgba(255,255,255,0.42)',
    textMuted: 'rgba(255,255,255,0.26)',

    // 글래스 표면
    glassFill: 'rgba(255,255,255,0.06)',
    glassFillStrong: 'rgba(255,255,255,0.10)',
    glassBorder: 'rgba(255,255,255,0.14)',
    glassBorderSoft: 'rgba(255,255,255,0.08)',
    glassHighlight: 'rgba(255,255,255,0.22)',

    // 액션
    danger: '#FF453A',          // iOS systemRed (다크)
    accent: '#FFFFFF',
    divider: 'rgba(255,255,255,0.06)',

    overlay: 'rgba(0,0,0,0.55)',
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
} as const;

export const radius = {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
} as const;

export const typography = {
    hero: { fontSize: 26, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.4 },
    title: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24, letterSpacing: -0.2 },
    body: { fontSize: 15, fontWeight: '500' as const, lineHeight: 21 },
    label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.4 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
    brand: { fontSize: 22, fontWeight: '300' as const, letterSpacing: 12 },
} as const;

export const shadows = {
    glass: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.45,
        shadowRadius: 28,
        elevation: 12,
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 6,
    },
} as const;
