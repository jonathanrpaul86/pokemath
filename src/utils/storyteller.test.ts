import { describe, expect, it } from 'vitest'
import { storyStatus, storyTierFor, pickStory, shuffledChoices, storytellerRare, totalExplores } from './storyteller'
import { giftChoices } from './gifts'
import { AREA_MAP, STARTER_SPECIES_IDS, STARTER_GIFT_AREA_ID } from '../data/areas'
import { CITY_HUBS } from '../data/cities'
import { STORIES } from '../data/stories'
import { makeTrainer, seededRng } from '../test/fixtures'

describe('totalExplores', () => {
  it('sums explores across all areas, including extra explores past completion', () => {
    expect(totalExplores({ 'route-1': 12, 'viridian-forest': 3 })).toBe(15)
  })
})

describe('storyStatus', () => {
  it('is ready when no story has been told in that city', () => {
    expect(storyStatus(makeTrainer(), 'viridian-city')).toEqual({ ready: true })
  })

  it('counts down explores until the next story', () => {
    const t = makeTrainer({
      exploreProgress: { 'route-1': 8 },
      storyteller: { heardStoryIds: [], nextStoryAt: { 'viridian-city': 11 } },
    })
    expect(storyStatus(t, 'viridian-city')).toEqual({ ready: false, exploresLeft: 3 })
    expect(storyStatus(t, 'pewter-city')).toEqual({ ready: true })
  })
})

describe('storyTierFor', () => {
  it('gives early cities easier stories', () => {
    expect(storyTierFor(AREA_MAP['viridian-city'])).toBe(1)
    expect(storyTierFor(AREA_MAP['celadon-city'])).toBe(2)
    expect(storyTierFor(AREA_MAP['cinnabar-island'])).toBe(3)
  })
})

describe('pickStory', () => {
  it('never repeats a story until the tier runs out', () => {
    const tier1 = STORIES.filter(s => s.tier === 1).map(s => s.id)
    const heard = tier1.slice(0, -1)
    expect(pickStory(1, heard, seededRng(1)).id).toBe(tier1[tier1.length - 1])
  })

  it('allows repeats once every story in the tier has been heard', () => {
    const tier1 = STORIES.filter(s => s.tier === 1).map(s => s.id)
    expect(tier1).toContain(pickStory(1, tier1, seededRng(2)).id)
  })
})

describe('storytellerRare', () => {
  const caught = { seen: true, caught: true }
  const lou = CITY_HUBS['cerulean-city'].storyteller!

  it('offers a set rare every time, even once it has been caught', () => {
    const eevee = CITY_HUBS['viridian-city'].storyteller!
    expect(storytellerRare(eevee, makeTrainer({ pokedex: { 133: caught } }))).toEqual({ speciesId: 133, level: 6 })
  })

  it('offers a starter the player is missing, never their own', () => {
    expect(storytellerRare(lou, makeTrainer({ pokedex: { 1: caught } }))?.speciesId).toBe(4)
    expect(storytellerRare(lou, makeTrainer({ pokedex: { 4: caught } }))?.speciesId).toBe(1)
    expect(storytellerRare(lou, makeTrainer({ pokedex: { 7: caught } }))?.speciesId).toBe(1)
  })

  it('leaves the last missing starter for Bill until his gift is claimed', () => {
    const pokedex = { 1: caught, 4: caught }
    expect(storytellerRare(lou, makeTrainer({ pokedex }))).toBeNull()
    expect(storytellerRare(lou, makeTrainer({ pokedex, claimedRewardIds: [STARTER_GIFT_AREA_ID] }))?.speciesId).toBe(7)
  })

  it('gives each starter exactly once, whichever the player starts with and whoever comes first', () => {
    const billsGift = AREA_MAP[STARTER_GIFT_AREA_ID].completionReward?.gift
    if (billsGift?.kind !== 'pokemon') throw new Error('Bill should give a Pokémon')
    for (const starter of STARTER_SPECIES_IDS) {
      for (const billFirst of [true, false]) {
        for (const billPick of [0, 1]) {
          const t = makeTrainer({ pokedex: { [starter]: caught } })
          const got: number[] = [starter]
          const receive = (id: number) => { got.push(id); t.pokedex[id] = caught }
          const hearStories = () => {
            for (let i = 0; i < 5; i++) {
              const rare = storytellerRare(lou, t)
              if (!rare) return
              receive(rare.speciesId)
            }
          }
          const visitBill = () => {
            const choices = giftChoices(billsGift.speciesIds, t.pokedex)
            receive(choices[Math.min(billPick, choices.length - 1)])
            t.claimedRewardIds.push(STARTER_GIFT_AREA_ID)
          }
          if (!billFirst) hearStories()
          visitBill()
          hearStories()
          expect(got.sort((a, b) => a - b), `starter ${starter}, ${billFirst ? 'Bill' : 'Storyteller'} first`).toEqual([1, 4, 7])
        }
      }
    }
  })
})

describe('shuffledChoices', () => {
  it('always includes every answer exactly once', () => {
    const rng = seededRng(4)
    for (const story of STORIES) {
      const choices = shuffledChoices(story, rng)
      expect([...choices].sort()).toEqual([story.correctAnswer, ...story.wrongAnswers].sort())
    }
  })
})
