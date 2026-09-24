/**
 * Where each species can be found, worked out from the game data (wild
 * tables, evolutions, gifts, legendaries…) so the Pokédex can never drift out
 * of date with the world.
 */
import type { GiftDefinition, Trainer } from '../types'
import { KANTO_AREAS, AREA_MAP, STARTER_SPECIES_IDS, hasKeyItem } from '../data/areas'
import { CITY_HUBS } from '../data/cities'
import { EVOLUTIONS } from '../data/evolutions'
import { BADGE_NAMES } from '../data/gyms'
import { ITEM_MAP } from '../data/items'
import { KANTO_NAMES } from '../data/pokedex'
import { CHAMPION_GIFT } from '../data/league'

export type SpeciesSource =
  | { kind: 'wild'; areaId: string; minLevel: number; maxLevel: number; rodId?: string }
  | { kind: 'legendary'; areaId: string; level: number }
  | { kind: 'evolution'; fromId: number; atLevel: number; choice: boolean }
  | { kind: 'starter' }
  | { kind: 'storyteller'; cityId: string }
  /** Any NPC gift or trade, already described */
  | { kind: 'gift'; text: string }

function giftSpecies(gift: GiftDefinition): number[] {
  return gift.kind === 'pokemon' ? gift.speciesIds : []
}

function buildSources(): Map<number, SpeciesSource[]> {
  const sources = new Map<number, SpeciesSource[]>()
  const add = (id: number, source: SpeciesSource) => sources.set(id, [...(sources.get(id) ?? []), source])

  for (const area of KANTO_AREAS) {
    // One line per species per area, spanning all its level ranges
    const wild = new Map<string, SpeciesSource & { kind: 'wild' }>()
    for (const e of area.encounters) {
      const key = `${e.speciesId}|${e.requiresKeyItem ?? ''}`
      const prev = wild.get(key)
      wild.set(key, {
        kind: 'wild', areaId: area.id, rodId: e.requiresKeyItem,
        minLevel: Math.min(prev?.minLevel ?? e.minLevel, e.minLevel),
        maxLevel: Math.max(prev?.maxLevel ?? e.maxLevel, e.maxLevel),
      })
    }
    for (const [key, source] of wild) add(Number(key.split('|')[0]), source)

    if (area.legendary) add(area.legendary.speciesId, { kind: 'legendary', areaId: area.id, level: area.legendary.level })

    const reward = area.completionReward
    if (reward) {
      for (const id of giftSpecies(reward.gift)) {
        add(id, { kind: 'gift', text: `${reward.npcName} gives one away for exploring all of ${area.name}` })
      }
    }
  }

  for (const [cityId, hub] of Object.entries(CITY_HUBS)) {
    const city = AREA_MAP[cityId].name
    for (const id of hub.storyteller?.rareEncounter.speciesIds ?? []) add(id, { kind: 'storyteller', cityId })
    for (const house of hub.houses) {
      if (house.exchange) {
        const item = ITEM_MAP[house.exchange.takesKeyItemId]?.name ?? house.exchange.takesKeyItemId
        for (const id of giftSpecies(house.exchange.gives)) {
          add(id, { kind: 'gift', text: `Bring a ${item} to the ${house.name} in ${city}` })
        }
      }
      if (house.gift) {
        const badge = house.gift.requiredBadge
        const after = badge ? ` once you have the ${BADGE_NAMES[badge] ?? badge}` : ''
        for (const id of giftSpecies(house.gift.gift)) {
          add(id, { kind: 'gift', text: `${house.npcName} at the ${house.name} in ${city} gives one away${after}` })
        }
      }
    }
  }

  for (const id of giftSpecies(CHAMPION_GIFT.gift)) {
    add(id, { kind: 'gift', text: `${CHAMPION_GIFT.npcName} gives one to the new Pokémon League Champion` })
  }

  for (const id of STARTER_SPECIES_IDS) add(id, { kind: 'starter' })

  for (const [from, evo] of Object.entries(EVOLUTIONS)) {
    for (const into of evo.choices ?? [evo.evolvesIntoId]) {
      add(into, { kind: 'evolution', fromId: Number(from), atLevel: evo.atLevel, choice: !!evo.choices })
    }
  }

  return sources
}

/** The everyday ways to get a Pokémon come first, the special ones last */
const SOURCE_ORDER: SpeciesSource['kind'][] = ['starter', 'wild', 'evolution', 'storyteller', 'gift', 'legendary']

const SOURCES = new Map(
  [...buildSources()].map(([id, list]) => [
    id,
    // Wild areas go in the order a player reaches them (by level)
    [...list].sort((a, b) =>
      SOURCE_ORDER.indexOf(a.kind) - SOURCE_ORDER.indexOf(b.kind)
      || (a.kind === 'wild' && b.kind === 'wild' ? a.minLevel - b.minLevel : 0)),
  ]),
)

/** Every way to get a species, in the order the Pokédex shows them */
export function speciesSources(speciesId: number): SpeciesSource[] {
  return SOURCES.get(speciesId) ?? []
}

/** One source as a sentence for the Pokédex */
export function describeSource(source: SpeciesSource): string {
  switch (source.kind) {
    case 'wild': {
      const levels = source.minLevel === source.maxLevel ? `Lv. ${source.minLevel}` : `Lv. ${source.minLevel}–${source.maxLevel}`
      const rod = source.rodId ? `, fishing with the ${ITEM_MAP[source.rodId]?.name ?? source.rodId}` : ''
      return `${AREA_MAP[source.areaId].name} (${levels}${rod})`
    }
    case 'legendary':
      return `Legendary! It appears in ${AREA_MAP[source.areaId].name} once you’ve explored all of it (Lv. ${source.level})`
    case 'evolution': {
      const from = KANTO_NAMES[source.fromId]
      return source.choice
        ? `Evolve ${from} at level ${source.atLevel} (you choose what it becomes)`
        : `Evolve ${from} at level ${source.atLevel}`
    }
    case 'starter':
      return 'One of the three Pokémon new trainers can choose in Pallet Town'
    case 'storyteller':
      return `Answer the Storyteller’s question in ${AREA_MAP[source.cityId].name} correctly to meet one`
    case 'gift':
      return source.text
  }
}

/**
 * A nudge for a species the player hasn't seen yet, without naming it: points
 * at a place they've already been where it lives, if there is one.
 */
export function unseenHint(
  speciesId: number,
  trainer: Pick<Trainer, 'unlockedAreaIds' | 'keyItems'>,
): string {
  const nearby = speciesSources(speciesId).find(s =>
    s.kind === 'wild' && trainer.unlockedAreaIds.includes(s.areaId)
    && (!s.rodId || hasKeyItem(trainer.keyItems, s.rodId)))
  if (nearby?.kind === 'wild') return `It lives somewhere you’ve already been. Keep exploring ${AREA_MAP[nearby.areaId].name}!`
  return 'You haven’t met this Pokémon yet. Keep exploring Kanto to find it!'
}
