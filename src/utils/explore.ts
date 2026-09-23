import type { Area, ExploreOutcome, ExploreOutcomeKind, RouteTrainer } from '../types'
import { pickEncounter, pickLevel } from './encounter'

type Rng = () => number

// ---- Tuning -----------------------------------------------------------------

/** Relative odds of each explore result. Wild battles stay the core loop. */
const OUTCOME_WEIGHTS: Record<ExploreOutcomeKind, number> = {
  wild:    64,
  trainer: 12,
  item:    12,
  money:    6,
  nothing:  6,
}

/** Loot tables by progression tier (see lootTier) */
const LOOT_TABLES: [itemId: string, weight: number][][] = [
  [['potion', 50], ['poke-ball', 50]],
  [['potion', 25], ['super-potion', 30], ['poke-ball', 20], ['great-ball', 25]],
  [['super-potion', 25], ['hyper-potion', 20], ['great-ball', 25], ['ultra-ball', 15], ['revive', 15]],
  [['hyper-potion', 25], ['ultra-ball', 30], ['revive', 25], ['full-restore', 10], ['max-revive', 10]],
]

const TRAINER_CLASSES: Record<Area['areaType'], string[]> = {
  route:   ['Youngster', 'Lass', 'Camper', 'Picnicker', 'Bird Keeper'],
  forest:  ['Bug Catcher', 'Lass', 'Camper'],
  cave:    ['Hiker', 'Super Nerd', 'Camper'],
  special: ['Cooltrainer', 'Hiker', 'Black Belt'],
  city:    [],
  town:    [],
}

const AREA_TRAINER_CLASSES: Record<string, string[]> = {
  'pokemon-tower': ['Channeler'],
  'safari-zone':   ['Cooltrainer', 'Picnicker'],
}

const FIRST_NAMES = [
  'Joey', 'Mia', 'Sam', 'Ava', 'Leo', 'Zoe', 'Max', 'Ruby',
  'Finn', 'Ivy', 'Theo', 'Luna', 'Owen', 'Nora', 'Eli', 'Rosa',
]

const TRAINER_QUOTES = [
  'Hey! Our eyes met — that means we have to battle!',
  'I just caught a new Pokémon. Let’s test it out!',
  'Bet you can’t solve problems as fast as I can!',
  'My Pokémon and I trained all week for this!',
  'You look strong. Let’s see what you’ve got!',
  'Nobody gets past me without a battle!',
]

// ---- Helpers ----------------------------------------------------------------

function weightedPick<T>(entries: readonly [T, number][], rng: Rng): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = rng() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll <= 0) return value
  }
  return entries[entries.length - 1][0]
}

function pickOne<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)]
}

/** 0–3, following the area's math difficulty so rewards grow with the journey */
function lootTier(area: Area): number {
  if (area.mathDifficulty < 30) return 0
  if (area.mathDifficulty < 60) return 1
  if (area.mathDifficulty < 85) return 2
  return 3
}

function trainerTeamSize(area: Area, rng: Rng): number {
  if (area.mathDifficulty < 25) return 1
  if (area.mathDifficulty < 60) return rng() < 0.5 ? 1 : 2
  return rng() < 0.5 ? 2 : 3
}

export function createRouteTrainer(area: Area, rng: Rng = Math.random): RouteTrainer {
  const classes = AREA_TRAINER_CLASSES[area.id] ?? TRAINER_CLASSES[area.areaType]
  const team = Array.from({ length: trainerTeamSize(area, rng) }, () => {
    const entry = pickEncounter(area, rng)
    return { speciesId: entry.speciesId, level: pickLevel(entry, rng) }
  })
  return {
    name: `${pickOne(classes.length ? classes : TRAINER_CLASSES.route, rng)} ${pickOne(FIRST_NAMES, rng)}`,
    team,
    quote: pickOne(TRAINER_QUOTES, rng),
  }
}

// ---- Public API -------------------------------------------------------------

/** A random item from the loot table matching the area's progression */
export function rollLootItem(area: Area, rng: Rng = Math.random): string {
  return weightedPick(LOOT_TABLES[lootTier(area)], rng)
}

/** Areas without wild Pokémon (cities, towns) can't be explored */
export function canExplore(area: Area): boolean {
  return area.encounters.length > 0
}

export function rollExploreOutcome(area: Area, rng: Rng = Math.random): ExploreOutcome {
  const kinds = Object.entries(OUTCOME_WEIGHTS) as [ExploreOutcomeKind, number][]
  const kind = weightedPick(kinds, rng)

  switch (kind) {
    case 'wild':
      return { kind }
    case 'trainer':
      return { kind, trainer: createRouteTrainer(area, rng) }
    case 'item':
      return { kind, itemId: rollLootItem(area, rng), quantity: 1 }
    case 'money': {
      const base = (lootTier(area) + 1) * 40
      return { kind, amount: Math.round((base + rng() * base) / 10) * 10 }
    }
    case 'nothing':
      return { kind }
  }
}
