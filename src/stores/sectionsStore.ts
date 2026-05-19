import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { ID, Keyword, Section } from '../types/domain';
import { SYSTEM_PIN_SECTION_ID } from '../types/domain';
import { generateId } from '../utils/id';
import { STORAGE_PREFIX, rnStorage } from './persist/asyncStorage';
// TODO: 백엔드 연동 시 mock 시드 제거 ↓ 이 import 한 줄도 함께 삭제.
import { buildMockSections } from '../data/mockSections';

const ACCENTS = ['#FFFFFF', '#5BC0FF', '#FF7C9C', '#3DDC97', '#FFC857', '#FF9E5C'];

/** '고정' 시스템 섹션 시드 (앱 첫 실행 시 자동 추가, 사용자가 삭제 불가). */
function makePinSystemSection(): Section {
    const now = Date.now();
    return {
        id: SYSTEM_PIN_SECTION_ID,
        kind: 'system',
        title: '스크랩',
        source: '',
        universityId: 'uos',
        accentColor: '#FFC857', // 따뜻한 옐로우 — 시각적으로 user 섹션과 분리
        order: -1,
        pinned: true,
        notifyOn: false,
        keywords: [],
        createdAt: now,
        updatedAt: now,
        lastVisitedAt: null,
    };
}

interface SectionsState {
    sections: Record<ID, Section>;
    orderedIds: ID[];
    hasHydrated: boolean;
    /** TODO: 백엔드 연동 시 제거 — mock 시드를 한 번만 주입하기 위한 플래그. */
    hasSeededMock: boolean;
    /** 섹션별 공지 총 개수 캐시 (SectionDetail 진입 시 업데이트, 영구 저장). */
    noticeCountCache: Record<ID, number>;
}

interface SectionsActions {
    addSection: (input: {
        title: string;
        source?: string;
        universityId?: string;
        emoji?: string;
    }) => Section;
    removeSection: (id: ID) => void;
    restoreSection: (section: Section) => void;
    renameSection: (id: ID, title: string) => void;
    reorderSections: (newOrderedIds: ID[]) => void;
    togglePin: (id: ID) => void;
    toggleNotify: (id: ID) => void;
    addKeyword: (sectionId: ID, text: string) => void;
    removeKeyword: (sectionId: ID, keywordId: ID) => void;
    /** 섹션 상세 화면을 떠날 때 호출 — lastVisitedAt 을 현재 시각으로 갱신. */
    markVisited: (sectionId: ID) => void;
    /** SectionDetail 에서 공지 fetch 완료 후 총 개수를 캐시에 저장. */
    updateNoticeCount: (sectionId: ID, count: number) => void;
    /** 시스템 섹션이 누락된 경우(첫 실행 또는 마이그레이션 후) 자동 복구. */
    ensureSystemSections: () => void;
    /** TODO: 백엔드 연동 시 제거 — UI 검증용 mock 섹션을 한 번만 주입. */
    seedMockOnce: () => void;
    setHasHydrated: (v: boolean) => void;
}

export type SectionsStore = SectionsState & SectionsActions;

export const useSectionsStore = create<SectionsStore>()(
    persist(
        (set, get) => ({
            sections: {},
            orderedIds: [],
            hasHydrated: false,
            hasSeededMock: false,
            noticeCountCache: {},

            addSection: ({ title, source = '', universityId = 'uos', emoji }) => {
                const id = generateId();
                const now = Date.now();
                const idx = get().orderedIds.length;
                const accent = ACCENTS[idx % ACCENTS.length];
                const section: Section = {
                    id,
                    kind: 'user',
                    title,
                    source,
                    universityId,
                    emoji,
                    accentColor: accent,
                    order: idx,
                    pinned: false,
                    notifyOn: true,
                    keywords: [],
                    createdAt: now,
                    updatedAt: now,
                    lastVisitedAt: null,
                };
                set(s => ({
                    sections: { ...s.sections, [id]: section },
                    orderedIds: [...s.orderedIds, id],
                }));
                return section;
            },

            removeSection: (id) =>
                set(s => {
                    const sec = s.sections[id];
                    if (!sec) return s;
                    // 시스템 섹션은 절대 삭제 금지.
                    if (sec.kind === 'system') return s;
                    const next = { ...s.sections };
                    delete next[id];
                    return {
                        sections: next,
                        orderedIds: s.orderedIds.filter(x => x !== id),
                    };
                }),

            restoreSection: (section) =>
                set(s => {
                    if (s.sections[section.id]) return s;
                    return {
                        sections: { ...s.sections, [section.id]: section },
                        orderedIds: [...s.orderedIds, section.id],
                    };
                }),

            renameSection: (id, title) =>
                set(s => {
                    const sec = s.sections[id];
                    if (!sec) return s;
                    if (sec.kind === 'system') return s; // 시스템 섹션 이름 변경 금지
                    return {
                        sections: {
                            ...s.sections,
                            [id]: { ...sec, title, updatedAt: Date.now() },
                        },
                    };
                }),

            /**
             * 사용자가 user 섹션 순서를 변경. 시스템 섹션은 ListHeaderComponent 로
             * 분리돼 있으므로 이 배열에는 포함되지 않는다. 안전망으로 system id 가
             * 들어와도 무시한다.
             */
            reorderSections: (newOrderedIds) =>
                set(s => {
                    const userOnly = newOrderedIds.filter(id => {
                        const sec = s.sections[id];
                        return sec && sec.kind !== 'system';
                    });
                    const systemIds = s.orderedIds.filter(id => {
                        const sec = s.sections[id];
                        return sec?.kind === 'system';
                    });
                    return { orderedIds: [...systemIds, ...userOnly] };
                }),

            togglePin: (id) =>
                set(s => {
                    const sec = s.sections[id];
                    if (!sec) return s;
                    if (sec.kind === 'system') return s; // 시스템 섹션 pin 토글 금지
                    return {
                        sections: {
                            ...s.sections,
                            [id]: { ...sec, pinned: !sec.pinned, updatedAt: Date.now() },
                        },
                    };
                }),

            toggleNotify: (id) =>
                set(s => {
                    const sec = s.sections[id];
                    if (!sec) return s;
                    return {
                        sections: {
                            ...s.sections,
                            [id]: { ...sec, notifyOn: !sec.notifyOn, updatedAt: Date.now() },
                        },
                    };
                }),

            addKeyword: (sectionId, text) =>
                set(s => {
                    const sec = s.sections[sectionId];
                    if (!sec) return s;
                    const trimmed = text.trim();
                    if (!trimmed) return s;
                    if (sec.keywords.some(k => k.text === trimmed)) return s;
                    const k: Keyword = {
                        id: generateId(),
                        text: trimmed,
                        createdAt: Date.now(),
                    };
                    return {
                        sections: {
                            ...s.sections,
                            [sectionId]: {
                                ...sec,
                                keywords: [...sec.keywords, k],
                                updatedAt: Date.now(),
                            },
                        },
                    };
                }),

            removeKeyword: (sectionId, keywordId) =>
                set(s => {
                    const sec = s.sections[sectionId];
                    if (!sec) return s;
                    return {
                        sections: {
                            ...s.sections,
                            [sectionId]: {
                                ...sec,
                                keywords: sec.keywords.filter(k => k.id !== keywordId),
                                updatedAt: Date.now(),
                            },
                        },
                    };
                }),

            markVisited: (sectionId) =>
                set(s => {
                    const sec = s.sections[sectionId];
                    if (!sec) return s;
                    return {
                        sections: {
                            ...s.sections,
                            [sectionId]: {
                                ...sec,
                                lastVisitedAt: Date.now(),
                            },
                        },
                    };
                }),

            updateNoticeCount: (sectionId, count) =>
                set(s => ({
                    noticeCountCache: { ...s.noticeCountCache, [sectionId]: count },
                })),

            ensureSystemSections: () =>
                set(s => {
                    if (s.sections[SYSTEM_PIN_SECTION_ID]) return s;
                    const pin = makePinSystemSection();
                    return {
                        sections: { ...s.sections, [pin.id]: pin },
                        // 시스템 섹션은 항상 맨 앞.
                        orderedIds: [pin.id, ...s.orderedIds.filter(x => x !== pin.id)],
                    };
                }),

            // TODO: 백엔드 연동 시 제거 ↓
            seedMockOnce: () =>
                set(s => {
                    if (s.hasSeededMock) return s;
                    // 이미 사용자가 만든 섹션이 있으면 시드하지 않는다 (사용자 데이터 보호).
                    const hasUser = Object.values(s.sections).some(
                        x => x.kind === 'user',
                    );
                    if (hasUser) return { ...s, hasSeededMock: true };

                    const mocks = buildMockSections();
                    const nextSections = { ...s.sections };
                    const newIds: string[] = [];
                    for (const m of mocks) {
                        nextSections[m.id] = m;
                        newIds.push(m.id);
                    }
                    return {
                        sections: nextSections,
                        orderedIds: [...s.orderedIds, ...newIds],
                        hasSeededMock: true,
                    };
                }),
            // ↑ TODO: 백엔드 연동 시 제거

            setHasHydrated: (v) => set({ hasHydrated: v }),
        }),
        {
            name: STORAGE_PREFIX + 'sections',
            storage: rnStorage,
            version: 3,
            partialize: (s) => ({
                sections: s.sections,
                orderedIds: s.orderedIds,
                hasSeededMock: s.hasSeededMock, // TODO: 백엔드 연동 시 제거
                noticeCountCache: s.noticeCountCache,
            }),
            migrate: (persisted: any, fromVersion) => {
                if (!persisted) return persisted;
                // v1 → v2: 모든 section 에 kind: 'user' 채우기.
                if (fromVersion < 2 && persisted.sections) {
                    const next: Record<string, Section> = {};
                    for (const [id, raw] of Object.entries(
                        persisted.sections as Record<string, Section>,
                    )) {
                        next[id] = { ...raw, kind: raw.kind ?? 'user' };
                    }
                    persisted = { ...persisted, sections: next };
                }
                // v2 → v3: 모든 section 에 lastVisitedAt: null 채우기.
                if (fromVersion < 3 && persisted.sections) {
                    const next: Record<string, Section> = {};
                    for (const [id, raw] of Object.entries(
                        persisted.sections as Record<string, Section>,
                    )) {
                        next[id] = {
                            ...raw,
                            lastVisitedAt:
                                (raw as any).lastVisitedAt ?? null,
                        };
                    }
                    persisted = {
                        ...persisted,
                        sections: next,
                        noticeCountCache: persisted.noticeCountCache ?? {},
                    };
                }
                return persisted;
            },
            onRehydrateStorage: () => (state) => {
                // hydrate 직후 시스템 섹션 누락 시 시드.
                state?.ensureSystemSections();
                state?.seedMockOnce(); // TODO: 백엔드 연동 시 제거
                state?.setHasHydrated(true);
            },
        },
    ),
);

// 첫 마운트가 hydrate 보다 빠른 경우(스토리지 비어있을 때)도 보장.
useSectionsStore.getState().ensureSystemSections();
// TODO: 백엔드 연동 시 제거 — mock 시드(첫 실행에서만 1회 주입).
useSectionsStore.getState().seedMockOnce();

/* ────────────────────────── selectors ─────────────────────────── */

/** 시스템 '고정' 섹션 (없으면 undefined — 시드 직전 한 프레임 동안만 가능). */
export function usePinSystemSection(): Section | undefined {
    return useSectionsStore(s => s.sections[SYSTEM_PIN_SECTION_ID]);
}

/**
 * 사용자 섹션 정렬: pinned user 먼저, 그 다음 일반 user.
 * 시스템 섹션은 별도 selector(usePinSystemSection)로 노출되며 이 배열에 포함되지 않는다.
 */
export function useOrderedUserSections(): Section[] {
    return useSectionsStore(
        useShallow((s) => {
            const list = s.orderedIds
                .map(id => s.sections[id])
                .filter((x): x is Section => Boolean(x) && x.kind === 'user');
            return [
                ...list.filter(x => x.pinned),
                ...list.filter(x => !x.pinned),
            ];
        }),
    );
}

/** 헤더 배너 등에서 "현재 보이는 섹션 전체" 가 필요할 때 사용 (system 포함). */
export function useAllOrderedSections(): Section[] {
    return useSectionsStore(
        useShallow((s) => {
            const list = s.orderedIds
                .map(id => s.sections[id])
                .filter((x): x is Section => Boolean(x));
            const system = list.filter(x => x.kind === 'system');
            const userPinned = list.filter(x => x.kind === 'user' && x.pinned);
            const userRest = list.filter(x => x.kind === 'user' && !x.pinned);
            return [...system, ...userPinned, ...userRest];
        }),
    );
}
