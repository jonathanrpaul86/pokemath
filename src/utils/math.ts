import type { MathOperator, MathProblem } from '../types'

/**
 * One step of the difficulty curve. Every area whose mathDifficulty falls in
 * the same band gets the same math, so problems level up every few areas
 * rather than every area. Each operator starts small when it first appears
 * and grows on its own schedule, instead of inheriting addition's numbers.
 */
interface Band {
  /** Lowest mathDifficulty this band covers */
  from: number
  /** Largest sum for two-number addition */
  addMax: number
  /** Largest sum for three-number addition; 0 = not unlocked yet */
  add3Max: number
  /** Smallest addend / subtrahend, so late problems read 12+13 rather than 20+5 */
  minOperand: number
  /** Largest starting number for subtraction; 0 = not unlocked yet */
  subMax: number
  /** Largest factor for multiplication; 0 = not unlocked yet */
  mulMax: number
  /** Largest divisor and quotient for division; 0 = not unlocked yet */
  divMax: number
  /** Most equal parts in a shaded-shape fraction; 0 = not unlocked yet */
  fracMax: number
  /** Seconds to answer, before level and timer adjustments */
  timeLimit: number
}

// Rough area mapping (see data/areas.ts):
//   1  Pallet Town, Route 1         10 Route 22, Viridian, Route 2
//   20 Viridian Forest              25 Pewter City, Route 3
//   35 Mt. Moon, Route 4            45 Cerulean, Routes 24/25
//   50 Routes 5/6/9/11              60 Rock Tunnel … Saffron
//   75 Routes 12–15, Fuchsia        85 Routes 19–21, Seafoam, Cinnabar
//   95 Victory Road, League
const BANDS: Band[] = [
  { from: 1,  addMax: 10, add3Max: 0,  minOperand: 0,  subMax: 0,  mulMax: 0,  divMax: 0,  fracMax: 0,  timeLimit: 15 },
  { from: 10, addMax: 15, add3Max: 0,  minOperand: 0,  subMax: 0,  mulMax: 0,  divMax: 0,  fracMax: 0,  timeLimit: 15 },
  { from: 20, addMax: 20, add3Max: 0,  minOperand: 0,  subMax: 0,  mulMax: 0,  divMax: 0,  fracMax: 0,  timeLimit: 15 },
  { from: 25, addMax: 20, add3Max: 0,  minOperand: 0,  subMax: 10, mulMax: 0,  divMax: 0,  fracMax: 0,  timeLimit: 15 },
  { from: 35, addMax: 25, add3Max: 10, minOperand: 0,  subMax: 15, mulMax: 0,  divMax: 0,  fracMax: 0,  timeLimit: 14 },
  { from: 45, addMax: 30, add3Max: 15, minOperand: 0,  subMax: 20, mulMax: 0,  divMax: 0,  fracMax: 4,  timeLimit: 14 },
  { from: 50, addMax: 30, add3Max: 15, minOperand: 0,  subMax: 20, mulMax: 5,  divMax: 0,  fracMax: 4,  timeLimit: 14 },
  { from: 60, addMax: 40, add3Max: 20, minOperand: 3,  subMax: 30, mulMax: 6,  divMax: 0,  fracMax: 6,  timeLimit: 13 },
  { from: 75, addMax: 50, add3Max: 25, minOperand: 5,  subMax: 40, mulMax: 8,  divMax: 5,  fracMax: 8,  timeLimit: 12 },
  { from: 85, addMax: 75, add3Max: 40, minOperand: 8,  subMax: 60, mulMax: 10, divMax: 8,  fracMax: 8,  timeLimit: 11 },
  { from: 95, addMax: 99, add3Max: 60, minOperand: 10, subMax: 99, mulMax: 12, divMax: 10, fracMax: 8,  timeLimit: 10 },
]

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function bandIndex(d: number): number {
  let i = 0
  while (i + 1 < BANDS.length && d >= BANDS[i + 1].from) i++
  return i
}

function operatorsFor(band: Band): MathOperator[] {
  const ops: MathOperator[] = ['+']
  if (band.subMax > 0) ops.push('-')
  if (band.mulMax > 0) ops.push('×')
  if (band.divMax > 0) ops.push('÷')
  if (band.fracMax > 0) ops.push('½')
  return ops
}

/** Lower bound that pushes a boosted problem past the area's own range, when there is room */
function floorAbove(baseMax: number, max: number, fallback: number): number {
  return baseMax > 0 && baseMax < max ? baseMax + 1 : fallback
}

/**
 * A problem for an area's difficulty. `stepsUp` asks for the numbers of a
 * later band while keeping the operators the area already uses — stronger
 * moves use it to ask for bigger numbers than the area normally does.
 */
export function generateProblem(difficulty: number, operator?: MathOperator, stepsUp = 0): MathProblem {
  const baseIdx = bandIndex(difficulty)
  const base = BANDS[baseIdx]
  const band = BANDS[Math.min(BANDS.length - 1, baseIdx + stepsUp)]
  const boosted = band !== base
  const ops = operatorsFor(base)
  const op = operator ?? ops[Math.floor(Math.random() * ops.length)]
  const { minOperand } = band

  let operands: number[]

  if (op === '+') {
    const terms = base.add3Max > 0 && Math.random() < 0.5 ? 3 : 2
    const max = terms === 3 ? band.add3Max : band.addMax
    const baseMax = terms === 3 ? base.add3Max : base.addMax
    // Keep three small addends possible at the lower three-term sums
    const min = Math.min(minOperand, Math.floor(max / (terms * 2)))
    const sum = randInt(boosted ? floorAbove(baseMax, max, min * terms) : min * terms, max)

    if (terms === 2) {
      const a = randInt(min, sum - min)
      operands = [a, sum - a]
    } else {
      const a = randInt(min, sum - 2 * min)
      const b = randInt(min, sum - a - min)
      operands = [a, b, sum - a - b]
    }

    if (difficulty <= 50) {
      operands.sort((x, y) => y - x)  // largest first
    } else {
      for (let i = operands.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [operands[i], operands[j]] = [operands[j], operands[i]]
      }
    }
  } else if (op === '-') {
    const max = band.subMax || BANDS.find(b => b.subMax > 0)!.subMax
    const minuend = randInt(boosted ? floorAbove(base.subMax, max, 2 * minOperand) : 2 * minOperand, max)
    const subtrahend = randInt(minOperand, minuend - minOperand)
    operands = [minuend, subtrahend]
  } else if (op === '×') {
    const max = band.mulMax || BANDS.find(b => b.mulMax > 0)!.mulMax
    // A boosted problem makes at least one factor bigger than the area's usual
    const big = randInt(boosted ? floorAbove(base.mulMax, max, 2) : 2, max)
    operands = Math.random() < 0.5 ? [big, randInt(2, max)] : [randInt(2, max), big]
  } else if (op === '½') {
    // A shape cut into equal parts, some shaded: halves, thirds and fourths
    // first, more parts later. Usually asks for the shaded count (top number),
    // sometimes for the number of parts (bottom number).
    const max = band.fracMax || BANDS.find(b => b.fracMax > 0)!.fracMax
    const parts = randInt(boosted ? floorAbove(base.fracMax, max, 2) : 2, max)
    const shaded = randInt(1, parts)
    const fractionAsk = Math.random() < 0.3 ? 'bottom' : 'top'
    return {
      operands: [shaded, parts],
      operator: op,
      answer: fractionAsk === 'top' ? shaded : parts,
      timeLimit: band.timeLimit,
      fractionAsk,
    }
  } else {
    // ÷ — generate answer first to guarantee clean division
    const max = band.divMax || BANDS.find(b => b.divMax > 0)!.divMax
    const quotient = randInt(boosted ? floorAbove(base.divMax, max, 1) : 1, max)
    const divisor = randInt(2, max)
    operands = [quotient * divisor, divisor]
  }

  const answer =
    op === '+' ? operands.reduce((s, x) => s + x, 0) :
    op === '-' ? operands[0] - operands[1] :
    op === '×' ? operands[0] * operands[1] :
                 operands[0] / operands[1]

  return { operands, operator: op, answer, timeLimit: band.timeLimit }
}

/** Shaded parts first, then the empty ones, like a shaded bar on a worksheet */
function shadedShape(shaded: number, parts: number): string {
  return '■'.repeat(shaded) + '□'.repeat(parts - shaded)
}

/**
 * The problem as shown in battle, with `fill` in place of the unknown:
 * "7 + 5 = ?", or for fractions "■■□ = ?/3" / "■■□ = 2/?".
 */
export function problemText(problem: MathProblem, fill = '?'): string {
  if (problem.operator === '½') {
    const [shaded, parts] = problem.operands
    const shape = shadedShape(shaded, parts)
    return problem.fractionAsk === 'bottom'
      ? `${shape} = ${shaded}/${fill}`
      : `${shape} = ${fill}/${parts}`
  }
  return `${problem.operands.join(` ${problem.operator} `)} = ${fill}`
}

export function checkAnswer(problem: MathProblem, candidate: number): boolean {
  return candidate === problem.answer
}
