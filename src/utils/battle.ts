import type { Move, PokemonSpecies, WildPokemon } from '../types'
import { calcStats, pickMoveset } from './formulas'

// ---- Damage -----------------------------------------------------------------

/**
 * Simplified damage formula scaled for a kid's game.
 * Physical moves use attack/defense; special moves use specialAttack/specialDefense.
 */
export function calcDamage(
  move: Move,
  attacker: { stats: ReturnType<typeof calcStats> },
  defender: { stats: ReturnType<typeof calcStats> }
): number {
  if (move.power === null || move.damageClass === 'status') return 0

  const atk =
    move.damageClass === 'physical'
      ? attacker.stats.attack
      : attacker.stats.specialAttack

  const def =
    move.damageClass === 'physical'
      ? defender.stats.defense
      : defender.stats.specialDefense

  const base = Math.floor((atk / def) * move.power * 0.1) + 1

  // Accuracy check: treat null accuracy as always-hit
  const accuracy = move.accuracy ?? 100
  if (Math.random() * 100 > accuracy) return 0

  return base
}

// ---- Catch difficulty -------------------------------------------------------

export interface CatchDifficulty {
  problemsRequired: number
  timePerProblem: number
}

/**
 * Higher HP% remaining and higher level = harder to catch.
 * problemsRequired: 1–5, timePerProblem: 8–20 seconds.
 */
export function calcCatchDifficulty(
  wildHpPct: number,
  wildLevel: number
): CatchDifficulty {
  // Score 0–1: blend of remaining HP and level (levels cap at 60 for Kanto)
  const hpFactor = wildHpPct                       // 0 = near-fainted, 1 = full
  const levelFactor = Math.min(wildLevel / 60, 1)
  const score = hpFactor * 0.6 + levelFactor * 0.4

  const problemsRequired = Math.max(1, Math.round(score * 4) + 1) // 1–5
  const timePerProblem   = Math.round(20 - score * 12)            // 8–20s

  return { problemsRequired, timePerProblem }
}

// ---- Wild Pokemon spawn -----------------------------------------------------

export function spawnWildPokemon(species: PokemonSpecies, level: number): WildPokemon {
  const stats = calcStats(species.baseStats, level)
  return {
    speciesId: species.id,
    name: species.name,
    level,
    currentHp: stats.hp,
    maxHp: stats.hp,
    stats,
    moves: pickMoveset(species, level),
  }
}

// ---- Catch threshold --------------------------------------------------------

/** Wild Pokemon is catchable when HP is at or below this fraction */
export const CATCH_HP_THRESHOLD = 0.5
