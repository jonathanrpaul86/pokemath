import { describe, expect, it } from 'vitest'
import { AREA_MAP } from '../data/areas'
import { availableEncounters, pickEncounter } from './encounter'
import { seededRng } from '../test/fixtures'

const route12 = AREA_MAP['route-12']
const rods = ['old-rod', 'good-rod', 'super-rod'].map(itemId => ({ itemId, quantity: 1 }))

describe('availableEncounters', () => {
  it('hides fishing Pokémon without a rod', () => {
    expect(availableEncounters(route12).some(e => e.requiresKeyItem)).toBe(false)
  })

  it('adds the ones your rods can catch', () => {
    const withOld = availableEncounters(route12, [rods[0]])
    expect(withOld.some(e => e.speciesId === 129)).toBe(true)  // Magikarp
    expect(withOld.some(e => e.speciesId === 90)).toBe(false)  // Shellder needs the Super Rod
    expect(availableEncounters(route12, rods).some(e => e.speciesId === 90)).toBe(true)
  })
})

describe('pickEncounter', () => {
  it('never picks a fishing Pokémon for a player without a rod', () => {
    const rng = seededRng(7)
    for (let i = 0; i < 300; i++) expect(pickEncounter(route12, rng).requiresKeyItem).toBeUndefined()
  })
})
