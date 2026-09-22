import type { BadgeId } from './items'

/** One entry in an area's encounter table */
export interface EncounterEntry {
  speciesId: number
  /** Relative weight — higher = appears more often */
  weight: number
  minLevel: number
  maxLevel: number
}

export type AreaType = 'city' | 'town' | 'route' | 'forest' | 'cave' | 'special'

export interface Area {
  id: string
  name: string
  description: string
  areaType: AreaType
  encounters: EncounterEntry[]
  /**
   * Counted explores needed before the player can move on to a NEW area from
   * here. 0 for areas with no wild Pokémon (cities, towns).
   */
  exploresToComplete: number
  /** IDs of areas this one connects to */
  connectedAreaIds: string[]
  /** Position on the world map canvas (internal 600×380 coordinate space) */
  mapX: number
  mapY: number
  /** 1–100 scalar driving math problem difficulty in this area */
  mathDifficulty: number
  /** Item IDs available for purchase at this area's Poké Mart (cities/towns only) */
  martItems?: string[]
  /** Badge required to enter this area for the first time */
  requiredBadge?: BadgeId
}
