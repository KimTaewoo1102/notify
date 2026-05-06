import React from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NoticeCard from '../components/NoticeCard';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            {/* 밋밋한 흰 배경 대신 고급스러운 그라데이션 배경을 깔아줘 */}
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.headerTitle}>시립대 공지사항</Text>

                    <NoticeCard
                        title="2026학년도 1학기 장학금 신청 안내"
                        department="학생처"
                        date="오늘"
                        tag="장학금"
                    />
                    <NoticeCard
                        title="컴퓨터과학부 졸업작품 전시회 일정 및 장소 안내"
                        department="컴퓨터과학부"
                        date="어제"
                        tag="학사"
                    />
                    <NoticeCard
                        title="SMASH 배드민턴 동아리 신입 부원 모집"
                        department="총동아리연합회"
                        date="3일 전"
                        tag="동아리"
                    />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 60 },
    headerTitle: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24
    },
});