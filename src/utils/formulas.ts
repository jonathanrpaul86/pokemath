import type { BaseStats, OwnedPokemon, PokemonSpecies } from '../types'

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

/** XP required to reach the next trainer level */
export function trainerXpToNextLevel(currentLevel: number): number {
  return currentLevel * 100
}

/** XP required for a Pokemon to reach its next level */
export function pokemonXpToNextLevel(currentLevel: number): number {
  return currentLevel * 50
}

/** XP rewarded to Valentine's active Pokemon after winning a battle */
export function battleXpReward(wildLevel: number): number {
  return Math.floor(wildLevel * 1.5 + 10)
}

/** XP rewarded to Valentine's trainer after winning a battle */
export function trainerXpReward(wildLevel: number): number {
  return Math.floor(wildLevel * 2 + 5)
}

// ---- Pokemon factory --------------------------------------------------------

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
    stats,
    moveIds: [],
    caughtAt: Date.now(),
  }
}
