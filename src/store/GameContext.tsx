import {
  createContext, useContext, useEffect, useCallback,
  useState, type ReactNode,
} from 'react'
import type { Trainer, PokemonSpecies } from '../types'
import { gameReducer, createNewTrainer } from './reducer'
import { loadSave, writeSave, deleteSave, listSaves, migrateLegacySave } from './localStorage'
import type { GameAction } from './actions'

interface GameContextValue {
  trainer: Trainer | null
  currentSlot: number | null
  saves: (Trainer | null)[]
  dispatch: (action: GameAction) => void
  startNewGame: (name: string, starterSpecies: PokemonSpecies, slot: number) => void
  loadSlot: (slot: number) => void
  deleteSlot: (slot: number) => void
  goToTitle: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentSlot, setCurrentSlot] = useState<number | null>(null)
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [saves, setSaves] = useState<(Trainer | null)[]>(() => {
    migrateLegacySave()
    return listSaves()
  })

  // Auto-save whenever trainer state changes while a slot is active
  useEffect(() => {
    if (currentSlot !== null && trainer !== null) {
      writeSave(currentSlot, trainer)
      // Refresh the saves list so TitleScreen shows up-to-date info
      setSaves(prev => {
        const next = [...prev]
        next[currentSlot] = trainer
        return next
      })
    }
  }, [trainer, currentSlot])

  const dispatch = useCallback((action: GameAction) => {
    setTrainer(prev => (prev ? gameReducer(prev, action) : null))
  }, [])

  const startNewGame = useCallback((name: string, starterSpecies: PokemonSpecies, slot: number) => {
    const newTrainer = createNewTrainer(name, starterSpecies)
    writeSave(slot, newTrainer)
    setSaves(listSaves())
    setCurrentSlot(slot)
    setTrainer(newTrainer)
  }, [])

  const loadSlot = useCallback((slot: number) => {
    const saved = loadSave(slot)
    if (!saved) return
    setCurrentSlot(slot)
    setTrainer(saved)
  }, [])

  const deleteSlot = useCallback((slot: number) => {
    deleteSave(slot)
    const updated = listSaves()
    setSaves(updated)
    if (currentSlot === slot) {
      setCurrentSlot(null)
      setTrainer(null)
    }
  }, [currentSlot])

  const goToTitle = useCallback(() => {
    setCurrentSlot(null)
    setTrainer(null)
    setSaves(listSaves())
  }, [])

  return (
    <GameContext.Provider value={{ trainer, currentSlot, saves, dispatch, startNewGame, loadSlot, deleteSlot, goToTitle }}>
      {children}
    </GameContext.Provider>
  )
}

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
