import { useEffect, useRef } from 'react';
import {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../../ui/feedback/haptics';
import { SHAKE_NOTIFY_ON_SEQUENCE } from '../../../constants/animation';

interface Options {
    /** DraggableFlatList 의 isActive — 드래그 중 카드를 약간 확대/투명화 */
    isDragActive: boolean | undefined;
    /** 현재 알림 ON 상태 — OFF→ON 전이 시 1회 흔들림 (의도 1.8) */
    notifyOn: boolean;
    /** 시스템 섹션은 흔들림/햅틱 모두 미적용 */
    isSystem: boolean;
}

/**
 * SectionCard 의 외곽 컨테이너 애니메이션을 단일 스타일로 통합 관리.
 *  - drag 전이: spring 으로 scale 1↔1.04, opacity 1↔0.96
 *  - notify OFF→ON 전이: 종 모양 감쇠 시퀀스로 translateX 흔들림 + heavy haptic
 *
 * 의도(intent) — 함부로 건드리지 말 것:
 *  - shake 의 진폭/duration 비율은 constants/animation.ts 에서 관리 (SHAKE_NOTIFY_ON_SEQUENCE).
 *  - 시스템 섹션은 정책상 흔들리지 않는다.
 */
export function useSectionCardAnimation({ isDragActive, notifyOn, isSystem }: Options) {
    const dragScale = useSharedValue(1);
    const dragOpacity = useSharedValue(1);
    const shake = useSharedValue(0);

    useEffect(() => {
        dragScale.value = withSpring(isDragActive ? 1.04 : 1, {
            damping: 14,
            stiffness: 200,
        });
        dragOpacity.value = withSpring(isDragActive ? 0.96 : 1, {
            damping: 18,
            stiffness: 240,
        });
    }, [isDragActive, dragScale, dragOpacity]);

    const prevNotify = useRef(notifyOn);
    useEffect(() => {
        const wasOff = !prevNotify.current;
        const isOn = notifyOn;
        if (wasOff && isOn && !isSystem) {
            haptic('heavy');
            // 감쇠 시퀀스 — 진폭/duration 비율이 의도 (constants/animation.ts 참조)
            const [s0, s1, s2, s3, s4, s5] = SHAKE_NOTIFY_ON_SEQUENCE;
            shake.value = withSequence(
                withTiming(s0.dx, { duration: s0.duration }),
                withTiming(s1.dx, { duration: s1.duration }),
                withTiming(s2.dx, { duration: s2.duration }),
                withTiming(s3.dx, { duration: s3.duration }),
                withTiming(s4.dx, { duration: s4.duration }),
                withTiming(s5.dx, { duration: s5.duration }),
            );
        }
        prevNotify.current = notifyOn;
    }, [notifyOn, isSystem, shake]);

    return useAnimatedStyle(() => ({
        transform: [
            { translateX: shake.value },
            { scale: dragScale.value },
        ],
        opacity: dragOpacity.value,
    }));
}
