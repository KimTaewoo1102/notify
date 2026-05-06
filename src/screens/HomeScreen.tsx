import React, { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import ScreenBackground from '../components/layout/ScreenBackground';
import AppHeader from '../components/layout/AppHeader';
import MenuModal from '../components/layout/MenuModal';
import NoticeSection from '../components/notice/NoticeSection';
import { ScrollRefProvider } from '../contexts/ScrollRefContext';

import { useNotices } from '../hooks/useNotices';
import { getUniversityAdapter } from '../services/universities';
import { mockUserKeywords } from '../data/mockNotices';
import { colors, spacing } from '../constants/theme';

export default function HomeScreen() {
    const [universityId] = useState('uos');
    const keywords = useMemo(() => mockUserKeywords, []);
    const adapter = useMemo(() => getUniversityAdapter(universityId), [universityId]);

    const { today, keyword, hot, loading, refresh, dismiss } = useNotices({
        universityId,
        keywords,
    });

    const [menuOpen, setMenuOpen] = useState(false);
    const restToday = today;

    // SwipeableNoticeRow가 스와이프 시 ScrollView 스크롤을 잠근다
    const scrollRef = useRef<ScrollView>(null);

    return (
        <ScrollRefProvider value={scrollRef}>
            <View style={styles.root}>
                <ScreenBackground />

                <SafeAreaView style={styles.safe}>
                    <AppHeader
                        universityName={adapter.name}
                        onMenuPress={() => setMenuOpen(true)}
                    />

                    <ScrollView
                        ref={scrollRef}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        // directionalLockEnabled: iOS에서 첫 제스처 방향으로만 스크롤 고정
                        directionalLockEnabled
                        refreshControl={
                            <RefreshControl
                                refreshing={loading}
                                onRefresh={refresh}
                                tintColor={colors.textSecondary}
                                colors={[colors.textSecondary]}
                            />
                        }
                    >
                        {loading && today.length === 0 ? (
                            <View style={styles.loader}>
                                <ActivityIndicator color={colors.textSecondary} />
                            </View>
                        ) : (
                            <>
                                <NoticeSection
                                    title="내 키워드 공지"
                                    subtitle={
                                        keywords.length > 0
                                            ? `"${keywords.join('", "')}" 와(과) 매칭됐어요`
                                            : '키워드를 등록하면 맞춤 공지가 나타나요'
                                    }
                                    icon="key-outline"
                                    notices={keyword}
                                    onDelete={dismiss}
                                    emptyText="키워드와 일치하는 공지가 없어요."
                                />

                                <NoticeSection
                                    title="HOT 공지"
                                    subtitle="조회수가 빠르게 오르고 있어요"
                                    icon="flame-outline"
                                    notices={hot}
                                    showViews
                                    onDelete={dismiss}
                                />

                                <NoticeSection
                                    title="최신 공지"
                                    subtitle="오늘 들어온 모든 공지"
                                    icon="time-outline"
                                    notices={restToday}
                                    onDelete={dismiss}
                                />
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>

                <MenuModal
                    visible={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    items={[
                        { icon: 'log-in-outline', label: '로그인', onPress: () => {} },
                        { icon: 'school-outline', label: '학교 설정', onPress: () => {} },
                        { icon: 'notifications-outline', label: '알림 설정', onPress: () => {} },
                        { icon: 'key-outline', label: '내 키워드 설정', onPress: () => {} },
                    ]}
                />
            </View>
        </ScrollRefProvider>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgTop },
    safe: { flex: 1 },
    scrollContent: {
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl * 2,
    },
    loader: { paddingVertical: spacing.xxl * 2, alignItems: 'center' },
});
