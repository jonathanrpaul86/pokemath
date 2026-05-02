import type { Area, EncounterEntry } from '../types'

export function pickEncounter(area: Area): EncounterEntry {
  const total = area.encounters.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * total
  for (const entry of area.encounters) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return area.encounters[area.encounters.length - 1]
}

export function pickLevel(entry: EncounterEntry): number {
  return Math.floor(Math.random() * (entry.maxLevel - entry.minLevel + 1)) + entry.minLevel
}
