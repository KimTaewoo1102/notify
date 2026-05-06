import React, { createContext, MutableRefObject, useContext } from 'react';
import { ScrollView } from 'react-native';

/**
 * SwipeableNoticeRow가 수직 ScrollView의 스크롤을 일시 중단할 수 있도록
 * ScrollView의 ref를 공유한다.
 * setNativeProps를 사용하므로 React 리렌더 없이 즉각 반영된다.
 */
const ScrollRefContext = createContext<MutableRefObject<ScrollView | null> | null>(null);

export const ScrollRefProvider = ScrollRefContext.Provider;

export function useScrollRef() {
    return useContext(ScrollRefContext);
}
