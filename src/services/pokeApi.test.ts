import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_CACHE_PREFIX } from '../utils/storage'

// Real PokéAPI responses carry huge fields the game never uses (every move,
// every game version, every language). Simulate that bulk.
const BULK = 'x'.repeat(200_000)

const rawPokemon = {
  id: 4,
  name: 'charmander',
  types: [{ slot: 1, type: { name: 'fire' } }],
  stats: [
    ['hp', 39], ['attack', 52], ['defense', 43],
    ['special-attack', 60], ['special-defense', 50], ['speed', 65],
  ].map(([name, base_stat]) => ({ base_stat, stat: { name } })),
  sprites: { front_default: 'front.png', back_default: 'back.png' },
  moves: [
    { move: { name: 'scratch' }, version_group_details: [{ level_learned_at: 1, move_learn_method: { name: 'level-up' } }] },
    { move: { name: 'ember' }, version_group_details: [{ level_learned_at: 7, move_learn_method: { name: 'level-up' } }] },
    { move: { name: 'dig' }, version_group_details: [{ level_learned_at: 0, move_learn_method: { name: 'machine' } }] },
  ],
  game_indices: BULK,
}

const rawMoves: Record<string, object> = {
  scratch: { id: 10, name: 'scratch', type: { name: 'normal' }, power: 40, accuracy: 100, damage_class: { name: 'physical' }, flavor_text_entries: BULK },
  ember: { id: 52, name: 'ember', type: { name: 'fire' }, power: 40, accuracy: 100, damage_class: { name: 'special' }, flavor_text_entries: BULK },
}

function mockFetch() {
  const fetchMock = vi.fn(async (url: string) => {
    const body = url.endsWith('/pokemon/4') ? rawPokemon : rawMoves[url.split('/').pop()!]
    return { ok: !!body, status: body ? 200 : 404, json: async () => body } as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Fresh module each time, so its in-memory cache starts empty */
async function freshApi() {
  vi.resetModules()
  return import('./pokeApi')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchPokemonSpecies', () => {
  it('returns the fields the game needs, with level-up moves only', async () => {
    mockFetch()
    const { fetchPokemonSpecies } = await freshApi()
    const species = await fetchPokemonSpecies(4)
    expect(species.name).toBe('charmander')
    expect(species.baseStats.attack).toBe(52)
    expect(species.sprites).toEqual({ front: 'front.png', back: 'back.png' })
    expect(Object.keys(species.levelUpMoves)).toEqual(['1', '7'])
    expect(species.levelUpMoves[7][0]).toMatchObject({ name: 'ember', damageClass: 'special' })
  })

  it('caches only the trimmed data, not the raw response', async () => {
    mockFetch()
    const { fetchPokemonSpecies } = await freshApi()
    await fetchPokemonSpecies(4)
    const cached = localStorage.getItem(`${API_CACHE_PREFIX}species_4`)!
    expect(cached).not.toContain('xxxxxxxx')
    expect(cached.length).toBeLessThan(2_000)
    expect(localStorage.getItem(`${API_CACHE_PREFIX}move_ember`)!.length).toBeLessThan(200)
  })

  it('serves later requests from storage without the network', async () => {
    const fetchMock = mockFetch()
    await (await freshApi()).fetchPokemonSpecies(4)
    const callsAfterFirstSession = fetchMock.mock.calls.length

    // A new session (fresh module) should read the saved cache
    const species = await (await freshApi()).fetchPokemonSpecies(4)
    expect(species.name).toBe('charmander')
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirstSession)
  })

  it('shares one request between parallel callers', async () => {
    const fetchMock = mockFetch()
    const { fetchPokemonSpecies } = await freshApi()
    await Promise.all([fetchPokemonSpecies(4), fetchPokemonSpecies(4), fetchPokemonSpecies(4)])
    const speciesCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/pokemon/4'))
    expect(speciesCalls).toHaveLength(1)
  })

  it('does not cache a failed request', async () => {
    const fetchMock = mockFetch()
    const { fetchPokemonSpecies } = await freshApi()
    await expect(fetchPokemonSpecies(999)).rejects.toThrow()
    await expect(fetchPokemonSpecies(999)).rejects.toThrow()
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/pokemon/999'))).toHaveLength(2)
    expect(localStorage.getItem(`${API_CACHE_PREFIX}species_999`)).toBeNull()
  })
})
