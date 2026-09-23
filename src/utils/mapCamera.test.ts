import { describe, expect, it } from 'vitest'
import { fitView, followView, makeTransform, viewRect, easeToward } from './mapCamera'

const WORLD = { width: 600, height: 380 }

describe('fitView', () => {
  it('shows the whole world on a canvas of the same shape', () => {
    const view = fitView(WORLD, 1200, 760)
    const t = makeTransform(view, 1200, 760, WORLD)
    expect(t.tx(0)).toBeCloseTo(0)
    expect(t.ty(0)).toBeCloseTo(0)
    expect(t.tx(600)).toBeCloseTo(1200)
    expect(t.ty(380)).toBeCloseTo(760)
  })

  it('letterboxes a differently shaped canvas instead of cropping', () => {
    const t = makeTransform(fitView(WORLD, 1000, 1000), 1000, 1000, WORLD)
    expect(t.tx(0)).toBeCloseTo(0)
    expect(t.tx(600)).toBeCloseTo(1000)
    expect(t.ty(0)).toBeGreaterThan(0)
    expect(t.ty(380)).toBeLessThan(1000)
  })
})

describe('followView', () => {
  it('centers on the target in the middle of the world', () => {
    const view = followView(WORLD, { x: 300, y: 190 }, 300, 600, 380)
    expect(view.centerX).toBe(300)
    expect(view.centerY).toBe(190)
  })

  it('stops at the world edges instead of showing past them', () => {
    const view = followView(WORLD, { x: 0, y: 380 }, 300, 600, 380)
    const rect = viewRect(view, 600, 380)
    expect(rect.x).toBeCloseTo(0)
    expect(rect.y + rect.height).toBeCloseTo(380)
  })

  it('centers the world when the view is wider than it', () => {
    const view = followView(WORLD, { x: 10, y: 10 }, 900, 600, 380)
    expect(view.centerX).toBe(300)
    expect(view.centerY).toBe(190)
  })
})

describe('makeTransform', () => {
  it('round-trips between world and canvas coordinates', () => {
    const t = makeTransform(followView(WORLD, { x: 250, y: 150 }, 360, 800, 507), 800, 507, WORLD)
    const [wx, wy] = t.toWorld(t.tx(212), t.ty(98))
    expect(wx).toBeCloseTo(212)
    expect(wy).toBeCloseTo(98)
  })

  it('keeps node sizes the same when zooming in, but spreads places apart', () => {
    const full = makeTransform(fitView(WORLD, 600, 380), 600, 380, WORLD)
    const zoomed = makeTransform(followView(WORLD, { x: 300, y: 190 }, 300, 600, 380), 600, 380, WORLD)
    expect(zoomed.ts(18)).toBeCloseTo(full.ts(18))
    const distance = (t: typeof full) => t.tx(350) - t.tx(300)
    expect(distance(zoomed)).toBeCloseTo(distance(full) * 2)
  })
})

describe('easeToward', () => {
  it('moves part of the way, then snaps when close', () => {
    const halfway = easeToward({ x: 0, y: 0 }, { x: 100, y: 50 }, 0.5)
    expect(halfway).toEqual({ x: 50, y: 25 })
    expect(easeToward({ x: 99.8, y: 50.2 }, { x: 100, y: 50 }, 0.1)).toEqual({ x: 100, y: 50 })
  })
})
