import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export const STORAGE_PREFIX = 'notify:v1:';
export const rnStorage = createJSONStorage(() => AsyncStorage);
