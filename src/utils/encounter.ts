import type { Area, EncounterEntry } from '../types'

export function pickEncounter(area: Area, rng: () => number = Math.random): EncounterEntry {
  const total = area.encounters.reduce((sum, e) => sum + e.weight, 0)
  let roll = rng() * total
  for (const entry of area.encounters) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return area.encounters[area.encounters.length - 1]
}

export function pickLevel(entry: EncounterEntry, rng: () => number = Math.random): number {
  return Math.floor(rng() * (entry.maxLevel - entry.minLevel + 1)) + entry.minLevel
}
