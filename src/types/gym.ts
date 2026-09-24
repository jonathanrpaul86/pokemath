import type { BadgeId } from './items'

export interface TrainerPokemon {
  speciesId: number
  level: number
}

export interface GymTrainer {
  id: string
  name: string
  team: TrainerPokemon[]
  quote: string
}

export interface GymLeader {
  name: string
  team: TrainerPokemon[]
  badge: BadgeId
  quote: string
  winQuote: string
  /** A stronger team for a rematch once the player has every badge */
  rematch?: { team: TrainerPokemon[]; quote: string }
}

export interface GymDefinition {
  id: string
  cityAreaId: string
  name: string
  type: string
  /** Badges needed before the gym opens (Viridian stays closed until the end) */
  requiredBadgeCount?: number
  trainers: GymTrainer[]
  leader: GymLeader
}

export interface GymProgress {
  defeatedTrainerIds: string[]
  leaderDefeated: boolean
}

/** Passed to BattleScreen to run a trainer battle instead of a wild encounter */
export interface TrainerBattle {
  trainerName: string
  isLeader: boolean
  team: TrainerPokemon[]
  quote: string
  onComplete: (won: boolean) => void
}
