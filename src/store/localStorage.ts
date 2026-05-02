import type { Trainer } from '../types'

const SAVE_KEY = 'pmg_trainer_v1'

export function loadTrainer(): Trainer | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? (JSON.parse(raw) as Trainer) : null
  } catch {
    return null
  }
}

export function saveTrainer(trainer: Trainer): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(trainer))
  } catch {
    // Storage full — not fatal, game continues without saving
    console.warn('Could not save game: localStorage quota exceeded')
  }
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY)
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null
}
