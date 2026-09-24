import type { Area, EncounterEntry, InventorySlot } from '../types'
import { hasKeyItem } from '../data/areas'

/** The area's encounters this player can meet: fishing ones need the right rod */
export function availableEncounters(area: Area, keyItems: InventorySlot[] = []): EncounterEntry[] {
  return area.encounters.filter(e => !e.requiresKeyItem || hasKeyItem(keyItems, e.requiresKeyItem))
}

export function pickEncounter(
  area: Area,
  rng: () => number = Math.random,
  keyItems: InventorySlot[] = [],
): EncounterEntry {
  const encounters = availableEncounters(area, keyItems)
  const total = encounters.reduce((sum, e) => sum + e.weight, 0)
  let roll = rng() * total
  for (const entry of encounters) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return encounters[encounters.length - 1]
}

export function pickLevel(entry: EncounterEntry, rng: () => number = Math.random): number {
  return Math.floor(rng() * (entry.maxLevel - entry.minLevel + 1)) + entry.minLevel
}
