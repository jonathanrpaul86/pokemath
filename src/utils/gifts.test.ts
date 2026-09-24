import { describe, expect, it } from 'vitest'
import { evolutionLine, giftChoices } from './gifts'

describe('evolutionLine', () => {
  it('follows a species all the way up', () => {
    expect(evolutionLine(1)).toEqual([1, 2, 3])
  })

  it('includes every branch', () => {
    expect(evolutionLine(133)).toEqual([133, 134, 135, 136])
  })
})

describe('giftChoices', () => {
  it('leaves out species whose line the player already caught', () => {
    const pokedex = { 5: { seen: true, caught: true } } // Charmeleon counts for Charmander
    expect(giftChoices([1, 4, 7], pokedex)).toEqual([1, 7])
  })

  it('offers everything once the player has caught them all', () => {
    const caught = { seen: true, caught: true }
    expect(giftChoices([1, 4, 7], { 1: caught, 4: caught, 7: caught })).toEqual([1, 4, 7])
  })

  it('does not count species only seen', () => {
    expect(giftChoices([107, 106], { 106: { seen: true, caught: false } })).toEqual([107, 106])
  })
})
