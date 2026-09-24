import type { Area, BadgeId, Trainer } from '../types'
import { mapAt } from './mapGrid'

export const KANTO_AREAS: Area[] = [
  {
    id: 'pallet-town',
    name: 'Pallet Town',
    description: 'Your hometown: a quiet seaside town where every journey begins. Professor Oak’s lab sits at the edge of town.',
    areaType: 'town',
    exploresToComplete: 0,
    connectedAreaIds: ['route-1'],
    ...mapAt(18, 90),
    mathDifficulty: 3,
    encounters: [],
  },
  {
    id: 'route-1',
    name: 'Route 1',
    description: 'A grassy path between Pallet Town and Viridian City. Weak wild Pokémon roam here.',
    areaType: 'route',
    exploresToComplete: 8,
    connectedAreaIds: ['pallet-town', 'viridian-city'],
    ...mapAt(18, 78),
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
    description: "The first city on your journey. Route 2 leads north toward Viridian Forest, and Route 22 heads west toward the Pokémon League. The city's Gym stays locked until a trainer has earned seven badges.",
    areaType: 'city',
    exploresToComplete: 0,
    connectedAreaIds: ['route-1', 'route-2', 'route-22'],
    ...mapAt(18, 66),
    mathDifficulty: 13,
    martItems: ['poke-ball', 'potion'],
    encounters: [],
  },
  {
    id: 'route-22',
    name: 'Route 22',
    description: 'A quiet trail west of Viridian City where new trainers test their Pokémon. Farther west, the road to the Pokémon League begins.',
    areaType: 'route',
    exploresToComplete: 6,
    connectedAreaIds: ['viridian-city', 'route-23'],
    ...mapAt(9, 66),
    mathDifficulty: 10,
    encounters: [
      { speciesId: 19, weight: 35, minLevel: 3, maxLevel: 6 },  // Rattata
      { speciesId: 21, weight: 30, minLevel: 3, maxLevel: 6 },  // Spearow
      { speciesId: 29, weight: 15, minLevel: 3, maxLevel: 5 },  // Nidoran♀
      { speciesId: 32, weight: 15, minLevel: 3, maxLevel: 5 },  // Nidoran♂
      { speciesId: 56, weight: 5,  minLevel: 4, maxLevel: 6 },  // Mankey
    ],
  },
  {
    id: 'route-23',
    name: 'Route 23',
    description: 'The long road to the Pokémon League. Guards at the gate only let trainers with the Volcano Badge pass.',
    areaType: 'route',
    exploresToComplete: 12,
    requiredBadge: 'volcano-badge',
    connectedAreaIds: ['route-22', 'victory-road'],
    ...mapAt(4, 50),
    mathDifficulty: 95,
    encounters: [
      { speciesId: 22,  weight: 25, minLevel: 40, maxLevel: 46 }, // Fearow
      { speciesId: 24,  weight: 20, minLevel: 40, maxLevel: 45 }, // Arbok
      { speciesId: 28,  weight: 20, minLevel: 40, maxLevel: 45 }, // Sandslash
      { speciesId: 57,  weight: 20, minLevel: 40, maxLevel: 46 }, // Primeape
      { speciesId: 132, weight: 15, minLevel: 40, maxLevel: 44 }, // Ditto
    ],
  },
  {
    id: 'route-2',
    name: 'Route 2',
    description: 'A leafy road north of Viridian City. Bug Pokémon wander out of the forest ahead.',
    areaType: 'route',
    exploresToComplete: 6,
    connectedAreaIds: ['viridian-city', 'viridian-forest', 'digletts-cave'],
    ...mapAt(18, 54),
    mathDifficulty: 16,
    encounters: [
      { speciesId: 16, weight: 35, minLevel: 3, maxLevel: 5 },  // Pidgey
      { speciesId: 19, weight: 35, minLevel: 3, maxLevel: 5 },  // Rattata
      { speciesId: 10, weight: 15, minLevel: 3, maxLevel: 5 },  // Caterpie
      { speciesId: 13, weight: 15, minLevel: 3, maxLevel: 5 },  // Weedle
    ],
  },
  {
    id: 'viridian-forest',
    name: 'Viridian Forest',
    description: 'A dense forest full of Bug-type Pokémon — and a rare Pikachu!',
    areaType: 'forest',
    exploresToComplete: 14,
    connectedAreaIds: ['route-2', 'pewter-city'],
    ...mapAt(18, 44),
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
    exploresToComplete: 0,
    connectedAreaIds: ['viridian-forest', 'route-3'],
    ...mapAt(18, 32),
    mathDifficulty: 30,
    martItems: ['poke-ball', 'potion', 'super-potion'],
    encounters: [],
  },
  {
    id: 'route-3',
    name: 'Route 3',
    description: 'Rugged terrain east of Pewter City. Bird and ground-type Pokémon nest among the rocky outcrops.',
    areaType: 'route',
    exploresToComplete: 10,
    requiredBadge: 'boulder-badge',
    connectedAreaIds: ['pewter-city', 'mt-moon'],
    ...mapAt(29, 27),
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
    exploresToComplete: 12,
    connectedAreaIds: ['route-3', 'route-4'],
    ...mapAt(40, 23),
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
    exploresToComplete: 10,
    connectedAreaIds: ['mt-moon', 'cerulean-city'],
    ...mapAt(51, 21),
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
    exploresToComplete: 0,
    connectedAreaIds: ['route-4', 'route-5', 'route-9'],
    ...mapAt(62, 22),
    mathDifficulty: 47,
    martItems: ['poke-ball', 'great-ball', 'potion', 'super-potion'],
    encounters: [],
  },
  {
    id: 'route-9',
    name: 'Route 9',
    description: 'A rough, hilly path connecting Cerulean City to Rock Tunnel. Scrappy Pokémon patrol these dusty trails.',
    areaType: 'route',
    exploresToComplete: 8,
    requiredBadge: 'thunder-badge',
    connectedAreaIds: ['cerulean-city', 'rock-tunnel'],
    ...mapAt(73, 22),
    mathDifficulty: 56,
    encounters: [
      { speciesId: 19, weight: 30, minLevel: 20, maxLevel: 25 }, // Rattata
      { speciesId: 21, weight: 25, minLevel: 20, maxLevel: 24 }, // Spearow
      { speciesId: 23, weight: 25, minLevel: 20, maxLevel: 24 }, // Ekans
      { speciesId: 22, weight: 20, minLevel: 22, maxLevel: 25 }, // Fearow
    ],
  },
  {
    id: 'rock-tunnel',
    name: 'Rock Tunnel',
    description: 'A pitch-black tunnel carved through solid rock.',
    areaType: 'cave',
    exploresToComplete: 10,
    connectedAreaIds: ['route-9', 'lavender-town'],
    ...mapAt(84, 26),
    mathDifficulty: 59,
    encounters: [
      { speciesId: 74, weight: 30, minLevel: 21, maxLevel: 25 }, // Geodude
      { speciesId: 66, weight: 25, minLevel: 21, maxLevel: 25 }, // Machop
      { speciesId: 95, weight: 20, minLevel: 21, maxLevel: 25 }, // Onix
      { speciesId: 75, weight: 15, minLevel: 23, maxLevel: 26 }, // Graveler
      { speciesId: 41, weight: 10, minLevel: 21, maxLevel: 25 }, // Zubat
    ],
  },
  {
    id: 'lavender-town',
    name: 'Lavender Town',
    description: 'A quiet, eerie town. The Pokémon Tower looms to the east, and Route 8 leads west toward Saffron City.',
    areaType: 'town',
    exploresToComplete: 0,
    connectedAreaIds: ['rock-tunnel', 'route-8', 'pokemon-tower'],
    ...mapAt(87, 48),
    mathDifficulty: 63,
    martItems: ['poke-ball', 'great-ball', 'potion', 'super-potion', 'revive'],
    encounters: [],
  },
  {
    id: 'vermilion-city',
    name: 'Vermilion City',
    description: "A busy harbor city where ships come and go. Lt. Surge's Electric-type Gym crackles with energy.",
    areaType: 'city',
    exploresToComplete: 0,
    connectedAreaIds: ['route-6', 'digletts-cave'],
    ...mapAt(62, 70),
    mathDifficulty: 64,
    martItems: ['poke-ball', 'great-ball', 'potion', 'super-potion', 'revive'],
    encounters: [],
  },
  {
    id: 'pokemon-tower',
    name: 'Pokémon Tower',
    description: 'A haunted tower in Lavender Town. Ghost-type Pokémon stir among the graves on every floor. Only trainers with the Rainbow Badge are brave enough to climb it.',
    areaType: 'special',
    exploresToComplete: 10,
    requiredBadge: 'rainbow-badge',
    connectedAreaIds: ['lavender-town'],
    ...mapAt(95, 48),
    mathDifficulty: 71,
    encounters: [
      { speciesId: 92,  weight: 40, minLevel: 30, maxLevel: 35 }, // Gastly
      { speciesId: 104, weight: 25, minLevel: 30, maxLevel: 34 }, // Cubone
      { speciesId: 96,  weight: 20, minLevel: 30, maxLevel: 34 }, // Drowzee
      { speciesId: 93,  weight: 15, minLevel: 32, maxLevel: 36 }, // Haunter
    ],
  },
  {
    id: 'route-7',
    name: 'Route 7',
    description: 'A short road between Celadon City and Saffron City. An Underground Path runs east beneath Saffron to Route 8. Electric and Fire types wander through the tall grass.',
    areaType: 'route',
    exploresToComplete: 10,
    requiredBadge: 'thunder-badge',
    connectedAreaIds: ['celadon-city', 'saffron-city', 'route-8'],
    ...mapAt(51, 48),
    mathDifficulty: 66,
    encounters: [
      { speciesId: 37, weight: 25, minLevel: 24, maxLevel: 29 }, // Vulpix
      { speciesId: 25, weight: 20, minLevel: 24, maxLevel: 29 }, // Pikachu
      { speciesId: 48, weight: 20, minLevel: 24, maxLevel: 28 }, // Venonat
      { speciesId: 39, weight: 20, minLevel: 24, maxLevel: 28 }, // Jigglypuff
      { speciesId: 63, weight: 15, minLevel: 24, maxLevel: 28 }, // Abra
    ],
  },
  {
    id: 'route-8',
    name: 'Route 8',
    description: 'A grassy road between Saffron City and Lavender Town. An Underground Path runs west beneath Saffron to Route 7.',
    areaType: 'route',
    exploresToComplete: 8,
    connectedAreaIds: ['lavender-town', 'saffron-city', 'route-7'],
    ...mapAt(75, 48),
    mathDifficulty: 64,
    encounters: [
      { speciesId: 17, weight: 25, minLevel: 24, maxLevel: 28 }, // Pidgeotto
      { speciesId: 58, weight: 20, minLevel: 24, maxLevel: 28 }, // Growlithe
      { speciesId: 23, weight: 20, minLevel: 24, maxLevel: 28 }, // Ekans
      { speciesId: 27, weight: 20, minLevel: 24, maxLevel: 28 }, // Sandshrew
      { speciesId: 56, weight: 15, minLevel: 24, maxLevel: 28 }, // Mankey
    ],
  },
  {
    id: 'route-5',
    name: 'Route 5',
    description: 'A road south of Cerulean City toward Saffron. Saffron’s gates are shut to most trainers, but an Underground Path leads south to Route 6.',
    areaType: 'route',
    exploresToComplete: 10,
    requiredBadge: 'cascade-badge',
    connectedAreaIds: ['cerulean-city', 'saffron-city', 'route-6'],
    ...mapAt(62, 36),
    mathDifficulty: 50,
    encounters: [
      { speciesId: 16, weight: 30, minLevel: 14, maxLevel: 18 }, // Pidgey
      { speciesId: 43, weight: 20, minLevel: 14, maxLevel: 18 }, // Oddish
      { speciesId: 69, weight: 20, minLevel: 14, maxLevel: 18 }, // Bellsprout
      { speciesId: 52, weight: 20, minLevel: 14, maxLevel: 18 }, // Meowth
      { speciesId: 56, weight: 10, minLevel: 15, maxLevel: 19 }, // Mankey
    ],
  },
  {
    id: 'route-6',
    name: 'Route 6',
    description: 'A road north of Vermilion City. The Underground Path here leads north to Route 5, beneath Saffron City.',
    areaType: 'route',
    exploresToComplete: 10,
    connectedAreaIds: ['saffron-city', 'vermilion-city', 'route-5'],
    ...mapAt(62, 60),
    mathDifficulty: 53,
    encounters: [
      { speciesId: 16, weight: 25, minLevel: 16, maxLevel: 21 }, // Pidgey
      { speciesId: 43, weight: 20, minLevel: 16, maxLevel: 20 }, // Oddish
      { speciesId: 69, weight: 20, minLevel: 16, maxLevel: 20 }, // Bellsprout
      { speciesId: 52, weight: 15, minLevel: 16, maxLevel: 20 }, // Meowth
      { speciesId: 54, weight: 10, minLevel: 17, maxLevel: 21 }, // Psyduck
      { speciesId: 17, weight: 10, minLevel: 19, maxLevel: 22 }, // Pidgeotto
    ],
  },
  {
    id: 'digletts-cave',
    name: 'Diglett’s Cave',
    description: 'A long tunnel dug by wild Diglett, linking Vermilion City to Route 2. Trees block the way in until a trainer has the Thunder Badge.',
    areaType: 'cave',
    exploresToComplete: 10,
    requiredBadge: 'thunder-badge',
    connectedAreaIds: ['vermilion-city', 'route-2'],
    ...mapAt(40, 62),
    mathDifficulty: 58,
    encounters: [
      { speciesId: 50, weight: 85, minLevel: 20, maxLevel: 26 }, // Diglett
      { speciesId: 51, weight: 15, minLevel: 26, maxLevel: 30 }, // Dugtrio
    ],
  },
  {
    id: 'celadon-city',
    name: 'Celadon City',
    description: "A lush city with a famous Department Store and Erika's Grass-type Gym.",
    areaType: 'city',
    exploresToComplete: 0,
    connectedAreaIds: ['route-7', 'cycling-road'],
    ...mapAt(40, 48),
    mathDifficulty: 70,
    martItems: ['poke-ball', 'great-ball', 'ultra-ball', 'potion', 'super-potion', 'hyper-potion', 'revive'],
    encounters: [],
  },
  {
    id: 'saffron-city',
    name: 'Saffron City',
    description: "A shining city at the heart of Kanto. Sabrina's Psychic-type Gym sits behind its golden gates.",
    areaType: 'city',
    exploresToComplete: 0,
    requiredBadge: 'rainbow-badge',
    connectedAreaIds: ['route-5', 'route-6', 'route-7', 'route-8'],
    ...mapAt(62, 48),
    mathDifficulty: 72,
    martItems: ['great-ball', 'ultra-ball', 'super-potion', 'hyper-potion', 'revive'],
    encounters: [],
  },
  {
    id: 'cycling-road',
    name: 'Cycling Road',
    description: 'A long downhill road stretching south from Celadon City. Fast Pokémon race alongside trainers here.',
    areaType: 'route',
    exploresToComplete: 14,
    requiredBadge: 'marsh-badge',
    connectedAreaIds: ['celadon-city', 'fuchsia-city'],
    ...mapAt(30, 68),
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
    exploresToComplete: 0,
    connectedAreaIds: ['cycling-road', 'safari-zone', 'seafoam-islands'],
    ...mapAt(54, 89),
    mathDifficulty: 78,
    martItems: ['great-ball', 'ultra-ball', 'super-potion', 'hyper-potion', 'revive'],
    encounters: [],
  },
  {
    id: 'safari-zone',
    name: 'Safari Zone',
    description: 'A vast preserve inside Fuchsia City. Exotic and powerful Pokémon roam freely here.',
    areaType: 'special',
    exploresToComplete: 10,
    connectedAreaIds: ['fuchsia-city'],
    ...mapAt(54, 79),
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
    exploresToComplete: 12,
    requiredBadge: 'soul-badge',
    connectedAreaIds: ['fuchsia-city', 'cinnabar-island'],
    ...mapAt(30, 106),
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
    exploresToComplete: 10,
    connectedAreaIds: ['seafoam-islands'],
    ...mapAt(18, 106),
    mathDifficulty: 87,
    martItems: ['ultra-ball', 'hyper-potion', 'full-restore', 'max-revive'],
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
    description: 'A treacherous cave on the way to the Pokémon League. Only trainers with all eight badges may enter.',
    areaType: 'special',
    exploresToComplete: 15,
    requiredBadge: 'earth-badge',
    connectedAreaIds: ['route-23', 'indigo-plateau'],
    ...mapAt(4, 38),
    mathDifficulty: 100,
    encounters: [
      { speciesId: 67,  weight: 25, minLevel: 45, maxLevel: 52 }, // Machoke
      { speciesId: 95,  weight: 20, minLevel: 45, maxLevel: 52 }, // Onix
      { speciesId: 105, weight: 20, minLevel: 45, maxLevel: 52 }, // Marowak
      { speciesId: 49,  weight: 15, minLevel: 45, maxLevel: 52 }, // Venomoth
      { speciesId: 147, weight: 10, minLevel: 45, maxLevel: 50 }, // Dratini
      { speciesId: 42,  weight: 10, minLevel: 45, maxLevel: 52 }, // Golbat
    ],
  },
  {
    id: 'indigo-plateau',
    name: 'Indigo Plateau',
    description: 'Home of the Pokémon League, where the Elite Four wait for the best trainers in Kanto. The League’s doors open soon!',
    areaType: 'city',
    exploresToComplete: 0,
    connectedAreaIds: ['victory-road'],
    ...mapAt(4, 26),
    mathDifficulty: 100,
    martItems: ['ultra-ball', 'hyper-potion', 'full-restore', 'max-revive'],
    encounters: [],
  },
]

export const STARTER_SPECIES_IDS = [4, 7, 1] as const // Charmander, Squirtle, Bulbasaur

export const AREA_MAP: Record<string, Area> = Object.fromEntries(
  KANTO_AREAS.map(area => [area.id, area])
)

/**
 * Badge gates only block first entry. Areas already visited stay open, so
 * re-tuned gates can never strand an older save on the wrong side of one.
 */
export function meetsBadgeRequirement(area: Area, badges: BadgeId[], unlockedAreaIds: string[]): boolean {
  return !area.requiredBadge || badges.includes(area.requiredBadge) || unlockedAreaIds.includes(area.id)
}

export function exploresDone(area: Area, exploreProgress: Record<string, number>): number {
  return Math.min(exploreProgress[area.id] ?? 0, area.exploresToComplete)
}

/** Cities and towns are always "explored"; wild areas once their explore count is met */
export function isAreaExplored(area: Area, exploreProgress: Record<string, number>): boolean {
  return exploresDone(area, exploreProgress) >= area.exploresToComplete
}

export type TravelBlocker = 'badge' | 'explore'

/**
 * Why the player can't step from `from` into the adjacent area `to`, or null if
 * they can. Going back to anywhere already visited is always allowed, so a
 * player can retreat from an unfinished area to heal.
 */
export function travelBlocker(
  from: Area,
  to: Area,
  trainer: Pick<Trainer, 'badges' | 'unlockedAreaIds' | 'exploreProgress'>,
): TravelBlocker | null {
  if (trainer.unlockedAreaIds.includes(to.id)) return null
  if (!meetsBadgeRequirement(to, trainer.badges, trainer.unlockedAreaIds)) return 'badge'
  if (!isAreaExplored(from, trainer.exploreProgress)) return 'explore'
  return null
}
