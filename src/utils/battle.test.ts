import { describe, expect, it } from 'vitest'
import { battleProblem, calcCatchDifficulty, moveMathTier, moveMenuOptions } from './battle'
import type { Move } from '../types'

const SCRATCH: Move = { id: 10, name: 'scratch', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' }
const EMBER: Move = { id: 52, name: 'ember', type: 'fire', power: 40, accuracy: 100, damageClass: 'special' }
const GROWL: Move = { id: 45, name: 'growl', type: 'normal', power: null, accuracy: 100, damageClass: 'status' }

describe('moveMenuOptions', () => {
  it('offers nothing when choosing moves is off', () => {
    expect(moveMenuOptions([SCRATCH, EMBER], false)).toEqual([])
    expect(moveMenuOptions([SCRATCH, EMBER], undefined)).toEqual([])
  })

  it('offers only moves that deal damage', () => {
    expect(moveMenuOptions([SCRATCH, GROWL, EMBER], true)).toEqual([SCRATCH, EMBER])
  })

  it('skips the menu when there is at most one attack to pick', () => {
    expect(moveMenuOptions([SCRATCH, GROWL], true)).toEqual([])
    expect(moveMenuOptions([], true)).toEqual([])
    expect(moveMenuOptions(undefined, true)).toEqual([])
  })
})

const SLASH: Move = { id: 163, name: 'slash', type: 'normal', power: 70, accuracy: 100, damageClass: 'physical' }
const FLAMETHROWER: Move = { id: 53, name: 'flamethrower', type: 'fire', power: 90, accuracy: 100, damageClass: 'special' }

describe('moveMathTier', () => {
  it('asks for harder math as moves get stronger', () => {
    expect([GROWL, EMBER, { ...EMBER, power: 59 }].map(moveMathTier)).toEqual([0, 0, 0])
    expect([{ ...EMBER, power: 60 }, SLASH, { ...EMBER, power: 89 }].map(moveMathTier)).toEqual([1, 1, 1])
    expect([FLAMETHROWER, { ...EMBER, power: 150 }].map(moveMathTier)).toEqual([2, 2])
  })
})

describe('battleProblem', () => {
  const sample = (difficulty: number, move?: Move) => Array.from({ length: 300 }, () => battleProblem(difficulty, move))
  const answers = (difficulty: number, move?: Move) => sample(difficulty, move).map(p => p.answer)

  it('uses bigger numbers for stronger moves (Route 1: sums up to 10, then 11–15, then 11–20)', () => {
    expect(Math.max(...answers(5))).toBeLessThanOrEqual(10)
    expect(Math.max(...answers(5, EMBER))).toBeLessThanOrEqual(10)
    expect(answers(5, SLASH).every(a => a >= 11 && a <= 15)).toBe(true)
    expect(answers(5, FLAMETHROWER).every(a => a >= 11 && a <= 20)).toBe(true)
  })

  it('keeps the kind of problem the area uses, and its time to answer', () => {
    // Difficulty 60 mixes +, − and ×; the 80 a strong move reaches would add ÷
    const hard = sample(60, FLAMETHROWER)
    expect(hard.some(p => p.operator === '÷')).toBe(false)
    expect(sample(5, FLAMETHROWER).every(p => p.operator === '+')).toBe(true)
    expect(new Set(hard.map(p => p.timeLimit))).toEqual(new Set([battleProblem(60).timeLimit]))
  })
})

describe('calcCatchDifficulty', () => {
  it('asks for two more problems to catch a legendary', () => {
    const normal = calcCatchDifficulty(0.5, 50, 'ultra-ball')
    const legendary = calcCatchDifficulty(0.5, 50, 'ultra-ball', true)
    expect(legendary.problemsRequired).toBe(normal.problemsRequired + 2)
  })

  it('still catches a legendary with one problem using a Master Ball', () => {
    expect(calcCatchDifficulty(1, 70, 'master-ball', true).problemsRequired).toBe(1)
  })
})
