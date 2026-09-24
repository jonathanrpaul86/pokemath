import type { BaseStats, Move, OwnedPokemon, PokemonSpecies } from '../types'

// ---- Stat calculations ------------------------------------------------------

/** Simplified HP formula scaled for a kid's game (not Gen 1 exact) */
export function calcMaxHp(baseHp: number, level: number): number {
  return Math.floor(baseHp * 0.5 + level * 3 + 10)
}

/** Simplified stat formula for non-HP stats */
export function calcStat(baseStat: number, level: number): number {
  return Math.floor(baseStat * 0.5 + level * 2 + 5)
}

export function calcStats(baseStats: BaseStats, level: number): BaseStats {
  return {
    hp:             calcMaxHp(baseStats.hp, level),
    attack:         calcStat(baseStats.attack, level),
    defense:        calcStat(baseStats.defense, level),
    specialAttack:  calcStat(baseStats.specialAttack, level),
    specialDefense: calcStat(baseStats.specialDefense, level),
    speed:          calcStat(baseStats.speed, level),
  }
}

// ---- XP curves --------------------------------------------------------------

/**
 * XP required for a Pokemon to reach its next level. Paired with
 * battleXpReward so a level takes ~2.5 wins at any stage of the game, and
 * finishing each area's explores brings a lead Pokemon to within a few levels
 * of the next gym leader — close enough that fast math can carry the fight.
 */
export function pokemonXpToNextLevel(currentLevel: number): number {
  return currentLevel * 8 + 20
}

/**
 * Max Pokemon level by badges earned. Each cap sits just above the NEXT gym
 * leader's ace (Brock 14, Misty 21, Surge 24, Erika 29, Sabrina 38, Koga 43,
 * Blaine 47, Giovanni 50) so a single over-trained Pokemon can never
 * trivialize the next gym. All 8 badges lifts the cap entirely.
 */
const LEVEL_CAP_BY_BADGES = [15, 23, 26, 31, 40, 45, 49, 52, 100] as const

export function pokemonLevelCap(badgeCount: number): number {
  return LEVEL_CAP_BY_BADGES[Math.min(badgeCount, LEVEL_CAP_BY_BADGES.length - 1)]
}

/** XP rewarded to the active Pokemon after winning a battle */
/** Trainers' Pokémon are worth more XP than wild ones, as in the original games */
export const TRAINER_XP_MULTIPLIER = 1.5
/** With the Exp. All, the rest of the (conscious) party shares this much of the XP */
export const EXP_ALL_SHARE = 0.5

export function battleXpReward(level: number, fromTrainer = false): number {
  const base = level * 3 + 15
  return fromTrainer ? Math.round(base * TRAINER_XP_MULTIPLIER) : base
}

/** Money rewarded for defeating a trainer, based on their highest-level Pokémon */
export function trainerMoneyReward(topLevel: number): number {
  return Math.floor(topLevel * 30 + 50)
}

// ---- Pokemon factory --------------------------------------------------------

/** Every level-up move a species has learned by a given level, newest first */
function movesLearnedBy(species: PokemonSpecies, level: number): Array<{ learnLevel: number; move: Move }> {
  const entries: Array<{ learnLevel: number; move: Move }> = []
  for (const [learnLevelStr, moves] of Object.entries(species.levelUpMoves)) {
    const learnLevel = Number(learnLevelStr)
    if (learnLevel <= level) {
      for (const move of moves) entries.push({ learnLevel, move })
    }
  }
  return entries.sort((a, b) => b.learnLevel - a.learnLevel)
}

/** Returns the 4 most recently learned moves for a species at a given level. */
export function pickMoveset(species: PokemonSpecies, level: number): Move[] {
  return movesLearnedBy(species, level).slice(0, 4).map(e => e.move)
}

/**
 * The four moves a player's Pokémon keeps at a given level. Moves that deal no
 * damage do nothing in battle here, so its newest attacks come first, topped up
 * with its newest other moves when it knows fewer than four. Newest first.
 */
export function learnedMoveset(species: PokemonSpecies, level: number): Move[] {
  const learned = movesLearnedBy(species, level)
  const isAttack = (e: { move: Move }) => (e.move.power ?? 0) > 0
  const kept = [...learned.filter(isAttack), ...learned.filter(e => !isAttack(e))].slice(0, 4)
  return kept.sort((a, b) => b.learnLevel - a.learnLevel).map(e => e.move)
}

/**
 * Pokémon learn moves as they level up and evolve (see learnedMoveset).
 * Returns the moves a Pokémon should know now, or null when its moves are
 * already current.
 */
export function updatedMoveset(pokemon: OwnedPokemon, species: PokemonSpecies): Move[] | null {
  const moves = learnedMoveset(species, pokemon.level)
  const known = pokemon.moves ?? []
  const current = moves.length === known.length && moves.every((m, i) => m.id === known[i].id)
  // An empty learnset (missing data) shouldn't wipe out moves a Pokémon already knows
  return current || moves.length === 0 ? null : moves
}

/** Create a fresh OwnedPokemon from a species at a given level */
export function createOwnedPokemon(
  species: PokemonSpecies,
  level: number
): OwnedPokemon {
  const stats = calcStats(species.baseStats, level)
  return {
    uid: globalThis.crypto.randomUUID(),
    speciesId: species.id,
    name: species.name,
    level,
    xp: 0,
    xpToNextLevel: pokemonXpToNextLevel(level),
    currentHp: stats.hp,
    maxHp: stats.hp,
    baseStats: species.baseStats,
    stats,
    moves: learnedMoveset(species, level),
    caughtAt: Date.now(),
  }
}
