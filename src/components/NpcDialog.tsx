import { useEffect, useState } from 'react'
import type { NpcHouse } from '../types'

interface Props {
  house: NpcHouse
  onClose: () => void
}

export default function NpcDialog({ house, onClose }: Props) {
  const [lineIdx, setLineIdx] = useState(0)
  const isLast = lineIdx >= house.lines.length - 1

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (isLast) onClose()
        else setLineIdx(i => i + 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isLast, onClose])

  return (
    <div className="city-overlay" onClick={onClose}>
      <div className="city-dialog" onClick={e => e.stopPropagation()}>
        <p className="city-dialog__place">{house.icon} {house.name}</p>
        <p className="city-dialog__speaker">{house.npcName}</p>
        <p className="city-dialog__line">{house.lines[lineIdx]}</p>
        <div className="city-dialog__actions">
          <span className="city-dialog__count">{lineIdx + 1} / {house.lines.length}</span>
          <button
            className="btn btn-primary"
            onClick={() => (isLast ? onClose() : setLineIdx(i => i + 1))}
          >
            {isLast ? 'Bye!' : 'Next ▸'}
          </button>
        </div>
      </div>
    </div>
  )
}
