import type { Trainer, OwnedPokemon, MathStats, ItemPocket } from '../types'
import type { GameAction } from './actions'
import { createOwnedPokemon, pokemonXpToNextLevel, pokemonLevelCap, calcStats } from '../utils/formulas'
import { KANTO_AREAS, AREA_MAP } from '../data/areas'
import { ITEM_MAP } from '../data/items'
import { totalExplores, STORY_COOLDOWN_EXPLORES } from '../utils/storyteller'

const PARTY_MAX = 6
const DEV_TRAINER_NAME = 'DEBUG'
const DEV_STARTER_LEVEL = 40

// ---- Trainer factory --------------------------------------------------------

export function createNewTrainer(name: string, starterSpecies: Parameters<typeof createOwnedPokemon>[0]): Trainer {
  const isDev = name.trim().toUpperCase() === DEV_TRAINER_NAME
  const starter = createOwnedPokemon(starterSpecies, isDev ? DEV_STARTER_LEVEL : 5)
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
    name: isDev ? 'Trainer' : name,
    party: [starter],
    pc: [],
    pokedex: {
      [starterSpecies.id]: { seen: true, caught: true },
    },
    currentAreaId: 'route-1',
    unlockedAreaIds: isDev ? KANTO_AREAS.map(a => a.id) : ['route-1'],
    exploreProgress: isDev
      ? Object.fromEntries(KANTO_AREAS.map(a => [a.id, a.exploresToComplete]))
      : {},
    mathStats,
    money: 3000,
    items: [],
    balls: [{ itemId: 'poke-ball', quantity: isDev ? 99 : 5 }],
    keyItems: [],
    badges: [],
    storyteller: { heardStoryIds: [], nextStoryAt: {} },
  }
}

// ---- Level-up helpers -------------------------------------------------------

/** Recalculate stats for the Pokémon's level, keeping its HP ratio */
function withStatsForLevel(pokemon: OwnedPokemon, level: number): OwnedPokemon {
  const hpRatio = pokemon.maxHp > 0 ? pokemon.currentHp / pokemon.maxHp : 1
  if (pokemon.baseStats) {
    const stats = calcStats(pokemon.baseStats, level)
    return { ...pokemon, stats, maxHp: stats.hp, currentHp: Math.max(1, Math.floor(stats.hp * hpRatio)) }
  }
  // Legacy Pokémon without base stats yet: grow HP only until backfilled
  const maxHp = Math.floor(pokemon.stats.hp * 0.5 + level * 3 + 10)
  return { ...pokemon, maxHp, currentHp: Math.max(1, Math.floor(maxHp * hpRatio)) }
}

function applyPokemonLevelUp(pokemon: OwnedPokemon, levelCap: number): OwnedPokemon {
  let { level, xp, xpToNextLevel } = pokemon
  while (xp >= xpToNextLevel && level < levelCap) {
    xp -= xpToNextLevel
    level += 1
    xpToNextLevel = pokemonXpToNextLevel(level)
  }
  // At the cap, hold at most one full bar of XP so the next badge grants an
  // immediate level-up instead of a multi-level surge
  if (level >= levelCap) xp = Math.min(xp, xpToNextLevel)
  if (level === pokemon.level && xp === pokemon.xp) return pokemon
  if (level === pokemon.level) return { ...pokemon, xp }
  return { ...withStatsForLevel(pokemon, level), level, xp, xpToNextLevel }
}

// ---- Inventory helper -------------------------------------------------------

function pocketKey(pocket: ItemPocket): 'items' | 'balls' | 'keyItems' {
  if (pocket === 'ball') return 'balls'
  if (pocket === 'key-item') return 'keyItems'
  return 'items'
}

// ---- Reducer ----------------------------------------------------------------

export function gameReducer(trainer: Trainer, action: GameAction): Trainer {
  let next: Trainer

  switch (action.type) {
    case 'RECORD_EXPLORE': {
      const { areaId } = action.payload
      const area = AREA_MAP[areaId]
      if (!area || area.exploresToComplete === 0) return trainer
      next = {
        ...trainer,
        exploreProgress: {
          ...trainer.exploreProgress,
          [areaId]: (trainer.exploreProgress[areaId] ?? 0) + 1,
        },
      }
      break
    }

    case 'FINISH_STORY': {
      const { cityId, storyId } = action.payload
      const { heardStoryIds, nextStoryAt } = trainer.storyteller
      next = {
        ...trainer,
        storyteller: {
          heardStoryIds: heardStoryIds.includes(storyId) ? heardStoryIds : [...heardStoryIds, storyId],
          nextStoryAt: {
            ...nextStoryAt,
            [cityId]: totalExplores(trainer.exploreProgress) + STORY_COOLDOWN_EXPLORES,
          },
        },
      }
      break
    }

    case 'SET_BASE_STATS': {
      const { uid, baseStats } = action.payload
      const backfill = (list: OwnedPokemon[]) => list.map(p =>
        p.uid === uid && !p.baseStats ? withStatsForLevel({ ...p, baseStats }, p.level) : p
      )
      next = { ...trainer, party: backfill(trainer.party), pc: backfill(trainer.pc) }
      break
    }

    case 'GAIN_POKEMON_XP': {
      const { uid, amount } = action.payload
      const cap = pokemonLevelCap(trainer.badges.length)
      next = {
        ...trainer,
        party: trainer.party.map(p =>
          p.uid === uid
            ? applyPokemonLevelUp({ ...p, xp: p.xp + amount }, cap)
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
            baseStats: newBaseStats,
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

    case 'GAIN_MONEY': {
      next = { ...trainer, money: trainer.money + action.payload.amount }
      break
    }

    case 'SPEND_MONEY': {
      next = { ...trainer, money: Math.max(0, trainer.money - action.payload.amount) }
      break
    }

    case 'ADD_ITEM': {
      const { itemId, quantity } = action.payload
      const def = ITEM_MAP[itemId]
      if (!def) return trainer
      const key = pocketKey(def.pocket)
      const slots = trainer[key].map(s => ({ ...s }))
      const existing = slots.find(s => s.itemId === itemId)
      if (existing) {
        existing.quantity += quantity
      } else {
        slots.push({ itemId, quantity })
      }
      next = { ...trainer, [key]: slots }
      break
    }

    case 'REMOVE_ITEM': {
      const { itemId, quantity } = action.payload
      const def = ITEM_MAP[itemId]
      if (!def) return trainer
      const key = pocketKey(def.pocket)
      const slots = trainer[key]
        .map(s => s.itemId === itemId ? { ...s, quantity: s.quantity - quantity } : { ...s })
        .filter(s => s.quantity > 0)
      next = { ...trainer, [key]: slots }
      break
    }

    case 'EARN_BADGE': {
      const { badgeId } = action.payload
      if (trainer.badges.includes(badgeId)) return trainer
      // Raising the cap may unlock a banked level-up for capped Pokemon
      const newCap = pokemonLevelCap(trainer.badges.length + 1)
      next = {
        ...trainer,
        badges: [...trainer.badges, badgeId],
        party: trainer.party.map(p => applyPokemonLevelUp(p, newCap)),
        pc: trainer.pc.map(p => applyPokemonLevelUp(p, newCap)),
      }
      break
    }

    case 'RECORD_GYM_TRAINER_DEFEAT': {
      const { gymId, trainerId } = action.payload
      const prev = trainer.gymProgress?.[gymId] ?? { defeatedTrainerIds: [], leaderDefeated: false }
      if (prev.defeatedTrainerIds.includes(trainerId)) return trainer
      next = {
        ...trainer,
        gymProgress: {
          ...trainer.gymProgress,
          [gymId]: { ...prev, defeatedTrainerIds: [...prev.defeatedTrainerIds, trainerId] },
        },
      }
      break
    }

    default:
      return trainer
  }

  return next
}
