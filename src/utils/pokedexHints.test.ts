import { describe, expect, it } from 'vitest'
import { speciesSources, describeSource, unseenHint } from './pokedexHints'
import { KANTO_NAMES } from '../data/pokedex'
import { makeTrainer } from '../test/fixtures'

const described = (id: number) => speciesSources(id).map(describeSource)

describe('speciesSources', () => {
  it('gives every one of the 151 at least one way to find it', () => {
    for (const id of Object.keys(KANTO_NAMES).map(Number)) {
      expect(described(id).length, KANTO_NAMES[id]).toBeGreaterThan(0)
      for (const text of described(id)) expect(text.length, KANTO_NAMES[id]).toBeGreaterThan(0)
    }
  })

  it('names the area, levels, and rod for wild Pokémon', () => {
    expect(described(129)).toContain('Route 12 (Lv. 30–35, fishing with the Old Rod)') // Magikarp
    expect(described(16)).toContain('Route 1 (Lv. 2–4)')                               // Pidgey
  })

  it('explains evolutions, including branching ones', () => {
    expect(described(26)).toContain('Evolve Pikachu at level 30')
    expect(described(135)).toContain('Evolve Eevee at level 30 (you choose what it becomes)')
  })

  it('covers gifts, trades, legendaries, and the Champion prize', () => {
    expect(described(140).some(t => t.includes('Dome Fossil') && t.includes('Cinnabar Island'))).toBe(true) // Kabuto
    expect(described(4).some(t => t.includes('Bill'))).toBe(true)                                           // Charmander
    expect(described(145).some(t => t.startsWith('Legendary!') && t.includes('Power Plant'))).toBe(true)    // Zapdos
    expect(described(151).some(t => t.includes('Champion'))).toBe(true)                                     // Mew
    expect(described(107).some(t => t.includes('Storyteller') && t.includes('Saffron City'))).toBe(true)    // Hitmonchan
  })
})

describe('unseenHint', () => {
  it('points at a visited area where the Pokémon lives', () => {
    const t = makeTrainer({ unlockedAreaIds: ['pallet-town', 'route-1'] })
    expect(unseenHint(16, t)).toContain('Route 1')
  })

  it('stays vague when it lives nowhere the player has been', () => {
    const t = makeTrainer({ unlockedAreaIds: ['pallet-town', 'route-1'] })
    expect(unseenHint(145, t)).not.toContain('Power Plant')
  })

  it('only counts fishing spots when the player has that rod', () => {
    const noRod = makeTrainer({ unlockedAreaIds: ['route-4'] })
    expect(unseenHint(129, noRod)).not.toContain('Route 4')
    const withRod = makeTrainer({ unlockedAreaIds: ['route-4'], keyItems: [{ itemId: 'old-rod', quantity: 1 }] })
    expect(unseenHint(129, withRod)).toContain('Route 4')
  })
})
