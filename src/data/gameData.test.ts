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

  it('are all reachable from Route 1', () => {
    const seen = new Set(['route-1'])
    const queue = ['route-1']
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

  it('stay inside the map canvas', () => {
    for (const a of KANTO_AREAS) {
      expect(a.mapX, a.id).toBeGreaterThan(0)
      expect(a.mapX, a.id).toBeLessThan(600)
      expect(a.mapY, a.id).toBeGreaterThan(0)
      expect(a.mapY, a.id).toBeLessThan(380)
    }
  })
})

describe('badges and gyms', () => {
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
    for (const [id, c] of Object.entries(CITY_HUBS)) {
      if (c.storyteller) expect(wild.has(c.storyteller.rareEncounter.speciesId), id).toBe(false)
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
