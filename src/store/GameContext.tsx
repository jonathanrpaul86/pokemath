import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { Trainer, PokemonSpecies } from '../types'
import { gameReducer, createNewTrainer } from './reducer'
import { loadTrainer, deleteSave } from './localStorage'
import type { GameAction } from './actions'

interface GameContextValue {
  trainer: Trainer | null
  dispatch: (action: GameAction) => void
  startNewGame: (starterSpecies: PokemonSpecies) => void
  deleteSaveFile: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

function init(): Trainer | null {
  return loadTrainer()
}

// Thin wrapper so we can hold null (no save file) outside the reducer
function rootReducer(
  state: Trainer | null,
  action: GameAction
): Trainer | null {
  if (action.type === 'NEW_GAME') {
    return createNewTrainer(action.payload.starterSpecies)
  }
  if (action.type === 'DELETE_SAVE') {
    deleteSave()
    return null
  }
  if (state === null) return null
  return gameReducer(state, action)
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [trainer, dispatch] = useReducer(rootReducer, null, init)

  const startNewGame = useCallback((starterSpecies: PokemonSpecies) => {
    dispatch({ type: 'NEW_GAME', payload: { starterSpecies } })
  }, [])

  const deleteSaveFile = useCallback(() => {
    dispatch({ type: 'DELETE_SAVE' })
  }, [])

  return (
    <GameContext.Provider value={{ trainer, dispatch, startNewGame, deleteSaveFile }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameStore(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameStore must be used inside <GameProvider>')
  return ctx
}

// Convenience selector hooks so components don't need to null-check everywhere
export function useTrainer(): Trainer {
  const { trainer } = useGameStore()
  if (!trainer) throw new Error('useTrainer called before a game has started')
  return trainer
}
