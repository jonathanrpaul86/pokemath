import { useState } from 'react'
import { useTrainer } from '../store'
import { KANTO_NAMES, KANTO_TOTAL, spriteUrl } from '../data/pokedex'
import './PokedexScreen.css'

type Filter = 'all' | 'caught' | 'seen' | 'not-yet'

interface Props {
  onBack: () => void
}

export default function PokedexScreen({ onBack }: Props) {
  const trainer = useTrainer()
  const [filter, setFilter] = useState<Filter>('all')

  const caughtCount = Object.values(trainer.pokedex).filter(e => e.caught).length
  const seenCount   = Object.values(trainer.pokedex).filter(e => e.seen && !e.caught).length

  const ids = Array.from({ length: KANTO_TOTAL }, (_, i) => i + 1).filter(id => {
    const entry = trainer.pokedex[id]
    const caught = entry?.caught ?? false
    const seen   = entry?.seen   ?? false
    if (filter === 'caught')  return caught
    if (filter === 'seen')    return seen && !caught
    if (filter === 'not-yet') return !seen && !caught
    return true
  })

  return (
    <div className="pokedex">

      {/* ── Header ── */}
      <header className="pokedex-header">
        <button className="pokedex-back btn btn-secondary" onClick={onBack}>← Back</button>
        <h1 className="pokedex-title">Pokédex</h1>
        <div className="pokedex-counts">
          <span className="pokedex-counts__caught">⭐ {caughtCount} caught</span>
          <span className="pokedex-counts__seen">👁 {seenCount} seen</span>
          <span className="pokedex-counts__total">/ {KANTO_TOTAL}</span>
        </div>
      </header>

      {/* ── Filter tabs ── */}
      <div className="pokedex-filters">
        {([
          ['all',      'All'],
          ['caught',   '⭐ Caught'],
          ['seen',     '👁 Seen'],
          ['not-yet',  '? Not Yet'],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`pokedex-filter-btn ${filter === key ? 'pokedex-filter-btn--active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {ids.length === 0 ? (
        <div className="pokedex-empty">
          {filter === 'caught'  && 'No Pokémon caught yet — get out there and battle!'}
          {filter === 'seen'    && 'No Pokémon seen but not caught yet.'}
          {filter === 'not-yet' && 'You\'ve seen every Pokémon!'}
        </div>
      ) : (
        <div className="pokedex-grid">
          {ids.map(id => {
            const entry  = trainer.pokedex[id]
            const caught = entry?.caught ?? false
            const seen   = entry?.seen   ?? false
            const known  = seen || caught
            const status = caught ? 'caught' : seen ? 'seen' : 'unknown'

            return (
              <div key={id} className={`pokedex-card pokedex-card--${status}`}>
                <span className="pokedex-card__number">#{String(id).padStart(3, '0')}</span>
                <img
                  className={`pokedex-card__sprite ${!known ? 'pokedex-card__sprite--silhouette' : ''}`}
                  src={spriteUrl(id)}
                  alt={known ? KANTO_NAMES[id] : '???'}
                  loading="lazy"
                />
                <span className="pokedex-card__name">
                  {known ? KANTO_NAMES[id] : '???'}
                </span>
                {caught && <span className="pokedex-card__caught-star">⭐</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
