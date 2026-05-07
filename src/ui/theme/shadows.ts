import type { ViewStyle } from 'react-native';

const make = (
    opacity: number,
    radius: number,
    offsetY: number,
    elevation: number,
): ViewStyle => ({
    shadowColor: '#000',
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: offsetY },
    elevation,
});

export const shadows = {
    sm: make(0.18, 6, 2, 2),
    md: make(0.28, 14, 6, 6),
    lg: make(0.4, 24, 12, 12),
} as const;

export type ShadowToken = keyof typeof shadows;
