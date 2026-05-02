import { useEffect, useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import { AREA_MAP } from '../data/areas'
import { preloadAreaSpecies } from '../services/pokeApi'
import type { Area, OwnedPokemon } from '../types'
import './OverworldScreen.css'

interface Props {
  onStartBattle: () => void
  onOpenPokedex: () => void
  onOpenParty: () => void
}

// ---- Sub-components ---------------------------------------------------------

function XpBar({ xp, xpToNextLevel }: { xp: number; xpToNextLevel: number }) {
  const pct = Math.min(100, Math.round((xp / xpToNextLevel) * 100))
  return (
    <div className="xp-bar" title={`${xp} / ${xpToNextLevel} XP`}>
      <div className="xp-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min(100, Math.round((current / max) * 100))
  const cls = pct > 50 ? 'hp-bar__fill--green' : pct > 20 ? 'hp-bar__fill--yellow' : 'hp-bar__fill--red'
  return (
    <div className="hp-bar">
      <div className={`hp-bar__fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function PartyMember({ pokemon }: { pokemon: OwnedPokemon }) {
  const fainted = pokemon.currentHp === 0
  return (
    <div className={`party-member ${fainted ? 'party-member--fainted' : ''}`}>
      <div className="party-member__info">
        <span className="party-member__name">{pokemon.name}</span>
        <span className="party-member__level">Lv.{pokemon.level}</span>
      </div>
      {fainted
        ? <span className="party-member__fainted-label">Fainted</span>
        : (
          <>
            <HpBar current={pokemon.currentHp} max={pokemon.maxHp} />
            <span className="party-member__hp-text">
              {pokemon.currentHp} / {pokemon.maxHp}
            </span>
          </>
        )
      }
    </div>
  )
}

// ---- Nurse Joy SVG avatar ---------------------------------------------------

function NurseJoy() {
  return (
    <svg viewBox="0 0 80 92" width="88" height="88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Hair buns (drawn first — sit behind head) */}
      <ellipse cx="11" cy="55" rx="12" ry="15" fill="#f0809a"/>
      <ellipse cx="69" cy="55" rx="12" ry="15" fill="#f0809a"/>

      {/* Head */}
      <ellipse cx="40" cy="54" rx="19" ry="21" fill="#fcd5a8"/>

      {/* Nurse cap — brim + top block */}
      <rect x="19" y="28" width="42" height="9" rx="2" fill="white"/>
      <rect x="27" y="13" width="26" height="19" rx="4" fill="white"/>

      {/* Cross on cap */}
      <rect x="34.5" y="20" width="11" height="3.5" rx="1.5" fill="#e63946"/>
      <rect x="38" y="16.5" width="4" height="10" rx="1.5" fill="#e63946"/>

      {/* Blush */}
      <ellipse cx="27" cy="58" rx="5.5" ry="3" fill="#f5a0b5" opacity="0.65"/>
      <ellipse cx="53" cy="58" rx="5.5" ry="3" fill="#f5a0b5" opacity="0.65"/>

      {/* Eyes */}
      <ellipse cx="32.5" cy="51" rx="3" ry="3.5" fill="#2a1818"/>
      <ellipse cx="47.5" cy="51" rx="3" ry="3.5" fill="#2a1818"/>
      <circle cx="33.8" cy="49.6" r="1.1" fill="white"/>
      <circle cx="48.8" cy="49.6" r="1.1" fill="white"/>

      {/* Smile */}
      <path d="M 33 62 Q 40 68 47 62" stroke="#b06050" strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Uniform body */}
      <rect x="13" y="72" width="54" height="20" rx="9" fill="white"/>

      {/* Pink bow / collar */}
      <path d="M 28 72 Q 40 80 52 72 Q 40 76 28 72Z" fill="#f0809a"/>
    </svg>
  )
}

// ---- Pokémon Center modal ---------------------------------------------------

type CenterPhase = 'prompt' | 'healed'

function PokemonCenterModal({
  phase,
  onHeal,
  onClose,
}: {
  phase: CenterPhase
  onHeal: () => void
  onClose: () => void
}) {
  const trainer = useTrainer()
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

// ---- Main screen ------------------------------------------------------------

export default function OverworldScreen({ onStartBattle, onOpenPokedex, onOpenParty }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()
  const [centerPhase, setCenterPhase] = useState<CenterPhase | null>(null)

  const currentArea: Area = AREA_MAP[trainer.currentAreaId]

  // Preload species for the current area so battles start instantly
  useEffect(() => {
    const ids = currentArea.encounters.map(e => e.speciesId)
    preloadAreaSpecies(ids)
  }, [currentArea.id])

  function handleTravel(area: Area) {
    dispatch({ type: 'UNLOCK_AREA', payload: { areaId: area.id } })
    dispatch({ type: 'SET_CURRENT_AREA', payload: { areaId: area.id } })
  }

  function handleHeal() {
    dispatch({ type: 'HEAL_PARTY' })
    setCenterPhase('healed')
    setTimeout(() => setCenterPhase(null), 2200)
  }

  const partyHasLiveMember = trainer.party.some(p => p.currentHp > 0)

  return (
    <div className="overworld">

      {/* ── Trainer header ── */}
      <header className="trainer-bar">
        <div className="trainer-bar__name">{trainer.name}</div>
        <div className="trainer-bar__level">Lv.{trainer.level} Trainer</div>
        <button className="btn btn-secondary pokedex-btn" onClick={onOpenPokedex}>
          📖 Pokédex
        </button>
        <div className="trainer-bar__xp">
          <XpBar xp={trainer.xp} xpToNextLevel={trainer.xpToNextLevel} />
          <span className="trainer-bar__xp-label">
            {trainer.xp} / {trainer.xpToNextLevel} XP
          </span>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="overworld__main">

        {/* Area panel */}
        <section className="area-panel">
          <h2 className="area-panel__name">{currentArea.name}</h2>
          <p className="area-panel__desc">{currentArea.description}</p>
          <div className="area-panel__badge">
            {currentArea.encounters.length} wild Pokémon types here
          </div>
          <button
            className="btn btn-battle"
            onClick={onStartBattle}
            disabled={!partyHasLiveMember}
            title={!partyHasLiveMember ? 'All your Pokémon have fainted!' : undefined}
          >
            ⚔ Battle!
          </button>
          <button className="btn btn-pokecenter" onClick={() => setCenterPhase('prompt')}>
            🏥 Pokémon Center
          </button>
          {!partyHasLiveMember && (
            <p className="area-panel__blackout-warning">
              All Pokémon fainted — visit the Pokémon Center!
            </p>
          )}
        </section>

        {/* Party panel */}
        <section className="party-panel">
          <div className="party-panel__header">
            <h3 className="party-panel__title">Your Party</h3>
            <button className="btn party-manage-btn" onClick={onOpenParty}>
              ⚙ Manage
            </button>
          </div>
          <div className="party-panel__list">
            {trainer.party.map(p => (
              <PartyMember key={p.uid} pokemon={p} />
            ))}
          </div>
        </section>
      </main>

      {/* ── Travel footer ── */}
      <footer className="travel-bar">
        <span className="travel-bar__label">Travel to:</span>
        <div className="travel-bar__buttons">
          {currentArea.connectedAreaIds.map(areaId => {
            const area = AREA_MAP[areaId]
            if (!area) return null
            const canTravel = trainer.level >= area.requiredTrainerLevel
            return (
              <button
                key={areaId}
                className={`btn travel-btn ${canTravel ? 'travel-btn--open' : 'travel-btn--locked'}`}
                onClick={() => canTravel && handleTravel(area)}
                disabled={!canTravel}
                title={!canTravel ? `Reach Lv.${area.requiredTrainerLevel} to travel here` : undefined}
              >
                {area.name}
                {!canTravel && (
                  <span className="travel-btn__lock"> (Lv.{area.requiredTrainerLevel})</span>
                )}
              </button>
            )
          })}
        </div>
      </footer>

      {/* ── Pokémon Center modal ── */}
      {centerPhase && (
        <PokemonCenterModal
          phase={centerPhase}
          onHeal={handleHeal}
          onClose={() => setCenterPhase(null)}
        />
      )}
    </div>
  )
}
