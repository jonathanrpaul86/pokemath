import { useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import type { BadgeId, InventorySlot } from '../types'
import { ITEM_MAP, BALL_EMOJI, ITEM_EMOJI, BADGE_META } from '../data/items'
import './BagScreen.css'

interface Props {
  onBack: () => void
}

type BagTab = 'items' | 'balls' | 'key-items' | 'badges'

const ALL_BADGES: BadgeId[] = [
  'boulder-badge', 'cascade-badge', 'thunder-badge', 'rainbow-badge',
  'soul-badge',    'marsh-badge',   'volcano-badge',  'earth-badge',
]

function itemEmoji(itemId: string): string {
  return BALL_EMOJI[itemId] ?? ITEM_EMOJI[itemId] ?? '📦'
}

// ---- Party picker (for using healing items) ---------------------------------

function PartyPicker({
  itemId,
  onUse,
  onCancel,
}: {
  itemId: string
  onUse: (uid: string) => void
  onCancel: () => void
}) {
  const trainer = useTrainer()
  const def = ITEM_MAP[itemId]
  const healFull = def?.healAmount === 0

  return (
    <div className="bag-picker">
      <p className="bag-picker__prompt">Use {def?.name} on which Pokémon?</p>
      <div className="bag-picker__list">
        {trainer.party.map(p => {
          const fainted = p.currentHp === 0
          const alreadyFull = p.currentHp === p.maxHp
          const disabled = fainted || alreadyFull
          return (
            <button
              key={p.uid}
              className={`bag-picker__member${disabled ? ' bag-picker__member--disabled' : ''}`}
              onClick={() => !disabled && onUse(p.uid)}
              disabled={disabled}
            >
              <span className="bag-picker__name">{p.name}</span>
              <span className="bag-picker__hp">
                {fainted ? 'Fainted' : `${p.currentHp}/${p.maxHp} HP${alreadyFull ? ' (full)' : ''}`}
              </span>
              {!fainted && !alreadyFull && (
                <span className="bag-picker__gain">
                  +{healFull ? (p.maxHp - p.currentHp) : Math.min(def!.healAmount!, p.maxHp - p.currentHp)} HP
                </span>
              )}
            </button>
          )
        })}
      </div>
      <button className="btn btn-secondary bag-picker__cancel" onClick={onCancel}>Cancel</button>
    </div>
  )
}

// ---- Item row ---------------------------------------------------------------

function ItemRow({ slot, onUseClick }: { slot: InventorySlot; onUseClick: (itemId: string) => void }) {
  const def = ITEM_MAP[slot.itemId]
  if (!def) return null
  const canUse = def.pocket === 'item' && def.healAmount !== undefined
  return (
    <div className="bag-row">
      <span className="bag-row__icon">{itemEmoji(slot.itemId)}</span>
      <div className="bag-row__info">
        <span className="bag-row__name">{def.name}</span>
        <span className="bag-row__desc">{def.description}</span>
      </div>
      <span className="bag-row__qty">×{slot.quantity}</span>
      {canUse && (
        <button className="btn bag-row__use" onClick={() => onUseClick(slot.itemId)}>
          Use
        </button>
      )}
    </div>
  )
}

// ---- Main screen ------------------------------------------------------------

export default function BagScreen({ onBack }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()
  const [tab, setTab] = useState<BagTab>('items')
  const [usingItemId, setUsingItemId] = useState<string | null>(null)

  function handleUse(itemId: string, targetUid: string) {
    const def = ITEM_MAP[itemId]
    if (!def) return
    const pokemon = trainer.party.find(p => p.uid === targetUid)
    if (!pokemon) return

    const healAmount = def.healAmount === 0
      ? pokemon.maxHp - pokemon.currentHp
      : (def.healAmount ?? 0)
    const newHp = Math.min(pokemon.maxHp, pokemon.currentHp + healAmount)

    dispatch({ type: 'REMOVE_ITEM', payload: { itemId, quantity: 1 } })
    dispatch({ type: 'UPDATE_POKEMON_HP', payload: { uid: targetUid, currentHp: newHp } })
    setUsingItemId(null)
  }

  const tabs: { id: BagTab; label: string }[] = [
    { id: 'items',     label: 'Items'     },
    { id: 'balls',     label: 'Balls'     },
    { id: 'key-items', label: 'Key Items' },
    { id: 'badges',    label: 'Badges'    },
  ]

  const slotsByTab: Record<BagTab, InventorySlot[]> = {
    'items':     trainer.items,
    'balls':     trainer.balls,
    'key-items': trainer.keyItems,
    'badges':    [],
  }
  const activeSlots = slotsByTab[tab]

  return (
    <div className="bag">

      {/* ── Header ── */}
      <header className="bag-header">
        <button className="btn btn-secondary bag-back" onClick={onBack}>← Back</button>
        <h1 className="bag-title">🎒 Bag</h1>
        <span className="bag-money">💰 ¥{trainer.money.toLocaleString()}</span>
      </header>

      {/* ── Tab bar ── */}
      <nav className="bag-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`bag-tab${tab === t.id ? ' bag-tab--active' : ''}`}
            onClick={() => { setTab(t.id); setUsingItemId(null) }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main className="bag-content">
        {usingItemId ? (
          <PartyPicker
            itemId={usingItemId}
            onUse={(uid) => handleUse(usingItemId, uid)}
            onCancel={() => setUsingItemId(null)}
          />
        ) : tab === 'badges' ? (
          <div className="bag-badges">
            {ALL_BADGES.map(id => {
              const meta = BADGE_META[id]
              const earned = trainer.badges.includes(id)
              return (
                <div key={id} className={`badge-slot${earned ? ' badge-slot--earned' : ''}`}>
                  <span className="badge-slot__emoji">{earned ? meta.emoji : '?'}</span>
                  <span className="badge-slot__name">{meta.name}</span>
                </div>
              )
            })}
          </div>
        ) : activeSlots.length === 0 ? (
          <p className="bag-empty">
            {tab === 'balls'
              ? 'No Poké Balls — buy some at a Poké Mart!'
              : tab === 'key-items'
              ? 'No key items yet.'
              : 'No items yet — buy some at a Poké Mart!'}
          </p>
        ) : (
          <div className="bag-list">
            {activeSlots.map(slot => (
              <ItemRow
                key={slot.itemId}
                slot={slot}
                onUseClick={setUsingItemId}
              />
            ))}
            {tab === 'balls' && (
              <p className="bag-balls-hint">Balls can only be used during battle.</p>
            )}
            {tab === 'key-items' && (
              <p className="bag-balls-hint">Key items are used automatically.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
