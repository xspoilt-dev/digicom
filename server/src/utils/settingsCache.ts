import Setting from "../models/Setting";

interface CacheEntry {
  value: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

export async function getSetting<T = any>(key: string, ttlMs: number = DEFAULT_TTL_MS): Promise<T | null> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  try {
    const doc = await Setting.findOne({ key }).lean() as { key: string; value: any } | null;
    const value = doc ? doc.value : null;

    cache.set(key, {
      value,
      expiresAt: now + ttlMs,
    });

    return value as T;
  } catch (err) {
    console.error(`[SettingsCache] Error fetching key "${key}":`, err);
    // Return stale value if available on error
    if (cached) return cached.value as T;
    return null;
  }
}

export function invalidateSettingCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
