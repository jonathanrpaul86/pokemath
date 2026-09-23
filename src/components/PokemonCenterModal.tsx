import { useEffect, useState } from 'react'
import { useTrainer, useGameStore } from '../store'

// ---- Nurse Joy SVG avatar ---------------------------------------------------

function NurseJoy() {
  return (
    <svg viewBox="0 0 80 92" width="88" height="88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="11" cy="55" rx="12" ry="15" fill="#f0809a"/>
      <ellipse cx="69" cy="55" rx="12" ry="15" fill="#f0809a"/>
      <ellipse cx="40" cy="54" rx="19" ry="21" fill="#fcd5a8"/>
      <rect x="19" y="28" width="42" height="9" rx="2" fill="white"/>
      <rect x="27" y="13" width="26" height="19" rx="4" fill="white"/>
      <rect x="34.5" y="20" width="11" height="3.5" rx="1.5" fill="#e63946"/>
      <rect x="38" y="16.5" width="4" height="10" rx="1.5" fill="#e63946"/>
      <ellipse cx="27" cy="58" rx="5.5" ry="3" fill="#f5a0b5" opacity="0.65"/>
      <ellipse cx="53" cy="58" rx="5.5" ry="3" fill="#f5a0b5" opacity="0.65"/>
      <ellipse cx="32.5" cy="51" rx="3" ry="3.5" fill="#2a1818"/>
      <ellipse cx="47.5" cy="51" rx="3" ry="3.5" fill="#2a1818"/>
      <circle cx="33.8" cy="49.6" r="1.1" fill="white"/>
      <circle cx="48.8" cy="49.6" r="1.1" fill="white"/>
      <path d="M 33 62 Q 40 68 47 62" stroke="#b06050" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="13" y="72" width="54" height="20" rx="9" fill="white"/>
      <path d="M 28 72 Q 40 80 52 72 Q 40 76 28 72Z" fill="#f0809a"/>
    </svg>
  )
}

// ---- Pokémon Center modal ---------------------------------------------------

export default function PokemonCenterModal({ onClose }: { onClose: () => void }) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()
  const [phase, setPhase] = useState<'prompt' | 'healed'>('prompt')

  // Close automatically a moment after healing
  useEffect(() => {
    if (phase !== 'healed') return
    const t = setTimeout(onClose, 2200)
    return () => clearTimeout(t)
  }, [phase, onClose])

  function onHeal() {
    dispatch({ type: 'HEAL_PARTY' })
    setPhase('healed')
  }
  const allHealthy = trainer.party.every(p => p.currentHp === p.maxHp)

  return (
    <div className="pc-overlay" onClick={phase === 'healed' ? onClose : undefined}>
      <div className="pc-modal" onClick={e => e.stopPropagation()}>
        <div className="pc-modal__nurse">
          <NurseJoy />
          {phase === 'prompt' ? (
            <>
              <p className="pc-modal__speech">
                {allHealthy
                  ? 'Your Pokémon are already in great shape!'
                  : 'Welcome to the Pokémon Center! Shall I heal your Pokémon?'}
              </p>
              <div className="pc-modal__party">
                {trainer.party.map(p => {
                  const pct = Math.round((p.currentHp / p.maxHp) * 100)
                  const mod = pct > 50 ? 'green' : pct > 20 ? 'yellow' : 'red'
                  const fainted = p.currentHp === 0
                  return (
                    <div key={p.uid} className={`pc-pkmn ${fainted ? 'pc-pkmn--fainted' : ''}`}>
                      <span className="pc-pkmn__name">{p.name}</span>
                      <div className="pc-pkmn__bar-wrap">
                        <div className="pc-pkmn__bar">
                          <div
                            className={`pc-pkmn__bar-fill pc-pkmn__bar-fill--${mod}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="pc-pkmn__hp">
                          {fainted ? 'Fainted' : `${p.currentHp}/${p.maxHp}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="pc-modal__actions">
                <button className="btn pc-modal__heal-btn" onClick={onHeal}>
                  {allHealthy ? 'OK!' : '✨ Yes, heal them!'}
                </button>
                {!allHealthy && (
                  <button className="btn btn-secondary pc-modal__no-btn" onClick={onClose}>
                    No thanks
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="pc-modal__healed">
              <p className="pc-modal__speech pc-modal__speech--healed">
                ✨ Your Pokémon are fully healed! ✨
              </p>
              <p className="pc-modal__subtext">Come back any time!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
