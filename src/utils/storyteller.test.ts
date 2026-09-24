import { describe, expect, it } from 'vitest'
import { storyStatus, storyTierFor, pickStory, shuffledChoices, storytellerRare, totalExplores } from './storyteller'
import { giftChoices } from './gifts'
import { AREA_MAP, STARTER_SPECIES_IDS } from '../data/areas'
import { CITY_HUBS } from '../data/cities'
import { STORIES } from '../data/stories'
import { makePokemon, makeTrainer, seededRng } from '../test/fixtures'

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
  const storyteller = (city: string) => CITY_HUBS[city].storyteller!

  /** A trainer whose party is these species, all in the Pokédex */
  const owning = (...speciesIds: number[]) => makeTrainer({
    party: speciesIds.map((speciesId, i) => makePokemon({ uid: `p${i}`, speciesId })),
    pokedex: Object.fromEntries(speciesIds.map(id => [id, caught])),
  })

  it('offers the rare until the player has caught it', () => {
    expect(storytellerRare(storyteller('lavender-town'), owning(4))).toEqual({ speciesId: 143, level: 26 })
    expect(storytellerRare(storyteller('lavender-town'), owning(4, 143))).toBeNull()
  })

  it('counts a caught rare that has since evolved', () => {
    const omastar = makeTrainer({ party: [makePokemon({ speciesId: 139 })], pokedex: { 138: caught, 139: caught } })
    expect(storytellerRare(storyteller('pewter-city'), omastar)).toBeNull()
  })

  it('keeps offering Eevee until there is one for each of its evolutions', () => {
    const ed = storyteller('viridian-city')
    expect(storytellerRare(ed, owning(4, 133, 133))?.speciesId).toBe(133)
    expect(storytellerRare(ed, owning(4, 133, 133, 133))).toBeNull()
    expect(storytellerRare(ed, owning(4, 134, 135, 133))).toBeNull() // Vaporeon, Jolteon, and an Eevee for Flareon
    expect(storytellerRare(ed, owning(4, 134, 134, 133))?.speciesId).toBe(133) // two Vaporeon leave one short
  })

  it('offers a starter the player is missing, never their own', () => {
    expect(storytellerRare(storyteller('cerulean-city'), owning(1))?.speciesId).toBe(4)
    expect(storytellerRare(storyteller('cerulean-city'), owning(4))?.speciesId).toBe(1)
    expect(storytellerRare(storyteller('cerulean-city'), owning(9))?.speciesId).toBe(1) // Blastoise counts as Squirtle
  })

  it('leaves the last one for the gift it shares until that gift is claimed', () => {
    expect(storytellerRare(storyteller('cerulean-city'), owning(1, 4))).toBeNull()
    expect(storytellerRare(storyteller('cerulean-city'), { ...owning(1, 4), claimedRewardIds: ['route-25'] })?.speciesId).toBe(7)
  })

  /**
   * Plays a save through a Storyteller and the gift it shares its rares with,
   * meeting either first, and returns every species the player ends up with
   */
  function collect(city: string, start: number[], giftFirst: boolean, giftPick: number): number[] {
    const claimId = storyteller(city).rareEncounter.sharedWithGiftId!
    const gift = AREA_MAP[claimId]?.completionReward?.gift
      ?? Object.values(CITY_HUBS).flatMap(c => c.houses).find(h => h.id === claimId)?.gift?.gift
    if (gift?.kind !== 'pokemon') throw new Error(`${claimId} should give a Pokémon`)
    const t = owning(...start)
    const receive = (speciesId: number) => {
      t.party.push(makePokemon({ uid: `p${t.party.length}`, speciesId }))
      t.pokedex[speciesId] = caught
    }
    const hearStories = () => {
      for (let i = 0; i < 5; i++) {
        const rare = storytellerRare(storyteller(city), t)
        if (!rare) return
        receive(rare.speciesId)
      }
    }
    if (!giftFirst) hearStories()
    const choices = giftChoices(gift.speciesIds, t.pokedex)
    receive(choices[Math.min(giftPick, choices.length - 1)])
    t.claimedRewardIds.push(claimId)
    hearStories()
    return t.party.map(p => p.speciesId).sort((a, b) => a - b)
  }

  it('gives each starter once, whichever the player picks and whoever they meet first', () => {
    for (const starter of STARTER_SPECIES_IDS) {
      for (const giftFirst of [true, false]) {
        for (const pick of [0, 1]) {
          expect(collect('cerulean-city', [starter], giftFirst, pick), `starter ${starter}, pick ${pick}`).toEqual([1, 4, 7])
        }
      }
    }
  })

  it('gives Hitmonlee and Hitmonchan once each, whether the Dojo or the Storyteller comes first', () => {
    for (const giftFirst of [true, false]) {
      for (const pick of [0, 1]) expect(collect('saffron-city', [], giftFirst, pick), `pick ${pick}`).toEqual([106, 107])
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
