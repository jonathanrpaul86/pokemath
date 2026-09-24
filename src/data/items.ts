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
  {
    id: 'revive',
    name: 'Revive',
    description: 'Revives a fainted Pokémon to half its max HP.',
    pocket: 'item',
    buyPrice: 1500,
    sellPrice: 750,
    revivePercent: 0.5,
  },
  {
    id: 'max-revive',
    name: 'Max Revive',
    description: 'Revives a fainted Pokémon to full HP.',
    pocket: 'item',
    buyPrice: 4000,
    sellPrice: 2000,
    revivePercent: 1.0,
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
    description: 'A folding bicycle that can be used anywhere. Needed to ride Cycling Road.',
    pocket: 'key-item',
    buyPrice: 0,
    sellPrice: 0,
    howToGet: 'Explore all of Route 11 to earn a Bike Voucher, then trade it in at the Cerulean City Bike Shop.',
  },
  {
    id: 'bike-voucher',
    name: 'Bike Voucher',
    description: 'A voucher from the Pokémon Fan Club. Trade it in at the Cerulean City Bike Shop for a free Bicycle!',
    pocket: 'key-item',
    buyPrice: 0,
    sellPrice: 0,
  },
  {
    id: 'poke-flute',
    name: 'Poké Flute',
    description: 'A flute that plays a tune so lovely it can wake up even a sleeping Snorlax.',
    pocket: 'key-item',
    buyPrice: 0,
    sellPrice: 0,
    howToGet: 'Explore all of the Pokémon Tower in Lavender Town, and Mr. Fuji will give you one.',
  },
  {
    id: 'old-rod',
    name: 'Old Rod',
    description: 'A battered old fishing rod. Magikarp will bite in areas near the water.',
    pocket: 'key-item',
    buyPrice: 0,
    sellPrice: 0,
  },
  {
    id: 'good-rod',
    name: 'Good Rod',
    description: 'A decent fishing rod. Poliwag and Goldeen bite in rivers and lakes.',
    pocket: 'key-item',
    buyPrice: 0,
    sellPrice: 0,
  },
  {
    id: 'super-rod',
    name: 'Super Rod',
    description: 'An awesome, high-tech fishing rod. Shellder and other sea Pokémon bite along the coast.',
    pocket: 'key-item',
    buyPrice: 0,
    sellPrice: 0,
  },
  {
    id: 'dome-fossil',
    name: 'Dome Fossil',
    description: 'The fossil of an ancient Pokémon that lived in the sea. The Pokémon Lab on Cinnabar Island can bring it back to life.',
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
  'revive':        '💫',
  'max-revive':    '⭐',
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
