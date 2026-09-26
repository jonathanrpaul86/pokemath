import { describe, expect, it } from 'vitest'
import { gameReducer, createNewTrainer } from './reducer'
import { calcStats, pokemonLevelCap, pokemonXpToNextLevel } from '../utils/formulas'
import { KANTO_AREAS } from '../data/areas'
import { STORY_COOLDOWN_EXPLORES } from '../utils/storyteller'
import { CHARMANDER_BASE, CHARMELEON_BASE, makePokemon, makeSpecies, makeTrainer } from '../test/fixtures'
import type { Move } from '../types'
import type { GameAction } from './actions'

const gainXp = (trainer = makeTrainer(), amount: number) =>
  gameReducer(trainer, { type: 'GAIN_POKEMON_XP', payload: { uid: 'pkmn-1', amount } })

describe('GAIN_POKEMON_XP', () => {
  it('levels up and carries leftover XP', () => {
    const toNext = pokemonXpToNextLevel(5)
    const next = gainXp(makeTrainer(), toNext + 7).party[0]
    expect(next.level).toBe(6)
    expect(next.xp).toBe(7)
    expect(next.xpToNextLevel).toBe(pokemonXpToNextLevel(6))
  })

  it('recalculates every stat on level-up, not just HP', () => {
    const before = makeTrainer().party[0]
    const after = gainXp(makeTrainer(), 10_000).party[0]
    expect(after.stats).toEqual(calcStats(CHARMANDER_BASE, after.level))
    expect(after.stats.attack).toBeGreaterThan(before.stats.attack)
    expect(after.maxHp).toBe(after.stats.hp)
  })

  it('keeps the HP ratio when max HP grows', () => {
    const hurt = makePokemon()
    hurt.currentHp = Math.floor(hurt.maxHp / 2)
    const after = gainXp(makeTrainer({ party: [hurt] }), pokemonXpToNextLevel(5)).party[0]
    expect(after.currentHp / after.maxHp).toBeCloseTo(0.5, 1)
  })

  it('stops at the badge level cap and banks at most one full bar', () => {
    const cap = pokemonLevelCap(0)
    const after = gainXp(makeTrainer(), 1_000_000).party[0]
    expect(after.level).toBe(cap)
    expect(after.xp).toBe(after.xpToNextLevel)
  })

  it('grows HP only for legacy Pokémon without base stats', () => {
    const legacy = makePokemon({ baseStats: undefined })
    const after = gainXp(makeTrainer({ party: [legacy] }), pokemonXpToNextLevel(5)).party[0]
    expect(after.level).toBe(6)
    expect(after.stats).toEqual(legacy.stats)
    expect(after.maxHp).toBeGreaterThan(legacy.maxHp)
  })
})

describe('SET_MOVES', () => {
  it('replaces the moves of that Pokémon only, in the party or the PC', () => {
    const ember: Move = { id: 52, name: 'ember', type: 'fire', power: 40, accuracy: 100, damageClass: 'special' }
    const t = makeTrainer({ party: [makePokemon()], pc: [makePokemon({ uid: 'pkmn-2' })] })
    const next = gameReducer(t, { type: 'SET_MOVES', payload: { uid: 'pkmn-2', moves: [ember] } })
    expect(next.pc[0].moves).toEqual([ember])
    expect(next.party[0]).toBe(t.party[0])
  })
})

describe('RELEASE_POKEMON', () => {
  const release = (t: ReturnType<typeof makeTrainer>, uid: string) =>
    gameReducer(t, { type: 'RELEASE_POKEMON', payload: { uid } })

  it('removes the Pokémon from the party or the PC and keeps it caught in the Pokédex', () => {
    const t = makeTrainer({
      party: [makePokemon(), makePokemon({ uid: 'pkmn-2' })],
      pc: [makePokemon({ uid: 'pkmn-3' })],
      pokedex: { 4: { seen: true, caught: true } },
    })
    expect(release(t, 'pkmn-2').party.map(p => p.uid)).toEqual(['pkmn-1'])
    expect(release(t, 'pkmn-3').pc).toEqual([])
    expect(release(t, 'pkmn-3').pokedex[4]).toEqual({ seen: true, caught: true })
  })

  it('never releases the last Pokémon in the party', () => {
    const t = makeTrainer({ party: [makePokemon()], pc: [makePokemon({ uid: 'pkmn-2' })] })
    expect(release(t, 'pkmn-1')).toBe(t)
  })
})

describe('EARN_BADGE', () => {
  it('releases the banked level-up when the cap rises', () => {
    const capped = gainXp(makeTrainer(), 1_000_000)
    const levelAtCap = capped.party[0].level
    const next = gameReducer(capped, { type: 'EARN_BADGE', payload: { badgeId: 'boulder-badge' } })
    expect(next.badges).toEqual(['boulder-badge'])
    expect(next.party[0].level).toBe(levelAtCap + 1)
  })

  it('ignores a badge the trainer already has', () => {
    const once = gameReducer(makeTrainer(), { type: 'EARN_BADGE', payload: { badgeId: 'boulder-badge' } })
    expect(gameReducer(once, { type: 'EARN_BADGE', payload: { badgeId: 'boulder-badge' } })).toBe(once)
  })
})

describe('RECORD_EXPLORE', () => {
  it('counts explores in wild areas', () => {
    let t = makeTrainer()
    t = gameReducer(t, { type: 'RECORD_EXPLORE', payload: { areaId: 'route-1' } })
    t = gameReducer(t, { type: 'RECORD_EXPLORE', payload: { areaId: 'route-1' } })
    expect(t.exploreProgress['route-1']).toBe(2)
  })

  it('ignores cities and unknown areas', () => {
    const t = makeTrainer()
    expect(gameReducer(t, { type: 'RECORD_EXPLORE', payload: { areaId: 'viridian-city' } })).toBe(t)
    expect(gameReducer(t, { type: 'RECORD_EXPLORE', payload: { areaId: 'nowhere' } })).toBe(t)
  })
})

describe('FINISH_STORY', () => {
  it('marks the story heard and starts the cooldown from total explores', () => {
    const t = makeTrainer({ exploreProgress: { 'route-1': 8, 'viridian-forest': 3 } })
    const next = gameReducer(t, { type: 'FINISH_STORY', payload: { cityId: 'viridian-city', storyId: 'pidgey-nest' } })
    expect(next.storyteller.heardStoryIds).toEqual(['pidgey-nest'])
    expect(next.storyteller.nextStoryAt['viridian-city']).toBe(11 + STORY_COOLDOWN_EXPLORES)
  })

  it('does not list a story twice', () => {
    let t = makeTrainer()
    for (let i = 0; i < 2; i++) {
      t = gameReducer(t, { type: 'FINISH_STORY', payload: { cityId: 'pewter-city', storyId: 'pidgey-nest' } })
    }
    expect(t.storyteller.heardStoryIds).toEqual(['pidgey-nest'])
  })
})

describe('SET_BASE_STATS', () => {
  it('backfills base stats and recalculates stats at the current level', () => {
    const legacy = makePokemon({ level: 20, baseStats: undefined, stats: calcStats(CHARMANDER_BASE, 5) })
    const next = gameReducer(makeTrainer({ party: [legacy] }), {
      type: 'SET_BASE_STATS', payload: { uid: 'pkmn-1', baseStats: CHARMANDER_BASE },
    }).party[0]
    expect(next.baseStats).toEqual(CHARMANDER_BASE)
    expect(next.stats).toEqual(calcStats(CHARMANDER_BASE, 20))
  })

  it('never overwrites existing base stats', () => {
    const t = makeTrainer()
    const next = gameReducer(t, { type: 'SET_BASE_STATS', payload: { uid: 'pkmn-1', baseStats: CHARMELEON_BASE } })
    expect(next.party[0].baseStats).toEqual(CHARMANDER_BASE)
  })
})

describe('EVOLVE_POKEMON', () => {
  it('stores the new base stats so later level-ups use them', () => {
    // Two badges, so the level cap allows growing past 16
    const trainer = makeTrainer({ party: [makePokemon({ level: 16 })], badges: ['boulder-badge', 'cascade-badge'] })
    const evolved = gameReducer(trainer, {
      type: 'EVOLVE_POKEMON',
      payload: { uid: 'pkmn-1', newSpeciesId: 5, newName: 'charmeleon', newBaseStats: CHARMELEON_BASE },
    })
    expect(evolved.party[0].baseStats).toEqual(CHARMELEON_BASE)
    const leveled = gainXp(evolved, pokemonXpToNextLevel(16)).party[0]
    expect(leveled.stats).toEqual(calcStats(CHARMELEON_BASE, 17))
  })
})

describe('RECEIVE_GIFT', () => {
  const receive = (t: ReturnType<typeof makeTrainer>, payload: Extract<GameAction, { type: 'RECEIVE_GIFT' }>['payload']) =>
    gameReducer(t, { type: 'RECEIVE_GIFT', payload })

  it('gives a key item and records the gift', () => {
    const t = receive(makeTrainer(), { claimId: 'pokemon-tower', keyItemId: 'poke-flute' })
    expect(t.keyItems).toEqual([{ itemId: 'poke-flute', quantity: 1 }])
    expect(t.claimedRewardIds).toEqual(['pokemon-tower'])
  })

  it('does not hand the same gift out twice', () => {
    const once = receive(makeTrainer(), { claimId: 'pokemon-tower', keyItemId: 'poke-flute' })
    expect(receive(once, { claimId: 'pokemon-tower', keyItemId: 'poke-flute' })).toBe(once)
  })

  it('trades a key item away', () => {
    const t = receive(
      makeTrainer({ keyItems: [{ itemId: 'bike-voucher', quantity: 1 }] }),
      { takesKeyItemId: 'bike-voucher', keyItemId: 'bicycle' },
    )
    expect(t.keyItems).toEqual([{ itemId: 'bicycle', quantity: 1 }])
  })

  it('does nothing if the traded item is missing', () => {
    const t = makeTrainer()
    expect(receive(t, { takesKeyItemId: 'dome-fossil', pokemon: makePokemon({ uid: 'kabuto', speciesId: 140 }) })).toBe(t)
  })

  it('adds a gift Pokémon to the party and the Pokédex', () => {
    const t = receive(makeTrainer(), { claimId: 'safari-zone', pokemon: makePokemon({ uid: 'licky', speciesId: 108 }) })
    expect(t.party.map(p => p.uid)).toContain('licky')
    expect(t.pokedex[108]).toEqual({ seen: true, caught: true })
  })

  it('sends a gift Pokémon to the PC when the party is full', () => {
    const party = Array.from({ length: 6 }, (_, i) => makePokemon({ uid: `p${i}` }))
    const t = receive(makeTrainer({ party }), { pokemon: makePokemon({ uid: 'licky', speciesId: 108 }) })
    expect(t.party).toHaveLength(6)
    expect(t.pc.map(p => p.uid)).toEqual(['licky'])
  })
})

describe('ENTER_HALL_OF_FAME', () => {
  it('records the party as it is now', () => {
    const t = gameReducer(
      makeTrainer({ party: [makePokemon({ speciesId: 6, name: 'charizard', level: 58 })] }),
      { type: 'ENTER_HALL_OF_FAME', payload: { date: 1000 } },
    )
    expect(t.hallOfFame).toEqual([{ date: 1000, team: [{ speciesId: 6, name: 'charizard', level: 58 }] }])
  })
})

describe('createNewTrainer', () => {
  it('remembers which starter the player picked', () => {
    expect(createNewTrainer('Ash', makeSpecies()).starterSpeciesId).toBe(makeSpecies().id)
  })

  it('starts a normal game in Pallet Town with nothing explored', () => {
    const t = createNewTrainer('Ash', makeSpecies())
    expect(t.name).toBe('Ash')
    expect(t.currentAreaId).toBe('pallet-town')
    expect(t.unlockedAreaIds).toEqual(['pallet-town'])
    expect(t.exploreProgress).toEqual({})
    expect(t.party[0].level).toBe(5)
    expect(t.party[0].baseStats).toEqual(CHARMANDER_BASE)
    expect(t.storyteller).toEqual({ heardStoryIds: [], nextStoryAt: {} })
  })

  it('DEBUG unlocks and completes every area', () => {
    const t = createNewTrainer('debug', makeSpecies())
    expect(t.name).toBe('Trainer')
    expect(t.unlockedAreaIds).toHaveLength(KANTO_AREAS.length)
    for (const area of KANTO_AREAS) {
      expect(t.exploreProgress[area.id]).toBe(area.exploresToComplete)
    }
  })
})
