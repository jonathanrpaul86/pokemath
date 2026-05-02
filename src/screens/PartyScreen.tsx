import { useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import { spriteUrl } from '../data/pokedex'
import type { OwnedPokemon } from '../types'
import './PartyScreen.css'

interface Props {
  onBack: () => void
}

type Selection = { uid: string; location: 'party' | 'pc' } | null

// ---- Sub-components ---------------------------------------------------------

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min(100, Math.round((current / max) * 100))
  const mod = pct > 50 ? 'green' : pct > 20 ? 'yellow' : 'red'
  return (
    <div className="pm-hp-bar">
      <div className={`pm-hp-bar__fill pm-hp-bar__fill--${mod}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function PokemonCard({
  pokemon,
  selected,
  onClick,
}: {
  pokemon: OwnedPokemon
  selected: boolean
  onClick: () => void
}) {
  const fainted = pokemon.currentHp === 0
  return (
    <button
      className={`pm-card${selected ? ' pm-card--selected' : ''}${fainted ? ' pm-card--fainted' : ''}`}
      onClick={onClick}
    >
      <img
        className="pm-card__sprite"
        src={spriteUrl(pokemon.speciesId)}
        alt={pokemon.name}
        loading="lazy"
      />
      <div className="pm-card__info">
        <span className="pm-card__name">{pokemon.name}</span>
        <span className="pm-card__level">Lv.{pokemon.level}</span>
        {!fainted && <HpBar current={pokemon.currentHp} max={pokemon.maxHp} />}
        <span className="pm-card__hp-text">
          {fainted ? 'Fainted' : `${pokemon.currentHp} / ${pokemon.maxHp} HP`}
        </span>
      </div>
    </button>
  )
}

// ---- Main screen ------------------------------------------------------------

export default function PartyScreen({ onBack }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()
  const [selection, setSelection] = useState<Selection>(null)

  function handleSelect(uid: string, location: 'party' | 'pc') {
    setSelection(prev => (prev?.uid === uid ? null : { uid, location }))
  }

  function handleSendToPC() {
    if (!selection) return
    dispatch({ type: 'MOVE_TO_PC', payload: { uid: selection.uid } })
    setSelection(null)
  }

  function handleAddToParty() {
    if (!selection) return
    dispatch({ type: 'MOVE_TO_PARTY', payload: { uid: selection.uid } })
    setSelection(null)
  }

  const partyFull = trainer.party.length >= 6
  const partyIsOne = trainer.party.length <= 1

  return (
    <div className="party-screen">

      {/* ── Header ── */}
      <header className="pm-header">
        <button className="btn btn-secondary pm-back" onClick={onBack}>
          ← Back
        </button>
        <h2 className="pm-title">Manage Pokémon</h2>
        <div className="pm-counts">
          <span className="pm-counts__party">Party: {trainer.party.length}/6</span>
          <span className="pm-counts__pc">PC: {trainer.pc.length}</span>
        </div>
      </header>

      {/* ── Two-panel body ── */}
      <div className="pm-body">

        {/* Party panel */}
        <section className="pm-panel pm-panel--party">
          <h3 className="pm-panel__title">Your Party</h3>
          <div className="pm-panel__list">
            {trainer.party.map(p => (
              <PokemonCard
                key={p.uid}
                pokemon={p}
                selected={selection?.uid === p.uid}
                onClick={() => handleSelect(p.uid, 'party')}
              />
            ))}
            {Array.from({ length: 6 - trainer.party.length }).map((_, i) => (
              <div key={`empty-${i}`} className="pm-card pm-card--empty">
                <span className="pm-card__empty-label">Empty slot</span>
              </div>
            ))}
          </div>
        </section>

        {/* PC panel */}
        <section className="pm-panel pm-panel--pc">
          <h3 className="pm-panel__title">PC Box ({trainer.pc.length})</h3>
          {trainer.pc.length === 0 ? (
            <p className="pm-panel__empty">
              Catch more Pokémon to fill the PC!
            </p>
          ) : (
            <div className="pm-panel__list">
              {trainer.pc.map(p => (
                <PokemonCard
                  key={p.uid}
                  pokemon={p}
                  selected={selection?.uid === p.uid}
                  onClick={() => handleSelect(p.uid, 'pc')}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Action bar ── */}
      <footer className="pm-action-bar">
        {!selection && (
          <p className="pm-action-bar__hint">Tap a Pokémon to select it, then move it</p>
        )}

        {selection?.location === 'party' && (
          <div className="pm-action-bar__row">
            <span className="pm-action-bar__label">
              {trainer.party.find(p => p.uid === selection.uid)?.name} selected
            </span>
            <button
              className="btn btn-secondary"
              onClick={handleSendToPC}
              disabled={partyIsOne}
              title={partyIsOne ? "Can't deposit your last Pokémon!" : undefined}
            >
              Send to PC →
            </button>
            {partyIsOne && (
              <span className="pm-action-bar__warning">Need at least 1 Pokémon in party</span>
            )}
          </div>
        )}

        {selection?.location === 'pc' && (
          <div className="pm-action-bar__row">
            <span className="pm-action-bar__label">
              {trainer.pc.find(p => p.uid === selection.uid)?.name} selected
            </span>
            <button
              className="btn btn-primary"
              onClick={handleAddToParty}
              disabled={partyFull}
              title={partyFull ? 'Party is full! (6/6)' : undefined}
            >
              ← Add to Party
            </button>
            {partyFull && (
              <span className="pm-action-bar__warning">Party is full — send one to PC first</span>
            )}
          </div>
        )}
      </footer>
    </div>
  )
}
