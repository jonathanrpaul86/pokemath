import type { MathOperator, MathProblem } from '../types'

interface ProblemConfig {
  operators: MathOperator[]
  maxAddSub: number
  minOperand: number
  threeTermAddition: boolean
  randomAdditionOrder: boolean
  maxFactor: number
  timeLimit: number
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function difficultyToConfig(d: number): ProblemConfig {
  const operators: MathOperator[] = ['+']
  if (d >= 25) operators.push('-')
  if (d >= 50) operators.push('×')
  if (d >= 75) operators.push('÷')

  // +/− operand ceiling: 5 at d=1, 99 at d=100
  const maxAddSub = Math.max(5, Math.round(5 + (d - 1) * 0.95))

  // minimum operand: 0 at d=1, ~20 at d=100
  // forces balanced addends — 12+13 rather than 20+5 at high difficulties
  const minOperand = Math.round((d - 1) / 99 * 20)

  // 3-term addition unlocks at d=38; applied randomly (50/50) per problem
  const threeTermAddition = d >= 38

  // addition order: d≤50 → largest first; d>50 → random
  const randomAdditionOrder = d > 50

  // ×/÷ factor ceiling: 5 at d=50, 15 at d=100
  const maxFactor = Math.round(5 + Math.max(0, (d - 50) / 50) * 10)

  // time limit: 30s at d=1, 12s at d=100
  const timeLimit = Math.max(6, Math.round(15 - (d - 1) / 99 * 9))

  return { operators, maxAddSub, minOperand, threeTermAddition, randomAdditionOrder, maxFactor, timeLimit }
}

export function generateProblem(difficulty: number, operator?: MathOperator): MathProblem {
  const config = difficultyToConfig(difficulty)
  const op = operator ?? config.operators[Math.floor(Math.random() * config.operators.length)]
  const { maxAddSub, minOperand, maxFactor } = config

  let operands: number[]

  if (op === '+') {
    const terms = config.threeTermAddition && Math.random() < 0.5 ? 3 : 2
    const minSum = minOperand * terms
    const sum = randInt(minSum, maxAddSub)

    if (terms === 2) {
      const a = randInt(minOperand, sum - minOperand)
      operands = [a, sum - a]
    } else {
      const a = randInt(minOperand, sum - 2 * minOperand)
      const b = randInt(minOperand, sum - a - minOperand)
      operands = [a, b, sum - a - b]
    }

    if (!config.randomAdditionOrder) {
      operands.sort((x, y) => y - x)  // largest first
    } else {
      for (let i = operands.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [operands[i], operands[j]] = [operands[j], operands[i]]
      }
    }
  } else if (op === '-') {
    const diff = randInt(0, maxAddSub - minOperand)
    const subtrahend = randInt(minOperand, maxAddSub - diff)
    operands = [subtrahend + diff, subtrahend]
  } else if (op === '×') {
    operands = [randInt(2, maxFactor), randInt(2, maxFactor)]
  } else {
    // ÷ — generate answer first to guarantee clean division
    const quotient = randInt(1, maxFactor)
    const divisor = randInt(2, maxFactor)
    operands = [quotient * divisor, divisor]
  }

  const answer =
    op === '+' ? operands.reduce((s, x) => s + x, 0) :
    op === '-' ? operands[0] - operands[1] :
    op === '×' ? operands[0] * operands[1] :
                 operands[0] / operands[1]

  return { operands, operator: op, answer, timeLimit: config.timeLimit }
}

export function checkAnswer(problem: MathProblem, candidate: number): boolean {
  return candidate === problem.answer
}
