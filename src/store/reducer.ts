import type { Trainer, OwnedPokemon, MathStats } from '../types'
import type { GameAction } from './actions'
import { createOwnedPokemon, trainerXpToNextLevel, pokemonXpToNextLevel, calcStats } from '../utils/formulas'
import { KANTO_AREAS } from '../data/areas'

const PARTY_MAX = 6
const DEV_TRAINER_NAME = 'DEBUG'
const DEV_TRAINER_LEVEL = 40

// ---- Trainer factory --------------------------------------------------------

export function createNewTrainer(name: string, starterSpecies: Parameters<typeof createOwnedPokemon>[0]): Trainer {
  const isDev = name.trim().toUpperCase() === DEV_TRAINER_NAME
  const starterLevel = isDev ? DEV_TRAINER_LEVEL : 5
  const trainerLevel = isDev ? DEV_TRAINER_LEVEL : 1
  const starter = createOwnedPokemon(starterSpecies, starterLevel)
  const mathStats: MathStats = {
    operators: {
      '+': { totalAttempts: 0, correctAnswers: 0 },
      '-': { totalAttempts: 0, correctAnswers: 0 },
      '×': { totalAttempts: 0, correctAnswers: 0 },
      '÷': { totalAttempts: 0, correctAnswers: 0 },
    },
    lifetimeTotal: 0,
    lifetimeCorrect: 0,
  }

  return {
    name,
    level: trainerLevel,
    xp: 0,
    xpToNextLevel: trainerXpToNextLevel(trainerLevel),
    party: [starter],
    pc: [],
    pokedex: {
      [starterSpecies.id]: { seen: true, caught: true },
    },
    currentAreaId: 'route-1',
    unlockedAreaIds: isDev ? KANTO_AREAS.map(a => a.id) : ['route-1'],
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
      const prev = trainer.mathStats.operators[operator] ?? { totalAttempts: 0, correctAnswers: 0 }
      const updatedOp = {
        totalAttempts: prev.totalAttempts + 1,
        correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
      }
      const updatedStats: MathStats = {
        ...trainer.mathStats,
        operators: { ...trainer.mathStats.operators, [operator]: updatedOp },
        lifetimeTotal: trainer.mathStats.lifetimeTotal + 1,
        lifetimeCorrect: trainer.mathStats.lifetimeCorrect + (correct ? 1 : 0),
      }
      next = { ...trainer, mathStats: updatedStats }
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

    case 'EVOLVE_POKEMON': {
      const { uid, newSpeciesId, newName, newBaseStats } = action.payload
      function evolve(list: typeof trainer.party) {
        return list.map(p => {
          if (p.uid !== uid) return p
          const newStats = calcStats(newBaseStats, p.level)
          const hpRatio = p.maxHp > 0 ? p.currentHp / p.maxHp : 1
          return {
            ...p,
            speciesId: newSpeciesId,
            name: newName,
            stats: newStats,
            maxHp: newStats.hp,
            currentHp: Math.max(1, Math.floor(newStats.hp * hpRatio)),
          }
        })
      }
      next = {
        ...trainer,
        party: evolve(trainer.party),
        pc: evolve(trainer.pc),
        pokedex: {
          ...trainer.pokedex,
          [newSpeciesId]: { seen: true, caught: true },
        },
      }
      break
    }

    case 'REORDER_PARTY': {
      const { uid, direction } = action.payload
      const idx = trainer.party.findIndex(p => p.uid === uid)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (idx === -1 || swapIdx < 0 || swapIdx >= trainer.party.length) return trainer
      const party = [...trainer.party]
      ;[party[idx], party[swapIdx]] = [party[swapIdx], party[idx]]
      next = { ...trainer, party }
      break
    }

    case 'REORDER_PC': {
      const { uid, direction } = action.payload
      const idx = trainer.pc.findIndex(p => p.uid === uid)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (idx === -1 || swapIdx < 0 || swapIdx >= trainer.pc.length) return trainer
      const pc = [...trainer.pc]
      ;[pc[idx], pc[swapIdx]] = [pc[swapIdx], pc[idx]]
      next = { ...trainer, pc }
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

    case 'RENAME_TRAINER': {
      const trimmed = action.payload.name.trim()
      if (!trimmed) return trainer
      next = { ...trainer, name: trimmed }
      break
    }

    case 'SET_TIMER_MULTIPLIER': {
      next = { ...trainer, timerMultiplier: action.payload.multiplier }
      break
    }

    default:
      return trainer
  }

  return next
}
