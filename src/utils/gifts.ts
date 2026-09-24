import type { PokedexEntry } from '../types'
import { EVOLUTIONS } from '../data/evolutions'

/** A species and everything it can evolve into */
export function evolutionLine(speciesId: number): number[] {
  const line = [speciesId]
  for (let i = 0; i < line.length; i++) {
    const evo = EVOLUTIONS[line[i]]
    const next = evo ? evo.choices ?? [evo.evolvesIntoId] : []
    for (const id of next) if (!line.includes(id)) line.push(id)
  }
  return line
}

/**
 * Which species a Pokémon gift offers: the ones whose evolution line the
 * player hasn't caught yet, or all of them once they've caught every one
 */
export function giftChoices(speciesIds: number[], pokedex: Record<number, PokedexEntry>): number[] {
  const fresh = speciesIds.filter(id => !evolutionLine(id).some(member => pokedex[member]?.caught))
  return fresh.length ? fresh : speciesIds
}
