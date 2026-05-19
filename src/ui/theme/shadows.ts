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
    sm: make(0.32, 10, 3, 4),
    md: make(0.48, 20, 8, 10),
    lg: make(0.60, 32, 16, 18),
} as const;

export type ShadowToken = keyof typeof shadows;
