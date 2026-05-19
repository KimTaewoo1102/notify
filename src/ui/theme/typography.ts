import type { TextStyle } from 'react-native';

export const typography = {
    display: { fontSize: 32, fontWeight: '700', letterSpacing: -0.6 },
    h1: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
    h2: { fontSize: 20, fontWeight: '600', letterSpacing: -0.2 },
    h3: { fontSize: 16, fontWeight: '600', letterSpacing: -0.1 },
    // body: 한글 본문 가독성을 위해 Regular(400). 강조가 필요한 곳은 호출 측에서
    // fontWeight 오버라이드 (SectionCard.title 700, HotNoticeCard.title 700 등).
    body: { fontSize: 16, fontWeight: '400' },
    // bodySm: 버튼 라벨 등 약한 강조가 기본 — 500 유지.
    bodySm: { fontSize: 14, fontWeight: '500' },
    caption: { fontSize: 12, fontWeight: '500' },
    mono: { fontSize: 13, fontWeight: '500' },
} satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
