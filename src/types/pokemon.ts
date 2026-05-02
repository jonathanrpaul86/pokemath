export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon'

export type DamageClass = 'physical' | 'special' | 'status'

export interface Move {
  id: number
  name: string
  type: PokemonType
  power: number | null
  accuracy: number | null
  damageClass: DamageClass
}

export interface BaseStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

/** Static species data fetched from PokeAPI and cached */
export interface PokemonSpecies {
  id: number
  name: string
  types: PokemonType[]
  baseStats: BaseStats
  sprites: {
    front: string
    back: string
  }
  /** Moves learned by level-up: level -> Move */
  levelUpMoves: Record<number, Move[]>
}

/** A Pokemon owned by Valentine */
export interface OwnedPokemon {
  uid: string
  speciesId: number
  name: string
  level: number
  xp: number
  xpToNextLevel: number
  currentHp: number
  maxHp: number
  stats: BaseStats
  /** Move IDs currently known (up to 4) */
  moveIds: number[]
  caughtAt: number
}

/** A wild Pokemon encountered in battle (ephemeral) */
export interface WildPokemon {
  speciesId: number
  name: string
  level: number
  currentHp: number
  maxHp: number
  stats: BaseStats
  /** Moves available at this level */
  moves: Move[]
}
