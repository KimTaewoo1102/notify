export const colors = {
    bgTop: '#0A0A0B',
    bgBase: '#0E0E10',
    bgRaised: '#16161A',
    bgRaisedAlt: '#1C1C22',

    border: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.12)',

    textPrimary: '#F5F5F7',
    textSecondary: 'rgba(245,245,247,0.66)',
    textMuted: 'rgba(245,245,247,0.42)',
    textDisabled: 'rgba(245,245,247,0.24)',

    accent: '#7C5CFF',
    accentAlt: '#5BC0FF',
    success: '#3DDC97',
    danger: '#FF5C7A',
    warning: '#FFC857',

    overlay: 'rgba(0,0,0,0.6)',
} as const;

export type ColorToken = keyof typeof colors;
