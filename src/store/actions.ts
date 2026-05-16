import type { OwnedPokemon, MathOperator, BaseStats } from '../types'

export type GameAction =
  | { type: 'GAIN_TRAINER_XP'; payload: { amount: number } }
  | { type: 'GAIN_POKEMON_XP'; payload: { uid: string; amount: number } }
  | { type: 'CATCH_POKEMON'; payload: { pokemon: OwnedPokemon } }
  | { type: 'RECORD_ANSWER'; payload: { operator: MathOperator; correct: boolean } }
  | { type: 'UNLOCK_AREA'; payload: { areaId: string } }
  | { type: 'SET_CURRENT_AREA'; payload: { areaId: string } }
  | { type: 'MOVE_TO_PARTY'; payload: { uid: string } }
  | { type: 'MOVE_TO_PC'; payload: { uid: string } }
  | { type: 'REORDER_PARTY'; payload: { uid: string; direction: 'up' | 'down' } }
  | { type: 'REORDER_PC'; payload: { uid: string; direction: 'up' | 'down' } }
  | { type: 'EVOLVE_POKEMON'; payload: { uid: string; newSpeciesId: number; newName: string; newBaseStats: BaseStats } }
  | { type: 'HEAL_PARTY' }
  | { type: 'SEE_POKEMON'; payload: { speciesId: number } }
  | { type: 'UPDATE_POKEMON_HP'; payload: { uid: string; currentHp: number } }
