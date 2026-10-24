// [PERSONAL] Mascot outfit and accessory definitions, unlock criteria, and catalog
export type OutfitCategory = 'hat' | 'glasses' | 'scarf';

export interface OutfitItemDef {
  id: string;
  category: OutfitCategory;
  name: string;
  description: string;
  icon: string; // Emoji or short symbol
  requiredLevel?: number;
  requiredBadge?: string;
  unlockedByDefault?: boolean;
}

export const OUTFIT_CATALOG: OutfitItemDef[] = [
  // HATS
  {
    id: 'cap-scholar',
    category: 'hat',
    name: 'Scholar Mortarboard',
    description: "Pip's iconic graduation cap with golden tassel",
    icon: '🎓',
    unlockedByDefault: true,
  },
  {
    id: 'beanie-sage',
    category: 'hat',
    name: 'Cozy Sage Beanie',
    description: 'Warm knitted winter beanie with a fluffy pom-pom',
    icon: '🧶',
    requiredLevel: 2,
  },
  {
    id: 'wizard-hat',
    category: 'hat',
    name: 'Sorcerer Star Hat',
    description: 'A magical star-studded pointed hat for deep study wisdom',
    icon: '🧙‍♂️',
    requiredLevel: 5,
    requiredBadge: 'scholar-100',
  },

  // GLASSES
  {
    id: 'none',
    category: 'glasses',
    name: 'No Glasses',
    description: 'Pip with bare bright eyes',
    icon: '✨',
    unlockedByDefault: true,
  },
  {
    id: 'glasses-round',
    category: 'glasses',
    name: 'Scholar Spectacles',
    description: 'Circular brass wire-frame reading glasses',
    icon: '👓',
    unlockedByDefault: true,
  },
  {
    id: 'glasses-sunglasses',
    category: 'glasses',
    name: 'Chill Shades',
    description: 'Ultra-cool dark tortoiseshell sunglasses',
    icon: '🕶️',
    requiredLevel: 3,
  },

  // SCARFS
  {
    id: 'none',
    category: 'scarf',
    name: 'No Scarf',
    description: 'Pip without neckwear',
    icon: '🍃',
    unlockedByDefault: true,
  },
  {
    id: 'scarf-terracotta',
    category: 'scarf',
    name: 'Terracotta Knit Scarf',
    description: 'Earthy woolen warm wrap with fringed edge',
    icon: '🧣',
    requiredLevel: 3,
  },
  {
    id: 'scarf-emerald',
    category: 'scarf',
    name: 'Emerald Forest Scarf',
    description: 'Deep soothing green wrap with stitched gold detail',
    icon: '🌲',
    requiredLevel: 6,
    requiredBadge: 'streak-7',
  },
];

export function isOutfitUnlocked(
  itemId: string,
  userLevel: number = 1,
  unlockedBadges: Record<string, { unlockedAt: string }> = {}
): boolean {
  if (itemId === 'none') return true;
  const item = OUTFIT_CATALOG.find((i) => i.id === itemId);
  if (!item) return false;
  if (item.unlockedByDefault) return true;

  // Level check
  if (item.requiredLevel && userLevel >= item.requiredLevel) {
    return true;
  }

  // Badge check
  if (item.requiredBadge && unlockedBadges[item.requiredBadge]) {
    return true;
  }

  return false;
}
