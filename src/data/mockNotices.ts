import type { Notice } from '../types/notice';

/**
 * 실제 API 응답을 그대로 흉내낸 mock.
 * 필드는 Notice 타입과 1:1 — 백엔드 연동 시 이 파일 자체가 사라진다.
 */
export const mockNotices: Notice[] = [
    {
        id: 'uos-2026-0512',
        universityId: 'uos',
        category: 'academic',
        title: '2026학년도 1학기 수강신청 일정 안내',
        department: '학사지원과',
        publishedAt: '2026-05-06T09:10:00+09:00',
        sourceUrl: 'https://www.uos.ac.kr/notice/2026-0512',
        viewCount: 18420,
        isPinned: true,
    },
    {
        id: 'uos-2026-0508',
        universityId: 'uos',
        category: 'scholarship',
        title: '2026-1학기 국가장학금 2차 신청 마감 D-3',
        department: '장학복지팀',
        publishedAt: '2026-05-06T08:00:00+09:00',
        sourceUrl: 'https://www.uos.ac.kr/notice/2026-0508',
        viewCount: 9234,
    },
    {
        id: 'uos-2026-0507',
        universityId: 'uos',
        category: 'recruit',
        title: '[현대자동차] 2026 SW 신입 공채 — 시립대 캠퍼스 리쿠르팅',
        department: '취업진로처',
        publishedAt: '2026-05-05T17:42:00+09:00',
        sourceUrl: 'https://www.uos.ac.kr/notice/2026-0507',
        viewCount: 7610,
    },
    {
        id: 'uos-2026-0506',
        universityId: 'uos',
        category: 'event',
        title: '2026 봄 축제 "전농제" 라인업 공개 및 사전 신청',
        department: '학생처',
        publishedAt: '2026-05-05T15:00:00+09:00',
        sourceUrl: 'https://www.uos.ac.kr/notice/2026-0506',
        viewCount: 12880,
    },
    {
        id: 'uos-2026-0505',
        universityId: 'uos',
        category: 'library',
        title: '중앙도서관 시험기간 24시간 운영 안내 (5/20 ~ 6/20)',
        department: '중앙도서관',
        publishedAt: '2026-05-05T11:20:00+09:00',
        sourceUrl: 'https://www.uos.ac.kr/notice/2026-0505',
        viewCount: 4120,
    },
    {
        id: 'uos-2026-0504',
        universityId: 'uos',
        category: 'dorm',
        title: '2026-2학기 생활관 입사 신청 안내',
        department: '생활관',
        publishedAt: '2026-05-04T18:05:00+09:00',
        sourceUrl: 'https://www.uos.ac.kr/notice/2026-0504',
        viewCount: 3380,
    },
    {
        id: 'uos-2026-0503',
        universityId: 'uos',
        category: 'recruit',
        title: '[네이버] AI 리서치 인턴 모집 (~5/15)',
        department: '취업진로처',
        publishedAt: '2026-05-04T10:11:00+09:00',
        sourceUrl: 'https://www.uos.ac.kr/notice/2026-0503',
        viewCount: 5560,
    },
    {
        id: 'uos-2026-0502',
        universityId: 'uos',
        category: 'general',
        title: '교내 무선 네트워크 점검에 따른 일시 중단 안내 (5/10 02:00~05:00)',
        department: '정보화기획팀',
        publishedAt: '2026-05-03T20:30:00+09:00',
        sourceUrl: 'https://www.uos.ac.kr/notice/2026-0502',
        viewCount: 980,
    },
];

/** 데모용 회원 키워드. 실제로는 user.keywords에서 온다. */
export const mockUserKeywords: string[] = ['장학금', '인턴', 'AI'];
