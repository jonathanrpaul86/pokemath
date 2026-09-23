import { describe, expect, it } from 'vitest'
import { pokemonLevelCap, pokemonXpToNextLevel, battleXpReward, calcStats } from './formulas'
import { KANTO_GYMS } from '../data/gyms'
import { CHARMANDER_BASE } from '../test/fixtures'

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
