import type { UniversityAdapter } from './types';
import { uosAdapter } from './uos';

/** 신규 학교 추가 시 이 맵에만 등록하면 된다. */
const REGISTRY: Record<string, UniversityAdapter> = {
    [uosAdapter.id]: uosAdapter,
};

export function getUniversityAdapter(id: string): UniversityAdapter {
    const adapter = REGISTRY[id];
    if (!adapter) throw new Error(`Unsupported university: ${id}`);
    return adapter;
}

export function listUniversities(): UniversityAdapter[] {
    return Object.values(REGISTRY);
}

export type { UniversityAdapter } from './types';
