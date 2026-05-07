import * as Haptics from 'expo-haptics';

export type HapticKind =
    | 'light'
    | 'medium'
    | 'heavy'
    | 'success'
    | 'warning'
    | 'error'
    | 'selection';

const dispatch: Record<HapticKind, () => Promise<void> | void> = {
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    selection: () => Haptics.selectionAsync(),
};

/** Fire-and-forget haptic. expo-haptics는 web/일부 플랫폼에서 throw 할 수 있어 swallow. */
export function haptic(kind: HapticKind = 'light'): void {
    try {
        const r = dispatch[kind]();
        if (r && typeof (r as Promise<void>).catch === 'function') {
            (r as Promise<void>).catch(() => {});
        }
    } catch {
        /* no-op */
    }
}
