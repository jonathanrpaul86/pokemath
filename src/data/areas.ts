import type { Area } from '../types'

export const KANTO_AREAS: Area[] = [
  {
    id: 'route-1',
    name: 'Route 1',
    description: 'A grassy path outside Pallet Town. Weak wild Pokemon roam here.',
    requiredTrainerLevel: 1,
    connectedAreaIds: ['viridian-city'],
    encounters: [
      { speciesId: 16, weight: 50, minLevel: 2, maxLevel: 4 },  // Pidgey
      { speciesId: 19, weight: 50, minLevel: 2, maxLevel: 4 },  // Rattata
    ],
  },
  {
    id: 'viridian-city',
    name: 'Viridian City',
    description: 'Routes around the first city. New Pokemon starting to appear.',
    requiredTrainerLevel: 3,
    connectedAreaIds: ['route-1', 'viridian-forest'],
    encounters: [
      { speciesId: 16, weight: 35, minLevel: 3, maxLevel: 6 },  // Pidgey
      { speciesId: 19, weight: 35, minLevel: 3, maxLevel: 6 },  // Rattata
      { speciesId: 29, weight: 15, minLevel: 3, maxLevel: 5 },  // Nidoran♀
      { speciesId: 32, weight: 15, minLevel: 3, maxLevel: 5 },  // Nidoran♂
    ],
  },
  {
    id: 'viridian-forest',
    name: 'Viridian Forest',
    description: 'A dense forest full of Bug-type Pokemon — and a rare Pikachu!',
    requiredTrainerLevel: 5,
    connectedAreaIds: ['viridian-city', 'pewter-city'],
    encounters: [
      { speciesId: 10, weight: 35, minLevel: 3, maxLevel: 7 },  // Caterpie
      { speciesId: 13, weight: 35, minLevel: 3, maxLevel: 7 },  // Weedle
      { speciesId: 11, weight: 10, minLevel: 4, maxLevel: 6 },  // Metapod
      { speciesId: 14, weight: 10, minLevel: 4, maxLevel: 6 },  // Kakuna
      { speciesId: 25, weight: 10, minLevel: 4, maxLevel: 7 },  // Pikachu
    ],
  },
  {
    id: 'pewter-city',
    name: 'Pewter City',
    description: 'Rocky terrain surrounds the Boulder Badge gym.',
    requiredTrainerLevel: 8,
    connectedAreaIds: ['viridian-forest', 'mt-moon'],
    encounters: [
      { speciesId: 21, weight: 35, minLevel: 6, maxLevel: 10 }, // Spearow
      { speciesId: 39, weight: 20, minLevel: 6, maxLevel: 10 }, // Jigglypuff
      { speciesId: 23, weight: 20, minLevel: 6, maxLevel: 10 }, // Ekans
      { speciesId: 27, weight: 25, minLevel: 6, maxLevel: 10 }, // Sandshrew
    ],
  },
  {
    id: 'mt-moon',
    name: 'Mt. Moon',
    description: 'A deep cave system. Clefairy are said to dance here under the moon.',
    requiredTrainerLevel: 11,
    connectedAreaIds: ['pewter-city', 'cerulean-city'],
    encounters: [
      { speciesId: 41, weight: 45, minLevel: 8,  maxLevel: 12 }, // Zubat
      { speciesId: 74, weight: 30, minLevel: 8,  maxLevel: 12 }, // Geodude
      { speciesId: 46, weight: 15, minLevel: 8,  maxLevel: 11 }, // Paras
      { speciesId: 35, weight: 10, minLevel: 9,  maxLevel: 12 }, // Clefairy
    ],
  },
  {
    id: 'cerulean-city',
    name: 'Cerulean City',
    description: 'Flower-filled routes where Psychic and Grass types wander.',
    requiredTrainerLevel: 14,
    connectedAreaIds: ['mt-moon', 'rock-tunnel'],
    encounters: [
      { speciesId: 43, weight: 25, minLevel: 12, maxLevel: 16 }, // Oddish
      { speciesId: 69, weight: 25, minLevel: 12, maxLevel: 16 }, // Bellsprout
      { speciesId: 54, weight: 20, minLevel: 12, maxLevel: 15 }, // Psyduck
      { speciesId: 79, weight: 20, minLevel: 13, maxLevel: 16 }, // Slowpoke
      { speciesId: 63, weight: 10, minLevel: 12, maxLevel: 15 }, // Abra
    ],
  },
  {
    id: 'rock-tunnel',
    name: 'Rock Tunnel',
    description: 'A pitch-black tunnel carved through solid rock.',
    requiredTrainerLevel: 18,
    connectedAreaIds: ['cerulean-city', 'lavender-town'],
    encounters: [
      { speciesId: 74, weight: 30, minLevel: 16, maxLevel: 20 }, // Geodude
      { speciesId: 66, weight: 25, minLevel: 16, maxLevel: 20 }, // Machop
      { speciesId: 95, weight: 20, minLevel: 16, maxLevel: 20 }, // Onix
      { speciesId: 75, weight: 15, minLevel: 18, maxLevel: 22 }, // Graveler
      { speciesId: 41, weight: 10, minLevel: 16, maxLevel: 20 }, // Zubat
    ],
  },
  {
    id: 'lavender-town',
    name: 'Lavender Town',
    description: 'A spooky town where Ghost-type Pokemon haunt the tower.',
    requiredTrainerLevel: 22,
    connectedAreaIds: ['rock-tunnel', 'celadon-city'],
    encounters: [
      { speciesId: 92, weight: 40, minLevel: 20, maxLevel: 25 }, // Gastly
      { speciesId: 96, weight: 25, minLevel: 20, maxLevel: 24 }, // Drowzee
      { speciesId: 104, weight: 20, minLevel: 20, maxLevel: 24 }, // Cubone
      { speciesId: 93, weight: 15, minLevel: 22, maxLevel: 27 }, // Haunter
    ],
  },
  {
    id: 'celadon-city',
    name: 'Celadon City',
    description: 'A lush city. Rare Pokemon can be found in the tall grass nearby.',
    requiredTrainerLevel: 26,
    connectedAreaIds: ['lavender-town', 'fuchsia-city'],
    encounters: [
      { speciesId: 48, weight: 30, minLevel: 24, maxLevel: 28 }, // Venonat
      { speciesId: 52, weight: 30, minLevel: 24, maxLevel: 28 }, // Meowth
      { speciesId: 123, weight: 15, minLevel: 25, maxLevel: 30 }, // Scyther
      { speciesId: 127, weight: 15, minLevel: 25, maxLevel: 30 }, // Pinsir
      { speciesId: 133, weight: 10, minLevel: 24, maxLevel: 28 }, // Eevee
    ],
  },
  {
    id: 'fuchsia-city',
    name: 'Fuchsia City / Safari Zone',
    description: 'Home of the Safari Zone — exotic and powerful Pokemon live here.',
    requiredTrainerLevel: 30,
    connectedAreaIds: ['celadon-city', 'cinnabar-island'],
    encounters: [
      { speciesId: 111, weight: 25, minLevel: 28, maxLevel: 35 }, // Rhyhorn
      { speciesId: 30,  weight: 20, minLevel: 28, maxLevel: 32 }, // Nidorina
      { speciesId: 123, weight: 20, minLevel: 30, maxLevel: 35 }, // Scyther
      { speciesId: 115, weight: 15, minLevel: 28, maxLevel: 35 }, // Kangaskhan
      { speciesId: 128, weight: 15, minLevel: 28, maxLevel: 35 }, // Tauros
      { speciesId: 113, weight: 5,  minLevel: 28, maxLevel: 35 }, // Chansey
    ],
  },
  {
    id: 'cinnabar-island',
    name: 'Cinnabar Island',
    description: 'A volcanic island. Fire-type Pokemon thrive in the heat here.',
    requiredTrainerLevel: 35,
    connectedAreaIds: ['fuchsia-city', 'victory-road'],
    encounters: [
      { speciesId: 77,  weight: 35, minLevel: 33, maxLevel: 40 }, // Ponyta
      { speciesId: 58,  weight: 35, minLevel: 33, maxLevel: 40 }, // Growlithe
      { speciesId: 126, weight: 30, minLevel: 33, maxLevel: 40 }, // Magmar
    ],
  },
  {
    id: 'victory-road',
    name: 'Victory Road',
    description: 'The final challenge before the Pokemon League. Only the strongest survive.',
    requiredTrainerLevel: 40,
    connectedAreaIds: ['cinnabar-island'],
    encounters: [
      { speciesId: 67,  weight: 25, minLevel: 38, maxLevel: 45 }, // Machoke
      { speciesId: 95,  weight: 25, minLevel: 38, maxLevel: 45 }, // Onix
      { speciesId: 105, weight: 20, minLevel: 38, maxLevel: 45 }, // Marowak
      { speciesId: 49,  weight: 15, minLevel: 38, maxLevel: 45 }, // Venomoth
      { speciesId: 147, weight: 15, minLevel: 38, maxLevel: 45 }, // Dratini
    ],
  },
]

export const STARTER_SPECIES_IDS = [4, 7, 1] as const // Charmander, Squirtle, Bulbasaur

export const AREA_MAP: Record<string, Area> = Object.fromEntries(
  KANTO_AREAS.map(area => [area.id, area])
)
