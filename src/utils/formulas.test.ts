import { describe, expect, it } from 'vitest'
import { pokemonLevelCap, pokemonXpToNextLevel, battleXpReward, calcStats, updatedMoveset } from './formulas'
import { KANTO_GYMS } from '../data/gyms'
import { CHARMANDER_BASE, makePokemon, makeSpecies } from '../test/fixtures'
import type { Move } from '../types'

describe('pokemonLevelCap', () => {
  it('sits just above the next gym leader’s strongest Pokémon', () => {
    // Gyms in the order players meet them; the cap with N badges must beat gym N+1's ace
    const order = ['pewter-gym', 'cerulean-gym', 'vermilion-gym', 'celadon-gym', 'saffron-gym', 'fuchsia-gym', 'cinnabar-gym', 'viridian-gym']
    order.forEach((gymId, badges) => {
      const gym = KANTO_GYMS.find(g => g.id === gymId)!
      const ace = Math.max(...gym.leader.team.map(p => p.level))
      expect(pokemonLevelCap(badges), gymId).toBeGreaterThan(ace)
      expect(pokemonLevelCap(badges) - ace, gymId).toBeLessThanOrEqual(3)
    })
  })

  it('lifts the cap after all 8 badges', () => {
    expect(pokemonLevelCap(8)).toBe(100)
    expect(pokemonLevelCap(20)).toBe(100)
  })
})

describe('XP pacing', () => {
  it('takes roughly 2–3 same-level wins per level at every stage', () => {
    for (const level of [5, 15, 30, 45]) {
      const wins = pokemonXpToNextLevel(level) / battleXpReward(level - 2)
      expect(wins, `level ${level}`).toBeGreaterThan(2)
      expect(wins, `level ${level}`).toBeLessThan(3)
    }
  })
})

describe('calcStats', () => {
  it('grows every stat with level', () => {
    const low = calcStats(CHARMANDER_BASE, 5)
    const high = calcStats(CHARMANDER_BASE, 40)
    for (const key of Object.keys(low) as (keyof typeof low)[]) {
      expect(high[key], key).toBeGreaterThan(low[key])
    }
  })
})

describe('updatedMoveset', () => {
  const move = (id: number, name: string, power: number | null): Move =>
    ({ id, name, type: 'normal', power, accuracy: 100, damageClass: power ? 'physical' : 'status' })
  const SCRATCH = move(10, 'scratch', 40)
  const GROWL = move(45, 'growl', null)
  const EMBER = move(52, 'ember', 40)
  const LEER = move(43, 'leer', null)
  const RAGE = move(99, 'rage', 20)
  const SLASH = move(163, 'slash', 70)
  const species = makeSpecies({
    levelUpMoves: { 1: [SCRATCH, GROWL], 9: [EMBER], 15: [LEER], 22: [RAGE], 30: [SLASH] },
  })

  it('leaves moves alone when they are already current', () => {
    expect(updatedMoveset(makePokemon({ level: 8, moves: [SCRATCH, GROWL] }), species)).toBeNull()
  })

  it('learns the moves a level-up unlocks', () => {
    expect(updatedMoveset(makePokemon({ level: 9, moves: [SCRATCH, GROWL] }), species)).toEqual([EMBER, SCRATCH, GROWL])
  })

  it('keeps its four newest attacks, dropping moves that do nothing in battle', () => {
    expect(updatedMoveset(makePokemon({ level: 30, moves: [SCRATCH, GROWL] }), species)).toEqual([SLASH, RAGE, EMBER, SCRATCH])
  })

  it('keeps an attack even when newer moves do nothing in battle', () => {
    const TAIL_WHIP = move(39, 'tail-whip', null)
    const SAND_ATTACK = move(28, 'sand-attack', null)
    const statusHeavy = makeSpecies({ levelUpMoves: { 1: [SCRATCH], 5: [GROWL], 7: [LEER], 9: [TAIL_WHIP], 11: [SAND_ATTACK] } })
    expect(updatedMoveset(makePokemon({ level: 11, moves: [SCRATCH] }), statusHeavy)).toEqual([SAND_ATTACK, TAIL_WHIP, LEER, SCRATCH])
  })

  it('fills in moves for Pokémon from older saves', () => {
    expect(updatedMoveset(makePokemon({ level: 5, moves: [] }), species)).toEqual([SCRATCH, GROWL])
  })

  it('keeps known moves when the learnset is missing', () => {
    expect(updatedMoveset(makePokemon({ level: 20, moves: [SCRATCH] }), makeSpecies({ levelUpMoves: {} }))).toBeNull()
  })
})
