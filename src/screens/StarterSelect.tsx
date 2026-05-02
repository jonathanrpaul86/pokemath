import { useState, useEffect } from 'react'
import { fetchPokemonSpecies } from '../services/pokeApi'
import { useGameStore } from '../store'
import type { PokemonSpecies, PokemonType } from '../types'
import './StarterSelect.css'

// Charmander, Squirtle, Bulbasaur
const STARTER_IDS = [4, 7, 1]

const TYPE_COLORS: Partial<Record<PokemonType, string>> = {
  fire:     '#F08030',
  water:    '#6890F0',
  grass:    '#78C850',
  poison:   '#A040A0',
  normal:   '#A8A878',
  electric: '#F8D030',
  ice:      '#98D8D8',
  fighting: '#C03028',
  ground:   '#E0C068',
  flying:   '#A890F0',
  psychic:  '#F85888',
  bug:      '#A8B820',
  rock:     '#B8A038',
  ghost:    '#705898',
  dragon:   '#7038F8',
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface Props {
  onBack: () => void
}

export default function StarterSelect({ onBack }: Props) {
  const { startNewGame } = useGameStore()
  const [starters, setStarters] = useState<PokemonSpecies[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(STARTER_IDS.map(id => fetchPokemonSpecies(id)))
      .then(species => {
        if (!cancelled) {
          setStarters(species)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load starters. Check your connection and try again.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  function handleBegin() {
    const species = starters.find(s => s.id === selectedId)
    if (!species) return
    startNewGame(species)
  }

  return (
    <div className="starter-select">
      <div className="starter-select__inner">
        <h1 className="starter-select__title">Choose Your Partner!</h1>
        <p className="starter-select__subtitle">Your Pokémon will travel with you on your math adventure.</p>

        {loading && (
          <div className="starter-select__loading">
            <div className="spinner" />
            <p>Loading Pokémon…</p>
          </div>
        )}

        {error && (
          <div className="starter-select__error">
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={onBack}>Go Back</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="starter-cards">
              {starters.map(species => (
                <button
                  key={species.id}
                  className={`starter-card ${selectedId === species.id ? 'starter-card--selected' : ''}`}
                  style={selectedId === species.id
                    ? { borderColor: TYPE_COLORS[species.types[0]] ?? '#ffd700', boxShadow: `0 0 20px ${TYPE_COLORS[species.types[0]] ?? '#ffd700'}88` }
                    : undefined
                  }
                  onClick={() => setSelectedId(species.id)}
                >
                  <img
                    className="starter-card__sprite"
                    src={species.sprites.front}
                    alt={species.name}
                  />
                  <span className="starter-card__name">{capitalize(species.name)}</span>
                  <div className="starter-card__types">
                    {species.types.map(type => (
                      <span
                        key={type}
                        className="type-badge"
                        style={{ background: TYPE_COLORS[type] ?? '#888' }}
                      >
                        {capitalize(type)}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="starter-select__actions">
              <button className="btn btn-secondary" onClick={onBack}>Back</button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleBegin}
                disabled={selectedId === null}
              >
                Begin Adventure!
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
