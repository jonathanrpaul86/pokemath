export type MathOperator = '+' | '-'

export interface MathProblem {
  operand1: number
  operand2: number
  operator: MathOperator
  answer: number
  timeLimit: number
}

/**
 * Difficulty levels map to the range of numbers used in problems.
 * Level 1-2: addition only. Level 3+: subtraction introduced.
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

export interface OperatorStats {
  totalAttempts: number
  correctAnswers: number
}

/** Per-operator accuracy tracking, used to drive adaptive difficulty */
export interface MathStats {
  difficultyLevel: DifficultyLevel
  operators: Record<MathOperator, OperatorStats>
  /** Total problems answered across all time */
  lifetimeTotal: number
  lifetimeCorrect: number
}
