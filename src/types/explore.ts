import type { TrainerPokemon } from './gym'

/** A randomly generated trainer met while exploring a route */
export interface RouteTrainer {
  name: string
  team: TrainerPokemon[]
  quote: string
}

/** What turns up when the player explores an area */
export type ExploreOutcome =
  | { kind: 'wild' }
  | { kind: 'trainer'; trainer: RouteTrainer }
  | { kind: 'item'; itemId: string; quantity: number }
  | { kind: 'money'; amount: number }
  | { kind: 'nothing' }

export type ExploreOutcomeKind = ExploreOutcome['kind']
