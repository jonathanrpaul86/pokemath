import type { DifficultyLevel, MathOperator, MathProblem } from '../types'

// Number ranges and operator availability per difficulty level
const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { max: number; operators: MathOperator[]; timeLimit: number }
> = {
  1: { max: 5,  operators: ['+'],       timeLimit: 25 },
  2: { max: 10, operators: ['+'],       timeLimit: 22 },
  3: { max: 15, operators: ['+'],       timeLimit: 20 },
  4: { max: 20, operators: ['+'],       timeLimit: 18 },
  5: { max: 20, operators: ['+', '-'],  timeLimit: 18 },
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateProblem(
  difficulty: DifficultyLevel,
  operator?: MathOperator
): MathProblem {
  const config = DIFFICULTY_CONFIG[difficulty]
  const op = operator ?? config.operators[Math.floor(Math.random() * config.operators.length)]

  let operand1: number
  let operand2: number

  if (op === '+') {
    // Pick the answer first so all sums in [0, max] are equally likely
    const sum = randInt(0, config.max)
    operand1 = randInt(0, sum)
    operand2 = sum - operand1
  } else {
    // Pick the answer first so all differences in [0, max] are equally likely
    const diff = randInt(0, config.max)
    operand2 = randInt(0, config.max - diff)
    operand1 = operand2 + diff
  }

  return {
    operand1,
    operand2,
    operator: op,
    answer: op === '+' ? operand1 + operand2 : operand1 - operand2,
    timeLimit: config.timeLimit,
  }
}

export function checkAnswer(problem: MathProblem, candidate: number): boolean {
  return candidate === problem.answer
}
