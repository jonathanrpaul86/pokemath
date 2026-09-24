import type { Trainer, OwnedPokemon, MathStats } from '../types'
import { AREA_MAP, STARTER_SPECIES_IDS } from '../data/areas'
import { evolutionLine } from '../utils/gifts'
import { pokemonXpToNextLevel } from '../utils/formulas'
import { clearApiCache } from '../utils/storage'

const SLOT_COUNT = 3
const LEGACY_KEY = 'pmg_trainer_v1'

function slotKey(slot: number): string {
  return `pmg_save_v1_${slot}`
}

const DEFAULT_MATH_STATS: MathStats = {
  operators: {
    '+': { totalAttempts: 0, correctAnswers: 0 },
    '-': { totalAttempts: 0, correctAnswers: 0 },
    '×': { totalAttempts: 0, correctAnswers: 0 },
    '÷': { totalAttempts: 0, correctAnswers: 0 },
  },
  lifetimeTotal: 0,
  lifetimeCorrect: 0,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migratePokemon(p: any): OwnedPokemon {
  // Keep old saves on the current XP curve, clamped to one full bar so a curve
  // change can't trigger a multi-level jump (a full bar is also what the level
  // cap banks for the next badge)
  const xpToNextLevel = pokemonXpToNextLevel(p.level)
  return { moves: [], ...p, xpToNextLevel, xp: Math.min(p.xp ?? 0, xpToNextLevel) }
}

/** Saves from before explore-gating count every visited wild area as explored */
function migrateExploreProgress(unlockedAreaIds: string[] = []): Record<string, number> {
  return Object.fromEntries(
    unlockedAreaIds
      .map(id => AREA_MAP[id])
      .filter(area => area && area.exploresToComplete > 0)
      .map(area => [area.id, area.exploresToComplete]),
  )
}

/**
 * Areas added to the map between places an older save had already been. A save
 * that reached any `impliedBy` area gets the new area as visited and explored,
 * so it can still walk back the way it came.
 */
const AREA_BACKFILLS: { areaId: string; impliedBy: string[] }[] = [
  { areaId: 'pallet-town', impliedBy: ['route-1'] },
  { areaId: 'route-2', impliedBy: ['viridian-forest'] },
  { areaId: 'route-22', impliedBy: ['victory-road'] },
  { areaId: 'route-23', impliedBy: ['victory-road'] },
  // Vermilion used to hang off Lavender Town, and Route 7 ran straight to it
  { areaId: 'route-5', impliedBy: ['vermilion-city'] },
  { areaId: 'route-6', impliedBy: ['vermilion-city'] },
  { areaId: 'route-8', impliedBy: ['route-7'] },
  // Rock Tunnel used to open straight onto Lavender Town
  { areaId: 'route-10', impliedBy: ['lavender-town'] },
  // Cycling Road used to run straight from Celadon to Fuchsia
  { areaId: 'route-16', impliedBy: ['cycling-road'] },
  { areaId: 'route-18', impliedBy: ['cycling-road'] },
  // Fuchsia used to link straight to the Seafoam Islands
  { areaId: 'route-19', impliedBy: ['seafoam-islands'] },
  { areaId: 'route-20', impliedBy: ['seafoam-islands'] },
]

function backfillNewAreas(
  unlockedAreaIds: string[],
  exploreProgress: Record<string, number>,
): Pick<Trainer, 'unlockedAreaIds' | 'exploreProgress'> {
  const added = AREA_BACKFILLS
    .filter(b => !unlockedAreaIds.includes(b.areaId) && b.impliedBy.some(id => unlockedAreaIds.includes(id)))
    .map(b => AREA_MAP[b.areaId])
  return {
    unlockedAreaIds: [...unlockedAreaIds, ...added.map(a => a.id)],
    exploreProgress: {
      ...exploreProgress,
      ...Object.fromEntries(added.filter(a => a.exploresToComplete > 0).map(a => [a.id, a.exploresToComplete])),
    },
  }
}

/**
 * Saves from before the starter was recorded: the starter is the first Pokémon
 * the player ever got, so find the earliest one and check its evolution line
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inferStarter(raw: any): number | undefined {
  const all: OwnedPokemon[] = [...(raw.party ?? []), ...(raw.pc ?? [])]
  const first = all.reduce<OwnedPokemon | undefined>((a, p) => (!a || p.caughtAt < a.caughtAt ? p : a), undefined)
  if (!first) return undefined
  return STARTER_SPECIES_IDS.find(id => evolutionLine(id).includes(first.speciesId))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateTrainer(raw: any): Trainer {
  // Trainer level/XP were removed; drop them from older saves
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { level, xp, xpToNextLevel, claimedRewardAreaIds, ...rest } = raw
  const mathStats: MathStats = {
    ...DEFAULT_MATH_STATS,
    ...(raw.mathStats ?? {}),
    operators: {
      ...DEFAULT_MATH_STATS.operators,
      ...(raw.mathStats?.operators ?? {}),
    },
  }
  return {
    money: 3000,
    items: [],
    balls: [{ itemId: 'poke-ball', quantity: 5 }],
    keyItems: [],
    badges: [],
    gymProgress: {},
    storyteller: { heardStoryIds: [], nextStoryAt: {} },
    hallOfFame: [],
    ...rest,
    ...backfillNewAreas(
      raw.unlockedAreaIds ?? [],
      raw.exploreProgress ?? migrateExploreProgress(raw.unlockedAreaIds),
    ),
    // Renamed from claimedRewardAreaIds once houses could hand out gifts too
    claimedRewardIds: raw.claimedRewardIds ?? claimedRewardAreaIds ?? [],
    starterSpeciesId: raw.starterSpeciesId ?? inferStarter(raw),
    party: (raw.party ?? []).map(migratePokemon),
    pc:    (raw.pc    ?? []).map(migratePokemon),
    mathStats,
  }
}

export function loadSave(slot: number): Trainer | null {
  try {
    const raw = localStorage.getItem(slotKey(slot))
    return raw ? migrateTrainer(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

// ---- Save status (observable, so the UI can warn when saving fails) --------

let lastSaveFailed = false
const saveStatusListeners = new Set<() => void>()

function setLastSaveFailed(failed: boolean): void {
  if (failed === lastSaveFailed) return
  lastSaveFailed = failed
  saveStatusListeners.forEach(listener => listener())
}

export function subscribeSaveStatus(listener: () => void): () => void {
  saveStatusListeners.add(listener)
  return () => { saveStatusListeners.delete(listener) }
}

export function getLastSaveFailed(): boolean {
  return lastSaveFailed
}

function trySetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/** Writes a save. If storage is full, clears the re-fetchable PokéAPI cache and retries. */
export function writeSave(slot: number, trainer: Trainer): boolean {
  const data = JSON.stringify({ ...trainer, savedAt: Date.now() } satisfies Trainer)
  let saved = trySetItem(slotKey(slot), data)
  if (!saved) {
    clearApiCache()
    saved = trySetItem(slotKey(slot), data)
  }
  if (!saved) console.warn('Could not save game: browser storage is full or unavailable')
  setLastSaveFailed(!saved)
  return saved
}

export function deleteSave(slot: number): void {
  localStorage.removeItem(slotKey(slot))
}

export function listSaves(): (Trainer | null)[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => loadSave(i))
}

/** The v1 cache stored raw PokéAPI responses (~250K chars per Pokémon) that could fill storage */
export function purgeOutdatedApiCache(): void {
  clearApiCache({ keepCurrent: true })
}

export function migrateLegacySave(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (!legacy) return
    const slot0 = localStorage.getItem(slotKey(0))
    if (!slot0) {
      localStorage.setItem(slotKey(0), legacy)
    }
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // Migration is best-effort
  }
}
