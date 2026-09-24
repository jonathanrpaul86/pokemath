import { describe, expect, it } from 'vitest'
import { PACING_ROUTES, simulatePacing } from './pacing'
import { pokemonLevelCap } from './formulas'
import { KANTO_GYMS } from '../data/gyms'
import { POKEMON_LEAGUE } from '../data/league'

describe.each(PACING_ROUTES)('pacing via $name', route => {
  const checkpoints = simulatePacing(route)
  const gyms = checkpoints.slice(0, KANTO_GYMS.length)
  const league = checkpoints.slice(KANTO_GYMS.length)

  it('reaches every gym and League opponent', () => {
    expect(checkpoints).toHaveLength(KANTO_GYMS.length + POKEMON_LEAGUE.length)
  })

  it('brings the lead to each gym close to the leader’s ace, without grinding', () => {
    gyms.forEach((c, badges) => {
      expect(c.leadLevel, c.opponent).toBeGreaterThanOrEqual(c.aceLevel - 2)
      expect(c.leadLevel, c.opponent).toBeLessThanOrEqual(pokemonLevelCap(badges))
    })
  })

  it('has the whole team ready for the League, thanks to the Exp. All', () => {
    for (const c of league) {
      expect(c.leadLevel, c.opponent).toBeGreaterThanOrEqual(c.aceLevel)
      expect(c.teamLevel, c.opponent).toBeGreaterThanOrEqual(c.aceLevel - 4)
    }
  })
})
