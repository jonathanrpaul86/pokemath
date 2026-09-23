import type { BaseStats, OwnedPokemon, PokemonSpecies, Trainer } from '../types'
import { calcStats, pokemonXpToNextLevel } from '../utils/formulas'

export const CHARMANDER_BASE: BaseStats = {
  hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65,
}

export const CHARMELEON_BASE: BaseStats = {
  hp: 58, attack: 64, defense: 58, specialAttack: 80, specialDefense: 65, speed: 80,
}

export function makeSpecies(overrides: Partial<PokemonSpecies> = {}): PokemonSpecies {
  return {
    id: 4,
    name: 'charmander',
    types: ['fire'],
    baseStats: CHARMANDER_BASE,
    sprites: { front: '', back: '' },
    levelUpMoves: {
      1: [{ id: 10, name: 'scratch', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' }],
    },
    ...overrides,
  }
}

export function makePokemon(overrides: Partial<OwnedPokemon> = {}): OwnedPokemon {
  const level = overrides.level ?? 5
  const baseStats = 'baseStats' in overrides ? overrides.baseStats : CHARMANDER_BASE
  const stats = calcStats(baseStats ?? CHARMANDER_BASE, level)
  return {
    uid: 'pkmn-1',
    speciesId: 4,
    name: 'charmander',
    level,
    xp: 0,
    xpToNextLevel: pokemonXpToNextLevel(level),
    currentHp: stats.hp,
    maxHp: stats.hp,
    stats,
    baseStats,
    moves: [],
    caughtAt: 0,
    ...overrides,
  }
}

export function makeTrainer(overrides: Partial<Trainer> = {}): Trainer {
  return {
    name: 'Tester',
    party: [makePokemon()],
    pc: [],
    pokedex: {},
    currentAreaId: 'route-1',
    unlockedAreaIds: ['route-1'],
    exploreProgress: {},
    mathStats: {
      operators: {
        '+': { totalAttempts: 0, correctAnswers: 0 },
        '-': { totalAttempts: 0, correctAnswers: 0 },
        '×': { totalAttempts: 0, correctAnswers: 0 },
        '÷': { totalAttempts: 0, correctAnswers: 0 },
      },
      lifetimeTotal: 0,
      lifetimeCorrect: 0,
    },
    money: 3000,
    items: [],
    balls: [],
    keyItems: [],
    badges: [],
    storyteller: { heardStoryIds: [], nextStoryAt: {} },
    ...overrides,
  }
}

/** Deterministic random numbers for reproducible rolls (LCG) */
export function seededRng(seed = 42): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}
