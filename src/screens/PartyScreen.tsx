import { useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import { spriteUrl } from '../data/pokedex'
import type { OwnedPokemon, PokemonType } from '../types'
import './PartyScreen.css'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const TYPE_COLORS: Record<PokemonType, string> = {
  normal:   '#a8a878', fire:     '#f08030', water:    '#6890f0',
  electric: '#f8d030', grass:    '#78c850', ice:      '#98d8d8',
  fighting: '#c03028', poison:   '#a040a0', ground:   '#e0c068',
  flying:   '#a890f0', psychic:  '#f85888', bug:      '#a8b820',
  rock:     '#b8a038', ghost:    '#705898', dragon:   '#7038f8',
}

function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span className="pm-type-badge" style={{ background: TYPE_COLORS[type] }}>
      {capitalize(type)}
    </span>
  )
}

function XpBar({ xp, max }: { xp: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((xp / max) * 100)) : 0
  return (
    <div className="pm-xp-bar">
      <div className="pm-xp-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

function PokemonDetail({ pokemon }: { pokemon: OwnedPokemon | null }) {
  if (!pokemon) {
    return (
      <div className="pm-detail pm-detail--empty">
        <p>Select a Pokémon to see its status</p>
      </div>
    )
  }

  const { stats, xp, xpToNextLevel, currentHp, maxHp, level, caughtAt } = pokemon
  const moves = pokemon.moves ?? []
  const hpPct = maxHp > 0 ? Math.min(100, Math.round((currentHp / maxHp) * 100)) : 0
  const hpColor = hpPct > 50 ? 'green' : hpPct > 20 ? 'yellow' : 'red'
  const caughtDate = new Date(caughtAt).toLocaleDateString()

  return (
    <div className="pm-detail">
      <div className="pm-detail__sprite-wrap">
        <img
          className="pm-detail__sprite"
          src={spriteUrl(pokemon.speciesId)}
          alt={pokemon.name}
        />
      </div>

      <h3 className="pm-detail__name">{capitalize(pokemon.name)}</h3>
      <p className="pm-detail__level">Level {level}</p>

      <section className="pm-detail__section">
        <h4 className="pm-detail__section-title">HP</h4>
        <div className="pm-hp-bar" style={{ maxWidth: '100%' }}>
          <div className={`pm-hp-bar__fill pm-hp-bar__fill--${hpColor}`} style={{ width: `${hpPct}%` }} />
        </div>
        <p className="pm-detail__stat-text">{currentHp} / {maxHp}</p>
      </section>

      <section className="pm-detail__section">
        <h4 className="pm-detail__section-title">Experience</h4>
        <XpBar xp={xp} max={xpToNextLevel} />
        <p className="pm-detail__stat-text">{xp} / {xpToNextLevel} XP</p>
      </section>

      <section className="pm-detail__section">
        <h4 className="pm-detail__section-title">Stats</h4>
        <div className="pm-stat-grid">
          <span className="pm-stat__label">ATK</span><span className="pm-stat__val">{stats.attack}</span>
          <span className="pm-stat__label">DEF</span><span className="pm-stat__val">{stats.defense}</span>
          <span className="pm-stat__label">SP.ATK</span><span className="pm-stat__val">{stats.specialAttack}</span>
          <span className="pm-stat__label">SP.DEF</span><span className="pm-stat__val">{stats.specialDefense}</span>
          <span className="pm-stat__label">SPD</span><span className="pm-stat__val">{stats.speed}</span>
        </div>
      </section>

      <section className="pm-detail__section">
        <h4 className="pm-detail__section-title">Moves</h4>
        {moves.length === 0 ? (
          <p className="pm-detail__none">No moves recorded</p>
        ) : (
          <ul className="pm-move-list">
            {moves.map(m => (
              <li key={m.id} className="pm-move">
                <span className="pm-move__name">{capitalize(m.name.replace('-', ' '))}</span>
                <TypeBadge type={m.type} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="pm-detail__caught">Caught {caughtDate}</p>
    </div>
  )
}

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

  const selectedPartyIdx = selection?.location === 'party'
    ? trainer.party.findIndex(p => p.uid === selection.uid)
    : -1
  const selectedPcIdx = selection?.location === 'pc'
    ? trainer.pc.findIndex(p => p.uid === selection.uid)
    : -1

  function handleReorder(direction: 'up' | 'down') {
    if (!selection) return
    if (selection.location === 'party') {
      dispatch({ type: 'REORDER_PARTY', payload: { uid: selection.uid, direction } })
    } else {
      dispatch({ type: 'REORDER_PC', payload: { uid: selection.uid, direction } })
    }
  }

  const selectedPokemon = selection
    ? (selection.location === 'party'
        ? trainer.party.find(p => p.uid === selection.uid)
        : trainer.pc.find(p => p.uid === selection.uid)) ?? null
    : null

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

      {/* ── Three-panel body ── */}
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

        {/* Detail panel */}
        <PokemonDetail pokemon={selectedPokemon} />
      </div>

      {/* ── Action bar ── */}
      <footer className="pm-action-bar">
        {!selection && (
          <p className="pm-action-bar__hint">Tap a Pokémon to select it, then move it</p>
        )}

        {selection?.location === 'party' && (
          <div className="pm-action-bar__row">
            <span className="pm-action-bar__label">
              {capitalize(trainer.party.find(p => p.uid === selection.uid)?.name ?? '')} selected
            </span>
            <div className="pm-action-bar__reorder">
              <button
                className="btn btn-secondary pm-reorder-btn"
                onClick={() => handleReorder('up')}
                disabled={selectedPartyIdx <= 0}
                title="Move up"
              >↑</button>
              <button
                className="btn btn-secondary pm-reorder-btn"
                onClick={() => handleReorder('down')}
                disabled={selectedPartyIdx >= trainer.party.length - 1}
                title="Move down"
              >↓</button>
            </div>
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
              {capitalize(trainer.pc.find(p => p.uid === selection.uid)?.name ?? '')} selected
            </span>
            <div className="pm-action-bar__reorder">
              <button
                className="btn btn-secondary pm-reorder-btn"
                onClick={() => handleReorder('up')}
                disabled={selectedPcIdx <= 0}
                title="Move up"
              >↑</button>
              <button
                className="btn btn-secondary pm-reorder-btn"
                onClick={() => handleReorder('down')}
                disabled={selectedPcIdx >= trainer.pc.length - 1}
                title="Move down"
              >↓</button>
            </div>
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
