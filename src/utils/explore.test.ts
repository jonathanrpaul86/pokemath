import { describe, expect, it } from 'vitest'
import { rollExploreOutcome, createRouteTrainer, rollLootItem, canExplore } from './explore'
import { AREA_MAP } from '../data/areas'
import { ITEM_MAP } from '../data/items'
import { seededRng } from '../test/fixtures'
import type { ExploreOutcomeKind } from '../types'

const area = (id: string) => AREA_MAP[id]

describe('canExplore', () => {
  it('is true for wild areas and false for cities', () => {
    expect(canExplore(area('route-1'))).toBe(true)
    expect(canExplore(area('pewter-city'))).toBe(false)
  })
})

describe('rollExploreOutcome', () => {
  it('matches the intended mix over many rolls', () => {
    const rng = seededRng(7)
    const counts: Record<ExploreOutcomeKind, number> = { wild: 0, trainer: 0, item: 0, money: 0, nothing: 0 }
    const N = 20_000
    for (let i = 0; i < N; i++) counts[rollExploreOutcome(area('route-1'), rng).kind]++
    expect(counts.wild / N).toBeCloseTo(0.64, 1)
    expect(counts.trainer / N).toBeCloseTo(0.12, 1)
    expect(counts.item / N).toBeCloseTo(0.12, 1)
    expect(counts.money / N).toBeCloseTo(0.06, 1)
    expect(counts.nothing / N).toBeCloseTo(0.06, 1)
  })

  it('pays more money later in the journey', () => {
    const maxMoney = (id: string) => {
      const rng = seededRng(3)
      let max = 0
      for (let i = 0; i < 5_000; i++) {
        const o = rollExploreOutcome(area(id), rng)
        if (o.kind === 'money') max = Math.max(max, o.amount)
      }
      return max
    }
    expect(maxMoney('victory-road')).toBeGreaterThan(maxMoney('route-1'))
  })
})

describe('rollLootItem', () => {
  it('only gives real items, scaling up with progression', () => {
    const rng = seededRng(11)
    const early = new Set(Array.from({ length: 500 }, () => rollLootItem(area('route-1'), rng)))
    const late = new Set(Array.from({ length: 500 }, () => rollLootItem(area('victory-road'), rng)))
    for (const id of [...early, ...late]) expect(ITEM_MAP[id], id).toBeDefined()
    expect(early).toEqual(new Set(['potion', 'poke-ball']))
    expect(late.has('full-restore')).toBe(true)
    expect(late.has('potion')).toBe(false)
  })
})

describe('createRouteTrainer', () => {
  it('builds a team from the area’s own encounter table and levels', () => {
    const forest = area('viridian-forest')
    const rng = seededRng(5)
    for (let i = 0; i < 50; i++) {
      const t = createRouteTrainer(forest, rng)
      for (const p of t.team) {
        const entry = forest.encounters.find(e => e.speciesId === p.speciesId)
        expect(entry, `species ${p.speciesId}`).toBeDefined()
        expect(p.level).toBeGreaterThanOrEqual(entry!.minLevel)
        expect(p.level).toBeLessThanOrEqual(entry!.maxLevel)
      }
    }
  })

  it('uses area-appropriate trainer classes', () => {
    const rng = seededRng(9)
    for (let i = 0; i < 20; i++) expect(createRouteTrainer(area('pokemon-tower'), rng).name).toMatch(/^Channeler /)
  })

  it('sends bigger teams later in the game', () => {
    const rng = seededRng(13)
    const early = Array.from({ length: 50 }, () => createRouteTrainer(area('route-1'), rng).team.length)
    const late = Array.from({ length: 50 }, () => createRouteTrainer(area('victory-road'), rng).team.length)
    expect(Math.max(...early)).toBe(1)
    expect(Math.min(...late)).toBeGreaterThanOrEqual(2)
  })
})
