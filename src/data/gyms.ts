import type { GymDefinition } from '../types'

export const KANTO_GYMS: GymDefinition[] = [
  {
    id: 'pewter-gym',
    cityAreaId: 'pewter-city',
    name: 'Pewter City Gym',
    type: 'Rock',
    trainers: [
      {
        id: 'pewter-t1',
        name: 'Bug Catcher Lad',
        team: [
          { speciesId: 10, level: 10 }, // Caterpie
          { speciesId: 13, level: 10 }, // Weedle
        ],
        quote: "I've been training to take on Brock! You'll have to go through me first!",
      },
    ],
    leader: {
      name: 'Brock',
      team: [
        { speciesId: 74, level: 12 }, // Geodude
        { speciesId: 95, level: 14 }, // Onix
      ],
      badge: 'boulder-badge',
      quote: "I'm Brock! My Pokémon are rock-solid and will crush anything! Defeat me if you can!",
      winQuote: "You're tough! The Boulder Badge is yours — now head east through the mountains!",
    },
  },
  {
    id: 'cerulean-gym',
    cityAreaId: 'cerulean-city',
    name: 'Cerulean City Gym',
    type: 'Water',
    trainers: [
      {
        id: 'cerulean-t1',
        name: 'Junior Trainer',
        team: [
          { speciesId: 120, level: 17 }, // Staryu
        ],
        quote: 'Misty taught me everything about Water-type Pokémon! I won\'t lose!',
      },
      {
        id: 'cerulean-t2',
        name: 'Swimmer Lara',
        team: [
          { speciesId: 116, level: 16 }, // Horsea
          { speciesId: 90, level: 15 },  // Shellder
        ],
        quote: "I swim laps in this pool every day. My Pokémon are fast and fierce!",
      },
    ],
    leader: {
      name: 'Misty',
      team: [
        { speciesId: 120, level: 18 }, // Staryu
        { speciesId: 121, level: 21 }, // Starmie
      ],
      badge: 'cascade-badge',
      quote: "My name's Misty! I'm an expert on Water-type Pokémon. You'd better be strong!",
      winQuote: "Incredible! You've earned the Cascade Badge. Rock Tunnel to the east is now open!",
    },
  },
  {
    id: 'celadon-gym',
    cityAreaId: 'celadon-city',
    name: 'Celadon City Gym',
    type: 'Grass',
    trainers: [
      {
        id: 'celadon-t1',
        name: 'Lass Liz',
        team: [
          { speciesId: 43, level: 24 }, // Oddish
          { speciesId: 69, level: 23 }, // Bellsprout
        ],
        quote: "Nature's beauty and power are one! My Pokémon will show you!",
      },
      {
        id: 'celadon-t2',
        name: 'Junior Trainer Kate',
        team: [
          { speciesId: 44, level: 25 }, // Gloom
        ],
        quote: "Erika inspired me to master Grass-types. Watch out for my Gloom!",
      },
      {
        id: 'celadon-t3',
        name: 'Beauty Tamia',
        team: [
          { speciesId: 70, level: 26 }, // Weepinbell
          { speciesId: 2,  level: 24 }, // Ivysaur
        ],
        quote: "A battle is like tending a garden — patient and precise. Prepare yourself!",
      },
    ],
    leader: {
      name: 'Erika',
      team: [
        { speciesId: 71,  level: 29 }, // Victreebel
        { speciesId: 114, level: 24 }, // Tangela
        { speciesId: 45,  level: 29 }, // Vileplume
      ],
      badge: 'rainbow-badge',
      quote: "I'm Erika, the Grass-type master! My Pokémon are nurtured with tender care. Face their wrath!",
      winQuote: "Wonderful! You've earned the Rainbow Badge. Cycling Road to the south awaits!",
    },
  },
  {
    id: 'fuchsia-gym',
    cityAreaId: 'fuchsia-city',
    name: 'Fuchsia City Gym',
    type: 'Poison',
    trainers: [
      {
        id: 'fuchsia-t1',
        name: 'Juggler Kirk',
        team: [
          { speciesId: 96, level: 34 }, // Drowzee
          { speciesId: 97, level: 36 }, // Hypno
        ],
        quote: "My Pokémon will confuse you until you can't stand! Try not to get dizzy!",
      },
      {
        id: 'fuchsia-t2',
        name: 'Tamer Bruno',
        team: [
          { speciesId: 92, level: 34 }, // Gastly
          { speciesId: 93, level: 36 }, // Haunter
        ],
        quote: "Koga taught us to use shadow and poison to overwhelm any opponent. Beware!",
      },
      {
        id: 'fuchsia-t3',
        name: 'Juggler Shawn',
        team: [
          { speciesId: 49, level: 38 }, // Venomoth
          { speciesId: 48, level: 36 }, // Venonat
        ],
        quote: "I juggle Poké Balls and baffle opponents at the same time. You're next!",
      },
    ],
    leader: {
      name: 'Koga',
      team: [
        { speciesId: 109, level: 37 }, // Koffing
        { speciesId: 89,  level: 39 }, // Muk
        { speciesId: 109, level: 37 }, // Koffing
        { speciesId: 110, level: 43 }, // Weezing
      ],
      badge: 'soul-badge',
      quote: "I am Koga of the Fuchsia Gym! My Pokémon use poison to wear down opponents. You will not escape!",
      winQuote: "You are skilled... The Soul Badge is yours. The Seafoam Islands lie to the south!",
    },
  },
  {
    id: 'cinnabar-gym',
    cityAreaId: 'cinnabar-island',
    name: 'Cinnabar Island Gym',
    type: 'Fire',
    trainers: [
      {
        id: 'cinnabar-t1',
        name: 'Scientist Garret',
        team: [
          { speciesId: 126, level: 40 }, // Magmar
        ],
        quote: "I've studied Fire-type Pokémon for years. My Magmar is a masterpiece!",
      },
      {
        id: 'cinnabar-t2',
        name: 'Burglar Simon',
        team: [
          { speciesId: 58, level: 38 }, // Growlithe
          { speciesId: 77, level: 40 }, // Ponyta
        ],
        quote: "I used to steal Pokémon, but now I battle with Fire! Stand and fight!",
      },
      {
        id: 'cinnabar-t3',
        name: 'Super Nerd Erik',
        team: [
          { speciesId: 38, level: 43 }, // Ninetales
          { speciesId: 78, level: 42 }, // Rapidash
        ],
        quote: "Fire-type data is my specialty. My calculations say you will lose!",
      },
    ],
    leader: {
      name: 'Blaine',
      team: [
        { speciesId: 58, level: 42 }, // Growlithe
        { speciesId: 77, level: 40 }, // Ponyta
        { speciesId: 78, level: 42 }, // Rapidash
        { speciesId: 59, level: 47 }, // Arcanine
      ],
      badge: 'volcano-badge',
      quote: "I'm Blaine! I'm burning with a passion for battling! My Fire-type Pokémon will incinerate you!",
      winQuote: "You're hot stuff! You've earned the Volcano Badge. Only Victory Road stands between you and the League!",
    },
  },
]

export const GYM_MAP: Record<string, GymDefinition> = Object.fromEntries(
  KANTO_GYMS.map(g => [g.id, g])
)

/** Returns the gym definition for a given city area, if one exists */
export function gymForCity(cityAreaId: string): GymDefinition | undefined {
  return KANTO_GYMS.find(g => g.cityAreaId === cityAreaId)
}

/** Human-readable badge names */
export const BADGE_NAMES: Record<string, string> = {
  'boulder-badge': 'Boulder Badge',
  'cascade-badge': 'Cascade Badge',
  'thunder-badge': 'Thunder Badge',
  'rainbow-badge': 'Rainbow Badge',
  'soul-badge':    'Soul Badge',
  'marsh-badge':   'Marsh Badge',
  'volcano-badge': 'Volcano Badge',
  'earth-badge':   'Earth Badge',
}
