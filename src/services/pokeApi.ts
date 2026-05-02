import type {
  Move,
  PokemonSpecies,
  BaseStats,
  PokemonType,
  DamageClass,
  PokeApiPokemon,
  PokeApiMoveDetail,
} from '../types'

const BASE_URL = 'https://pokeapi.co/api/v2'
const CACHE_PREFIX = 'pokeapi_v1_'

// In-memory cache so we never re-fetch within a session
const memCache = new Map<string, unknown>()

// ---- Storage helpers --------------------------------------------------------

function storageGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function storageSet(key: string, data: unknown): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data))
  } catch {
    // localStorage quota exceeded — session cache still works
  }
}

// ---- Generic cached fetch ---------------------------------------------------

async function cachedFetch<T>(cacheKey: string, url: string): Promise<T> {
  if (memCache.has(cacheKey)) return memCache.get(cacheKey) as T

  const stored = storageGet<T>(cacheKey)
  if (stored) {
    memCache.set(cacheKey, stored)
    return stored
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`PokeAPI fetch failed: ${url} (${res.status})`)
  const data = (await res.json()) as T

  memCache.set(cacheKey, data)
  storageSet(cacheKey, data)
  return data
}

// ---- Transformers -----------------------------------------------------------

function toBaseStats(raw: PokeApiPokemon): BaseStats {
  const get = (name: string) =>
    raw.stats.find(s => s.stat.name === name)?.base_stat ?? 0
  return {
    hp: get('hp'),
    attack: get('attack'),
    defense: get('defense'),
    specialAttack: get('special-attack'),
    specialDefense: get('special-defense'),
    speed: get('speed'),
  }
}

function toMove(raw: PokeApiMoveDetail): Move {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type.name as PokemonType,
    power: raw.power,
    accuracy: raw.accuracy,
    damageClass: raw.damage_class.name as DamageClass,
  }
}

// ---- Public API -------------------------------------------------------------

export async function fetchMove(name: string): Promise<Move> {
  const raw = await cachedFetch<PokeApiMoveDetail>(
    `move_${name}`,
    `${BASE_URL}/move/${name}`
  )
  return toMove(raw)
}

export async function fetchPokemonSpecies(id: number): Promise<PokemonSpecies> {
  const raw = await cachedFetch<PokeApiPokemon>(
    `pokemon_${id}`,
    `${BASE_URL}/pokemon/${id}`
  )

  // Collect level-up moves from the red-blue version group only
  const levelUpEntries: Array<{ level: number; moveName: string }> = []

  for (const entry of raw.moves) {
    for (const detail of entry.version_group_details) {
      if (
        detail.move_learn_method.name === 'level-up' &&
        detail.level_learned_at > 0
      ) {
        // Accept any version group — gives us the widest move variety
        levelUpEntries.push({
          level: detail.level_learned_at,
          moveName: entry.move.name,
        })
        break // one entry per move is enough
      }
    }
  }

  // Fetch all move details in parallel
  const moves = await Promise.all(
    levelUpEntries.map(e => fetchMove(e.moveName))
  )

  // Build Record<level, Move[]>
  const levelUpMoves: Record<number, Move[]> = {}
  for (let i = 0; i < levelUpEntries.length; i++) {
    const level = levelUpEntries[i].level
    if (!levelUpMoves[level]) levelUpMoves[level] = []
    levelUpMoves[level].push(moves[i])
  }

  return {
    id: raw.id,
    name: raw.name,
    types: raw.types.map(t => t.type.name as PokemonType),
    baseStats: toBaseStats(raw),
    sprites: {
      front: raw.sprites.front_default ?? '',
      back: raw.sprites.back_default ?? '',
    },
    levelUpMoves,
  }
}

/**
 * Preload all species for an area's encounter table in parallel.
 * Call this when the player enters an area so battles start instantly.
 */
export async function preloadAreaSpecies(speciesIds: number[]): Promise<void> {
  await Promise.all(speciesIds.map(id => fetchPokemonSpecies(id)))
}

/**
 * Returns the moves a Pokemon of a given level could know,
 * drawn from its level-up learnset up to that level.
 */
export function getAvailableMoves(species: PokemonSpecies, level: number): Move[] {
  return Object.entries(species.levelUpMoves)
    .filter(([learnLevel]) => parseInt(learnLevel) <= level)
    .flatMap(([, moves]) => moves)
}
