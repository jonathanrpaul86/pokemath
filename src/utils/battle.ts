import type { BattleOutcome, BattlePhase, MathProblem, Move, PokemonSpecies, WildPokemon } from '../types'
import { calcStats, pickMoveset } from './formulas'
import { generateProblem } from './math'
import { ITEM_MAP } from '../data/items'

export function isBattleOutcome(phase: BattlePhase): phase is BattleOutcome {
  return phase === 'victory' || phase === 'caught' || phase === 'fled' || phase === 'blacked-out'
}

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

// ---- Moves ------------------------------------------------------------------

/** Moves that deal damage. Status moves (Growl, Tail Whip…) have no effect in this game. */
export function damagingMoves(moves: Move[] = []): Move[] {
  return moves.filter(m => (m.power ?? 0) > 0)
}

/**
 * Moves to offer in the move menu when the player hits Fight. Empty when the
 * "choose moves" setting is off or there's only one attack to pick, so Fight
 * goes straight to the problem.
 */
export function moveMenuOptions(moves: Move[] | undefined, chooseMoves: boolean | undefined): Move[] {
  if (!chooseMoves) return []
  const options = damagingMoves(moves)
  return options.length > 1 ? options : []
}

// ---- Stronger moves, harder math --------------------------------------------

/** Difficulty points each step of move strength adds to a problem */
const MATH_BOOST_PER_TIER = 10

/** How much harder the math is when attacking with a move: 0 normal, 1 harder (power 60+), 2 hardest (power 90+) */
export function moveMathTier(move: Move): 0 | 1 | 2 {
  const power = move.power ?? 0
  return power >= 90 ? 2 : power >= 60 ? 1 : 0
}

/**
 * A battle problem at the area's difficulty. Attacking with a stronger chosen
 * move asks for harder math: bigger numbers of the kind the area already uses,
 * with the same time to answer.
 */
export function battleProblem(areaDifficulty: number, move?: Move): MathProblem {
  const base = generateProblem(areaDifficulty)
  const tier = move ? moveMathTier(move) : 0
  if (tier === 0) return base
  const harder = generateProblem(Math.min(100, areaDifficulty + tier * MATH_BOOST_PER_TIER), base.operator)
  return { ...harder, timeLimit: base.timeLimit }
}

// ---- Catch difficulty -------------------------------------------------------

export interface CatchDifficulty {
  problemsRequired: number
  timePerProblem: number
}

/**
 * Higher HP% remaining and higher level = harder to catch.
 * problemsRequired: 1–5, timePerProblem: 8–20 seconds.
 * ballId modifies problemsRequired via the item's catchMultiplier.
 */
export function calcCatchDifficulty(
  wildHpPct: number,
  wildLevel: number,
  ballId = 'poke-ball',
  legendary = false,
): CatchDifficulty {
  // Score 0–1: blend of remaining HP and level (levels cap at 60 for Kanto)
  const hpFactor = wildHpPct                       // 0 = near-fainted, 1 = full
  const levelFactor = Math.min(wildLevel / 60, 1)
  const score = hpFactor * 0.6 + levelFactor * 0.4

  const mult = ITEM_MAP[ballId]?.catchMultiplier ?? 1.0
  // Legendaries need two extra problems, unless it's a Master Ball
  const legendaryExtra = legendary && mult >= 0.1 ? 2 : 0
  const problemsRequired = Math.max(1, Math.round(score * 4 * mult) + 1) + legendaryExtra // 1–7
  const timePerProblem   = Math.round(20 - score * 12)                   // 8–20s

  return { problemsRequired, timePerProblem }
}

// ---- Money reward -----------------------------------------------------------

/** Pokédollars earned for defeating a wild Pokémon */
export function moneyReward(wildLevel: number): number {
  return Math.floor(wildLevel * 20 + 50)
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
    baseStats: species.baseStats,
    moves: pickMoveset(species, level),
  }
}

// ---- Catch threshold --------------------------------------------------------

/** Wild Pokemon is catchable when HP is at or below this fraction */
export const CATCH_HP_THRESHOLD = 0.5
