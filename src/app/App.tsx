import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import AppProviders from './providers/AppProviders';
import RootNavigator from '../navigation/RootNavigator';
import { SheetHost } from './sheets/SheetHost';

/** 앱 전체 배경 — 청량한 쿨톤 앰비언트 그라디언트 */
const BG_GRADIENT = ['#09101A', '#0B0D14', '#09090C'] as const;

export default function App() {
    return (
        <LinearGradient
            colors={BG_GRADIENT}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ flex: 1 }}
        >
            <AppProviders>
                <StatusBar style="light" />
                <RootNavigator />
                <SheetHost />
            </AppProviders>
        </LinearGradient>
    );
}
