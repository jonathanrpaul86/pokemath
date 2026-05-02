import { useTrainer } from '../store'
import { KANTO_NAMES, KANTO_TOTAL, spriteUrl } from '../data/pokedex'
import './PokedexScreen.css'

interface Props {
  onBack: () => void
}

export default function PokedexScreen({ onBack }: Props) {
  const trainer = useTrainer()

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
    </div>
  )
}
