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

/** A specific wild Pokémon to battle instead of rolling the area's table */
export interface WildOverride {
  speciesId: number
  level: number
  /** Replaces the usual "A wild X appeared!" opener */
  intro?: string
}

/** Everything that can start a battle from the overworld or a city */
export type BattleRequest =
  | { kind: 'wild' }
  | { kind: 'route-trainer'; trainer: RouteTrainer }
  | { kind: 'rare'; encounter: WildOverride }
