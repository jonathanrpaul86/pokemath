import type { Area, Story, StoryTier, Trainer } from '../types'
import { STORIES } from '../data/stories'

/** Explores (anywhere) needed after a story before a Storyteller has a new one */
export const STORY_COOLDOWN_EXPLORES = 5

export function totalExplores(exploreProgress: Record<string, number>): number {
  return Object.values(exploreProgress).reduce((sum, n) => sum + n, 0)
}

/** Later cities tell longer, harder stories */
export function storyTierFor(area: Area): StoryTier {
  if (area.mathDifficulty < 50) return 1
  if (area.mathDifficulty < 75) return 2
  return 3
}

export type StoryStatus = { ready: true } | { ready: false; exploresLeft: number }

export function storyStatus(
  trainer: Pick<Trainer, 'storyteller' | 'exploreProgress'>,
  cityId: string,
): StoryStatus {
  const readyAt = trainer.storyteller.nextStoryAt[cityId] ?? 0
  const left = readyAt - totalExplores(trainer.exploreProgress)
  return left <= 0 ? { ready: true } : { ready: false, exploresLeft: left }
}

/** Prefer a story the player hasn't heard; once a tier is exhausted, repeats are fine */
export function pickStory(tier: StoryTier, heardStoryIds: string[], rng: () => number = Math.random): Story {
  const pool = STORIES.filter(s => s.tier === tier)
  const fresh = pool.filter(s => !heardStoryIds.includes(s.id))
  const candidates = fresh.length ? fresh : pool
  return candidates[Math.floor(rng() * candidates.length)]
}

/** Answer choices in a random order, remembering which one is correct */
export function shuffledChoices(story: Story, rng: () => number = Math.random): string[] {
  const choices = [story.correctAnswer, ...story.wrongAnswers]
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return choices
}
