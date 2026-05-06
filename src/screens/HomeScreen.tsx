import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenBackground from '../components/layout/ScreenBackground';
import AppHeader from '../components/layout/AppHeader';
import MenuModal from '../components/layout/MenuModal';
import SectionCard from '../components/notice/SectionCard';
import SectionDetailScreen from './SectionDetailScreen';

import { useNotices } from '../hooks/useNotices';
import { getUniversityAdapter } from '../services/universities';
import { mockUserKeywords } from '../data/mockNotices';
import { colors, spacing } from '../constants/theme';
import type { Notice, NoticeFeed } from '../types/notice';

interface FeedConfig {
    id: NoticeFeed;
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    showViews?: boolean;
    emptyText?: string;
    buildSubtitle: (count: number, keywords: string[]) => string;
}

/**
 * 피드 정의 — 새 섹션 추가 시 이 배열에만 항목을 추가하면
 * 홈/디테일 양쪽이 함께 갱신된다.
 */
const FEED_CONFIGS: FeedConfig[] = [
    {
        id: 'keyword',
        title: '내 키워드 공지',
        icon: 'key-outline',
        buildSubtitle: (count, keywords) =>
            keywords.length === 0
                ? '키워드를 등록하면 맞춤 공지가 나타나요'
                : `"${keywords.join('", "')}" · ${count}건`,
        emptyText: '키워드와 일치하는 공지가 없어요.',
    },
    {
        id: 'hot',
        title: 'HOT 공지',
        icon: 'flame-outline',
        showViews: true,
        buildSubtitle: count => `조회수 급상승 · ${count}건`,
    },
    {
        id: 'today',
        title: '최신 공지',
        icon: 'time-outline',
        buildSubtitle: count => `오늘 들어온 공지 · ${count}건`,
    },
];

export default function HomeScreen() {
    const [universityId] = useState('uos');
    const keywords = useMemo(() => mockUserKeywords, []);
    const adapter = useMemo(() => getUniversityAdapter(universityId), [universityId]);

    const { today, keyword, hot, loading, dismiss } = useNotices({
        universityId,
        keywords,
    });

    const [menuOpen, setMenuOpen] = useState(false);
    const [activeFeed, setActiveFeed] = useState<NoticeFeed | null>(null);

    const noticesByFeed: Record<NoticeFeed, Notice[]> = {
        keyword,
        hot,
        today,
    };

    const activeConfig = activeFeed
        ? FEED_CONFIGS.find(c => c.id === activeFeed)!
        : null;

    return (
        <View style={styles.root}>
            <ScreenBackground />

            <SafeAreaView style={styles.safe}>
                <AppHeader
                    universityName={adapter.name}
                    onMenuPress={() => setMenuOpen(true)}
                />

                {loading && today.length === 0 ? (
                    <View style={styles.loader}>
                        <ActivityIndicator color={colors.textSecondary} />
                    </View>
                ) : (
                    <View style={styles.sectionStack}>
                        {FEED_CONFIGS.map(config => {
                            const list = noticesByFeed[config.id];
                            return (
                                <SectionCard
                                    key={config.id}
                                    title={config.title}
                                    subtitle={config.buildSubtitle(list.length, keywords)}
                                    icon={config.icon}
                                    notices={list}
                                    showViews={config.showViews}
                                    emptyText={config.emptyText}
                                    onPress={() => setActiveFeed(config.id)}
                                />
                            );
                        })}
                    </View>
                )}
            </SafeAreaView>

            {/* 디테일 오버레이 — 우측에서 슬라이드 인 */}
            {activeConfig && (
                <SectionDetailScreen
                    title={activeConfig.title}
                    subtitle={activeConfig.buildSubtitle(
                        noticesByFeed[activeConfig.id].length,
                        keywords,
                    )}
                    icon={activeConfig.icon}
                    notices={noticesByFeed[activeConfig.id]}
                    showViews={activeConfig.showViews}
                    onDismiss={dismiss}
                    onClose={() => setActiveFeed(null)}
                />
            )}

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
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgTop },
    safe: { flex: 1 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    sectionStack: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.lg,
        gap: spacing.lg,
    },
});
