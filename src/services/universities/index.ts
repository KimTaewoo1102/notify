import type { UniversityAdapter } from './types';
import { uosAdapter } from './uos';

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
