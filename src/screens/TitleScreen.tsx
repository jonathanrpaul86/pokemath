import { useRef, useState, type ChangeEvent } from 'react'
import Logo from '../components/Logo'
import { AREA_MAP } from '../data/areas'
import { exportSave, exportFileName, type ImportResult } from '../store'
import type { Trainer } from '../types'
import './TitleScreen.css'

interface Props {
  saves: (Trainer | null)[]
  onNewGame: (slot: number) => void
  onPlay: (slot: number) => void
  onDelete: (slot: number) => void
  onImport: (slot: number, text: string) => ImportResult
}

/** Downloads the save as a file, to carry to another device or keep as a backup */
function downloadSave(slot: number, trainer: Trainer): void {
  const data = exportSave(slot)
  if (!data) return
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = exportFileName(trainer)
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Some browsers start the download after click() returns
  setTimeout(() => URL.revokeObjectURL(url), 1000)
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
  onImport,
}: {
  slot: number
  trainer: Trainer | null
  onNewGame: (slot: number) => void
  onPlay: (slot: number) => void
  onDelete: (slot: number) => void
  onImport: (slot: number, text: string) => ImportResult
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Clear it so picking the same file again still fires a change
    e.target.value = ''
    if (!file) return
    let text: string
    try {
      text = await file.text()
    } catch {
      setImportError("Couldn't read that file.")
      return
    }
    const result = onImport(slot, text)
    setImportError(result.ok ? null : result.error)
  }

  if (!trainer) {
    return (
      <div className="slot-card slot-card--empty">
        <div className="slot-card__label">Save {slot + 1}</div>
        <div className="slot-card__empty-text">Empty</div>
        <button className="btn btn-primary" onClick={() => onNewGame(slot)}>
          ▶ New Game
        </button>
        <button className="slot-card__link-btn" onClick={() => fileInput.current?.click()}>
          📂 Import save file
        </button>
        {/* No accept filter: iOS greys out .json files it doesn't recognize */}
        <input ref={fileInput} type="file" hidden onChange={handleFile} />
        {importError && <p className="slot-card__error" role="alert">{importError}</p>}
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
            <span className="slot-card__level">🏅 {trainer.badges.length}</span>
            <span className="slot-card__area">{areaName}</span>
          </div>
          {trainer.savedAt && (
            <div className="slot-card__date">{formatDate(trainer.savedAt)}</div>
          )}
          <button className="btn btn-primary" onClick={() => onPlay(slot)}>
            ▶ Play
          </button>
          <button className="slot-card__link-btn" onClick={() => downloadSave(slot, trainer)}>
            ⬇ Export save file
          </button>
        </>
      )}
    </div>
  )
}

export default function TitleScreen({ saves, onNewGame, onPlay, onDelete, onImport }: Props) {
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
              onImport={onImport}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
