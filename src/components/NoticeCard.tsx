import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

interface NoticeCardProps {
    title: string;
    department: string;
    date: string;
    tag: string;
}

export default function NoticeCard({ title, department, date, tag }: NoticeCardProps) {
    return (
        <View style={styles.cardContainer}>
            {/* 이 BlurView가 진짜 유리처럼 뒤를 비치게 만들어주는 핵심이야 */}
            <BlurView intensity={40} tint="light" style={styles.blurView}>
                <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>{tag}</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>{department}</Text>
                    <Text style={styles.footerText}>{date}</Text>
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        // 1px의 반투명 흰색 테두리로 유리의 단면을 표현해
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
    },
    blurView: {
        padding: 20,
    },
    tagContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 12,
    },
    tagText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
    title: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, lineHeight: 26 },
    footer: { flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 13 },
});