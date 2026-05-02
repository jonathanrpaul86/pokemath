import type { WildPokemon } from './pokemon'
import type { MathProblem } from './math'

export type BattlePhase =
  | 'intro'
  | 'player-turn'
  | 'resolving-correct'
  | 'resolving-wrong'
  | 'enemy-turn'
  | 'catch-attempt'
  | 'victory'
  | 'caught'
  | 'fled'
  | 'blacked-out'

export interface CatchAttempt {
  problemsRequired: number
  problemsSolved: number
  timePerProblem: number
  currentProblem: MathProblem | null
  /** Seconds remaining on current problem */
  timeRemaining: number
}

export interface BattleLog {
  message: string
  type: 'info' | 'success' | 'damage' | 'catch' | 'error'
}

export interface BattleState {
  wildPokemon: WildPokemon
  /** Index into trainer.party */
  activePartyIndex: number
  phase: BattlePhase
  currentProblem: MathProblem | null
  /** Seconds remaining to answer current problem */
  timeRemaining: number
  catchAttempt: CatchAttempt | null
  log: BattleLog[]
}
