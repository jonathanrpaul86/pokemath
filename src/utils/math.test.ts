import { describe, expect, it } from 'vitest'
import { generateProblem } from './math'
import type { MathOperator } from '../types'

const sample = (difficulty: number, operator?: MathOperator) =>
  Array.from({ length: 500 }, () => generateProblem(difficulty, operator))
const maxOperand = (difficulty: number, operator: MathOperator) =>
  Math.max(...sample(difficulty, operator).flatMap(p => p.operands))

describe('generateProblem', () => {
  it('starts with sums up to 10', () => {
    const problems = sample(1)
    expect(problems.every(p => p.operator === '+' && p.answer <= 10)).toBe(true)
  })

  it('introduces subtraction with small numbers, not addition-sized ones', () => {
    const subs = sample(25, '-')
    expect(subs.every(p => p.operands[0] <= 10 && p.answer >= 0)).toBe(true)
    expect(sample(20).some(p => p.operator === '-')).toBe(false)
  })

  it('introduces three-number addition with small sums', () => {
    const threes = sample(35, '+').filter(p => p.operands.length === 3)
    expect(threes.length).toBeGreaterThan(0)
    expect(threes.every(p => p.answer <= 10)).toBe(true)
    expect(sample(30, '+').some(p => p.operands.length === 3)).toBe(false)
  })

  it('introduces multiplication with factors up to 5', () => {
    expect(maxOperand(50, '×')).toBeLessThanOrEqual(5)
    expect(sample(45).some(p => p.operator === '×')).toBe(false)
  })

  it('introduces division with divisors and answers up to 5', () => {
    const divs = sample(75, '÷')
    expect(divs.every(p => p.operands[1] <= 5 && p.answer <= 5 && Number.isInteger(p.answer))).toBe(true)
    expect(sample(70).some(p => p.operator === '÷')).toBe(false)
  })

  it('holds steady across the areas in a band', () => {
    // Pewter City (30) and Route 3 (34) share a band, so they get the same math
    expect(maxOperand(30, '+')).toBeLessThanOrEqual(20)
    expect(maxOperand(34, '+')).toBeLessThanOrEqual(20)
    expect(generateProblem(30).timeLimit).toBe(generateProblem(34).timeLimit)
  })

  it('reaches two-digit sums and the 12s times table by the League', () => {
    expect(maxOperand(100, '×')).toBeLessThanOrEqual(12)
    expect(Math.max(...sample(100, '+').map(p => p.answer))).toBeGreaterThan(75)
  })
})
