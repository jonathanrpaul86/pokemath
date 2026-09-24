import type { Area, AreaReward, BadgeId, InventorySlot, LegendaryEncounter, Trainer } from '../types'
import { mapAt } from './mapGrid'

export const KANTO_AREAS: Area[] = [
  {
    id: 'pallet-town',
    name: 'Pallet Town',
    description: 'Your hometown: a quiet seaside town where every journey begins. Professor Oak’s lab sits at the edge of town.',
    areaType: 'town',
    exploresToComplete: 0,
    connectedAreaIds: ['route-1', 'route-21'],
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
      { speciesId: 22,  weight: 25, minLevel: 44, maxLevel: 50 }, // Fearow
      { speciesId: 24,  weight: 20, minLevel: 44, maxLevel: 49 }, // Arbok
      { speciesId: 28,  weight: 20, minLevel: 44, maxLevel: 49 }, // Sandslash
      { speciesId: 57,  weight: 20, minLevel: 44, maxLevel: 50 }, // Primeape
      { speciesId: 132, weight: 15, minLevel: 44, maxLevel: 48 }, // Ditto
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
    completionReward: {
      npcName: 'Super Nerd',
      lines: [
        'Hey! You explored all of Mt. Moon? Then you deserve this!',
        'It’s a Dome Fossil, from a Pokémon that lived in the sea long, long ago. The Pokémon Lab on Cinnabar Island can bring fossils back to life!',
      ],
      gift: { kind: 'key-item', keyItemId: 'dome-fossil' },
    },
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
      { speciesId: 129, weight: 15, minLevel: 10, maxLevel: 15, requiresKeyItem: 'old-rod' }, // Magikarp (old rod)
    ],
  },
  {
    id: 'cerulean-city',
    name: 'Cerulean City',
    description: "A pretty waterside city with Misty's Water Gym. Pokémon Center is open to all trainers.",
    areaType: 'city',
    exploresToComplete: 0,
    connectedAreaIds: ['route-4', 'route-5', 'route-9', 'route-24', 'cerulean-cave'],
    ...mapAt(62, 22),
    mathDifficulty: 47,
    martItems: ['poke-ball', 'great-ball', 'potion', 'super-potion'],
    encounters: [],
  },
  {
    id: 'route-24',
    name: 'Route 24',
    description: 'The famous Nugget Bridge north of Cerulean City. Trainers line up to battle anyone who tries to cross.',
    areaType: 'route',
    exploresToComplete: 8,
    connectedAreaIds: ['cerulean-city', 'route-25'],
    ...mapAt(62, 12),
    mathDifficulty: 45,
    encounters: [
      { speciesId: 43, weight: 25, minLevel: 12, maxLevel: 16 }, // Oddish
      { speciesId: 69, weight: 25, minLevel: 12, maxLevel: 16 }, // Bellsprout
      { speciesId: 16, weight: 20, minLevel: 12, maxLevel: 16 }, // Pidgey
      { speciesId: 63, weight: 15, minLevel: 12, maxLevel: 15 }, // Abra
      { speciesId: 14, weight: 15, minLevel: 12, maxLevel: 15 }, // Kakuna
      { speciesId: 129, weight: 15, minLevel: 10, maxLevel: 15, requiresKeyItem: 'old-rod' }, // Magikarp (old rod)
      { speciesId: 60,  weight: 15, minLevel: 12, maxLevel: 16, requiresKeyItem: 'good-rod' }, // Poliwag (good rod)
    ],
  },
  {
    id: 'route-25',
    name: 'Route 25',
    description: 'A seaside path leading to the Sea Cottage, where a Pokémon researcher named Bill lives.',
    areaType: 'route',
    exploresToComplete: 8,
    connectedAreaIds: ['route-24'],
    completionReward: {
      npcName: 'Bill',
      lines: [
        'Hi! I’m Bill, a Pokémon researcher. Thanks for visiting my Sea Cottage!',
        'I raise the three Pokémon that new trainers pick from in Pallet Town. Would you like one you don’t have yet?',
      ],
      gift: { kind: 'pokemon', speciesIds: [1, 4, 7], level: 15 },
    },
    ...mapAt(73, 8),
    mathDifficulty: 46,
    encounters: [
      { speciesId: 16, weight: 25, minLevel: 13, maxLevel: 17 }, // Pidgey
      { speciesId: 43, weight: 20, minLevel: 13, maxLevel: 17 }, // Oddish
      { speciesId: 69, weight: 20, minLevel: 13, maxLevel: 17 }, // Bellsprout
      { speciesId: 48, weight: 20, minLevel: 13, maxLevel: 17 }, // Venonat
      { speciesId: 63, weight: 15, minLevel: 13, maxLevel: 16 }, // Abra
      { speciesId: 129, weight: 15, minLevel: 10, maxLevel: 15, requiresKeyItem: 'old-rod' }, // Magikarp (old rod)
      { speciesId: 118, weight: 10, minLevel: 13, maxLevel: 17, requiresKeyItem: 'good-rod' }, // Goldeen (good rod)
    ],
  },
  {
    id: 'cerulean-cave',
    name: 'Cerulean Cave',
    description: 'A mysterious cave full of the strongest wild Pokémon in Kanto. Only trainers with all eight badges are allowed inside.',
    areaType: 'cave',
    exploresToComplete: 15,
    requiredBadge: 'earth-badge',
    connectedAreaIds: ['cerulean-city'],
    legendary: {
      speciesId: 150, // Mewtwo
      level: 70,
      teaser: 'Deep in the cave, the air feels strange, as if someone is watching you think. An incredibly powerful Pokémon lives here…',
      intro: 'A voice echoes in your mind… The legendary Mewtwo appeared!',
    },
    ...mapAt(53, 12),
    mathDifficulty: 100,
    encounters: [
      { speciesId: 42,  weight: 20, minLevel: 50, maxLevel: 58 }, // Golbat
      { speciesId: 47,  weight: 15, minLevel: 50, maxLevel: 58 }, // Parasect
      { speciesId: 64,  weight: 15, minLevel: 50, maxLevel: 58 }, // Kadabra
      { speciesId: 26,  weight: 15, minLevel: 52, maxLevel: 60 }, // Raichu
      { speciesId: 82,  weight: 10, minLevel: 52, maxLevel: 60 }, // Magneton
      { speciesId: 112, weight: 10, minLevel: 54, maxLevel: 60 }, // Rhydon
      { speciesId: 40,  weight: 10, minLevel: 52, maxLevel: 60 }, // Wigglytuff
      { speciesId: 113, weight: 5,  minLevel: 54, maxLevel: 60 }, // Chansey
    ],
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
    connectedAreaIds: ['route-9', 'route-10'],
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
    description: 'A quiet, eerie town. The Pokémon Tower looms to the east, Route 8 leads west toward Saffron City, and Route 12 runs south along the coast.',
    areaType: 'town',
    exploresToComplete: 0,
    connectedAreaIds: ['route-10', 'route-8', 'route-12', 'pokemon-tower'],
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
    connectedAreaIds: ['route-6', 'route-11', 'digletts-cave'],
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
    completionReward: {
      npcName: 'Mr. Fuji',
      lines: [
        'You made it to the very top! The Ghost Pokémon here were only lonely, and you’ve helped them settle down.',
        'Please take my Poké Flute. Its song can wake even a sleeping Snorlax, like the one snoozing on Route 12.',
      ],
      gift: { kind: 'key-item', keyItemId: 'poke-flute' },
    },
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
    exploresToComplete: 8,
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
      { speciesId: 122, weight: 5 , minLevel: 25, maxLevel: 28 }, // Mr. Mime
    ],
  },
  {
    id: 'route-10',
    name: 'Route 10',
    description: 'A path along the river between Rock Tunnel and Lavender Town. The hum of the old Power Plant drifts over the water.',
    areaType: 'route',
    exploresToComplete: 6,
    connectedAreaIds: ['rock-tunnel', 'lavender-town', 'power-plant'],
    completionReward: {
      npcName: 'Fishing Guru’s Brother',
      lines: [
        'You explored the whole river path? My big brother would be proud!',
        'Here, have my Good Rod. With it, Poliwag and Goldeen will bite in rivers all over Kanto.',
      ],
      gift: { kind: 'key-item', keyItemId: 'good-rod' },
    },
    ...mapAt(87, 36),
    mathDifficulty: 61,
    encounters: [
      { speciesId: 100, weight: 30, minLevel: 22, maxLevel: 26 }, // Voltorb
      { speciesId: 21,  weight: 20, minLevel: 22, maxLevel: 26 }, // Spearow
      { speciesId: 23,  weight: 20, minLevel: 22, maxLevel: 26 }, // Ekans
      { speciesId: 27,  weight: 15, minLevel: 22, maxLevel: 26 }, // Sandshrew
      { speciesId: 81,  weight: 15, minLevel: 22, maxLevel: 26 }, // Magnemite
      { speciesId: 129, weight: 10, minLevel: 20, maxLevel: 25, requiresKeyItem: 'old-rod' }, // Magikarp (old rod)
      { speciesId: 60,  weight: 15, minLevel: 22, maxLevel: 25, requiresKeyItem: 'good-rod' }, // Poliwag (good rod)
      { speciesId: 118, weight: 10, minLevel: 22, maxLevel: 25, requiresKeyItem: 'good-rod' }, // Goldeen (good rod)
    ],
  },
  {
    id: 'power-plant',
    name: 'Power Plant',
    description: 'An abandoned power plant crackling with Electric-type Pokémon. It can only be reached by surfing, so trainers need the Soul Badge.',
    areaType: 'special',
    exploresToComplete: 10,
    requiredBadge: 'soul-badge',
    connectedAreaIds: ['route-10'],
    legendary: {
      speciesId: 145, // Zapdos
      level: 50,
      teaser: 'Every light in the Power Plant is flickering, and the air crackles with electricity. Something powerful is hiding in the generator room…',
      intro: 'A blinding flash! The legendary Zapdos appeared!',
    },
    ...mapAt(95, 33),
    mathDifficulty: 84,
    encounters: [
      { speciesId: 81,  weight: 25, minLevel: 36, maxLevel: 40 }, // Magnemite
      { speciesId: 100, weight: 20, minLevel: 36, maxLevel: 40 }, // Voltorb
      { speciesId: 25,  weight: 20, minLevel: 36, maxLevel: 40 }, // Pikachu
      { speciesId: 82,  weight: 15, minLevel: 38, maxLevel: 42 }, // Magneton
      { speciesId: 101, weight: 10, minLevel: 38, maxLevel: 42 }, // Electrode
      { speciesId: 125, weight: 10, minLevel: 38, maxLevel: 42 }, // Electabuzz
      { speciesId: 88,  weight: 15, minLevel: 36, maxLevel: 40 }, // Grimer
      { speciesId: 89,  weight: 5 , minLevel: 40, maxLevel: 42 }, // Muk
    ],
  },
  {
    id: 'route-11',
    name: 'Route 11',
    description: 'A grassy road east of Vermilion City, popular with trainers looking for a battle.',
    areaType: 'route',
    exploresToComplete: 8,
    connectedAreaIds: ['vermilion-city', 'route-12'],
    completionReward: {
      npcName: 'Fan Club Chairman',
      lines: [
        'Oh, you explored every corner of Route 11? My, you must love Pokémon as much as I do!',
        'I won this Bike Voucher in a raffle, but I never ride. Take it! The Bike Shop in Cerulean City will swap it for a Bicycle.',
      ],
      gift: { kind: 'key-item', keyItemId: 'bike-voucher' },
    },
    ...mapAt(74, 70),
    mathDifficulty: 55,
    encounters: [
      { speciesId: 96, weight: 30, minLevel: 20, maxLevel: 25 }, // Drowzee
      { speciesId: 21, weight: 25, minLevel: 20, maxLevel: 25 }, // Spearow
      { speciesId: 23, weight: 20, minLevel: 20, maxLevel: 24 }, // Ekans
      { speciesId: 27, weight: 25, minLevel: 20, maxLevel: 24 }, // Sandshrew
    ],
  },
  {
    id: 'route-12',
    name: 'Route 12',
    description: 'A long fishing pier south of Lavender Town, blocked by a sleeping Snorlax. Trainers need the Marsh Badge and a Poké Flute to wake it.',
    areaType: 'route',
    exploresToComplete: 8,
    requiredBadge: 'marsh-badge',
    requiredKeyItem: 'poke-flute',
    connectedAreaIds: ['lavender-town', 'route-11', 'route-13'],
    completionReward: {
      npcName: 'Fishing Guru’s Other Brother',
      lines: [
        'You’ve fished off every inch of this pier, haven’t you? You’re a real angler now!',
        'I want you to have my Super Rod. Shellder and other sea Pokémon bite along the coast with this beauty.',
      ],
      gift: { kind: 'key-item', keyItemId: 'super-rod' },
    },
    ...mapAt(87, 62),
    mathDifficulty: 76,
    encounters: [
      { speciesId: 44, weight: 25, minLevel: 34, maxLevel: 39 }, // Gloom
      { speciesId: 70, weight: 25, minLevel: 34, maxLevel: 39 }, // Weepinbell
      { speciesId: 48, weight: 20, minLevel: 34, maxLevel: 38 }, // Venonat
      { speciesId: 17, weight: 20, minLevel: 34, maxLevel: 39 }, // Pidgeotto
      { speciesId: 79, weight: 10, minLevel: 34, maxLevel: 38 }, // Slowpoke
      { speciesId: 129, weight: 10, minLevel: 30, maxLevel: 35, requiresKeyItem: 'old-rod' }, // Magikarp (old rod)
      { speciesId: 61,  weight: 10, minLevel: 34, maxLevel: 38, requiresKeyItem: 'good-rod' }, // Poliwhirl (good rod)
      { speciesId: 90,  weight: 15, minLevel: 34, maxLevel: 38, requiresKeyItem: 'super-rod' }, // Shellder (super rod)
    ],
  },
  {
    id: 'route-13',
    name: 'Route 13',
    description: 'A maze of fences and tall grass along the coast. Plenty of trainers wait among the hedges.',
    areaType: 'route',
    exploresToComplete: 8,
    connectedAreaIds: ['route-12', 'route-14'],
    ...mapAt(82, 78),
    mathDifficulty: 77,
    encounters: [
      { speciesId: 17,  weight: 25, minLevel: 35, maxLevel: 40 }, // Pidgeotto
      { speciesId: 44,  weight: 20, minLevel: 35, maxLevel: 40 }, // Gloom
      { speciesId: 70,  weight: 20, minLevel: 35, maxLevel: 40 }, // Weepinbell
      { speciesId: 48,  weight: 20, minLevel: 35, maxLevel: 39 }, // Venonat
      { speciesId: 132, weight: 15, minLevel: 35, maxLevel: 39 }, // Ditto
      { speciesId: 61,  weight: 10, minLevel: 35, maxLevel: 39, requiresKeyItem: 'good-rod' }, // Poliwhirl (good rod)
      { speciesId: 90,  weight: 15, minLevel: 35, maxLevel: 39, requiresKeyItem: 'super-rod' }, // Shellder (super rod)
    ],
  },
  {
    id: 'route-14',
    name: 'Route 14',
    description: 'A winding coastal road heading west toward Fuchsia City.',
    areaType: 'route',
    exploresToComplete: 8,
    connectedAreaIds: ['route-13', 'route-15'],
    ...mapAt(74, 85),
    mathDifficulty: 78,
    encounters: [
      { speciesId: 49,  weight: 25, minLevel: 36, maxLevel: 41 }, // Venomoth
      { speciesId: 44,  weight: 20, minLevel: 36, maxLevel: 40 }, // Gloom
      { speciesId: 70,  weight: 20, minLevel: 36, maxLevel: 40 }, // Weepinbell
      { speciesId: 17,  weight: 20, minLevel: 36, maxLevel: 41 }, // Pidgeotto
      { speciesId: 132, weight: 15, minLevel: 36, maxLevel: 40 }, // Ditto
    ],
  },
  {
    id: 'route-15',
    name: 'Route 15',
    description: 'The last stretch of road before Fuchsia City. Strong trainers make their final stand here.',
    areaType: 'route',
    exploresToComplete: 8,
    connectedAreaIds: ['route-14', 'fuchsia-city'],
    completionReward: {
      npcName: 'Professor Oak’s Aide',
      lines: [
        'Hi! I work for Professor Oak. He asked me to find trainers who explore every corner of Kanto.',
        'This is the Exp. All! With it, every Pokémon in your party learns from each battle, not just the one fighting.',
      ],
      gift: { kind: 'key-item', keyItemId: 'exp-all' },
    },
    ...mapAt(64, 89),
    mathDifficulty: 79,
    encounters: [
      { speciesId: 17,  weight: 25, minLevel: 37, maxLevel: 42 }, // Pidgeotto
      { speciesId: 49,  weight: 20, minLevel: 37, maxLevel: 42 }, // Venomoth
      { speciesId: 44,  weight: 20, minLevel: 37, maxLevel: 41 }, // Gloom
      { speciesId: 70,  weight: 20, minLevel: 37, maxLevel: 41 }, // Weepinbell
      { speciesId: 132, weight: 15, minLevel: 37, maxLevel: 41 }, // Ditto
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
    completionReward: {
      npcName: 'Fishing Guru',
      lines: [
        'Hello there! I see you’ve walked every step of Route 6. Do you like to fish?',
        'Take this Old Rod! Cast it near the water and you might hook a Magikarp. Train it well, and it grows into something amazing!',
      ],
      gift: { kind: 'key-item', keyItemId: 'old-rod' },
    },
    ...mapAt(62, 60),
    mathDifficulty: 53,
    encounters: [
      { speciesId: 16, weight: 25, minLevel: 16, maxLevel: 21 }, // Pidgey
      { speciesId: 43, weight: 20, minLevel: 16, maxLevel: 20 }, // Oddish
      { speciesId: 69, weight: 20, minLevel: 16, maxLevel: 20 }, // Bellsprout
      { speciesId: 52, weight: 15, minLevel: 16, maxLevel: 20 }, // Meowth
      { speciesId: 54, weight: 10, minLevel: 17, maxLevel: 21 }, // Psyduck
      { speciesId: 17, weight: 10, minLevel: 19, maxLevel: 22 }, // Pidgeotto
      { speciesId: 129, weight: 15, minLevel: 15, maxLevel: 20, requiresKeyItem: 'old-rod' }, // Magikarp (old rod)
      { speciesId: 60,  weight: 15, minLevel: 16, maxLevel: 20, requiresKeyItem: 'good-rod' }, // Poliwag (good rod)
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
    connectedAreaIds: ['route-7', 'route-16'],
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
    description: 'Route 17: a long downhill road from Route 16 to Route 18. Fast Pokémon race alongside trainers here.',
    areaType: 'route',
    exploresToComplete: 10,
    connectedAreaIds: ['route-16', 'route-18'],
    ...mapAt(30, 68),
    mathDifficulty: 73,
    encounters: [
      { speciesId: 20,  weight: 30, minLevel: 36, maxLevel: 43 }, // Raticate
      { speciesId: 22,  weight: 25, minLevel: 36, maxLevel: 42 }, // Fearow
      { speciesId: 84,  weight: 25, minLevel: 36, maxLevel: 42 }, // Doduo
      { speciesId: 49,  weight: 20, minLevel: 36, maxLevel: 43 }, // Venomoth
    ],
  },
  {
    id: 'route-16',
    name: 'Route 16',
    description: 'The road west of Celadon City, and the gate to Cycling Road. Only trainers with the Marsh Badge and a Bicycle are let through.',
    areaType: 'route',
    exploresToComplete: 8,
    requiredBadge: 'marsh-badge',
    requiredKeyItem: 'bicycle',
    connectedAreaIds: ['celadon-city', 'cycling-road'],
    ...mapAt(30, 48),
    mathDifficulty: 72,
    encounters: [
      { speciesId: 20, weight: 30, minLevel: 34, maxLevel: 39 }, // Raticate
      { speciesId: 84, weight: 25, minLevel: 34, maxLevel: 38 }, // Doduo
      { speciesId: 22, weight: 25, minLevel: 34, maxLevel: 39 }, // Fearow
      { speciesId: 21, weight: 20, minLevel: 34, maxLevel: 37 }, // Spearow
    ],
  },
  {
    id: 'route-18',
    name: 'Route 18',
    description: 'The end of Cycling Road, where the downhill ride rolls east into Fuchsia City.',
    areaType: 'route',
    exploresToComplete: 8,
    connectedAreaIds: ['cycling-road', 'fuchsia-city'],
    ...mapAt(40, 86),
    mathDifficulty: 76,
    encounters: [
      { speciesId: 85, weight: 25, minLevel: 37, maxLevel: 42 }, // Dodrio
      { speciesId: 22, weight: 25, minLevel: 37, maxLevel: 42 }, // Fearow
      { speciesId: 20, weight: 25, minLevel: 37, maxLevel: 41 }, // Raticate
      { speciesId: 84, weight: 25, minLevel: 37, maxLevel: 41 }, // Doduo
    ],
  },
  {
    id: 'route-19',
    name: 'Route 19',
    description: 'A sea route south of Fuchsia City. Trainers need the Soul Badge to surf these waters.',
    areaType: 'route',
    exploresToComplete: 8,
    requiredBadge: 'soul-badge',
    connectedAreaIds: ['fuchsia-city', 'route-20'],
    ...mapAt(54, 98),
    mathDifficulty: 82,
    encounters: [
      { speciesId: 72,  weight: 35, minLevel: 38, maxLevel: 43 }, // Tentacool
      { speciesId: 98,  weight: 20, minLevel: 38, maxLevel: 43 }, // Krabby
      { speciesId: 116, weight: 15, minLevel: 38, maxLevel: 42 }, // Horsea
      { speciesId: 118, weight: 15, minLevel: 38, maxLevel: 42 }, // Goldeen
      { speciesId: 73,  weight: 15, minLevel: 40, maxLevel: 43 }, // Tentacruel
      { speciesId: 129, weight: 10, minLevel: 35, maxLevel: 40, requiresKeyItem: 'old-rod' }, // Magikarp (old rod)
      { speciesId: 90,  weight: 15, minLevel: 38, maxLevel: 42, requiresKeyItem: 'super-rod' }, // Shellder (super rod)
    ],
  },
  {
    id: 'route-20',
    name: 'Route 20',
    description: 'Open sea stretching west toward the Seafoam Islands. Strong currents swirl around the rocks.',
    areaType: 'route',
    exploresToComplete: 8,
    connectedAreaIds: ['route-19', 'seafoam-islands'],
    ...mapAt(42, 104),
    mathDifficulty: 84,
    encounters: [
      { speciesId: 72,  weight: 30, minLevel: 40, maxLevel: 45 }, // Tentacool
      { speciesId: 73,  weight: 15, minLevel: 41, maxLevel: 45 }, // Tentacruel
      { speciesId: 119, weight: 15, minLevel: 40, maxLevel: 45 }, // Seaking
      { speciesId: 120, weight: 15, minLevel: 40, maxLevel: 44 }, // Staryu
      { speciesId: 99,  weight: 15, minLevel: 40, maxLevel: 45 }, // Kingler
      { speciesId: 117, weight: 10, minLevel: 41, maxLevel: 45 }, // Seadra
      { speciesId: 90,  weight: 15, minLevel: 40, maxLevel: 44, requiresKeyItem: 'super-rod' }, // Shellder (super rod)
    ],
  },
  {
    id: 'route-21',
    name: 'Route 21',
    description: 'A sea route linking Pallet Town to Cinnabar Island. Trainers need the Soul Badge to surf these waters.',
    areaType: 'route',
    exploresToComplete: 8,
    requiredBadge: 'soul-badge',
    connectedAreaIds: ['pallet-town', 'cinnabar-island'],
    ...mapAt(18, 98),
    mathDifficulty: 86,
    encounters: [
      { speciesId: 72,  weight: 30, minLevel: 40, maxLevel: 45 }, // Tentacool
      { speciesId: 114, weight: 20, minLevel: 40, maxLevel: 45 }, // Tangela
      { speciesId: 17,  weight: 20, minLevel: 40, maxLevel: 45 }, // Pidgeotto
      { speciesId: 120, weight: 15, minLevel: 40, maxLevel: 44 }, // Staryu
      { speciesId: 73,  weight: 15, minLevel: 41, maxLevel: 45 }, // Tentacruel
      { speciesId: 129, weight: 10, minLevel: 35, maxLevel: 40, requiresKeyItem: 'old-rod' }, // Magikarp (old rod)
      { speciesId: 90,  weight: 10, minLevel: 40, maxLevel: 44, requiresKeyItem: 'super-rod' }, // Shellder (super rod)
    ],
  },
  {
    id: 'fuchsia-city',
    name: 'Fuchsia City',
    description: "Home of the Safari Zone and Koga's Poison-type Gym. The Safari Zone is open to explorers.",
    areaType: 'city',
    exploresToComplete: 0,
    connectedAreaIds: ['route-18', 'route-15', 'route-19', 'safari-zone'],
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
    completionReward: {
      npcName: 'Safari Warden',
      lines: [
        'Well, I’ll be! You’ve seen every corner of the Safari Zone.',
        'This Lickitung followed me home from the grass one day. It loves new friends. Will you look after it?',
      ],
      gift: { kind: 'pokemon', speciesIds: [108], level: 40 },
    },
    ...mapAt(54, 79),
    mathDifficulty: 80,
    encounters: [
      { speciesId: 111, weight: 25, minLevel: 38, maxLevel: 45 }, // Rhyhorn
      { speciesId: 30,  weight: 20, minLevel: 38, maxLevel: 42 }, // Nidorina
      { speciesId: 123, weight: 20, minLevel: 40, maxLevel: 45 }, // Scyther
      { speciesId: 115, weight: 15, minLevel: 38, maxLevel: 45 }, // Kangaskhan
      { speciesId: 128, weight: 15, minLevel: 38, maxLevel: 45 }, // Tauros
      { speciesId: 113, weight: 5,  minLevel: 38, maxLevel: 45 }, // Chansey
      { speciesId: 102, weight: 15, minLevel: 38, maxLevel: 43 }, // Exeggcute
    ],
  },
  {
    id: 'seafoam-islands',
    name: 'Seafoam Islands',
    description: 'Frozen sea caves between Route 20 and Cinnabar Island. Ice and Water types thrive in the frigid waters.',
    areaType: 'cave',
    exploresToComplete: 12,
    requiredBadge: 'soul-badge',
    connectedAreaIds: ['route-20', 'cinnabar-island'],
    legendary: {
      speciesId: 144, // Articuno
      level: 50,
      teaser: 'An icy wind is blowing up from the deepest cave, colder than anything else in Seafoam. Something is stirring down there…',
      intro: 'Snow swirls through the cave… The legendary Articuno appeared!',
    },
    ...mapAt(30, 106),
    mathDifficulty: 86,
    encounters: [
      { speciesId: 86,  weight: 35, minLevel: 40, maxLevel: 47 }, // Seel
      { speciesId: 87,  weight: 25, minLevel: 42, maxLevel: 47 }, // Dewgong
      { speciesId: 80,  weight: 20, minLevel: 40, maxLevel: 47 }, // Slowbro
      { speciesId: 124, weight: 15, minLevel: 40, maxLevel: 47 }, // Jynx
      { speciesId: 131, weight: 5,  minLevel: 42, maxLevel: 47 }, // Lapras
      { speciesId: 90,  weight: 10, minLevel: 40, maxLevel: 45, requiresKeyItem: 'super-rod' }, // Shellder (super rod)
    ],
  },
  {
    id: 'cinnabar-island',
    name: 'Cinnabar Island',
    description: 'A volcanic island. Fire-type Pokémon thrive in the scorching heat. Route 21 leads north across the sea to Pallet Town.',
    areaType: 'special',
    exploresToComplete: 10,
    connectedAreaIds: ['seafoam-islands', 'route-21'],
    ...mapAt(18, 106),
    mathDifficulty: 87,
    martItems: ['ultra-ball', 'hyper-potion', 'full-restore', 'max-revive'],
    encounters: [
      { speciesId: 77,  weight: 25, minLevel: 40, maxLevel: 47 }, // Ponyta
      { speciesId: 58,  weight: 25, minLevel: 40, maxLevel: 47 }, // Growlithe
      { speciesId: 126, weight: 15, minLevel: 40, maxLevel: 47 }, // Magmar
      { speciesId: 38,  weight: 15, minLevel: 42, maxLevel: 47 }, // Ninetales
      { speciesId: 59,  weight: 20, minLevel: 42, maxLevel: 47 }, // Arcanine
      { speciesId: 109, weight: 15, minLevel: 40, maxLevel: 44 }, // Koffing
      { speciesId: 110, weight: 5 , minLevel: 44, maxLevel: 47 }, // Weezing
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
    legendary: {
      speciesId: 146, // Moltres
      level: 55,
      teaser: 'The rocks near the top of Victory Road are glowing hot, and a flicker of flame dances in the dark. Something is waiting up there…',
      intro: 'Flames light up the cave! The legendary Moltres appeared!',
    },
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
    description: 'Home of the Pokémon League, where the Elite Four and the Champion wait for the best trainers in Kanto.',
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

/** Bill gives a starter the player doesn't have for fully exploring this route */
export const STARTER_GIFT_AREA_ID = 'route-25'

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

export function hasKeyItem(keyItems: InventorySlot[], itemId: string): boolean {
  return keyItems.some(slot => slot.itemId === itemId && slot.quantity > 0)
}

/** Like badges, key-item gates only block first entry */
export function meetsKeyItemRequirement(area: Area, keyItems: InventorySlot[], unlockedAreaIds: string[]): boolean {
  return !area.requiredKeyItem || hasKeyItem(keyItems, area.requiredKeyItem) || unlockedAreaIds.includes(area.id)
}

/** The area's completion reward, if it's fully explored and the reward hasn't been handed out yet */
export function unclaimedReward(
  area: Area,
  trainer: Pick<Trainer, 'exploreProgress' | 'claimedRewardIds'>,
): AreaReward | null {
  if (!area.completionReward || trainer.claimedRewardIds.includes(area.id)) return null
  return isAreaExplored(area, trainer.exploreProgress) ? area.completionReward : null
}

/** The area's legendary, if the area is fully explored and it hasn't been caught yet */
export function legendaryAvailable(
  area: Area,
  trainer: Pick<Trainer, 'exploreProgress' | 'pokedex'>,
): LegendaryEncounter | null {
  const legendary = area.legendary
  if (!legendary || trainer.pokedex[legendary.speciesId]?.caught) return null
  return isAreaExplored(area, trainer.exploreProgress) ? legendary : null
}

export function exploresDone(area: Area, exploreProgress: Record<string, number>): number {
  return Math.min(exploreProgress[area.id] ?? 0, area.exploresToComplete)
}

/** Cities and towns are always "explored"; wild areas once their explore count is met */
export function isAreaExplored(area: Area, exploreProgress: Record<string, number>): boolean {
  return exploresDone(area, exploreProgress) >= area.exploresToComplete
}

export type TravelBlocker = 'badge' | 'key-item' | 'explore'

/**
 * Why the player can't step from `from` into the adjacent area `to`, or null if
 * they can. Going back to anywhere already visited is always allowed, so a
 * player can retreat from an unfinished area to heal.
 */
export function travelBlocker(
  from: Area,
  to: Area,
  trainer: Pick<Trainer, 'badges' | 'keyItems' | 'unlockedAreaIds' | 'exploreProgress'>,
): TravelBlocker | null {
  if (trainer.unlockedAreaIds.includes(to.id)) return null
  if (!meetsBadgeRequirement(to, trainer.badges, trainer.unlockedAreaIds)) return 'badge'
  if (!meetsKeyItemRequirement(to, trainer.keyItems, trainer.unlockedAreaIds)) return 'key-item'
  if (!isAreaExplored(from, trainer.exploreProgress)) return 'explore'
  return null
}

/** Unvisited areas next to `fromId` that the player could travel to right now */
export function openNewAreaIds(
  fromId: string,
  trainer: Pick<Trainer, 'badges' | 'keyItems' | 'unlockedAreaIds' | 'exploreProgress'>,
): string[] {
  const from = AREA_MAP[fromId]
  if (!from) return []
  return from.connectedAreaIds.filter(id =>
    !trainer.unlockedAreaIds.includes(id) && travelBlocker(from, AREA_MAP[id], trainer) === null)
}
