import { useMemo, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';

import { haptic } from '../../../ui/feedback/haptics';
import { spacing } from '../../../ui/theme';
import type { Section } from '../../../types/domain';

import type { MenuAnchor, SectionMenuItem } from '../components/SectionCardMenu';

const SCREEN_W = Dimensions.get('window').width;

interface Handlers {
    onToggleNotify?: () => void;
    onEditKeywords?: () => void;
    onRename?: () => void;
    onDelete?: () => void;
}

/**
 * SectionCard 우상단 케밥(⋮) 버튼의 메뉴 열림/닫힘 상태 + 메뉴 아이템 구성.
 *  - `kebabRef` 를 케밥 Pressable 에 연결하면, `openMenu()` 호출 시
 *    measureInWindow 로 화면 좌표를 계산해 anchor 를 잡는다.
 *  - 메뉴 항목은 section 의 현재 상태(notifyOn)에 따라 동적으로 결정.
 */
export function useSectionKebabMenu(section: Section, handlers: Handlers) {
    const kebabRef = useRef<View>(null);
    const [anchor, setAnchor] = useState<MenuAnchor | null>(null);

    const openMenu = () => {
        haptic('selection');
        kebabRef.current?.measureInWindow((x, y, w, h) => {
            setAnchor({
                top: y + h + 6,
                right: Math.max(spacing.lg, SCREEN_W - (x + w)),
            });
        });
    };

    const closeMenu = () => setAnchor(null);

    const items: SectionMenuItem[] = useMemo(
        () => [
            {
                key: 'notify',
                label: section.notifyOn ? '알람 끄기' : '알람 켜기',
                icon: section.notifyOn ? 'notifications-off' : 'notifications',
                onPress: () => handlers.onToggleNotify?.(),
            },
            {
                key: 'kw',
                label: '키워드 편집',
                icon: 'pricetag',
                onPress: () => handlers.onEditKeywords?.(),
            },
            {
                key: 'rename',
                label: '이름 변경',
                icon: 'create-outline',
                onPress: () => handlers.onRename?.(),
            },
            {
                key: 'delete',
                label: '섹션 삭제',
                icon: 'trash',
                destructive: true,
                onPress: () => handlers.onDelete?.(),
            },
        ],
        [section.notifyOn, handlers],
    );

    return { kebabRef, anchor, items, openMenu, closeMenu };
}
