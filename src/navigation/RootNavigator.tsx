import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SectionDetailScreen from '../screens/SectionDetailScreen';
import TrashScreen from '../screens/TrashScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#000' },
                animation: 'slide_from_right',
                animationDuration: 280,
            }}
        >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
                name="SectionDetail"
                component={SectionDetailScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="Trash"
                component={TrashScreen}
                options={{ animation: 'slide_from_bottom' }}
            />
        </Stack.Navigator>
    );
}
