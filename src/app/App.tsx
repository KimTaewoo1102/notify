import React from 'react';
import { StatusBar } from 'expo-status-bar';

import AppProviders from './providers/AppProviders';
import RootNavigator from '../navigation/RootNavigator';
import { SheetHost } from './sheets/SheetHost';

export default function App() {
    return (
        <AppProviders>
            <StatusBar style="light" />
            <RootNavigator />
            <SheetHost />
        </AppProviders>
    );
}
