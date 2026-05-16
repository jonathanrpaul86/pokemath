export type MathOperator = '+' | '-' | '×' | '÷'

export interface MathProblem {
  operands: number[]   // length 2 for binary ops; length 3 for 3-term addition
  operator: MathOperator
  answer: number
  timeLimit: number
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
