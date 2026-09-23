/** A house in a city whose NPC shares tips and Kanto lore */
export interface NpcHouse {
  id: string
  name: string
  icon: string
  npcName: string
  /** Shown one at a time */
  lines: string[]
}

export interface StorytellerDefinition {
  npcName: string
  /** Rare Pokémon offered for a correct first answer */
  rareEncounter: { speciesId: number; level: number }
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
