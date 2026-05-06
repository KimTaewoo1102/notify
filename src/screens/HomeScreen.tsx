import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; // 1. 햅틱 엔진 불러오기

export default function HomeScreen() {
    const [menuVisible, setMenuVisible] = useState(false);

    // 메뉴를 열 때 작동하는 햅틱 트리거
    const handleMenuOpen = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMenuVisible(true);
    };

    // 모달 바깥을 눌러서 닫을 때도 정갈한 피드백 부여
    const handleMenuClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMenuVisible(false);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#222222', '#000000', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                locations={[0, 0.35, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* 상단 메뉴 버튼에 햅틱 함수 연결 */}
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleMenuOpen}
                    activeOpacity={0.8}
                >
                    <BlurView intensity={25} tint="light" style={styles.iconBlur}>
                        <Ionicons name="apps-outline" size={24} color="#ffffff" />
                    </BlurView>
                </TouchableOpacity>

                <View style={styles.centerContent}>
                    <Text style={styles.mainTitle}>SIMPLE IS BEST</Text>
                </View>
            </SafeAreaView>

            <Modal visible={menuVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    {/* 어두운 배경 클릭 시 모달 닫기 + 햅틱 */}
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={handleMenuClose}>
                        <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFillObject} />
                    </Pressable>

                    <View style={styles.centerMenuContainer}>
                        <MenuItem icon="log-in-outline" text="로그인" onPress={() => { }} />
                        <MenuItem icon="school-outline" text="학교 설정" onPress={() => { }} />
                        <MenuItem icon="notifications-outline" text="알림 설정" onPress={() => { }} />
                        <MenuItem icon="key-outline" text="내 키워드 설정" onPress={() => { }} isLast={true} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// 메뉴 아이템 내부에도 햅틱 적용
const MenuItem = ({ icon, text, onPress, isLast = false }: { icon: any, text: string, onPress: () => void, isLast?: boolean }) => {
    // 각 메뉴 버튼을 누를 때마다 햅틱이 울리도록 래핑
    const handleItemPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <TouchableOpacity
            style={[styles.menuItem, isLast && styles.menuItemLast]}
            onPress={handleItemPress}
            activeOpacity={0.7}
        >
            <Ionicons name={icon} size={22} color="rgba(255,255,255,0.9)" style={styles.menuIcon} />
            <Text style={styles.menuText}>{text}</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    safeArea: { flex: 1 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mainTitle: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 22,
        letterSpacing: 12,
        fontWeight: '300',
        textShadowColor: 'rgba(255, 255, 255, 0.2)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 15,
    },
    headerButton: {
        position: 'absolute',
        top: 60,
        right: 24,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        zIndex: 10,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    iconBlur: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    centerMenuContainer: {
        width: '100%',
        backgroundColor: 'rgba(10, 10, 10, 0.6)',
        padding: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 30 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)'
    },
    menuItemLast: { borderBottomWidth: 0 },
    menuIcon: { marginRight: 16 },
    menuText: { flex: 1, color: 'rgba(255,255,255,0.95)', fontSize: 16, fontWeight: '400' }
});