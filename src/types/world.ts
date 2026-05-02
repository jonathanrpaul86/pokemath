/** One entry in an area's encounter table */
export interface EncounterEntry {
  speciesId: number
  /** Relative weight — higher = appears more often */
  weight: number
  minLevel: number
  maxLevel: number
}

export interface Area {
  id: string
  name: string
  description: string
  /** Trainer level required to unlock this area */
  requiredTrainerLevel: number
  encounters: EncounterEntry[]
  /** IDs of areas this one connects to */
  connectedAreaIds: string[]
}
