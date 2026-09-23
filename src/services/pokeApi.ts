import type {
  Move,
  PokemonSpecies,
  BaseStats,
  PokemonType,
  DamageClass,
  PokeApiPokemon,
  PokeApiMoveDetail,
} from '../types'
import { API_CACHE_PREFIX } from '../utils/storage'

const BASE_URL = 'https://pokeapi.co/api/v2'

// ---- Caching ----------------------------------------------------------------
//
// PokéAPI responses are huge (a Pokémon is ~250K characters, a move ~35K) but
// the game only needs a sliver of each. We cache the trimmed shapes the game
// uses — a species is a few K — so the cache never crowds out save files.

/** In-flight and finished lookups for this session, so parallel callers share one request */
const memCache = new Map<string, Promise<unknown>>()

function storageGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(API_CACHE_PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function storageSet(key: string, data: unknown): void {
  try {
    localStorage.setItem(API_CACHE_PREFIX + key, JSON.stringify(data))
  } catch {
    // Storage full or blocked: the in-memory cache still covers this session
  }
}

/** Returns the stored value for `key`, or runs `load` once and caches its (trimmed) result */
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = memCache.get(key)
  if (existing) return existing as Promise<T>

  const stored = storageGet<T>(key)
  const promise = stored
    ? Promise.resolve(stored)
    : load().then(value => { storageSet(key, value); return value })
  memCache.set(key, promise)
  // A failed request shouldn't poison the cache for the rest of the session
  promise.catch(() => memCache.delete(key))
  return promise
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`PokeAPI fetch failed: ${url} (${res.status})`)
  return (await res.json()) as T
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

export function fetchMove(name: string): Promise<Move> {
  return cached(`move_${name}`, async () =>
    toMove(await fetchJson<PokeApiMoveDetail>(`${BASE_URL}/move/${name}`))
  )
}

export function fetchPokemonSpecies(id: number): Promise<PokemonSpecies> {
  return cached(`species_${id}`, () => loadSpecies(id))
}

async function loadSpecies(id: number): Promise<PokemonSpecies> {
  const raw = await fetchJson<PokeApiPokemon>(`${BASE_URL}/pokemon/${id}`)

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
