import type { BadgeId } from './items'

/** One entry in an area's encounter table */
export interface EncounterEntry {
  speciesId: number
  /** Relative weight — higher = appears more often */
  weight: number
  minLevel: number
  maxLevel: number
  /** Only appears for players holding this key item (e.g. a fishing rod) */
  requiresKeyItem?: string
}

export type AreaType = 'city' | 'town' | 'route' | 'forest' | 'cave' | 'special'

/** Something an NPC hands over: a key item, or a Pokémon */
export type GiftDefinition =
  | { kind: 'key-item'; keyItemId: string }
  /** More than one species lets the player pick (from ones they haven't caught yet) */
  | { kind: 'pokemon'; speciesIds: number[]; level: number }

/** A legendary Pokémon that waits in a fully explored area until it's caught */
export interface LegendaryEncounter {
  speciesId: number
  level: number
  /** Hint shown before the player has met it */
  teaser: string
  /** Replaces the usual "A wild X appeared!" opener */
  intro: string
}

/** A one-time gift from an NPC once an area is fully explored */
export interface AreaReward {
  npcName: string
  /** Shown one at a time, before the gift is handed over */
  lines: string[]
  gift: GiftDefinition
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
  /** Appears once the area is fully explored, and stays until caught */
  legendary?: LegendaryEncounter
}
