import type { Trainer, OwnedPokemon, MathStats } from '../types'

const SLOT_COUNT = 3
const LEGACY_KEY = 'pmg_trainer_v1'

function slotKey(slot: number): string {
  return `pmg_save_v1_${slot}`
}

const DEFAULT_MATH_STATS: MathStats = {
  operators: {
    '+': { totalAttempts: 0, correctAnswers: 0 },
    '-': { totalAttempts: 0, correctAnswers: 0 },
    '×': { totalAttempts: 0, correctAnswers: 0 },
    '÷': { totalAttempts: 0, correctAnswers: 0 },
  },
  lifetimeTotal: 0,
  lifetimeCorrect: 0,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migratePokemon(p: any): OwnedPokemon {
  return { moves: [], ...p }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateTrainer(raw: any): Trainer {
  const mathStats: MathStats = {
    ...DEFAULT_MATH_STATS,
    ...(raw.mathStats ?? {}),
    operators: {
      ...DEFAULT_MATH_STATS.operators,
      ...(raw.mathStats?.operators ?? {}),
    },
  }
  return {
    ...raw,
    party: (raw.party ?? []).map(migratePokemon),
    pc:    (raw.pc    ?? []).map(migratePokemon),
    mathStats,
  }
}

export function loadSave(slot: number): Trainer | null {
  try {
    const raw = localStorage.getItem(slotKey(slot))
    return raw ? migrateTrainer(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function writeSave(slot: number, trainer: Trainer): void {
  try {
    const data: Trainer = { ...trainer, savedAt: Date.now() }
    localStorage.setItem(slotKey(slot), JSON.stringify(data))
  } catch {
    console.warn('Could not save game: localStorage quota exceeded')
  }
}

export function deleteSave(slot: number): void {
  localStorage.removeItem(slotKey(slot))
}

export function listSaves(): (Trainer | null)[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => loadSave(i))
}

export function migrateLegacySave(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (!legacy) return
    const slot0 = localStorage.getItem(slotKey(0))
    if (!slot0) {
      localStorage.setItem(slotKey(0), legacy)
    }
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // Migration is best-effort
  }
}
