import { useEffect, useState } from 'react'
import { useTrainer } from '../store'
import { KANTO_NAMES, KANTO_TOTAL, spriteUrl } from '../data/pokedex'
import { speciesSources, describeSource, unseenHint } from '../utils/pokedexHints'
import './PokedexScreen.css'

interface Props {
  onBack: () => void
}

export default function PokedexScreen({ onBack }: Props) {
  const trainer = useTrainer()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const caughtCount = Object.values(trainer.pokedex).filter(e => e.caught).length
  const seenCount   = Object.values(trainer.pokedex).filter(e => e.seen).length

  const ids = Array.from({ length: KANTO_TOTAL }, (_, i) => i + 1)

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

      {/* ── Grid ── */}
      <div className="pokedex-grid">
        {ids.map(id => {
          const entry  = trainer.pokedex[id]
          const caught = entry?.caught ?? false
          const seen   = entry?.seen   ?? false
          const known  = seen || caught
          const status = caught ? 'caught' : seen ? 'seen' : 'unknown'

          return (
            <button
              key={id}
              className={`pokedex-card pokedex-card--${status}`}
              onClick={() => setSelectedId(id)}
              title="Where to find it"
            >
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
            </button>
          )
        })}
      </div>

      {selectedId !== null && <PokedexDetail speciesId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}

/** One species: its sprite, and where to find it (a gentler hint if it hasn't been seen yet) */
function PokedexDetail({ speciesId, onClose }: { speciesId: number; onClose: () => void }) {
  const trainer = useTrainer()
  const entry = trainer.pokedex[speciesId]
  const known = !!(entry?.seen || entry?.caught)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="pokedex-detail-overlay" onClick={onClose}>
      <div className="pokedex-detail" onClick={e => e.stopPropagation()}>
        <div className="pokedex-detail__header">
          <img
            className={`pokedex-detail__sprite${known ? '' : ' pokedex-card__sprite--silhouette'}`}
            src={spriteUrl(speciesId)}
            alt=""
          />
          <div>
            <p className="pokedex-detail__number">#{String(speciesId).padStart(3, '0')}</p>
            <h2 className="pokedex-detail__name">{known ? KANTO_NAMES[speciesId] : '???'}</h2>
            <p className="pokedex-detail__status">
              {entry?.caught ? '⭐ Caught' : entry?.seen ? '👁 Seen, not caught yet' : 'Not seen yet'}
            </p>
          </div>
        </div>

        {known ? (
          <>
            <h3 className="pokedex-detail__heading">Where to find it</h3>
            <ul className="pokedex-detail__sources">
              {speciesSources(speciesId).map((source, i) => <li key={i}>{describeSource(source)}</li>)}
            </ul>
          </>
        ) : (
          <p className="pokedex-detail__hint">🧭 {unseenHint(speciesId, trainer)}</p>
        )}

        <button className="btn btn-primary pokedex-detail__close" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
