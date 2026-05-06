import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * 햅틱 정책을 한 곳에 모은다.
 * - tap:    가벼운 탭(메뉴, 버튼)
 * - select: 카드 진입(공지 클릭)
 * - warn:   삭제 직전 경고
 * - confirm: 삭제 완료 등 결정 피드백
 */

const isIOS = Platform.OS === 'ios';

export const haptics = {
    tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    select: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    warn: () =>
        isIOS
            ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    confirm: () =>
        isIOS
            ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
};
