/**
 * Expected-value model of a playthrough, for checking level pacing. It follows
 * the areas a player must fully explore before each gym, and tracks how
 * strong their lead Pokémon (which fights every battle) and a typical team
 * member (one of four sharing the battles) would be when they arrive.
 */
import type { Area } from '../types'
import { AREA_MAP } from '../data/areas'
import { KANTO_GYMS } from '../data/gyms'
import { POKEMON_LEAGUE } from '../data/league'
import { battleXpReward, pokemonLevelCap, pokemonXpToNextLevel, EXP_ALL_SHARE } from './formulas'

/** Chance an explore turns into a wild battle / a trainer battle (see OUTCOME_WEIGHTS in explore.ts) */
const WILD_CHANCE = 0.64
const TRAINER_CHANCE = 0.12
const TEAM_SIZE = 4

/** Areas on the way to each gym (and the League), in the order they're explored */
export interface PacingRoute {
  name: string
  stages: string[][]
  /** Area whose completion hands out the Exp. All, if this route passes it */
  expAllFrom?: string
}

/** Route 15 opens straight off Fuchsia, so bike riders can fetch the Exp. All before Koga too */
const BEFORE_KOGA_BY_BIKE = ['route-11', 'route-16', 'cycling-road', 'route-18', 'route-15']
const BEFORE_KOGA_BY_FLUTE = ['route-12', 'route-13', 'route-14', 'route-15']

function route(name: string, beforeKoga: string[]): PacingRoute {
  return {
    name,
    stages: [
      ['route-1', 'route-2', 'viridian-forest'],                          // → Brock
      ['route-3', 'mt-moon', 'route-4'],                                  // → Misty
      ['route-5', 'route-6'],                                             // → Surge
      ['route-9', 'rock-tunnel', 'route-10', 'route-8', 'route-7'],       // → Erika
      ['pokemon-tower'],                                                  // → Sabrina
      beforeKoga,                                                         // → Koga
      ['route-19', 'route-20', 'seafoam-islands', 'cinnabar-island'],     // → Blaine
      ['route-21', 'route-22', 'route-23'],                               // → Giovanni
      ['victory-road'],                                                   // → League
    ],
    expAllFrom: 'route-15',
  }
}

export const PACING_ROUTES: PacingRoute[] = [
  route('Cycling Road', BEFORE_KOGA_BY_BIKE),
  route('Routes 12–15', BEFORE_KOGA_BY_FLUTE),
]

export interface PacingCheckpoint {
  opponent: string
  /** The opponent's strongest Pokémon */
  aceLevel: number
  leadLevel: number
  teamLevel: number
}

/** Expected XP from one explore of an area */
function exploreXp(area: Area): number {
  const wild = area.encounters.filter(e => !e.requiresKeyItem)
  const total = wild.reduce((sum, e) => sum + e.weight, 0)
  const avgLevel = wild.reduce((sum, e) => sum + e.weight * (e.minLevel + e.maxLevel) / 2, 0) / total
  const trainerTeam = area.mathDifficulty < 25 ? 1 : area.mathDifficulty < 60 ? 1.5 : 2.5
  return WILD_CHANCE * battleXpReward(avgLevel) + TRAINER_CHANCE * trainerTeam * battleXpReward(avgLevel, true)
}

/** A Pokémon's level and XP, growing under a level cap */
class Growth {
  level = 5
  xp = 0

  gain(amount: number, cap: number) {
    this.xp += amount
    while (this.level < cap && this.xp >= pokemonXpToNextLevel(this.level)) {
      this.xp -= pokemonXpToNextLevel(this.level)
      this.level++
    }
    // At the cap, XP banks up to one full bar (like the reducer)
    if (this.level >= cap) this.xp = Math.min(this.xp, pokemonXpToNextLevel(this.level))
  }
}

export function simulatePacing(r: PacingRoute): PacingCheckpoint[] {
  const lead = new Growth()
  const member = new Growth()
  let expAll = false
  const checkpoints: PacingCheckpoint[] = []

  const battle = (xp: number, badges: number) => {
    const cap = pokemonLevelCap(badges)
    lead.gain(xp, cap)
    // A team member fights a quarter of the battles, and shares the rest with the Exp. All
    member.gain(xp / TEAM_SIZE + (expAll ? xp * (TEAM_SIZE - 1) / TEAM_SIZE * EXP_ALL_SHARE : 0), cap)
  }

  r.stages.forEach((areaIds, badges) => {
    for (const id of areaIds) {
      const area = AREA_MAP[id]
      for (let i = 0; i < area.exploresToComplete; i++) battle(exploreXp(area), badges)
      if (id === r.expAllFrom) expAll = true
    }
    const gym = KANTO_GYMS[badges]
    if (gym) {
      for (const p of gym.trainers.flatMap(t => t.team)) battle(battleXpReward(p.level, true), badges)
      checkpoints.push({
        opponent: gym.leader.name,
        aceLevel: Math.max(...gym.leader.team.map(p => p.level)),
        leadLevel: lead.level,
        teamLevel: member.level,
      })
      for (const p of gym.leader.team) battle(battleXpReward(p.level, true), badges)
    } else {
      // The League, fought back to back after the last gym
      for (const m of POKEMON_LEAGUE) {
        checkpoints.push({
          opponent: m.name,
          aceLevel: Math.max(...m.team.map(p => p.level)),
          leadLevel: lead.level,
          teamLevel: member.level,
        })
        for (const p of m.team) battle(battleXpReward(p.level, true), badges)
      }
    }
  })
  return checkpoints
}
