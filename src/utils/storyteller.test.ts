import { describe, expect, it } from 'vitest'
import { storyStatus, storyTierFor, pickStory, shuffledChoices, totalExplores } from './storyteller'
import { AREA_MAP } from '../data/areas'
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

describe('shuffledChoices', () => {
  it('always includes every answer exactly once', () => {
    const rng = seededRng(4)
    for (const story of STORIES) {
      const choices = shuffledChoices(story, rng)
      expect([...choices].sort()).toEqual([story.correctAnswer, ...story.wrongAnswers].sort())
    }
  })
})
