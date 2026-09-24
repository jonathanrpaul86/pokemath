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

/** A one-time gift from an NPC once an area is fully explored */
export interface AreaReward {
  npcName: string
  /** Shown one at a time, before the "You got …" line */
  lines: string[]
  keyItemId: string
}

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
  /** Position on the world map (see WORLD_BOUNDS in data/mapGrid) */
  mapX: number
  mapY: number
  /** 1–100 scalar driving math problem difficulty in this area */
  mathDifficulty: number
  /** Item IDs available for purchase at this area's Poké Mart (cities/towns only) */
  martItems?: string[]
  /** Badge required to enter this area for the first time */
  requiredBadge?: BadgeId
  /** Key item required (as well as any badge) to enter this area for the first time */
  requiredKeyItem?: string
  /** Given out once the area is fully explored */
  completionReward?: AreaReward
}
