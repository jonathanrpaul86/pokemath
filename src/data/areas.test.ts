import { describe, expect, it } from 'vitest'
import { AREA_MAP, travelBlocker, isAreaExplored, exploresDone, meetsBadgeRequirement, unclaimedReward, legendaryAvailable } from './areas'
import { makeTrainer } from '../test/fixtures'

const area = (id: string) => AREA_MAP[id]

describe('isAreaExplored / exploresDone', () => {
  it('treats cities as always explored', () => {
    expect(isAreaExplored(area('viridian-city'), {})).toBe(true)
  })

  it('needs the full explore count in wild areas', () => {
    expect(isAreaExplored(area('route-1'), { 'route-1': 7 })).toBe(false)
    expect(isAreaExplored(area('route-1'), { 'route-1': 8 })).toBe(true)
  })

  it('caps the displayed count at the requirement', () => {
    expect(exploresDone(area('route-1'), { 'route-1': 30 })).toBe(8)
  })
})

describe('travelBlocker', () => {
  it('blocks leaving an unexplored area for somewhere new', () => {
    const t = makeTrainer({ exploreProgress: { 'route-1': 3 } })
    expect(travelBlocker(area('route-1'), area('viridian-city'), t)).toBe('explore')
  })

  it('allows moving on once the area is fully explored', () => {
    const t = makeTrainer({ exploreProgress: { 'route-1': 8 } })
    expect(travelBlocker(area('route-1'), area('viridian-city'), t)).toBeNull()
  })

  it('always allows retreating to a visited area', () => {
    const t = makeTrainer({
      currentAreaId: 'viridian-forest',
      unlockedAreaIds: ['route-1', 'viridian-city', 'viridian-forest'],
      exploreProgress: { 'route-1': 8, 'viridian-forest': 2 },
    })
    expect(travelBlocker(area('viridian-forest'), area('viridian-city'), t)).toBeNull()
  })

  it('lets cities lead anywhere new, since they count as explored', () => {
    const t = makeTrainer({ unlockedAreaIds: ['route-1', 'viridian-city'] })
    expect(travelBlocker(area('viridian-city'), area('viridian-forest'), t)).toBeNull()
  })

  it('checks the badge before the explore requirement', () => {
    const t = makeTrainer({ unlockedAreaIds: ['pewter-city'] })
    expect(travelBlocker(area('pewter-city'), area('route-3'), t)).toBe('badge')
  })

  it('lets a badge holder through the gate', () => {
    const t = makeTrainer({ unlockedAreaIds: ['pewter-city'], badges: ['boulder-badge'] })
    expect(travelBlocker(area('pewter-city'), area('route-3'), t)).toBeNull()
  })

  it('needs the key item as well as the badge', () => {
    const lavender = { unlockedAreaIds: ['lavender-town'], badges: ['marsh-badge' as const] }
    expect(travelBlocker(area('lavender-town'), area('route-12'), makeTrainer(lavender))).toBe('key-item')
    const withFlute = makeTrainer({ ...lavender, keyItems: [{ itemId: 'poke-flute', quantity: 1 }] })
    expect(travelBlocker(area('lavender-town'), area('route-12'), withFlute)).toBeNull()
  })

  it('checks the badge before the key item', () => {
    const t = makeTrainer({ unlockedAreaIds: ['lavender-town'], keyItems: [{ itemId: 'poke-flute', quantity: 1 }] })
    expect(travelBlocker(area('lavender-town'), area('route-12'), t)).toBe('badge')
  })

  it('never re-locks a key-item area that was already visited', () => {
    const t = makeTrainer({ unlockedAreaIds: ['celadon-city', 'route-16'] })
    expect(travelBlocker(area('celadon-city'), area('route-16'), t)).toBeNull()
  })
})

describe('unclaimedReward', () => {
  it('appears once the area is fully explored', () => {
    expect(unclaimedReward(area('route-11'), makeTrainer({ exploreProgress: { 'route-11': 7 } }))).toBeNull()
    expect(unclaimedReward(area('route-11'), makeTrainer({ exploreProgress: { 'route-11': 8 } }))?.gift)
      .toEqual({ kind: 'key-item', keyItemId: 'bike-voucher' })
  })

  it('is only handed out once', () => {
    const t = makeTrainer({ exploreProgress: { 'route-11': 8 }, claimedRewardIds: ['route-11'] })
    expect(unclaimedReward(area('route-11'), t)).toBeNull()
  })

  it('is null for areas without one', () => {
    expect(unclaimedReward(area('route-1'), makeTrainer({ exploreProgress: { 'route-1': 8 } }))).toBeNull()
  })
})

describe('meetsBadgeRequirement', () => {
  it('exempts areas already visited, so re-tuned gates never strand old saves', () => {
    expect(meetsBadgeRequirement(area('route-16'), [], ['route-16'])).toBe(true)
    expect(meetsBadgeRequirement(area('route-16'), [], [])).toBe(false)
  })
})

describe('legendaryAvailable', () => {
  const plant = area('power-plant')

  it('waits until the area is fully explored', () => {
    expect(legendaryAvailable(plant, makeTrainer({ exploreProgress: { 'power-plant': 9 } }))).toBeNull()
    expect(legendaryAvailable(plant, makeTrainer({ exploreProgress: { 'power-plant': 10 } }))?.speciesId).toBe(145)
  })

  it('stays after a battle that did not catch it', () => {
    const t = makeTrainer({ exploreProgress: { 'power-plant': 10 }, pokedex: { 145: { seen: true, caught: false } } })
    expect(legendaryAvailable(plant, t)).not.toBeNull()
  })

  it('is gone once caught', () => {
    const t = makeTrainer({ exploreProgress: { 'power-plant': 10 }, pokedex: { 145: { seen: true, caught: true } } })
    expect(legendaryAvailable(plant, t)).toBeNull()
  })
})
