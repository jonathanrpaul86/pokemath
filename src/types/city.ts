import type { BadgeId } from './items'
import type { GiftDefinition } from './world'

/** A house in a city whose NPC shares tips and Kanto lore */
export interface NpcHouse {
  id: string
  name: string
  icon: string
  npcName: string
  /** Shown one at a time */
  lines: string[]
  /** Trades a key item for a gift, if the player has the key item */
  exchange?: KeyItemExchange
  /** A one-time gift, once the player has the badge */
  gift?: HouseGift
}

export interface KeyItemExchange {
  takesKeyItemId: string
  gives: GiftDefinition
  /** Shown instead of the usual lines when the trade happens */
  lines: string[]
}

export interface HouseGift {
  requiredBadge?: BadgeId
  gift: GiftDefinition
  /** Shown instead of the usual lines when the gift is handed over */
  lines: string[]
}

export interface StorytellerDefinition {
  npcName: string
  /**
   * Rare Pokémon offered for a correct first answer: a set species, or
   * `missingStarter` for a starter the player doesn't have yet
   */
  rareEncounter: { speciesId: number; level: number } | { missingStarter: true; level: number }
}

/** The extra buildings a city has beyond its Center, Mart, and Gym */
export interface CityHubData {
  houses: NpcHouse[]
  storyteller?: StorytellerDefinition
}

export type StoryTier = 1 | 2 | 3

/** A short reading passage with one multiple-choice question */
export interface Story {
  id: string
  tier: StoryTier
  title: string
  /** One entry per paragraph */
  passage: string[]
  question: string
  correctAnswer: string
  wrongAnswers: string[]
}

export interface StorytellerProgress {
  heardStoryIds: string[]
  /** Total explores the player must reach before a city's Storyteller has a new story */
  nextStoryAt: Record<string, number>
}
