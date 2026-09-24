import type { Area, Story, StoryTier, StorytellerDefinition, Trainer } from '../types'
import { STORIES } from '../data/stories'
import { EVOLUTIONS } from '../data/evolutions'
import { evolutionLine } from './gifts'

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

type StorytellerTrainer = Pick<Trainer, 'pokedex' | 'party' | 'pc' | 'claimedRewardIds'>

/**
 * Whether the player needs another of a species to catch everything it can
 * evolve into: one is enough, but Eevee takes one for each of its evolutions
 */
function needsAnother(speciesId: number, trainer: StorytellerTrainer): boolean {
  const line = evolutionLine(speciesId)
  const uncaughtFinalForms = line.filter(id => !EVOLUTIONS[id] && !trainer.pokedex[id]?.caught).length
  const stillToEvolve = [...trainer.party, ...trainer.pc]
    .filter(p => line.includes(p.speciesId) && EVOLUTIONS[p.speciesId]).length
  return uncaughtFinalForms > stillToEvolve
}

/**
 * The rare Pokémon a correct first answer earns: the first of the Storyteller's
 * species the player still needs, or null once they need none (the backup item
 * instead). A gift that shares the species keeps the last one until it's claimed.
 */
export function storytellerRare(
  storyteller: StorytellerDefinition,
  trainer: StorytellerTrainer,
): { speciesId: number; level: number } | null {
  const { speciesIds, level, sharedWithGiftId } = storyteller.rareEncounter
  const needed = speciesIds.filter(id => needsAnother(id, trainer))
  const leftForGift = sharedWithGiftId && !trainer.claimedRewardIds.includes(sharedWithGiftId) ? 1 : 0
  return needed.length > leftForGift ? { speciesId: needed[0], level } : null
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
