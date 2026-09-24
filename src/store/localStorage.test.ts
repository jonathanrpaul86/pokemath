import { describe, expect, it, vi } from 'vitest'
import {
  loadSave, writeSave, listSaves, deleteSave, purgeOutdatedApiCache,
  getLastSaveFailed, subscribeSaveStatus,
} from './localStorage'
import { API_CACHE_PREFIX } from '../utils/storage'
import { pokemonXpToNextLevel } from '../utils/formulas'
import { installMemoryStorage } from '../test/memoryStorage'
import { makePokemon, makeTrainer } from '../test/fixtures'
import type { Trainer } from '../types'

/** About what a real browser allows per site */
const BROWSER_QUOTA = 5 * 1024 * 1024

describe('writeSave / loadSave', () => {
  it('round-trips a save and stamps savedAt', () => {
    writeSave(0, makeTrainer({ name: 'Round Trip' }))
    const loaded = loadSave(0)
    expect(loaded?.name).toBe('Round Trip')
    expect(loaded?.savedAt).toEqual(expect.any(Number))
  })

  it('lists empty slots as null', () => {
    writeSave(1, makeTrainer())
    expect(listSaves().map(s => s?.name ?? null)).toEqual([null, 'Tester', null])
  })

  it('deletes a slot', () => {
    writeSave(0, makeTrainer())
    deleteSave(0)
    expect(loadSave(0)).toBeNull()
  })
})

describe('saving when storage is full', () => {
  it('clears the PokéAPI cache and retries, so a new game still saves', () => {
    // The original bug: a nearly full browser storage packed with cached data
    const storage = installMemoryStorage(BROWSER_QUOTA)
    for (let i = 0; storage.usedChars < BROWSER_QUOTA - 250_000; i++) {
      storage.setItem(`${API_CACHE_PREFIX}species_${i}`, 'x'.repeat(200_000))
    }
    storage.setItem(`${API_CACHE_PREFIX}move_filler`, 'x'.repeat(BROWSER_QUOTA - storage.usedChars - 500))

    expect(writeSave(2, makeTrainer({ name: 'New Game' }))).toBe(true)
    expect(loadSave(2)?.name).toBe('New Game')
    expect(getLastSaveFailed()).toBe(false)
  })

  it('reports failure when nothing can be freed, and recovers on the next good save', () => {
    const storage = installMemoryStorage(BROWSER_QUOTA)
    // Save status is module state; start from a known-good save
    expect(writeSave(1, makeTrainer())).toBe(true)
    storage.setItem('someone-elses-data', 'x'.repeat(BROWSER_QUOTA - storage.usedChars - 100))
    const listener = vi.fn()
    const unsubscribe = subscribeSaveStatus(listener)

    expect(writeSave(0, makeTrainer())).toBe(false)
    expect(getLastSaveFailed()).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)

    storage.removeItem('someone-elses-data')
    expect(writeSave(0, makeTrainer())).toBe(true)
    expect(getLastSaveFailed()).toBe(false)
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
  })
})

describe('purgeOutdatedApiCache', () => {
  it('removes old cache versions and keeps the current cache and saves', () => {
    const storage = installMemoryStorage()
    storage.setItem('pokeapi_v1_pokemon_4', 'raw')
    storage.setItem('pokeapi_v1_move_tackle', 'raw')
    storage.setItem(`${API_CACHE_PREFIX}species_4`, 'trimmed')
    writeSave(0, makeTrainer())

    purgeOutdatedApiCache()

    expect(storage.getItem('pokeapi_v1_pokemon_4')).toBeNull()
    expect(storage.getItem('pokeapi_v1_move_tackle')).toBeNull()
    expect(storage.getItem(`${API_CACHE_PREFIX}species_4`)).toBe('trimmed')
    expect(loadSave(0)).not.toBeNull()
  })
})

describe('migrating older saves', () => {
  function storeRaw(slot: number, raw: object) {
    localStorage.setItem(`pmg_save_v1_${slot}`, JSON.stringify(raw))
  }

  it('drops trainer level/XP from before explore-gating', () => {
    storeRaw(0, { ...makeTrainer(), level: 12, xp: 340, xpToNextLevel: 1200 })
    const loaded = loadSave(0) as unknown as Record<string, unknown>
    expect(loaded).not.toHaveProperty('level')
    expect(loaded).not.toHaveProperty('xp')
    expect(loaded).not.toHaveProperty('xpToNextLevel')
  })

  it('marks visited wild areas as explored, but not cities', () => {
    const old: Partial<Trainer> = makeTrainer({
      unlockedAreaIds: ['route-1', 'viridian-city'],
    })
    delete old.exploreProgress
    storeRaw(0, old)
    const loaded = loadSave(0)!
    expect(loaded.exploreProgress).toEqual({ 'route-1': 8 })
  })

  it('adds areas that were inserted on paths the save already walked', () => {
    storeRaw(0, makeTrainer({
      unlockedAreaIds: ['route-1', 'viridian-city', 'viridian-forest', 'victory-road'],
      exploreProgress: { 'route-1': 8, 'viridian-forest': 5 },
    }))
    const loaded = loadSave(0)!
    expect(loaded.unlockedAreaIds).toEqual(expect.arrayContaining(['pallet-town', 'route-2', 'route-22', 'route-23']))
    expect(loaded.exploreProgress).toEqual({
      'route-1': 8, 'viridian-forest': 5, 'route-2': 6, 'route-22': 6, 'route-23': 12,
    })
  })

  it('does not add new areas a save has not reached', () => {
    storeRaw(0, makeTrainer({ unlockedAreaIds: ['route-1', 'viridian-city'] }))
    expect(loadSave(0)!.unlockedAreaIds).toEqual(['route-1', 'viridian-city', 'pallet-town'])
  })

  it('keeps existing explore progress untouched', () => {
    storeRaw(0, makeTrainer({ exploreProgress: { 'route-1': 3 } }))
    expect(loadSave(0)!.exploreProgress).toEqual({ 'route-1': 3 })
  })

  it('re-bases Pokémon XP onto the current curve, capped at one full bar', () => {
    storeRaw(0, makeTrainer({ party: [makePokemon({ level: 10, xp: 450, xpToNextLevel: 500 })] }))
    const p = loadSave(0)!.party[0]
    expect(p.xpToNextLevel).toBe(pokemonXpToNextLevel(10))
    expect(p.xp).toBe(pokemonXpToNextLevel(10))
  })

  it('fills in defaults for fields added after the save was made', () => {
    storeRaw(0, { name: 'Ancient', party: [], pc: [], unlockedAreaIds: ['route-1'], currentAreaId: 'route-1', pokedex: {} })
    const loaded = loadSave(0)!
    expect(loaded.storyteller).toEqual({ heardStoryIds: [], nextStoryAt: {} })
    expect(loaded.badges).toEqual([])
    expect(loaded.claimedRewardIds).toEqual([])
    expect(loaded.mathStats.operators['+']).toEqual({ totalAttempts: 0, correctAnswers: 0 })
  })

  it('keeps gifts claimed under the old field name', () => {
    storeRaw(0, { ...makeTrainer(), claimedRewardIds: undefined, claimedRewardAreaIds: ['route-11'] })
    const loaded = loadSave(0) as unknown as Record<string, unknown>
    expect(loaded.claimedRewardIds).toEqual(['route-11'])
    expect(loaded).not.toHaveProperty('claimedRewardAreaIds')
  })

  it('returns null for corrupt saves instead of crashing', () => {
    localStorage.setItem('pmg_save_v1_0', '{not json')
    expect(loadSave(0)).toBeNull()
  })
})
