import type { OwnedPokemon } from './pokemon'
import type { MathStats } from './math'
import type { InventorySlot, BadgeId } from './items'
import type { GymProgress } from './gym'
import type { StorytellerProgress } from './city'

export interface PokedexEntry {
  seen: boolean
  caught: boolean
}

export interface Trainer {
  name: string
  /** Active party — max 6 */
  party: OwnedPokemon[]
  /** Pokemon stored in PC — no size limit */
  pc: OwnedPokemon[]
  /** Keyed by species ID */
  pokedex: Record<number, PokedexEntry>
  /** ID of the current area/route */
  currentAreaId: string
  /** IDs of areas unlocked so far */
  unlockedAreaIds: string[]
  /** Counted explores per area — keyed by Area.id */
  exploreProgress: Record<string, number>
  mathStats: MathStats
  money: number
  items: InventorySlot[]
  balls: InventorySlot[]
  keyItems: InventorySlot[]
  badges: BadgeId[]
  /** Multiplier applied to battle timer limits. 1 = normal, 1.5 = more time, 0.75 = less time */
  timerMultiplier?: number
  /** Pick which move to attack with when fighting, instead of a random one. Off by default. */
  chooseMoves?: boolean
  /** Unix ms timestamp of the last save — set by writeSave */
  savedAt?: number
  /** Progress per gym — keyed by GymDefinition.id */
  gymProgress?: Record<string, GymProgress>
  storyteller: StorytellerProgress
  /** One-time gifts already handed out: area ids (completion rewards) and house ids */
  claimedRewardIds: string[]
  /** Every time the player beat the Pokémon League, with the team that did it */
  hallOfFame: HallOfFameEntry[]
}

export interface HallOfFameEntry {
  /** Unix ms */
  date: number
  team: { speciesId: number; name: string; level: number }[]
}
