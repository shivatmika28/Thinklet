/**
 * Mascot Study Room Catalog & Rules (Pure Code)
 * Items unlock at Level / total-XP thresholds.
 * STRICT: Do NOT spend or deduct XP. Do not modify XP state.
 */

import { RoomItem, RoomSlot } from '../types';

export const ROOM_ITEMS_CATALOG: RoomItem[] = [
  // --- DESK SLOT ---
  {
    id: 'desk-pine',
    slot: 'desk',
    name: 'Pine Study Table',
    description: 'Clean, warm pine desk with smooth grain and wooden joinery.',
    requiredLevel: 1,
    requiredXp: 0,
    color: '#D4A373',
  },
  {
    id: 'desk-scholar',
    slot: 'desk',
    name: 'Scholar Mahogany Desk',
    description: 'Stately dark wood study desk with antique brass pulls.',
    requiredLevel: 2,
    requiredXp: 200,
    color: '#8B4513',
  },
  {
    id: 'desk-minimal',
    slot: 'desk',
    name: 'Zen Glass Workbench',
    description: 'Sleek frosted glass surface with matte slate framing.',
    requiredLevel: 4,
    requiredXp: 600,
    color: '#607D8B',
  },

  // --- PLANT SLOT ---
  {
    id: 'plant-succulent',
    slot: 'plant',
    name: 'Jade Succulent Pot',
    description: 'A cheerful, low-maintenance succulent in an earthenware bowl.',
    requiredLevel: 1,
    requiredXp: 0,
    color: '#7F9274',
  },
  {
    id: 'plant-monstera',
    slot: 'plant',
    name: 'Calming Monstera',
    description: 'Broad split leaves that purify air and bring lively energy.',
    requiredLevel: 2,
    requiredXp: 200,
    color: '#4E7043',
  },
  {
    id: 'plant-bonsai',
    slot: 'plant',
    name: 'Hundred-Year Bonsai',
    description: 'Artfully pruned miniature juniper on a dark granite saucer.',
    requiredLevel: 3,
    requiredXp: 400,
    color: '#386641',
  },

  // --- LAMP SLOT ---
  {
    id: 'lamp-lantern',
    slot: 'lamp',
    name: 'Amber Glow Lantern',
    description: 'Emits a soft, calming 2700K warm halo that eases eye strain.',
    requiredLevel: 1,
    requiredXp: 0,
    color: '#F4A261',
  },
  {
    id: 'lamp-brass',
    slot: 'lamp',
    name: 'Architect Brass Anglepoise',
    description: 'Balanced counterweighted task lamp focusing clear study light.',
    requiredLevel: 3,
    requiredXp: 400,
    color: '#E9C46A',
  },
  {
    id: 'lamp-neon',
    slot: 'lamp',
    name: 'Neon Thinklet Aurora Tube',
    description: 'Subtle gradient ambient glow that turns into dusk hues.',
    requiredLevel: 5,
    requiredXp: 800,
    color: '#A37C40',
  },

  // --- POSTER SLOT ---
  {
    id: 'poster-blueprint',
    slot: 'poster',
    name: 'Curious Blueprint Art',
    description: 'Hand-sketched mechanical diagram of a clockwork penguin.',
    requiredLevel: 1,
    requiredXp: 0,
    color: '#3A86FF',
  },
  {
    id: 'poster-cosmos',
    slot: 'poster',
    name: 'James Webb Deep Field',
    description: 'Sparkling nebula and distant galaxies against infinite space.',
    requiredLevel: 2,
    requiredXp: 200,
    color: '#4B3F72',
  },
  {
    id: 'poster-pixel',
    slot: 'poster',
    name: 'Retro 8-Bit Pip Mascot',
    description: 'Nostalgic pixel tapestry of Pip with tiny graduation cap.',
    requiredLevel: 3,
    requiredXp: 400,
    color: '#98473E',
  },

  // --- RUG SLOT ---
  {
    id: 'rug-sage',
    slot: 'rug',
    name: 'Sage Woven Hearth Mat',
    description: 'Comfortable natural linen weave in grounding olive tones.',
    requiredLevel: 1,
    requiredXp: 0,
    color: '#B5C99A',
  },
  {
    id: 'rug-terracotta',
    slot: 'rug',
    name: 'Terracotta Diamond Rug',
    description: 'Warm geometric pattern inspired by Mediterranean clay roofs.',
    requiredLevel: 2,
    requiredXp: 200,
    color: '#E76F51',
  },
  {
    id: 'rug-cloud',
    slot: 'rug',
    name: 'Nordic Cloud Fluff Rug',
    description: 'Plush circular wool rug that keeps Pip cozy while reading.',
    requiredLevel: 4,
    requiredXp: 600,
    color: '#D8E2DC',
  },
];

export function isItemUnlocked(item: RoomItem, studentLevel: number, totalXp: number): boolean {
  if (studentLevel >= item.requiredLevel) return true;
  if (item.requiredXp !== undefined && totalXp >= item.requiredXp) return true;
  return false;
}

export function getItemsForSlot(slot: RoomSlot): RoomItem[] {
  return ROOM_ITEMS_CATALOG.filter((i) => i.slot === slot);
}
