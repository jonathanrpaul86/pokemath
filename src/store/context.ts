import { createContext } from 'react'
import type { Trainer, PokemonSpecies } from '../types'
import type { GameAction } from './actions'

export interface GameContextValue {
  trainer: Trainer | null
  currentSlot: number | null
  saves: (Trainer | null)[]
  dispatch: (action: GameAction) => void
  startNewGame: (name: string, starterSpecies: PokemonSpecies, slot: number) => void
  loadSlot: (slot: number) => void
  deleteSlot: (slot: number) => void
  goToTitle: () => void
}

/**
 * Lives in its own module (not next to GameProvider) so hot reloading the
 * provider doesn't create a second context that running hooks can't see
 */
export const GameContext = createContext<GameContextValue | null>(null)
