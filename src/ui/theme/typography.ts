import type { TextStyle } from 'react-native';

export const typography = {
    display: { fontSize: 32, fontWeight: '700', letterSpacing: -0.6 },
    h1: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
    h2: { fontSize: 20, fontWeight: '600', letterSpacing: -0.2 },
    h3: { fontSize: 16, fontWeight: '600', letterSpacing: -0.1 },
    body: { fontSize: 16, fontWeight: '500' },
    bodySm: { fontSize: 14, fontWeight: '500' },
    caption: { fontSize: 12, fontWeight: '500' },
    mono: { fontSize: 13, fontWeight: '500' },
} satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
