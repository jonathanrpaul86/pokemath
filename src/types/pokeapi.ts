/** Shapes of the raw PokeAPI responses we care about */

export interface PokeApiStat {
  base_stat: number
  stat: { name: string }
}

export interface PokeApiMove {
  move: { name: string; url: string }
  version_group_details: Array<{
    level_learned_at: number
    move_learn_method: { name: string }
  }>
}

export interface PokeApiSprites {
  front_default: string | null
  back_default: string | null
}

export interface PokeApiPokemon {
  id: number
  name: string
  types: Array<{ type: { name: string } }>
  stats: PokeApiStat[]
  moves: PokeApiMove[]
  sprites: PokeApiSprites
}

export interface PokeApiMoveDetail {
  id: number
  name: string
  type: { name: string }
  power: number | null
  accuracy: number | null
  damage_class: { name: string }
}
