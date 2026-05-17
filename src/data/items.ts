import type { ItemDefinition } from '../types'

export const ITEM_DEFS: ItemDefinition[] = [
  // ── Balls ────────────────────────────────────────────────────────────────────
  {
    id: 'poke-ball',
    name: 'Poké Ball',
    description: 'A device for catching wild Pokémon. Standard difficulty.',
    pocket: 'ball',
    buyPrice: 200,
    sellPrice: 100,
    catchMultiplier: 1.0,
  },
  {
    id: 'great-ball',
    name: 'Great Ball',
    description: 'A higher-grade Ball. Reduces the number of math problems needed to catch.',
    pocket: 'ball',
    buyPrice: 600,
    sellPrice: 300,
    catchMultiplier: 0.70,
  },
  {
    id: 'ultra-ball',
    name: 'Ultra Ball',
    description: 'An ultra-performance Ball. Significantly easier catch challenges.',
    pocket: 'ball',
    buyPrice: 1200,
    sellPrice: 600,
    catchMultiplier: 0.45,
  },
  {
    id: 'master-ball',
    name: 'Master Ball',
    description: 'The best Ball ever made. Catches any Pokémon with almost no challenge.',
    pocket: 'ball',
    buyPrice: 0,
    sellPrice: 0,
    catchMultiplier: 0.05,
  },

  // ── Healing items ─────────────────────────────────────────────────────────────
  {
    id: 'potion',
    name: 'Potion',
    description: 'Restores 20 HP to a single Pokémon.',
    pocket: 'item',
    buyPrice: 300,
    sellPrice: 150,
    healAmount: 20,
  },
  {
    id: 'super-potion',
    name: 'Super Potion',
    description: 'Restores 60 HP to a single Pokémon.',
    pocket: 'item',
    buyPrice: 700,
    sellPrice: 350,
    healAmount: 60,
  },
  {
    id: 'hyper-potion',
    name: 'Hyper Potion',
    description: 'Restores 120 HP to a single Pokémon.',
    pocket: 'item',
    buyPrice: 1200,
    sellPrice: 600,
    healAmount: 120,
  },
  {
    id: 'full-restore',
    name: 'Full Restore',
    description: 'Fully restores the HP of a single Pokémon.',
    pocket: 'item',
    buyPrice: 3000,
    sellPrice: 1500,
    healAmount: 0,
  },

  // ── Key Items ─────────────────────────────────────────────────────────────────
  {
    id: 'town-map',
    name: 'Town Map',
    description: 'A map showing all of the Kanto region.',
    pocket: 'key-item',
    buyPrice: 0,
    sellPrice: 0,
  },
  {
    id: 'bicycle',
    name: 'Bicycle',
    description: 'A folding bicycle that can be used anywhere.',
    pocket: 'key-item',
    buyPrice: 0,
    sellPrice: 0,
  },
]

export const ITEM_MAP: Record<string, ItemDefinition> = Object.fromEntries(
  ITEM_DEFS.map(d => [d.id, d])
)

export const BALL_EMOJI: Record<string, string> = {
  'poke-ball':   '🔴',
  'great-ball':  '🔵',
  'ultra-ball':  '🟡',
  'master-ball': '🟣',
}

export const ITEM_EMOJI: Record<string, string> = {
  'potion':        '💊',
  'super-potion':  '💉',
  'hyper-potion':  '🧪',
  'full-restore':  '✨',
  'town-map':      '🗺️',
  'bicycle':       '🚲',
}

export const BADGE_META: Record<string, { name: string; emoji: string }> = {
  'boulder-badge': { name: 'Boulder Badge', emoji: '🪨' },
  'cascade-badge': { name: 'Cascade Badge', emoji: '💧' },
  'thunder-badge': { name: 'Thunder Badge', emoji: '⚡' },
  'rainbow-badge': { name: 'Rainbow Badge', emoji: '🌈' },
  'soul-badge':    { name: 'Soul Badge',    emoji: '👻' },
  'marsh-badge':   { name: 'Marsh Badge',   emoji: '🌿' },
  'volcano-badge': { name: 'Volcano Badge', emoji: '🔥' },
  'earth-badge':   { name: 'Earth Badge',   emoji: '🌍' },
}
