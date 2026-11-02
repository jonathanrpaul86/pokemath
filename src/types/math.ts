/** '½' is a shaded-shape fraction: operands are [shaded parts, total parts] */
export type MathOperator = '+' | '-' | '×' | '÷' | '½'

export interface MathProblem {
  operands: number[]   // length 2 for binary ops; length 3 for 3-term addition
  operator: MathOperator
  answer: number
  timeLimit: number
  /** Fractions only: which number of the fraction is hidden (defaults to 'top') */
  fractionAsk?: 'top' | 'bottom'
}

export interface OperatorStats {
  totalAttempts: number
  correctAnswers: number
}

export interface MathStats {
  operators: Record<MathOperator, OperatorStats>
  lifetimeTotal: number
  lifetimeCorrect: number
}
