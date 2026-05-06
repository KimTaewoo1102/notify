import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const mmkv = new MMKV({ id: 'notify-app' });

export const mmkvStorage: StateStorage = {
    getItem: name => {
        const v = mmkv.getString(name);
        return v ?? null;
    },
    setItem: (name, value) => mmkv.set(name, value),
    removeItem: name => mmkv.delete(name),
};
