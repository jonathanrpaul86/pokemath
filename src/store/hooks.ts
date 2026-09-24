import { useContext } from 'react'
import type { Trainer } from '../types'
import { GameContext, type GameContextValue } from './context'

export function useGameStore(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameStore must be used inside <GameProvider>')
  return ctx
}

export function useTrainer(): Trainer {
  const { trainer } = useGameStore()
  if (!trainer) throw new Error('useTrainer called before a game has started')
  return trainer
}
