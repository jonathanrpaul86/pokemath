/**
 * Consistency checks across the hand-written game data. These are the tests
 * that catch typos when adding new areas, gyms, cities, or stories.
 */
import { describe, expect, it } from 'vitest'
import { KANTO_AREAS, AREA_MAP } from './areas'
import { KANTO_GYMS, BADGE_NAMES } from './gyms'
import { CITY_HUBS, hasCityHub } from './cities'
import { STORIES } from './stories'
import { ITEM_MAP } from './items'
import { KANTO_NAMES } from './pokedex'
import { WORLD_BOUNDS } from './mapGrid'
import { EVOLUTIONS } from './evolutions'
import { STARTER_SPECIES_IDS } from './areas'
import { evolutionLine } from '../utils/gifts'
import { POKEMON_LEAGUE, CHAMPION_GIFT, LEAGUE_AREA_ID } from './league'
import type { GiftDefinition } from '../types'

/** Every gift an NPC can hand out: area rewards, house trades, and house gifts */
const ALL_GIFTS: { source: string; gift: GiftDefinition }[] = [
  ...KANTO_AREAS.flatMap(a => a.completionReward ? [{ source: a.id, gift: a.completionReward.gift }] : []),
  { source: 'hall-of-fame', gift: CHAMPION_GIFT.gift },
  ...Object.values(CITY_HUBS).flatMap(c => c.houses).flatMap(h => [
    ...(h.exchange ? [{ source: h.id, gift: h.exchange.gives }] : []),
    ...(h.gift ? [{ source: h.id, gift: h.gift.gift }] : []),
  ]),
]

/** Every species a Storyteller can offer */
const STORYTELLER_RARES = Object.entries(CITY_HUBS).flatMap(([city, c]) =>
  (c.storyteller?.rareEncounter.speciesIds ?? []).map(speciesId => ({ city, speciesId })))

describe('areas', () => {
  it('have unique ids', () => {
    const ids = KANTO_AREAS.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only connect to areas that exist', () => {
    for (const a of KANTO_AREAS) {
      for (const id of a.connectedAreaIds) expect(AREA_MAP[id], `${a.id} → ${id}`).toBeDefined()
    }
  })

  it('connect both ways', () => {
    for (const a of KANTO_AREAS) {
      for (const id of a.connectedAreaIds) {
        expect(AREA_MAP[id].connectedAreaIds, `${id} should link back to ${a.id}`).toContain(a.id)
      }
    }
  })

  it('are all reachable from Pallet Town', () => {
    const seen = new Set(['pallet-town'])
    const queue = ['pallet-town']
    while (queue.length) {
      for (const id of AREA_MAP[queue.shift()!].connectedAreaIds) {
        if (!seen.has(id)) { seen.add(id); queue.push(id) }
      }
    }
    expect([...seen].sort()).toEqual(KANTO_AREAS.map(a => a.id).sort())
  })

  it('need explores exactly when they have wild Pokémon', () => {
    for (const a of KANTO_AREAS) {
      if (a.encounters.length) expect(a.exploresToComplete, a.id).toBeGreaterThan(0)
      else expect(a.exploresToComplete, a.id).toBe(0)
    }
  })

  it('have sane encounter tables', () => {
    for (const a of KANTO_AREAS) {
      for (const e of a.encounters) {
        expect(e.weight, a.id).toBeGreaterThan(0)
        expect(e.minLevel, a.id).toBeLessThanOrEqual(e.maxLevel)
        expect(e.speciesId, a.id).toBeGreaterThanOrEqual(1)
        expect(e.speciesId, a.id).toBeLessThanOrEqual(151)
      }
    }
  })

  it('only stock items that exist', () => {
    for (const a of KANTO_AREAS) {
      for (const itemId of a.martItems ?? []) expect(ITEM_MAP[itemId], `${a.id}: ${itemId}`).toBeDefined()
    }
  })

  it('stay inside the world map', () => {
    for (const a of KANTO_AREAS) {
      expect(a.mapX, a.id).toBeGreaterThan(0)
      expect(a.mapX, a.id).toBeLessThan(WORLD_BOUNDS.width)
      expect(a.mapY, a.id).toBeGreaterThan(0)
      expect(a.mapY, a.id).toBeLessThan(WORLD_BOUNDS.height)
    }
  })

  it('sit far enough apart that their map nodes do not overlap', () => {
    for (const a of KANTO_AREAS) {
      for (const b of KANTO_AREAS) {
        if (a.id >= b.id) continue
        expect(Math.hypot(a.mapX - b.mapX, a.mapY - b.mapY), `${a.id} / ${b.id}`).toBeGreaterThanOrEqual(90)
      }
    }
  })
})

/**
 * Every area reachable with these badges, collecting the key items that
 * completion rewards and item trades hand out along the way
 */
function reachableWith(badges: string[]): Set<string> {
  const keyItems = new Set<string>()
  for (;;) {
    const seen = new Set(['pallet-town'])
    const queue = ['pallet-town']
    while (queue.length) {
      for (const id of AREA_MAP[queue.shift()!].connectedAreaIds) {
        const { requiredBadge, requiredKeyItem } = AREA_MAP[id]
        if (seen.has(id)) continue
        if (requiredBadge && !badges.includes(requiredBadge)) continue
        if (requiredKeyItem && !keyItems.has(requiredKeyItem)) continue
        seen.add(id)
        queue.push(id)
      }
    }
    const before = keyItems.size
    const addGift = (gift: GiftDefinition) => { if (gift.kind === 'key-item') keyItems.add(gift.keyItemId) }
    for (const id of seen) {
      const reward = AREA_MAP[id].completionReward
      if (reward) addGift(reward.gift)
      for (const house of CITY_HUBS[id]?.houses ?? []) {
        if (house.exchange && keyItems.has(house.exchange.takesKeyItemId)) addGift(house.exchange.gives)
      }
    }
    if (keyItems.size === before) return seen
  }
}

describe('key items', () => {
  const keyItem = (id: string) => ITEM_MAP[id]?.pocket === 'key-item'

  it('gates and rewards only use real key items', () => {
    for (const a of KANTO_AREAS) {
      if (a.requiredKeyItem) expect(keyItem(a.requiredKeyItem), a.id).toBe(true)
      for (const e of a.encounters) if (e.requiresKeyItem) expect(keyItem(e.requiresKeyItem), a.id).toBe(true)
    }
    for (const house of Object.values(CITY_HUBS).flatMap(c => c.houses)) {
      if (house.exchange) expect(keyItem(house.exchange.takesKeyItemId), house.id).toBe(true)
    }
    for (const { source, gift } of ALL_GIFTS) {
      if (gift.kind === 'key-item') expect(keyItem(gift.keyItemId), source).toBe(true)
    }
  })

  it('can all be found somewhere, if an area or encounter needs one', () => {
    const given = new Set(ALL_GIFTS.flatMap(({ gift }) => gift.kind === 'key-item' ? [gift.keyItemId] : []))
    for (const a of KANTO_AREAS) {
      if (a.requiredKeyItem) expect(given.has(a.requiredKeyItem), a.id).toBe(true)
      for (const e of a.encounters) if (e.requiresKeyItem) expect(given.has(e.requiresKeyItem), a.id).toBe(true)
    }
  })

  it('leave every explorable area with Pokémon you can meet without one', () => {
    for (const a of KANTO_AREAS.filter(a => a.encounters.length)) {
      expect(a.encounters.some(e => !e.requiresKeyItem), a.id).toBe(true)
    }
  })

  it('say where to get them when they open an area', () => {
    for (const a of KANTO_AREAS) {
      if (a.requiredKeyItem) expect(ITEM_MAP[a.requiredKeyItem].howToGet, a.id).toBeTruthy()
    }
  })

  it('only reward areas that have something to explore', () => {
    for (const a of KANTO_AREAS) {
      if (a.completionReward) expect(a.exploresToComplete, a.id).toBeGreaterThan(0)
    }
  })

  it('open every gated area once all badges are earned', () => {
    const seen = reachableWith(KANTO_GYMS.map(g => g.leader.badge))
    expect([...seen].sort()).toEqual(KANTO_AREAS.map(a => a.id).sort())
  })
})

describe('gifts', () => {
  it('give real Kanto Pokémon at sensible levels', () => {
    for (const { source, gift } of ALL_GIFTS) {
      if (gift.kind !== 'pokemon') continue
      expect(gift.speciesIds.length, source).toBeGreaterThan(0)
      for (const id of gift.speciesIds) expect(KANTO_NAMES[id], source).toBeDefined()
      expect(gift.level, source).toBeGreaterThan(0)
      expect(gift.level, source).toBeLessThanOrEqual(100)
    }
  })

  it('have unique ids, so each one-time gift is tracked separately', () => {
    const ids = [...KANTO_AREAS.filter(a => a.completionReward).map(a => a.id), ...Object.values(CITY_HUBS).flatMap(c => c.houses).filter(h => h.gift).map(h => h.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('Pokédex', () => {
  it('has every one of the 151 obtainable', () => {
    const obtainable = new Set<number>([
      ...STARTER_SPECIES_IDS,
      ...KANTO_AREAS.flatMap(a => a.encounters.map(e => e.speciesId)),
      ...STORYTELLER_RARES.map(r => r.speciesId),
      ...ALL_GIFTS.flatMap(({ gift }) => gift.kind === 'pokemon' ? gift.speciesIds : []),
      ...KANTO_AREAS.flatMap(a => a.legendary ? [a.legendary.speciesId] : []),
    ].flatMap(evolutionLine))
    const missing = Object.keys(KANTO_NAMES).map(Number).filter(id => !obtainable.has(id))
    expect(missing).toEqual([])
  })

  it('has each legendary in exactly one explorable area, and never in the wild', () => {
    const legendaries = KANTO_AREAS.flatMap(a => a.legendary ? [a.legendary.speciesId] : [])
    expect(legendaries.sort((a, b) => a - b)).toEqual([144, 145, 146, 150])
    const wild = new Set(KANTO_AREAS.flatMap(a => a.encounters.map(e => e.speciesId)))
    for (const a of KANTO_AREAS.filter(a => a.legendary)) {
      expect(a.exploresToComplete, a.id).toBeGreaterThan(0)
      expect(wild.has(a.legendary!.speciesId), a.id).toBe(false)
    }
  })

  it('offers evolution choices that are real species', () => {
    for (const [id, evo] of Object.entries(EVOLUTIONS)) {
      for (const choice of evo.choices ?? []) expect(KANTO_NAMES[choice], id).toBeDefined()
      if (evo.choices) expect(evo.choices, id).toContain(evo.evolvesIntoId)
    }
  })
})

describe('Pokémon League', () => {
  it('is four Elite Four members and then the Champion', () => {
    expect(POKEMON_LEAGUE.map(m => m.title)).toEqual(['Elite Four', 'Elite Four', 'Elite Four', 'Elite Four', 'Champion'])
    expect(new Set(POKEMON_LEAGUE.map(m => m.id)).size).toBe(POKEMON_LEAGUE.length)
  })

  it('uses real species, getting stronger with each opponent', () => {
    const strongest = POKEMON_LEAGUE.map(m => Math.max(...m.team.map(p => p.level)))
    for (const m of POKEMON_LEAGUE) {
      for (const p of m.team) expect(KANTO_NAMES[p.speciesId], m.id).toBeDefined()
    }
    expect([...strongest].sort((a, b) => a - b)).toEqual(strongest)
  })

  it('is stronger than Giovanni, and sits in a real city', () => {
    const giovanniAce = Math.max(...KANTO_GYMS[KANTO_GYMS.length - 1].leader.team.map(p => p.level))
    expect(Math.min(...POKEMON_LEAGUE[0].team.map(p => p.level))).toBeGreaterThanOrEqual(giovanniAce)
    expect(AREA_MAP[LEAGUE_AREA_ID].areaType).toBe('city')
  })
})

describe('badges and gyms', () => {
  it('each gym can be reached with only the badges from the gyms before it', () => {
    KANTO_GYMS.forEach((gym, i) => {
      const seen = reachableWith(KANTO_GYMS.slice(0, i).map(g => g.leader.badge))
      expect(seen.has(gym.cityAreaId), `${gym.id} with ${i} badges`).toBe(true)
    })
  })

  it('every badge can be earned from exactly one gym', () => {
    const earned = KANTO_GYMS.map(g => g.leader.badge).sort()
    expect(earned).toEqual(Object.keys(BADGE_NAMES).sort())
  })

  it('every badge gate uses a badge that exists', () => {
    for (const a of KANTO_AREAS) {
      if (a.requiredBadge) expect(BADGE_NAMES[a.requiredBadge], a.id).toBeDefined()
    }
  })

  it('gyms sit in real areas that have a city hub', () => {
    for (const g of KANTO_GYMS) {
      const city = AREA_MAP[g.cityAreaId]
      expect(city, g.id).toBeDefined()
      expect(hasCityHub(city), g.id).toBe(true)
    }
  })

  it('every leader has a post-game rematch that is tougher than the first battle', () => {
    const aces = KANTO_GYMS.map(g => {
      const rematch = g.leader.rematch
      expect(rematch, g.id).toBeDefined()
      for (const p of rematch!.team) expect(KANTO_NAMES[p.speciesId], g.id).toBeDefined()
      const ace = Math.max(...rematch!.team.map(p => p.level))
      expect(ace, g.id).toBeGreaterThan(Math.max(...g.leader.team.map(p => p.level)))
      return ace
    })
    expect([...aces].sort((a, b) => a - b)).toEqual(aces) // tougher in gym order
  })

  it('gym Pokémon are real Kanto species with sensible levels', () => {
    for (const g of KANTO_GYMS) {
      for (const p of [...g.trainers.flatMap(t => t.team), ...g.leader.team]) {
        expect(p.speciesId, g.id).toBeGreaterThanOrEqual(1)
        expect(p.speciesId, g.id).toBeLessThanOrEqual(151)
        expect(p.level, g.id).toBeGreaterThan(0)
        expect(p.level, g.id).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('cities', () => {
  it('are defined only for real areas', () => {
    for (const id of Object.keys(CITY_HUBS)) expect(AREA_MAP[id], id).toBeDefined()
  })

  it('have unique house ids with something to say', () => {
    const ids = Object.values(CITY_HUBS).flatMap(c => c.houses.map(h => h.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of Object.values(CITY_HUBS)) {
      for (const h of c.houses) expect(h.lines.length, h.id).toBeGreaterThan(0)
    }
  })

  it('offer Storyteller rares that are not already in any wild area', () => {
    const wild = new Set(KANTO_AREAS.flatMap(a => a.encounters.map(e => e.speciesId)))
    for (const { city, speciesId } of STORYTELLER_RARES) expect(wild.has(speciesId), city).toBe(false)
  })

  it('give Storyteller backup items that go in the Bag', () => {
    for (const [id, c] of Object.entries(CITY_HUBS)) {
      if (c.storyteller) expect(ITEM_MAP[c.storyteller.backupItemId]?.pocket, id).toMatch(/^(item|ball)$/)
    }
  })

  it('share Storyteller rares only with a one-time gift of the same species', () => {
    const oneTimeGifts = new Map<string, GiftDefinition>([
      ...KANTO_AREAS.flatMap(a => a.completionReward ? [[a.id, a.completionReward.gift] as const] : []),
      ...Object.values(CITY_HUBS).flatMap(c => c.houses).flatMap(h => h.gift ? [[h.id, h.gift.gift] as const] : []),
    ])
    for (const [id, c] of Object.entries(CITY_HUBS)) {
      const rare = c.storyteller?.rareEncounter
      if (!rare?.sharedWithGiftId) continue
      const gift = oneTimeGifts.get(rare.sharedWithGiftId)
      const given = gift?.kind === 'pokemon' ? [...gift.speciesIds].sort((a, b) => a - b) : []
      expect(given, id).toEqual([...rare.speciesIds].sort((a, b) => a - b))
    }
  })
})

describe('stories', () => {
  it('have unique ids', () => {
    const ids = STORIES.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('exist for every tier', () => {
    for (const tier of [1, 2, 3] as const) {
      expect(STORIES.filter(s => s.tier === tier).length, `tier ${tier}`).toBeGreaterThan(0)
    }
  })

  it('offer 3 choices in tiers 1–2 and 4 in tier 3, all different', () => {
    for (const s of STORIES) {
      const choices = [s.correctAnswer, ...s.wrongAnswers]
      expect(choices.length, s.id).toBe(s.tier === 3 ? 4 : 3)
      expect(new Set(choices).size, s.id).toBe(choices.length)
    }
  })

  it('have a passage and a question', () => {
    for (const s of STORIES) {
      expect(s.passage.length, s.id).toBeGreaterThan(0)
      expect(s.question.endsWith('?'), s.id).toBe(true)
    }
  })
})
