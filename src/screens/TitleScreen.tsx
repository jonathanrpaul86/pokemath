import { useState } from 'react'
import Logo from '../components/Logo'
import { AREA_MAP } from '../data/areas'
import type { Trainer } from '../types'
import './TitleScreen.css'

interface Props {
  saves: (Trainer | null)[]
  onNewGame: (slot: number) => void
  onPlay: (slot: number) => void
  onDelete: (slot: number) => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function SlotCard({
  slot,
  trainer,
  onNewGame,
  onPlay,
  onDelete,
}: {
  slot: number
  trainer: Trainer | null
  onNewGame: (slot: number) => void
  onPlay: (slot: number) => void
  onDelete: (slot: number) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!trainer) {
    return (
      <div className="slot-card slot-card--empty">
        <div className="slot-card__label">Save {slot + 1}</div>
        <div className="slot-card__empty-text">Empty</div>
        <button className="btn btn-primary" onClick={() => onNewGame(slot)}>
          ▶ New Game
        </button>
      </div>
    )
  }

  const areaName = AREA_MAP[trainer.currentAreaId]?.name ?? trainer.currentAreaId

  return (
    <div className="slot-card slot-card--occupied">
      <div className="slot-card__header">
        <div className="slot-card__label">Save {slot + 1}</div>
        {!confirmDelete && (
          <button
            className="slot-card__delete-btn"
            onClick={() => setConfirmDelete(true)}
            title="Delete save"
            aria-label="Delete save"
          >
            ✕
          </button>
        )}
      </div>

      {confirmDelete ? (
        <div className="slot-card__confirm">
          <p className="slot-card__confirm-text">Delete this save?</p>
          <div className="slot-card__confirm-btns">
            <button className="btn btn-danger" onClick={() => onDelete(slot)}>
              Delete
            </button>
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="slot-card__name">{trainer.name}</div>
          <div className="slot-card__meta">
            <span className="slot-card__level">Lv.{trainer.level}</span>
            <span className="slot-card__area">{areaName}</span>
          </div>
          {trainer.savedAt && (
            <div className="slot-card__date">{formatDate(trainer.savedAt)}</div>
          )}
          <button className="btn btn-primary" onClick={() => onPlay(slot)}>
            ▶ Play
          </button>
        </>
      )}
    </div>
  )
}

export default function TitleScreen({ saves, onNewGame, onPlay, onDelete }: Props) {
  return (
    <div className="title-screen">
      <div className="title-screen__inner">
        <Logo width={280} />
        <p className="title-screen__tagline">A math adventure</p>

        <div className="title-screen__slots">
          {saves.map((trainer, slot) => (
            <SlotCard
              key={slot}
              slot={slot}
              trainer={trainer}
              onNewGame={onNewGame}
              onPlay={onPlay}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
