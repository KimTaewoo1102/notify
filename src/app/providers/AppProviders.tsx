import React, { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';

import { colors } from '../../ui/theme';

const navTheme: Theme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: colors.bgBase,
        card: colors.bgTop,
        primary: colors.accent,
        text: colors.textPrimary,
        border: 'transparent',
        notification: colors.accent,
    },
};

export default function AppProviders({ children }: PropsWithChildren) {
    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaProvider>
                <BottomSheetModalProvider>
                    <NavigationContainer theme={navTheme}>{children}</NavigationContainer>
                </BottomSheetModalProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgTop },
});
