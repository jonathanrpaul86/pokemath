import type { Area, CityHubData } from '../types'
import { gymForCity } from './gyms'

/** Houses and Storytellers per city. Center, Mart, and Gym come from area and gym data. */
export const CITY_HUBS: Record<string, CityHubData> = {
  'pallet-town': {
    houses: [{
      id: 'oaks-lab',
      name: 'Professor Oak’s Lab',
      icon: '🧪',
      npcName: 'Professor Oak',
      lines: [
        'Ah, there you are! The world is full of Pokémon, and you’re about to meet lots of them.',
        'Head north on Route 1. Explore it fully and you’ll find the way to Viridian City.',
        'Every Pokémon you catch fills a page in your Pokédex. See if you can complete it!',
      ],
    }],
  },
  'indigo-plateau': {
    houses: [{
      id: 'league-gate',
      name: 'Pokémon League',
      icon: '🏆',
      npcName: 'League Guard',
      lines: [
        'Welcome to the Indigo Plateau, home of the Pokémon League!',
        'Only trainers with all eight badges make it this far. Well done!',
        'The Elite Four are still getting ready. Come back soon to challenge them!',
      ],
    }],
  },
  'viridian-city': {
    houses: [{
      id: 'trainer-school',
      name: 'Trainer School',
      icon: '🏫',
      npcName: 'Teacher Ann',
      lines: [
        'Welcome to the Trainer School! Lesson one: explore wild areas to find Pokémon, items, and other trainers.',
        'You can’t travel somewhere new until you’ve fully explored the place you’re in. Keep an eye on the Explored bar!',
        'Answer quickly! If you solve a problem fast enough, the other Pokémon won’t have time to attack back.',
        'Tired Pokémon? Come back to a Pokémon Center. You can always return to places you’ve already been.',
      ],
    }],
    storyteller: { npcName: 'Grandpa Ed', rareEncounter: { speciesId: 133, level: 6 } }, // Eevee
  },
  'pewter-city': {
    houses: [{
      id: 'pewter-museum',
      name: 'Pewter Museum',
      icon: '🏛️',
      npcName: 'Museum Guide',
      lines: [
        'Welcome to the Pewter Museum of Science!',
        'Long, long ago, Pokémon like Omanyte and Kabuto swam in the ancient seas.',
        'Their fossils were found inside Mt. Moon, just east of here.',
        'Brock’s Rock-type Pokémon have very tough skin. Make sure your team is strong before you visit his Gym!',
      ],
    }],
    storyteller: { npcName: 'Storyteller Pat', rareEncounter: { speciesId: 138, level: 12 } }, // Omanyte
  },
  'cerulean-city': {
    houses: [{
      id: 'bike-shop',
      name: 'Bike Shop',
      icon: '🚲',
      npcName: 'Shopkeeper',
      lines: [
        'Welcome! Our bikes are the finest in all of Kanto.',
        'This one is only ¥1,000,000! …No? Maybe next time!',
        'Misty’s Water Pokémon are quick. Earning badges helps your Pokémon grow strong enough to keep up.',
      ],
      exchange: {
        takesKeyItemId: 'bike-voucher',
        givesKeyItemId: 'bicycle',
        lines: [
          'Is that… a Bike Voucher from the Pokémon Fan Club?!',
          'A deal is a deal. Here you go: one shiny new Bicycle, free of charge!',
          'You can ride it down Cycling Road, west of Celadon City. Just watch those hills!',
        ],
      },
    }],
    storyteller: { npcName: 'Captain Lou', rareEncounter: { speciesId: 1, level: 16 } }, // Bulbasaur
  },
  'lavender-town': {
    houses: [{
      id: 'volunteer-house',
      name: 'Volunteer House',
      icon: '🏡',
      npcName: 'Mr. Fuji',
      lines: [
        'Hello, young one. I care for Pokémon who have lost their trainers.',
        'Every Pokémon deserves a kind friend.',
        'The Pokémon Tower east of here looks spooky, but most of its Ghost Pokémon are just playful.',
      ],
    }],
    storyteller: { npcName: 'Granny Iris', rareEncounter: { speciesId: 143, level: 26 } }, // Snorlax
  },
  'vermilion-city': {
    houses: [{
      id: 'fan-club',
      name: 'Pokémon Fan Club',
      icon: '🎀',
      npcName: 'Club Chairman',
      lines: [
        'Welcome to the Pokémon Fan Club! Would you like to hear about my Rapidash? It is the fastest, most beautiful—',
        '…Oh, you’re in a hurry? Very well!',
        'Here’s a secret: every Gym Badge lets your Pokémon grow a bit stronger. Without badges, they can only reach a certain level.',
        'So take good care of all your Pokémon, not just your strongest one!',
      ],
    }],
    storyteller: { npcName: 'Sailor Finn', rareEncounter: { speciesId: 83, level: 22 } }, // Farfetch'd
  },
  'celadon-city': {
    houses: [{
      id: 'celadon-mansion',
      name: 'Celadon Mansion',
      icon: '🏢',
      npcName: 'Game Designer',
      lines: [
        'I make video games! I’m working on one where you battle using math.',
        'Pro tip: Potions in your Bag can heal your Pokémon in the middle of a battle.',
        'And don’t forget to check your Pokédex. Filling it up is half the fun!',
      ],
    }],
    storyteller: { npcName: 'Poet Rin', rareEncounter: { speciesId: 137, level: 26 } }, // Porygon
  },
  'saffron-city': {
    houses: [{
      id: 'fighting-dojo',
      name: 'Fighting Dojo',
      icon: '🥋',
      npcName: 'Karate Master',
      lines: [
        'Hiyah! Welcome to the Fighting Dojo!',
        'A true fighter is kind as well as strong.',
        'Sabrina’s Psychic Pokémon are very powerful. Bring your toughest team, and a Bag full of Potions!',
      ],
    }],
    storyteller: { npcName: 'Madame Sol', rareEncounter: { speciesId: 106, level: 32 } }, // Hitmonlee
  },
  'fuchsia-city': {
    houses: [{
      id: 'wardens-house',
      name: 'Warden’s House',
      icon: '🏠',
      npcName: 'Safari Warden',
      lines: [
        'Ah, a young trainer! The Safari Zone is full of rare Pokémon.',
        'Koga’s Poison Pokémon wear you down slowly. Carry plenty of Potions!',
      ],
    }],
    storyteller: { npcName: 'Ranger Kit', rareEncounter: { speciesId: 127, level: 34 } }, // Pinsir
  },
  'cinnabar-island': {
    houses: [{
      id: 'pokemon-lab',
      name: 'Pokémon Lab',
      icon: '🔬',
      npcName: 'Scientist',
      lines: [
        'Welcome to the Pokémon Lab! We brought an ancient Pokémon back to life from a fossil.',
        'Blaine loves riddles almost as much as he loves fire.',
        'His Fire Pokémon hit hard. Make sure your team is fully healed before you go in!',
      ],
    }],
    storyteller: { npcName: 'Professor Ash', rareEncounter: { speciesId: 142, level: 38 } }, // Aerodactyl
  },
}

/** Any area with services (Center/Mart/Gym/houses) gets a city screen, including Cinnabar */
export function hasCityHub(area: Area): boolean {
  return area.areaType === 'city' || area.areaType === 'town'
    || !!area.martItems?.length || !!gymForCity(area.id) || !!CITY_HUBS[area.id]
}
