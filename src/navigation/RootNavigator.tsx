import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import SectionDetailScreen from '../screens/SectionDetailScreen';
import HotNoticesScreen from '../screens/HotNoticesScreen';
import TrashScreen from '../screens/TrashScreen';
import { HeaderBanner } from '../features/home/HeaderBanner';

import { colors } from '../ui/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.bgTop },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: { fontWeight: '600' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.bgBase },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    headerTitle: () => <HeaderBanner />,
                    headerTitleAlign: 'center',
                }}
            />
            <Stack.Screen
                name="SectionDetail"
                component={SectionDetailScreen}
                options={{ title: '' }}
            />
            <Stack.Screen
                name="HotNotices"
                component={HotNoticesScreen}
                options={{ title: 'HOT 공지' }}
            />
            <Stack.Screen
                name="Trash"
                component={TrashScreen}
                options={{ title: '휴지통' }}
            />
        </Stack.Navigator>
    );
}
