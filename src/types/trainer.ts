import type { OwnedPokemon } from './pokemon'
import type { MathStats } from './math'
import type { InventorySlot, BadgeId } from './items'

export interface PokedexEntry {
  seen: boolean
  caught: boolean
}

export interface Trainer {
  name: string
  level: number
  xp: number
  xpToNextLevel: number
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
  mathStats: MathStats
  money: number
  items: InventorySlot[]
  balls: InventorySlot[]
  keyItems: InventorySlot[]
  badges: BadgeId[]
  /** Multiplier applied to battle timer limits. 1 = normal, 1.5 = more time, 0.75 = less time */
  timerMultiplier?: number
  /** Unix ms timestamp of the last save — set by writeSave */
  savedAt?: number
}
