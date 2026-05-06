import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

/**
 * Zustand persist 용 영속 어댑터.
 *
 * Expo Go 호환을 위해 react-native-mmkv 대신 @react-native-async-storage/async-storage 를 사용.
 * AsyncStorage 는 비동기지만 zustand persist + createJSONStorage 가 Promise 를 정상 처리한다.
 *
 * 추후 dev build (custom native) 로 전환 시 이 파일 본문만 MMKV 로 갈아끼우면 되고,
 * 호출자(스토어)는 손대지 않아도 된다.
 */
export const persistStorage: StateStorage = {
    getItem: async name => {
        try {
            return (await AsyncStorage.getItem(name)) ?? null;
        } catch {
            return null;
        }
    },
    setItem: async (name, value) => {
        try {
            await AsyncStorage.setItem(name, value);
        } catch {
            /* swallow — 영속 실패는 UX 를 막지 않음 */
        }
    },
    removeItem: async name => {
        try {
            await AsyncStorage.removeItem(name);
        } catch {
            /* swallow */
        }
    },
};
