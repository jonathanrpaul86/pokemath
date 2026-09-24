import type { OwnedPokemon, MathOperator, BaseStats, BadgeId } from '../types'

export type GameAction =
  | { type: 'GAIN_POKEMON_XP'; payload: { uid: string; amount: number } }
  | { type: 'RECORD_EXPLORE'; payload: { areaId: string } }
  | { type: 'SET_BASE_STATS'; payload: { uid: string; baseStats: BaseStats } }
  | { type: 'FINISH_STORY'; payload: { cityId: string; storyId: string } }
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
  | { type: 'RENAME_TRAINER'; payload: { name: string } }
  | { type: 'SET_TIMER_MULTIPLIER'; payload: { multiplier: number } }
  | { type: 'SET_CHOOSE_MOVES'; payload: { enabled: boolean } }
  | { type: 'GAIN_MONEY';  payload: { amount: number } }
  | { type: 'SPEND_MONEY'; payload: { amount: number } }
  | { type: 'ADD_ITEM';    payload: { itemId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string; quantity: number } }
  | { type: 'EARN_BADGE';  payload: { badgeId: BadgeId } }
  | { type: 'RECORD_GYM_TRAINER_DEFEAT'; payload: { gymId: string; trainerId: string } }
