import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';

import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/constants/theme';

const navTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: colors.bgTop,
        card: colors.bgTop,
        primary: '#FFFFFF',
        text: colors.textPrimary,
        border: 'transparent',
        notification: '#7C5CFF',
    },
};

export default function App() {
    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaProvider>
                <BottomSheetModalProvider>
                    <NavigationContainer theme={navTheme}>
                        <StatusBar style="light" />
                        <RootNavigator />
                    </NavigationContainer>
                </BottomSheetModalProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
});
