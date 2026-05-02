import type { Trainer, OwnedPokemon, MathStats, DifficultyLevel } from '../types'
import type { GameAction } from './actions'
import { createOwnedPokemon, trainerXpToNextLevel, pokemonXpToNextLevel } from '../utils/formulas'
import { saveTrainer } from './localStorage'

const PARTY_MAX = 6

// ---- Trainer factory --------------------------------------------------------

export function createNewTrainer(starterSpecies: Parameters<typeof createOwnedPokemon>[0]): Trainer {
  const starter = createOwnedPokemon(starterSpecies, 5)
  const mathStats: MathStats = {
    difficultyLevel: 1,
    operators: {
      '+': { totalAttempts: 0, correctAnswers: 0 },
      '-': { totalAttempts: 0, correctAnswers: 0 },
    },
    lifetimeTotal: 0,
    lifetimeCorrect: 0,
  }

  return {
    name: 'Valentine',
    level: 1,
    xp: 0,
    xpToNextLevel: trainerXpToNextLevel(1),
    party: [starter],
    pc: [],
    pokedex: {
      [starterSpecies.id]: { seen: true, caught: true },
    },
    currentAreaId: 'route-1',
    unlockedAreaIds: ['route-1'],
    mathStats,
  }
}

// ---- Level-up helpers -------------------------------------------------------

function applyTrainerLevelUps(trainer: Trainer): Trainer {
  let { level, xp, xpToNextLevel } = trainer
  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel
    level += 1
    xpToNextLevel = trainerXpToNextLevel(level)
  }
  return { ...trainer, level, xp, xpToNextLevel }
}

function applyPokemonLevelUp(pokemon: OwnedPokemon): OwnedPokemon {
  let { level, xp, xpToNextLevel } = pokemon
  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel
    level += 1
    xpToNextLevel = pokemonXpToNextLevel(level)
  }
  // Recalculate HP ceiling on level up (keep current HP ratio)
  const hpRatio = pokemon.currentHp / pokemon.maxHp
  const newMaxHp = Math.floor(pokemon.stats.hp * 0.5 + level * 3 + 10)
  const newCurrentHp = Math.max(1, Math.floor(newMaxHp * hpRatio))
  return { ...pokemon, level, xp, xpToNextLevel, maxHp: newMaxHp, currentHp: newCurrentHp }
}

// ---- Adaptive difficulty ----------------------------------------------------

const ACCURACY_THRESHOLD_UP = 0.90   // promote if correct ≥ 90% over last 20
const ACCURACY_THRESHOLD_DOWN = 0.55 // demote if correct < 55% over last 20
const WINDOW = 20

function adjustDifficulty(stats: MathStats): MathStats {
  const combined =
    stats.operators['+'].totalAttempts + stats.operators['-'].totalAttempts
  if (combined < WINDOW) return stats

  const correct =
    stats.operators['+'].correctAnswers + stats.operators['-'].correctAnswers
  const accuracy = correct / combined

  let { difficultyLevel } = stats
  if (accuracy >= ACCURACY_THRESHOLD_UP && difficultyLevel < 5) {
    difficultyLevel = (difficultyLevel + 1) as DifficultyLevel
  } else if (accuracy < ACCURACY_THRESHOLD_DOWN && difficultyLevel > 1) {
    difficultyLevel = (difficultyLevel - 1) as DifficultyLevel
  }

  return { ...stats, difficultyLevel }
}

// ---- Reducer ----------------------------------------------------------------

export function gameReducer(trainer: Trainer, action: GameAction): Trainer {
  let next: Trainer

  switch (action.type) {
    case 'GAIN_TRAINER_XP': {
      next = applyTrainerLevelUps({
        ...trainer,
        xp: trainer.xp + action.payload.amount,
      })
      break
    }

    case 'GAIN_POKEMON_XP': {
      const { uid, amount } = action.payload
      next = {
        ...trainer,
        party: trainer.party.map(p =>
          p.uid === uid
            ? applyPokemonLevelUp({ ...p, xp: p.xp + amount })
            : p
        ),
      }
      break
    }

    case 'CATCH_POKEMON': {
      const { pokemon } = action.payload
      const inParty = trainer.party.length < PARTY_MAX
      next = {
        ...trainer,
        party: inParty ? [...trainer.party, pokemon] : trainer.party,
        pc: inParty ? trainer.pc : [...trainer.pc, pokemon],
        pokedex: {
          ...trainer.pokedex,
          [pokemon.speciesId]: { seen: true, caught: true },
        },
      }
      break
    }

    case 'RECORD_ANSWER': {
      const { operator, correct } = action.payload
      const prev = trainer.mathStats.operators[operator]
      const updatedOp = {
        totalAttempts: prev.totalAttempts + 1,
        correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
      }
      const updatedStats: MathStats = adjustDifficulty({
        ...trainer.mathStats,
        operators: { ...trainer.mathStats.operators, [operator]: updatedOp },
        lifetimeTotal: trainer.mathStats.lifetimeTotal + 1,
        lifetimeCorrect: trainer.mathStats.lifetimeCorrect + (correct ? 1 : 0),
      })
      next = { ...trainer, mathStats: updatedStats }
      break
    }

    case 'SET_DIFFICULTY': {
      next = {
        ...trainer,
        mathStats: { ...trainer.mathStats, difficultyLevel: action.payload.level },
      }
      break
    }

    case 'UNLOCK_AREA': {
      const { areaId } = action.payload
      if (trainer.unlockedAreaIds.includes(areaId)) return trainer
      next = { ...trainer, unlockedAreaIds: [...trainer.unlockedAreaIds, areaId] }
      break
    }

    case 'SET_CURRENT_AREA': {
      next = { ...trainer, currentAreaId: action.payload.areaId }
      break
    }

    case 'MOVE_TO_PARTY': {
      const { uid } = action.payload
      if (trainer.party.length >= PARTY_MAX) return trainer
      const pokemon = trainer.pc.find(p => p.uid === uid)
      if (!pokemon) return trainer
      next = {
        ...trainer,
        party: [...trainer.party, pokemon],
        pc: trainer.pc.filter(p => p.uid !== uid),
      }
      break
    }

    case 'MOVE_TO_PC': {
      const { uid } = action.payload
      if (trainer.party.length <= 1) return trainer // can't deposit last Pokemon
      const pokemon = trainer.party.find(p => p.uid === uid)
      if (!pokemon) return trainer
      next = {
        ...trainer,
        party: trainer.party.filter(p => p.uid !== uid),
        pc: [...trainer.pc, pokemon],
      }
      break
    }

    case 'HEAL_PARTY': {
      next = {
        ...trainer,
        party: trainer.party.map(p => ({ ...p, currentHp: p.maxHp })),
      }
      break
    }

    case 'SEE_POKEMON': {
      const { speciesId } = action.payload
      if (trainer.pokedex[speciesId]?.seen) return trainer
      next = {
        ...trainer,
        pokedex: {
          ...trainer.pokedex,
          [speciesId]: { seen: true, caught: trainer.pokedex[speciesId]?.caught ?? false },
        },
      }
      break
    }

    case 'UPDATE_POKEMON_HP': {
      const { uid, currentHp } = action.payload
      next = {
        ...trainer,
        party: trainer.party.map(p =>
          p.uid === uid ? { ...p, currentHp: Math.max(0, currentHp) } : p
        ),
      }
      break
    }

    default:
      return trainer
  }

  saveTrainer(next)
  return next
}
