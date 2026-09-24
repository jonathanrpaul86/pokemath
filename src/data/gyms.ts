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
      rematch: {
        team: [
          { speciesId: 95,  level: 50 }, // Onix
          { speciesId: 141, level: 50 }, // Kabutops
          { speciesId: 139, level: 51 }, // Omastar
          { speciesId: 76,  level: 52 }, // Golem
        ],
        quote: "You've come a long way since your first badge! My Rock Pokémon have been training too. Let's see who's stronger now!",
      },
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
      winQuote: "Incredible! You've earned the Cascade Badge. Route 5 is open now, and the harbor city of Vermilion lies beyond it!",
      rematch: {
        team: [
          { speciesId: 119, level: 51 }, // Seaking
          { speciesId: 131, level: 51 }, // Lapras
          { speciesId: 91,  level: 52 }, // Cloyster
          { speciesId: 121, level: 53 }, // Starmie
        ],
        quote: "A rematch? You bet! My Water Pokémon have grown so much. Get ready to be splashed!",
      },
    },
  },
  {
    id: 'vermilion-gym',
    cityAreaId: 'vermilion-city',
    name: 'Vermilion City Gym',
    type: 'Electric',
    trainers: [
      {
        id: 'vermilion-t1',
        name: 'Rocker Luca',
        team: [
          { speciesId: 100, level: 20 }, // Voltorb
          { speciesId: 81,  level: 21 }, // Magnemite
        ],
        quote: "My band plays so loud it makes sparks fly! Get ready for a shock!",
      },
      {
        id: 'vermilion-t2',
        name: 'Gentleman Tucker',
        team: [
          { speciesId: 25, level: 22 }, // Pikachu
        ],
        quote: "A true gentleman never loses his cool. My Pikachu, however, is fully charged!",
      },
    ],
    leader: {
      name: 'Lt. Surge',
      team: [
        { speciesId: 100, level: 21 }, // Voltorb
        { speciesId: 25,  level: 22 }, // Pikachu
        { speciesId: 26,  level: 24 }, // Raichu
      ],
      badge: 'thunder-badge',
      quote: "Hey, kid! I'm Lt. Surge! My Electric Pokémon are lightning fast — they'll zap you before you can blink!",
      winQuote: "Whoa, you're the real deal, kid! The Thunder Badge is yours. Route 9, east of Cerulean City, is open now, and so is Diglett's Cave!",
      rematch: {
        team: [
          { speciesId: 101, level: 52 }, // Electrode
          { speciesId: 82,  level: 52 }, // Magneton
          { speciesId: 125, level: 53 }, // Electabuzz
          { speciesId: 26,  level: 54 }, // Raichu
        ],
        quote: "Back for more, kid? My Electric Pokémon are charged to the max. This time you'll really feel the shock!",
      },
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
      winQuote: "Wonderful! You've earned the Rainbow Badge. The golden gates of Saffron City will now open for you!",
      rematch: {
        team: [
          { speciesId: 114, level: 52 }, // Tangela
          { speciesId: 103, level: 53 }, // Exeggutor
          { speciesId: 71,  level: 54 }, // Victreebel
          { speciesId: 45,  level: 55 }, // Vileplume
        ],
        quote: "Oh, welcome back! My garden has bloomed beautifully since you last visited. Shall we battle among the flowers?",
      },
    },
  },
  {
    id: 'saffron-gym',
    cityAreaId: 'saffron-city',
    name: 'Saffron City Gym',
    type: 'Psychic',
    trainers: [
      {
        id: 'saffron-t1',
        name: 'Psychic Johan',
        team: [
          { speciesId: 102, level: 33 }, // Exeggcute
          { speciesId: 79,  level: 33 }, // Slowpoke
        ],
        quote: "I can read your mind... You're thinking about math problems, aren't you?",
      },
      {
        id: 'saffron-t2',
        name: 'Medium Cameron',
        team: [
          { speciesId: 64,  level: 34 }, // Kadabra
          { speciesId: 122, level: 34 }, // Mr. Mime
        ],
        quote: "Sabrina taught us to see the future. I see you losing this battle!",
      },
      {
        id: 'saffron-t3',
        name: 'Psychic Preston',
        team: [
          { speciesId: 97, level: 35 }, // Hypno
          { speciesId: 80, level: 36 }, // Slowbro
        ],
        quote: "Focus your mind... if you can! My Pokémon's psychic powers are unmatched!",
      },
    ],
    leader: {
      name: 'Sabrina',
      team: [
        { speciesId: 64,  level: 35 }, // Kadabra
        { speciesId: 122, level: 35 }, // Mr. Mime
        { speciesId: 49,  level: 36 }, // Venomoth
        { speciesId: 65,  level: 38 }, // Alakazam
      ],
      badge: 'marsh-badge',
      quote: "I am Sabrina. I knew you would come... My psychic Pokémon have already seen how this battle ends.",
      winQuote: "I did not foresee this... The Marsh Badge is yours. With a Bicycle or a Poké Flute, the roads to Fuchsia City will open for you.",
      rematch: {
        team: [
          { speciesId: 122, level: 53 }, // Mr. Mime
          { speciesId: 97,  level: 53 }, // Hypno
          { speciesId: 80,  level: 54 }, // Slowbro
          { speciesId: 65,  level: 56 }, // Alakazam
        ],
        quote: "I knew you would return. I have seen this battle in my mind many times... but I still don't know how it ends.",
      },
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
      winQuote: "You are skilled... The Soul Badge is yours. You can surf now, so the sea routes south of Fuchsia will take you to the Seafoam Islands!",
      rematch: {
        team: [
          { speciesId: 49,  level: 54 }, // Venomoth
          { speciesId: 89,  level: 54 }, // Muk
          { speciesId: 42,  level: 55 }, // Golbat
          { speciesId: 110, level: 57 }, // Weezing
        ],
        quote: "Fwahaha! A ninja never stops training. My poisons are deadlier than ever. Can you keep up?",
      },
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
      winQuote: "You're hot stuff! You've earned the Volcano Badge. Surf Route 21 home to Pallet Town. The final Gym awaits in Viridian City, and Route 23 to its west is open now too!",
      rematch: {
        team: [
          { speciesId: 38,  level: 55 }, // Ninetales
          { speciesId: 78,  level: 55 }, // Rapidash
          { speciesId: 126, level: 56 }, // Magmar
          { speciesId: 59,  level: 58 }, // Arcanine
        ],
        quote: "Hah! Here's a riddle: what burns hotter the second time around? My Fire Pokémon, of course! Let's go!",
      },
    },
  },
  {
    id: 'viridian-gym',
    cityAreaId: 'viridian-city',
    name: 'Viridian City Gym',
    type: 'Ground',
    requiredBadgeCount: 7,
    trainers: [
      {
        id: 'viridian-t1',
        name: 'Cooltrainer Samuel',
        team: [
          { speciesId: 28, level: 44 }, // Sandslash
          { speciesId: 51, level: 44 }, // Dugtrio
        ],
        quote: "Only the toughest trainers make it this far. Let's see if you really belong here!",
      },
      {
        id: 'viridian-t2',
        name: 'Cooltrainer Mira',
        team: [
          { speciesId: 31, level: 45 }, // Nidoqueen
          { speciesId: 34, level: 45 }, // Nidoking
        ],
        quote: "Seven badges, huh? Impressive. But my royal pair won't go easy on you!",
      },
      {
        id: 'viridian-t3',
        name: 'Cooltrainer Yuji',
        team: [
          { speciesId: 111, level: 46 }, // Rhyhorn
          { speciesId: 105, level: 46 }, // Marowak
        ],
        quote: "The ground itself shakes when my Pokémon attack. Hold on tight!",
      },
    ],
    leader: {
      name: 'Giovanni',
      team: [
        { speciesId: 111, level: 45 }, // Rhyhorn
        { speciesId: 51,  level: 42 }, // Dugtrio
        { speciesId: 31,  level: 44 }, // Nidoqueen
        { speciesId: 34,  level: 45 }, // Nidoking
        { speciesId: 112, level: 50 }, // Rhydon
      ],
      badge: 'earth-badge',
      quote: "So, you've collected seven badges. I am Giovanni, the strongest Gym Leader in Kanto. Show me what you've got!",
      winQuote: "Remarkable... The Earth Badge is yours. You've conquered every Gym in Kanto. Victory Road is open, and the Pokémon League awaits at Indigo Plateau!",
      rematch: {
        team: [
          { speciesId: 51,  level: 55 }, // Dugtrio
          { speciesId: 31,  level: 56 }, // Nidoqueen
          { speciesId: 34,  level: 57 }, // Nidoking
          { speciesId: 112, level: 59 }, // Rhydon
        ],
        quote: "So, you want to face me again? Very well. I won't hold back this time. Prepare yourself!",
      },
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
