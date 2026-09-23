import { useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import { ITEM_MAP, ITEM_EMOJI, BALL_EMOJI } from '../data/items'

// ---- Poke Mart modal --------------------------------------------------------

function itemEmoji(itemId: string): string {
  return BALL_EMOJI[itemId] ?? ITEM_EMOJI[itemId] ?? '📦'
}

export default function PokeMartModal({
  martItems,
  onClose,
}: {
  martItems: string[]
  onClose: () => void
}) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')

  function handleBuy(itemId: string) {
    const def = ITEM_MAP[itemId]
    if (!def || trainer.money < def.buyPrice) return
    dispatch({ type: 'SPEND_MONEY', payload: { amount: def.buyPrice } })
    dispatch({ type: 'ADD_ITEM', payload: { itemId, quantity: 1 } })
  }

  function handleSell(itemId: string) {
    const def = ITEM_MAP[itemId]
    if (!def) return
    const sellPrice = Math.floor(def.buyPrice / 2)
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId, quantity: 1 } })
    dispatch({ type: 'GAIN_MONEY', payload: { amount: sellPrice } })
  }

  const allOwnedItems = [
    ...trainer.items,
    ...trainer.balls,
  ].filter(slot => {
    const def = ITEM_MAP[slot.itemId]
    return def && def.buyPrice > 0 && slot.quantity > 0
  })

  return (
    <div className="pc-overlay" onClick={onClose}>
      <div className="pc-modal mart-modal" onClick={e => e.stopPropagation()}>
        <div className="mart-modal__header">
          <span className="mart-modal__title">🛒 Poké Mart</span>
          <span className="mart-modal__money">💰 ¥{trainer.money.toLocaleString()}</span>
          <button className="mart-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="mart-modal__tabs">
          <button
            className={`mart-tab${tab === 'buy' ? ' mart-tab--active' : ''}`}
            onClick={() => setTab('buy')}
          >
            Buy
          </button>
          <button
            className={`mart-tab${tab === 'sell' ? ' mart-tab--active' : ''}`}
            onClick={() => setTab('sell')}
          >
            Sell
          </button>
        </div>

        <div className="mart-modal__list">
          {tab === 'buy' ? (
            martItems.map(itemId => {
              const def = ITEM_MAP[itemId]
              if (!def) return null
              const owned = [
                ...(trainer.items),
                ...(trainer.balls),
              ].find(s => s.itemId === itemId)?.quantity ?? 0
              const canAfford = trainer.money >= def.buyPrice
              return (
                <div key={itemId} className="mart-row">
                  <span className="mart-row__icon">{itemEmoji(itemId)}</span>
                  <div className="mart-row__info">
                    <span className="mart-row__name">{def.name}</span>
                    <span className="mart-row__desc">{def.description}</span>
                  </div>
                  <span className="mart-row__owned">×{owned}</span>
                  <span className="mart-row__price">¥{def.buyPrice.toLocaleString()}</span>
                  <button
                    className="btn mart-row__buy"
                    onClick={() => handleBuy(itemId)}
                    disabled={!canAfford}
                    title={!canAfford ? "Not enough money" : undefined}
                  >
                    Buy
                  </button>
                </div>
              )
            })
          ) : allOwnedItems.length === 0 ? (
            <p className="mart-empty">No items to sell.</p>
          ) : (
            allOwnedItems.map(slot => {
              const def = ITEM_MAP[slot.itemId]
              if (!def) return null
              const sellPrice = Math.floor(def.buyPrice / 2)
              return (
                <div key={slot.itemId} className="mart-row">
                  <span className="mart-row__icon">{itemEmoji(slot.itemId)}</span>
                  <div className="mart-row__info">
                    <span className="mart-row__name">{def.name}</span>
                    <span className="mart-row__desc">Sell value: ¥{sellPrice.toLocaleString()}</span>
                  </div>
                  <span className="mart-row__owned">×{slot.quantity}</span>
                  <span className="mart-row__price">¥{sellPrice.toLocaleString()}</span>
                  <button
                    className="btn mart-row__sell"
                    onClick={() => handleSell(slot.itemId)}
                  >
                    Sell
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
