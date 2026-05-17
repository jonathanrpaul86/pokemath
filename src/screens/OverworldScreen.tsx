import { useEffect, useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import { isMuted, setMuted } from '../utils/sound'
import { AREA_MAP, KANTO_AREAS } from '../data/areas'
import { KANTO_NAMES } from '../data/pokedex'
import { preloadAreaSpecies } from '../services/pokeApi'
import { WorldMapCanvas } from '../components/WorldMapCanvas'
import type { Area, OwnedPokemon, EncounterEntry } from '../types'
import './OverworldScreen.css'

interface Props {
  onStartBattle: () => void
  onOpenPokedex: () => void
  onOpenParty: () => void
  onOpenProfile: () => void
  onOpenBag: () => void
  onGoToTitle: () => void
}

// ---- Pokédex icon -----------------------------------------------------------

function PokedexIcon() {
  return (
    <svg viewBox="0 0 22 30" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
      {/* Body */}
      <rect x="1" y="1" width="20" height="28" rx="3" fill="#cc1a1a" />
      {/* Screen area */}
      <rect x="3.5" y="3.5" width="15" height="11" rx="2" fill="#111" />
      {/* Screen glow */}
      <rect x="4.5" y="4.5" width="13" height="9" rx="1.5" fill="#1a2a3a" />
      {/* Indicator light */}
      <circle cx="6.5" cy="18" r="2" fill="#44ee66" />
      {/* Button row */}
      <rect x="3.5" y="22" width="4.5" height="3" rx="1" fill="#fff3" />
      <rect x="9" y="22" width="4.5" height="3" rx="1" fill="#fff3" />
      <rect x="14.5" y="22" width="4" height="3" rx="1" fill="#fff3" />
      {/* D-pad stub */}
      <rect x="11" y="17" width="7" height="2" rx="1" fill="#fff2" />
      <rect x="13.5" y="15" width="2" height="6" rx="1" fill="#fff2" />
    </svg>
  )
}

// ---- Sub-components ---------------------------------------------------------

function XpBar({ xp, xpToNextLevel, pokemon }: { xp: number; xpToNextLevel: number; pokemon?: boolean }) {
  const pct = Math.min(100, Math.round((xp / xpToNextLevel) * 100))
  return (
    <div className={`xp-bar${pokemon ? ' xp-bar--pokemon' : ''}`} title={`${xp} / ${xpToNextLevel} XP`}>
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
      <XpBar xp={pokemon.xp} xpToNextLevel={pokemon.xpToNextLevel} pokemon />
    </div>
  )
}

// ---- Encounter preview ------------------------------------------------------

function EncounterPreview({ encounters }: { encounters: EncounterEntry[] }) {
  const trainer = useTrainer()
  return (
    <div className="encounter-preview">
      <div className="encounter-preview__label">Wild Pokémon</div>
      <div className="encounter-preview__grid">
        {encounters.map(e => {
          const seen = trainer.pokedex[e.speciesId]?.seen ?? false
          return (
            <div key={e.speciesId} className={`encounter-sprite${seen ? '' : ' encounter-sprite--unseen'}`}>
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${e.speciesId}.png`}
                alt={seen ? (KANTO_NAMES[e.speciesId] ?? `#${e.speciesId}`) : '???'}
                className={`encounter-sprite__img${seen ? '' : ' encounter-sprite__img--silhouette'}`}
              />
              <span className="encounter-sprite__name">
                {seen ? (KANTO_NAMES[e.speciesId] ?? `#${e.speciesId}`) : '???'}
              </span>
              {seen && (
                <span className="encounter-sprite__levels">Lv.{e.minLevel}–{e.maxLevel}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

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

export default function OverworldScreen({ onStartBattle, onOpenPokedex, onOpenParty, onOpenProfile, onOpenBag, onGoToTitle }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()
  const [centerPhase, setCenterPhase] = useState<CenterPhase | null>(null)
  const [muted, setMutedState] = useState(isMuted())
  // Which area is shown in the side panel (defaults to current, updates on hover/click)
  const [selectedAreaId, setSelectedAreaId] = useState(trainer.currentAreaId)

  function handleMuteToggle() {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  const currentArea: Area = AREA_MAP[trainer.currentAreaId]
  const selectedArea: Area = AREA_MAP[selectedAreaId] ?? currentArea

  // Keep selectedAreaId pointing at currentAreaId if it drifts (e.g. after travel)
  useEffect(() => {
    setSelectedAreaId(trainer.currentAreaId)
  }, [trainer.currentAreaId])

  // Preload species sprites for current area so battles start instantly
  useEffect(() => {
    const ids = currentArea.encounters.map(e => e.speciesId)
    preloadAreaSpecies(ids)
  }, [currentArea.id])

  function handleTravel(areaId: string) {
    dispatch({ type: 'UNLOCK_AREA', payload: { areaId } })
    dispatch({ type: 'SET_CURRENT_AREA', payload: { areaId } })
  }

  function handleSelectArea(areaId: string | null) {
    setSelectedAreaId(areaId ?? trainer.currentAreaId)
  }

  function handleHeal() {
    dispatch({ type: 'HEAL_PARTY' })
    setCenterPhase('healed')
    setTimeout(() => setCenterPhase(null), 2200)
  }

  const partyHasLiveMember = trainer.party.some(p => p.currentHp > 0)
  const selectedIsCurrent = selectedAreaId === trainer.currentAreaId
  const selectedIsAdjacent = currentArea.connectedAreaIds.includes(selectedAreaId)
  // Undiscovered areas more than 1 hop away are masked as unknown
  const selectedIsUnknown =
    !trainer.unlockedAreaIds.includes(selectedAreaId) &&
    !selectedIsAdjacent &&
    !selectedIsCurrent
  const canTravelToSelected =
    !selectedIsCurrent &&
    selectedIsAdjacent &&
    trainer.level >= selectedArea.requiredTrainerLevel
  const selectedIsLocked = !selectedIsUnknown && trainer.level < selectedArea.requiredTrainerLevel

  return (
    <div className="overworld">

      {/* ── Trainer header ── */}
      <header className="trainer-bar">
        <button className="btn btn-secondary title-btn" onClick={onGoToTitle} title="Title screen">
          🏠
        </button>
        <button className="trainer-bar__name" onClick={onOpenProfile} title="View profile">{trainer.name}</button>
        <div className="trainer-bar__level">Lv.{trainer.level} Trainer</div>
        <button className="btn btn-secondary pokedex-btn" onClick={onOpenPokedex}>
          <PokedexIcon /> Pokédex
        </button>
        <button className="btn btn-secondary bag-btn" onClick={onOpenBag} title="Open Bag">
          🎒 Bag
        </button>
        <span className="trainer-bar__money" title="Pokédollars">💰 ¥{trainer.money.toLocaleString()}</span>
        <button className="btn btn-secondary mute-toggle-btn" onClick={handleMuteToggle} title={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : '🔊'}
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

        {/* Map column */}
        <section className="map-section">
          <WorldMapCanvas
            areas={KANTO_AREAS}
            currentAreaId={trainer.currentAreaId}
            unlockedAreaIds={trainer.unlockedAreaIds}
            trainerLevel={trainer.level}
            selectedAreaId={selectedAreaId}
            onSelectArea={handleSelectArea}
            onTravel={handleTravel}
          />
        </section>

        {/* Side panel */}
        <aside className="side-panel">

          {/* Area detail */}
          <div className="area-detail">
            <h2 className="area-detail__name">{selectedIsUnknown ? '???' : selectedArea.name}</h2>
            <p className="area-detail__desc">
              {selectedIsUnknown
                ? 'An unexplored area hidden beyond the horizon...'
                : selectedArea.description}
            </p>

            {selectedIsLocked && (
              <p className="area-detail__locked-hint">
                🔒 Reach Lv.{selectedArea.requiredTrainerLevel} to travel here
              </p>
            )}

            <div className="area-detail__actions">
              {selectedIsCurrent && (
                <>
                  {selectedArea.areaType !== 'city' && selectedArea.areaType !== 'town' && (
                    <button
                      className="btn btn-battle"
                      onClick={onStartBattle}
                      disabled={!partyHasLiveMember}
                      title={!partyHasLiveMember ? 'All your Pokémon have fainted!' : undefined}
                    >
                      ⚔ Battle!
                    </button>
                  )}
                  {(selectedArea.areaType === 'city' || selectedArea.areaType === 'town') && (
                    <button className="btn btn-pokecenter" onClick={() => setCenterPhase('prompt')}>
                      🏥 Pokémon Center
                    </button>
                  )}
                  {!partyHasLiveMember && selectedArea.areaType !== 'city' && selectedArea.areaType !== 'town' && (
                    <p className="area-detail__blackout-warning">
                      All Pokémon fainted — visit the Pokémon Center!
                    </p>
                  )}
                </>
              )}
              {canTravelToSelected && (
                <button className="btn btn-travel-here" onClick={() => handleTravel(selectedAreaId)}>
                  ➜ Go to {selectedArea.name}
                </button>
              )}
            </div>

            {!selectedIsUnknown && selectedArea.encounters.length > 0 && (
              <EncounterPreview encounters={selectedArea.encounters} />
            )}
          </div>

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
        </aside>
      </main>

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
