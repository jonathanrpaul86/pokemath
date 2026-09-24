import type { AreaReward, TrainerPokemon } from '../types'
import { KANTO_NAMES } from './pokedex'

/** One opponent in the Pokémon League gauntlet */
export interface LeagueMember {
  id: string
  title: 'Elite Four' | 'Champion'
  name: string
  type: string
  team: TrainerPokemon[]
  quote: string
  /** Said after losing, before the player moves on */
  winQuote: string
}

/** Where the League is, and how many badges it takes to get in */
export const LEAGUE_AREA_ID = 'indigo-plateau'
export const LEAGUE_BADGES_REQUIRED = 8

/** Fought back to back, with no Pokémon Center in between */
export const POKEMON_LEAGUE: LeagueMember[] = [
  {
    id: 'lorelei',
    title: 'Elite Four',
    name: 'Lorelei',
    type: 'Ice',
    team: [
      { speciesId: 87,  level: 50 }, // Dewgong
      { speciesId: 91,  level: 51 }, // Cloyster
      { speciesId: 124, level: 52 }, // Jynx
      { speciesId: 131, level: 54 }, // Lapras
    ],
    quote: 'Welcome to the Pokémon League! I am Lorelei of the Elite Four. My Ice Pokémon will freeze you solid!',
    winQuote: 'You’re better than I thought! Go on ahead, but Bruno won’t go easy on you.',
  },
  {
    id: 'bruno',
    title: 'Elite Four',
    name: 'Bruno',
    type: 'Fighting',
    team: [
      { speciesId: 95,  level: 51 }, // Onix
      { speciesId: 107, level: 53 }, // Hitmonchan
      { speciesId: 106, level: 53 }, // Hitmonlee
      { speciesId: 68,  level: 55 }, // Machamp
    ],
    quote: 'I am Bruno! My Fighting Pokémon and I train together every single day. Hoo hah!',
    winQuote: 'Why? How could I lose? …You’ve earned it. Agatha is next.',
  },
  {
    id: 'agatha',
    title: 'Elite Four',
    name: 'Agatha',
    type: 'Ghost',
    team: [
      { speciesId: 93,  level: 52 }, // Haunter
      { speciesId: 42,  level: 53 }, // Golbat
      { speciesId: 24,  level: 54 }, // Arbok
      { speciesId: 94,  level: 56 }, // Gengar
    ],
    quote: 'I’m Agatha of the Elite Four. Let me show you how a real trainer battles, youngster!',
    winQuote: 'Oh ho! You’re something special, child. Go on, Lance is waiting.',
  },
  {
    id: 'lance',
    title: 'Elite Four',
    name: 'Lance',
    type: 'Dragon',
    team: [
      { speciesId: 130, level: 54 }, // Gyarados
      { speciesId: 148, level: 54 }, // Dragonair
      { speciesId: 148, level: 55 }, // Dragonair
      { speciesId: 142, level: 56 }, // Aerodactyl
      { speciesId: 149, level: 58 }, // Dragonite
    ],
    quote: 'I lead the Elite Four. My Dragon Pokémon are the mightiest of all. You can’t beat them!',
    winQuote: 'I still can’t believe my dragons lost! You are now truly powerful. One more battle remains…',
  },
  {
    id: 'champion',
    title: 'Champion',
    name: 'Champion Blue',
    type: 'Mixed',
    team: [
      { speciesId: 18,  level: 56 }, // Pidgeot
      { speciesId: 65,  level: 56 }, // Alakazam
      { speciesId: 112, level: 57 }, // Rhydon
      { speciesId: 103, level: 58 }, // Exeggutor
      { speciesId: 59,  level: 60 }, // Arcanine
    ],
    quote: 'Hey! I was waiting for you. I beat the Elite Four before you did, so I’m the Champion! Ready to lose?',
    winQuote: 'NO! That can’t be! You beat me at my best… You’re the new Pokémon League Champion!',
  },
]

/**
 * Like the rival in the original games, the Champion picked the starter that
 * beats the player's, and built the rest of his team around it
 */
const CHAMPION_CORE: TrainerPokemon[] = [
  { speciesId: 18,  level: 56 }, // Pidgeot
  { speciesId: 65,  level: 56 }, // Alakazam
  { speciesId: 112, level: 57 }, // Rhydon
]

const RIVAL_TEAMS: Record<number, { starterId: number; team: TrainerPokemon[] }> = {
  // Player chose Bulbasaur → the Champion has Charmander's line
  1: { starterId: 4, team: [...CHAMPION_CORE, { speciesId: 130, level: 58 }, { speciesId: 6, level: 60 }] }, // Gyarados, Charizard
  // Player chose Charmander → Squirtle's line
  4: { starterId: 7, team: [...CHAMPION_CORE, { speciesId: 103, level: 58 }, { speciesId: 9, level: 60 }] }, // Exeggutor, Blastoise
  // Player chose Squirtle → Bulbasaur's line
  7: { starterId: 1, team: [...CHAMPION_CORE, { speciesId: 59, level: 58 }, { speciesId: 3, level: 60 }] },  // Arcanine, Venusaur
}

/** The Champion's team for this player (his usual team if their starter isn't known) */
export function championTeam(playerStarterId?: number): TrainerPokemon[] {
  const rival = playerStarterId !== undefined ? RIVAL_TEAMS[playerStarterId] : undefined
  return rival?.team ?? POKEMON_LEAGUE[POKEMON_LEAGUE.length - 1].team
}

/** What the Champion says before the battle, remembering the starters they both picked */
export function championQuote(playerStarterId?: number): string {
  const champion = POKEMON_LEAGUE[POKEMON_LEAGUE.length - 1]
  const rival = playerStarterId !== undefined ? RIVAL_TEAMS[playerStarterId] : undefined
  if (!rival) return champion.quote
  return `${champion.quote} Remember back in Pallet Town? You picked ${KANTO_NAMES[playerStarterId!]}, so I picked ${KANTO_NAMES[rival.starterId]}. Now it's all grown up!`
}

/** Handed over the first time the player enters the Hall of Fame */
export const CHAMPION_GIFT: AreaReward = {
  npcName: 'Professor Oak',
  lines: [
    'Congratulations! You’re the new Champion of the Pokémon League!',
    'You’ve grown so much since you left Pallet Town. Your Pokémon clearly love and trust you.',
    'I have one last surprise. A very rare Pokémon has been hiding near the lab, and it wants to travel with you!',
  ],
  gift: { kind: 'pokemon', speciesIds: [151], level: 50 },
}

/** Claim id for the Champion gift, so it's only given once */
export const CHAMPION_GIFT_ID = 'hall-of-fame'
