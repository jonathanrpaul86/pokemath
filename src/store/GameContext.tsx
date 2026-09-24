import { useEffect, useCallback, useState, type ReactNode } from 'react'
import type { Trainer, PokemonSpecies } from '../types'
import { gameReducer, createNewTrainer } from './reducer'
import { loadSave, writeSave, deleteSave, listSaves, migrateLegacySave, purgeOutdatedApiCache } from './localStorage'
import type { GameAction } from './actions'
import { GameContext } from './context'

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentSlot, setCurrentSlot] = useState<number | null>(null)
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [saves, setSaves] = useState<(Trainer | null)[]>(() => {
    // Free the space the old raw cache took before touching saves
    purgeOutdatedApiCache()
    migrateLegacySave()
    return listSaves()
  })

  // Auto-save whenever trainer state changes while a slot is active. The saves
  // list only shows on the title screen, and goToTitle re-reads it from storage.
  useEffect(() => {
    if (currentSlot !== null && trainer !== null) writeSave(currentSlot, trainer)
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
