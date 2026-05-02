export interface Evolution {
  evolvesIntoId: number
  atLevel: number
}

/**
 * Level-up evolutions for all Kanto Pokémon.
 * Stone and trade evolutions are converted to level thresholds.
 */
export const EVOLUTIONS: Record<number, Evolution> = {
  1:   { evolvesIntoId: 2,   atLevel: 16 }, // Bulbasaur → Ivysaur
  2:   { evolvesIntoId: 3,   atLevel: 32 }, // Ivysaur → Venusaur
  4:   { evolvesIntoId: 5,   atLevel: 16 }, // Charmander → Charmeleon
  5:   { evolvesIntoId: 6,   atLevel: 36 }, // Charmeleon → Charizard
  7:   { evolvesIntoId: 8,   atLevel: 16 }, // Squirtle → Wartortle
  8:   { evolvesIntoId: 9,   atLevel: 36 }, // Wartortle → Blastoise
  10:  { evolvesIntoId: 11,  atLevel: 7  }, // Caterpie → Metapod
  11:  { evolvesIntoId: 12,  atLevel: 10 }, // Metapod → Butterfree
  13:  { evolvesIntoId: 14,  atLevel: 7  }, // Weedle → Kakuna
  14:  { evolvesIntoId: 15,  atLevel: 10 }, // Kakuna → Beedrill
  16:  { evolvesIntoId: 17,  atLevel: 18 }, // Pidgey → Pidgeotto
  17:  { evolvesIntoId: 18,  atLevel: 36 }, // Pidgeotto → Pidgeot
  19:  { evolvesIntoId: 20,  atLevel: 20 }, // Rattata → Raticate
  21:  { evolvesIntoId: 22,  atLevel: 20 }, // Spearow → Fearow
  23:  { evolvesIntoId: 24,  atLevel: 22 }, // Ekans → Arbok
  25:  { evolvesIntoId: 26,  atLevel: 30 }, // Pikachu → Raichu
  27:  { evolvesIntoId: 28,  atLevel: 22 }, // Sandshrew → Sandslash
  29:  { evolvesIntoId: 30,  atLevel: 16 }, // Nidoran♀ → Nidorina
  30:  { evolvesIntoId: 31,  atLevel: 36 }, // Nidorina → Nidoqueen
  32:  { evolvesIntoId: 33,  atLevel: 16 }, // Nidoran♂ → Nidorino
  33:  { evolvesIntoId: 34,  atLevel: 36 }, // Nidorino → Nidoking
  35:  { evolvesIntoId: 36,  atLevel: 30 }, // Clefairy → Clefable
  37:  { evolvesIntoId: 38,  atLevel: 30 }, // Vulpix → Ninetales
  39:  { evolvesIntoId: 40,  atLevel: 30 }, // Jigglypuff → Wigglytuff
  41:  { evolvesIntoId: 42,  atLevel: 22 }, // Zubat → Golbat
  43:  { evolvesIntoId: 44,  atLevel: 21 }, // Oddish → Gloom
  44:  { evolvesIntoId: 45,  atLevel: 36 }, // Gloom → Vileplume
  46:  { evolvesIntoId: 47,  atLevel: 24 }, // Paras → Parasect
  48:  { evolvesIntoId: 49,  atLevel: 31 }, // Venonat → Venomoth
  50:  { evolvesIntoId: 51,  atLevel: 26 }, // Diglett → Dugtrio
  52:  { evolvesIntoId: 53,  atLevel: 28 }, // Meowth → Persian
  54:  { evolvesIntoId: 55,  atLevel: 33 }, // Psyduck → Golduck
  56:  { evolvesIntoId: 57,  atLevel: 28 }, // Mankey → Primeape
  58:  { evolvesIntoId: 59,  atLevel: 30 }, // Growlithe → Arcanine
  60:  { evolvesIntoId: 61,  atLevel: 25 }, // Poliwag → Poliwhirl
  61:  { evolvesIntoId: 62,  atLevel: 36 }, // Poliwhirl → Poliwrath
  63:  { evolvesIntoId: 64,  atLevel: 16 }, // Abra → Kadabra
  64:  { evolvesIntoId: 65,  atLevel: 36 }, // Kadabra → Alakazam
  66:  { evolvesIntoId: 67,  atLevel: 28 }, // Machop → Machoke
  67:  { evolvesIntoId: 68,  atLevel: 36 }, // Machoke → Machamp
  69:  { evolvesIntoId: 70,  atLevel: 21 }, // Bellsprout → Weepinbell
  70:  { evolvesIntoId: 71,  atLevel: 36 }, // Weepinbell → Victreebel
  72:  { evolvesIntoId: 73,  atLevel: 30 }, // Tentacool → Tentacruel
  74:  { evolvesIntoId: 75,  atLevel: 25 }, // Geodude → Graveler
  75:  { evolvesIntoId: 76,  atLevel: 36 }, // Graveler → Golem
  77:  { evolvesIntoId: 78,  atLevel: 40 }, // Ponyta → Rapidash
  79:  { evolvesIntoId: 80,  atLevel: 37 }, // Slowpoke → Slowbro
  81:  { evolvesIntoId: 82,  atLevel: 30 }, // Magnemite → Magneton
  84:  { evolvesIntoId: 85,  atLevel: 31 }, // Doduo → Dodrio
  86:  { evolvesIntoId: 87,  atLevel: 34 }, // Seel → Dewgong
  88:  { evolvesIntoId: 89,  atLevel: 38 }, // Grimer → Muk
  90:  { evolvesIntoId: 91,  atLevel: 30 }, // Shellder → Cloyster
  92:  { evolvesIntoId: 93,  atLevel: 25 }, // Gastly → Haunter
  93:  { evolvesIntoId: 94,  atLevel: 36 }, // Haunter → Gengar
  96:  { evolvesIntoId: 97,  atLevel: 26 }, // Drowzee → Hypno
  98:  { evolvesIntoId: 99,  atLevel: 28 }, // Krabby → Kingler
  100: { evolvesIntoId: 101, atLevel: 30 }, // Voltorb → Electrode
  102: { evolvesIntoId: 103, atLevel: 30 }, // Exeggcute → Exeggutor
  104: { evolvesIntoId: 105, atLevel: 28 }, // Cubone → Marowak
  109: { evolvesIntoId: 110, atLevel: 35 }, // Koffing → Weezing
  111: { evolvesIntoId: 112, atLevel: 42 }, // Rhyhorn → Rhydon
  116: { evolvesIntoId: 117, atLevel: 32 }, // Horsea → Seadra
  118: { evolvesIntoId: 119, atLevel: 33 }, // Goldeen → Seaking
  120: { evolvesIntoId: 121, atLevel: 30 }, // Staryu → Starmie
  129: { evolvesIntoId: 130, atLevel: 20 }, // Magikarp → Gyarados
  133: { evolvesIntoId: 134, atLevel: 30 }, // Eevee → Vaporeon
  138: { evolvesIntoId: 139, atLevel: 40 }, // Omanyte → Omastar
  140: { evolvesIntoId: 141, atLevel: 40 }, // Kabuto → Kabutops
  147: { evolvesIntoId: 148, atLevel: 30 }, // Dratini → Dragonair
  148: { evolvesIntoId: 149, atLevel: 55 }, // Dragonair → Dragonite
}
