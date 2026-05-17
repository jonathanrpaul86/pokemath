import type { Area } from '../types'

export const KANTO_AREAS: Area[] = [
  {
    id: 'route-1',
    name: 'Route 1',
    description: 'A grassy path outside Pallet Town. Weak wild Pokémon roam here.',
    areaType: 'route',
    requiredTrainerLevel: 1,
    connectedAreaIds: ['viridian-city'],
    mapX: 200, mapY: 320,
    mathDifficulty: 5,
    encounters: [
      { speciesId: 16, weight: 35, minLevel: 2, maxLevel: 4 },  // Pidgey
      { speciesId: 19, weight: 35, minLevel: 2, maxLevel: 4 },  // Rattata
      { speciesId: 29, weight: 15, minLevel: 2, maxLevel: 4 },  // Nidoran♀
      { speciesId: 32, weight: 15, minLevel: 2, maxLevel: 4 },  // Nidoran♂
    ],
  },
  {
    id: 'viridian-city',
    name: 'Viridian City',
    description: 'The first city on your journey. Heal up at the Pokémon Center before pushing north through Viridian Forest.',
    areaType: 'city',
    requiredTrainerLevel: 0,
    connectedAreaIds: ['route-1', 'viridian-forest'],
    mapX: 200, mapY: 260,
    mathDifficulty: 13,
    encounters: [],
  },
  {
    id: 'viridian-forest',
    name: 'Viridian Forest',
    description: 'A dense forest full of Bug-type Pokémon — and a rare Pikachu!',
    areaType: 'forest',
    requiredTrainerLevel: 5,
    connectedAreaIds: ['viridian-city', 'pewter-city'],
    mapX: 200, mapY: 196,
    mathDifficulty: 22,
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
    description: "A boulder-grey city home to Brock's Rock-type Gym. Rest before the mountain paths ahead.",
    areaType: 'city',
    requiredTrainerLevel: 8,
    connectedAreaIds: ['viridian-forest', 'route-3'],
    mapX: 200, mapY: 136,
    mathDifficulty: 30,
    encounters: [],
  },
  {
    id: 'route-3',
    name: 'Route 3',
    description: 'Rugged terrain east of Pewter City. Bird and ground-type Pokémon nest among the rocky outcrops.',
    areaType: 'route',
    requiredTrainerLevel: 9,
    connectedAreaIds: ['pewter-city', 'mt-moon'],
    mapX: 253, mapY: 121,
    mathDifficulty: 34,
    encounters: [
      { speciesId: 21, weight: 30, minLevel: 8,  maxLevel: 13 }, // Spearow
      { speciesId: 27, weight: 25, minLevel: 8,  maxLevel: 12 }, // Sandshrew
      { speciesId: 23, weight: 20, minLevel: 8,  maxLevel: 12 }, // Ekans
      { speciesId: 39, weight: 15, minLevel: 8,  maxLevel: 11 }, // Jigglypuff
      { speciesId: 29, weight: 10, minLevel: 8,  maxLevel: 12 }, // Nidoran♀
    ],
  },
  {
    id: 'mt-moon',
    name: 'Mt. Moon',
    description: 'A deep cave system. Clefairy are said to dance here under the moon.',
    areaType: 'cave',
    requiredTrainerLevel: 11,
    connectedAreaIds: ['route-3', 'route-4'],
    mapX: 306, mapY: 106,
    mathDifficulty: 39,
    encounters: [
      { speciesId: 41, weight: 45, minLevel: 8,  maxLevel: 12 }, // Zubat
      { speciesId: 74, weight: 30, minLevel: 8,  maxLevel: 12 }, // Geodude
      { speciesId: 46, weight: 15, minLevel: 8,  maxLevel: 11 }, // Paras
      { speciesId: 35, weight: 10, minLevel: 9,  maxLevel: 12 }, // Clefairy
    ],
  },
  {
    id: 'route-4',
    name: 'Route 4',
    description: 'A winding path descending from Mt. Moon toward Cerulean City. Water-type Pokémon splash in the streams.',
    areaType: 'route',
    requiredTrainerLevel: 12,
    connectedAreaIds: ['mt-moon', 'cerulean-city'],
    mapX: 358, mapY: 113,
    mathDifficulty: 44,
    encounters: [
      { speciesId: 54, weight: 30, minLevel: 12, maxLevel: 17 }, // Psyduck
      { speciesId: 79, weight: 25, minLevel: 12, maxLevel: 16 }, // Slowpoke
      { speciesId: 43, weight: 20, minLevel: 12, maxLevel: 16 }, // Oddish
      { speciesId: 69, weight: 15, minLevel: 12, maxLevel: 16 }, // Bellsprout
      { speciesId: 52, weight: 10, minLevel: 12, maxLevel: 15 }, // Meowth
    ],
  },
  {
    id: 'cerulean-city',
    name: 'Cerulean City',
    description: "A pretty waterside city with Misty's Water Gym. Pokémon Center is open to all trainers.",
    areaType: 'city',
    requiredTrainerLevel: 14,
    connectedAreaIds: ['route-4', 'route-9'],
    mapX: 410, mapY: 120,
    mathDifficulty: 47,
    encounters: [],
  },
  {
    id: 'route-9',
    name: 'Route 9',
    description: 'A rough, hilly path connecting Cerulean City to Rock Tunnel. Scrappy Pokémon patrol these dusty trails.',
    areaType: 'route',
    requiredTrainerLevel: 16,
    connectedAreaIds: ['cerulean-city', 'rock-tunnel'],
    mapX: 438, mapY: 156,
    mathDifficulty: 51,
    encounters: [
      { speciesId: 19, weight: 30, minLevel: 16, maxLevel: 22 }, // Rattata
      { speciesId: 21, weight: 25, minLevel: 16, maxLevel: 21 }, // Spearow
      { speciesId: 23, weight: 25, minLevel: 16, maxLevel: 21 }, // Ekans
      { speciesId: 22, weight: 20, minLevel: 18, maxLevel: 22 }, // Fearow
    ],
  },
  {
    id: 'rock-tunnel',
    name: 'Rock Tunnel',
    description: 'A pitch-black tunnel carved through solid rock.',
    areaType: 'cave',
    requiredTrainerLevel: 18,
    connectedAreaIds: ['route-9', 'lavender-town'],
    mapX: 466, mapY: 192,
    mathDifficulty: 55,
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
    description: 'A quiet, eerie town. The Pokémon Tower looms to the east — brave trainers dare to enter.',
    areaType: 'town',
    requiredTrainerLevel: 22,
    connectedAreaIds: ['rock-tunnel', 'route-7', 'pokemon-tower'],
    mapX: 466, mapY: 262,
    mathDifficulty: 63,
    encounters: [],
  },
  {
    id: 'pokemon-tower',
    name: 'Pokémon Tower',
    description: 'A haunted tower in Lavender Town. Ghost-type Pokémon stir among the graves on every floor.',
    areaType: 'special',
    requiredTrainerLevel: 23,
    connectedAreaIds: ['lavender-town'],
    mapX: 534, mapY: 262,
    mathDifficulty: 67,
    encounters: [
      { speciesId: 92,  weight: 40, minLevel: 22, maxLevel: 28 }, // Gastly
      { speciesId: 104, weight: 25, minLevel: 22, maxLevel: 27 }, // Cubone
      { speciesId: 96,  weight: 20, minLevel: 22, maxLevel: 26 }, // Drowzee
      { speciesId: 93,  weight: 15, minLevel: 24, maxLevel: 28 }, // Haunter
    ],
  },
  {
    id: 'route-7',
    name: 'Route 7',
    description: 'A winding road linking Lavender Town to Celadon City. Electric and Fire types wander through tall grass.',
    areaType: 'route',
    requiredTrainerLevel: 23,
    connectedAreaIds: ['lavender-town', 'celadon-city'],
    mapX: 400, mapY: 250,
    mathDifficulty: 65,
    encounters: [
      { speciesId: 37, weight: 25, minLevel: 22, maxLevel: 27 }, // Vulpix
      { speciesId: 25, weight: 20, minLevel: 22, maxLevel: 27 }, // Pikachu
      { speciesId: 48, weight: 20, minLevel: 22, maxLevel: 26 }, // Venonat
      { speciesId: 39, weight: 20, minLevel: 22, maxLevel: 26 }, // Jigglypuff
      { speciesId: 63, weight: 15, minLevel: 22, maxLevel: 26 }, // Abra
    ],
  },
  {
    id: 'celadon-city',
    name: 'Celadon City',
    description: "A lush city with a famous Department Store and Erika's Grass-type Gym.",
    areaType: 'city',
    requiredTrainerLevel: 26,
    connectedAreaIds: ['route-7', 'cycling-road'],
    mapX: 340, mapY: 238,
    mathDifficulty: 70,
    encounters: [],
  },
  {
    id: 'cycling-road',
    name: 'Cycling Road',
    description: 'A long downhill road stretching south from Celadon City. Fast Pokémon race alongside trainers here.',
    areaType: 'route',
    requiredTrainerLevel: 27,
    connectedAreaIds: ['celadon-city', 'fuchsia-city'],
    mapX: 323, mapY: 283,
    mathDifficulty: 73,
    encounters: [
      { speciesId: 20,  weight: 30, minLevel: 26, maxLevel: 33 }, // Raticate
      { speciesId: 22,  weight: 25, minLevel: 26, maxLevel: 32 }, // Fearow
      { speciesId: 84,  weight: 25, minLevel: 26, maxLevel: 32 }, // Doduo
      { speciesId: 49,  weight: 20, minLevel: 26, maxLevel: 33 }, // Venomoth
    ],
  },
  {
    id: 'fuchsia-city',
    name: 'Fuchsia City',
    description: "Home of the Safari Zone and Koga's Poison-type Gym. The Safari Zone is open to explorers.",
    areaType: 'city',
    requiredTrainerLevel: 30,
    connectedAreaIds: ['cycling-road', 'safari-zone', 'seafoam-islands'],
    mapX: 306, mapY: 328,
    mathDifficulty: 78,
    encounters: [],
  },
  {
    id: 'safari-zone',
    name: 'Safari Zone',
    description: 'A vast preserve inside Fuchsia City. Exotic and powerful Pokémon roam freely here.',
    areaType: 'special',
    requiredTrainerLevel: 31,
    connectedAreaIds: ['fuchsia-city'],
    mapX: 362, mapY: 345,
    mathDifficulty: 80,
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
    id: 'seafoam-islands',
    name: 'Seafoam Islands',
    description: 'Frozen sea caves west of Fuchsia City. Ice and Water types thrive in the frigid waters.',
    areaType: 'cave',
    requiredTrainerLevel: 34,
    connectedAreaIds: ['fuchsia-city', 'cinnabar-island'],
    mapX: 227, mapY: 343,
    mathDifficulty: 86,
    encounters: [
      { speciesId: 86,  weight: 35, minLevel: 33, maxLevel: 40 }, // Seel
      { speciesId: 87,  weight: 25, minLevel: 35, maxLevel: 40 }, // Dewgong
      { speciesId: 80,  weight: 20, minLevel: 33, maxLevel: 40 }, // Slowbro
      { speciesId: 124, weight: 15, minLevel: 33, maxLevel: 40 }, // Jynx
      { speciesId: 131, weight: 5,  minLevel: 35, maxLevel: 40 }, // Lapras
    ],
  },
  {
    id: 'cinnabar-island',
    name: 'Cinnabar Island',
    description: 'A volcanic island. Fire-type Pokémon thrive in the scorching heat.',
    areaType: 'special',
    requiredTrainerLevel: 35,
    connectedAreaIds: ['seafoam-islands', 'victory-road'],
    mapX: 148, mapY: 358,
    mathDifficulty: 87,
    encounters: [
      { speciesId: 77,  weight: 25, minLevel: 33, maxLevel: 40 }, // Ponyta
      { speciesId: 58,  weight: 25, minLevel: 33, maxLevel: 40 }, // Growlithe
      { speciesId: 126, weight: 15, minLevel: 33, maxLevel: 40 }, // Magmar
      { speciesId: 38,  weight: 15, minLevel: 35, maxLevel: 40 }, // Ninetales
      { speciesId: 59,  weight: 20, minLevel: 35, maxLevel: 40 }, // Arcanine
    ],
  },
  {
    id: 'victory-road',
    name: 'Victory Road',
    description: 'The final challenge before the Pokémon League. Only the strongest survive.',
    areaType: 'special',
    requiredTrainerLevel: 40,
    connectedAreaIds: ['cinnabar-island'],
    mapX: 96, mapY: 240,
    mathDifficulty: 100,
    encounters: [
      { speciesId: 67,  weight: 25, minLevel: 38, maxLevel: 45 }, // Machoke
      { speciesId: 95,  weight: 20, minLevel: 38, maxLevel: 45 }, // Onix
      { speciesId: 105, weight: 20, minLevel: 38, maxLevel: 45 }, // Marowak
      { speciesId: 49,  weight: 15, minLevel: 38, maxLevel: 45 }, // Venomoth
      { speciesId: 147, weight: 10, minLevel: 38, maxLevel: 45 }, // Dratini
      { speciesId: 42,  weight: 10, minLevel: 38, maxLevel: 45 }, // Golbat
    ],
  },
]

export const STARTER_SPECIES_IDS = [4, 7, 1] as const // Charmander, Squirtle, Bulbasaur

export const AREA_MAP: Record<string, Area> = Object.fromEntries(
  KANTO_AREAS.map(area => [area.id, area])
)
