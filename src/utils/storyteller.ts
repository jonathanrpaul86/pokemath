import type { Area, Story, StoryTier, StorytellerDefinition, Trainer } from '../types'
import { STORIES } from '../data/stories'
import { STARTER_SPECIES_IDS, STARTER_GIFT_AREA_ID } from '../data/areas'
import { uncaughtLines } from './gifts'

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

/**
 * The rare Pokémon a correct first answer earns, or null when the Storyteller
 * has none to offer. A missing starter is the first one (in Pokédex order) the
 * player hasn't caught, but the last one is left for Bill until his gift is
 * claimed, so between them the player gets each starter once and never twice.
 */
export function storytellerRare(
  storyteller: StorytellerDefinition,
  trainer: Pick<Trainer, 'pokedex' | 'claimedRewardIds'>,
): { speciesId: number; level: number } | null {
  const rare = storyteller.rareEncounter
  if ('speciesId' in rare) return rare
  const missing = uncaughtLines([...STARTER_SPECIES_IDS].sort((a, b) => a - b), trainer.pokedex)
  const leftForBill = trainer.claimedRewardIds.includes(STARTER_GIFT_AREA_ID) ? 0 : 1
  return missing.length > leftForBill ? { speciesId: missing[0], level: rare.level } : null
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
