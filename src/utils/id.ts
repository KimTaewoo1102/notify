/**
 * 시간 prefix + 난수 — 앱 단일 사용자 스코프에서 충돌 무시 수준.
 * crypto.randomUUID 폴리필 없이 RN에서 즉시 동작.
 */
export function generateId(): string {
    const t = Date.now().toString(36);
    const r = Math.floor(Math.random() * 1e9).toString(36).padStart(6, '0');
    return `${t}-${r}`;
}
