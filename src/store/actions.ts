import type { OwnedPokemon, MathOperator, DifficultyLevel, PokemonSpecies } from '../types'

export type GameAction =
  | { type: 'NEW_GAME'; payload: { starterSpecies: PokemonSpecies } }
  | { type: 'LOAD_GAME' }
  | { type: 'DELETE_SAVE' }
  | { type: 'GAIN_TRAINER_XP'; payload: { amount: number } }
  | { type: 'GAIN_POKEMON_XP'; payload: { uid: string; amount: number } }
  | { type: 'CATCH_POKEMON'; payload: { pokemon: OwnedPokemon } }
  | { type: 'RECORD_ANSWER'; payload: { operator: MathOperator; correct: boolean } }
  | { type: 'SET_DIFFICULTY'; payload: { level: DifficultyLevel } }
  | { type: 'UNLOCK_AREA'; payload: { areaId: string } }
  | { type: 'SET_CURRENT_AREA'; payload: { areaId: string } }
  | { type: 'MOVE_TO_PARTY'; payload: { uid: string } }
  | { type: 'MOVE_TO_PC'; payload: { uid: string } }
  | { type: 'HEAL_PARTY' }
  | { type: 'SEE_POKEMON'; payload: { speciesId: number } }
  | { type: 'UPDATE_POKEMON_HP'; payload: { uid: string; currentHp: number } }
