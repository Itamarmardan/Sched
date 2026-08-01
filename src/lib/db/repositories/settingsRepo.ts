import { db } from '@/lib/db/dexie';
import { DEFAULT_NAV_SLOTS, NAV_CATEGORY_KEYS, type NavCategoryKey } from '@/lib/navCategories';

const NAV_SLOTS_KEY = 'navSlots';

export async function getNavSlots(): Promise<[NavCategoryKey, NavCategoryKey]> {
  const row = await db.settings.get(NAV_SLOTS_KEY);
  if (!row) return DEFAULT_NAV_SLOTS;
  try {
    const parsed = JSON.parse(row.value);
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      parsed.every((key) => NAV_CATEGORY_KEYS.includes(key))
    ) {
      return parsed as [NavCategoryKey, NavCategoryKey];
    }
  } catch {
    // Falls through to the default below.
  }
  return DEFAULT_NAV_SLOTS;
}

export async function setNavSlots(slots: [NavCategoryKey, NavCategoryKey]): Promise<void> {
  await db.settings.put({ key: NAV_SLOTS_KEY, value: JSON.stringify(slots) });
}
