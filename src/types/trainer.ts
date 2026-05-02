import type { OwnedPokemon } from './pokemon'
import type { MathStats } from './math'

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
}
