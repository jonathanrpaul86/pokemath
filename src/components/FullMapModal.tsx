import { useEffect, useRef, useState } from 'react'
import { useTrainer } from '../store'
import { KANTO_AREAS, AREA_MAP, exploresDone, isAreaExplored, meetsBadgeRequirement } from '../data/areas'
import { BADGE_NAMES } from '../data/gyms'
import { MapRenderer } from '../utils/mapRenderer'
import './FullMapModal.css'

interface Props {
  onClose: () => void
}

/** The whole of Kanto at once. View-only: travel happens on the local map. */
export default function FullMapModal({ onClose }: Props) {
  const trainer = useTrainer()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<MapRenderer | null>(null)
  const [selectedId, setSelectedId] = useState(trainer.currentAreaId)
  const latest = useRef({ trainer, selectedId })
  useEffect(() => { latest.current = { trainer, selectedId } })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
    }
    resize()
    const renderer = new MapRenderer(canvas)
    rendererRef.current = renderer
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    let pulse = 0
    let raf = 0
    const loop = () => {
      pulse += 1
      const { trainer: t, selectedId: sel } = latest.current
      renderer.render({
        areas: KANTO_AREAS,
        currentAreaId: t.currentAreaId,
        unlockedAreaIds: t.unlockedAreaIds,
        selectedAreaId: sel,
        pulse,
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); observer.disconnect(); rendererRef.current = null }
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function areaAt(e: React.MouseEvent<HTMLCanvasElement>): string | null {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    if (!canvas || !renderer) return null
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    return renderer.hitTest((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr, {
      areas: KANTO_AREAS,
      currentAreaId: trainer.currentAreaId,
      unlockedAreaIds: trainer.unlockedAreaIds,
      selectedAreaId: selectedId,
      pulse: 0,
    })
  }

  const area = AREA_MAP[selectedId] ?? AREA_MAP[trainer.currentAreaId]
  const isCurrent = area.id === trainer.currentAreaId
  const visited = trainer.unlockedAreaIds.includes(area.id)
  const adjacent = AREA_MAP[trainer.currentAreaId].connectedAreaIds.includes(area.id)
  const unknown = !visited && !adjacent && !isCurrent
  const status = isCurrent ? '📍 You are here'
    : unknown ? 'Somewhere you haven’t discovered yet'
    : !meetsBadgeRequirement(area, trainer.badges, trainer.unlockedAreaIds) && area.requiredBadge
      ? `🏅 Needs the ${BADGE_NAMES[area.requiredBadge] ?? area.requiredBadge}`
    : !visited ? 'Not visited yet'
    : area.exploresToComplete === 0 ? '🏙 Visited'
    : isAreaExplored(area, trainer.exploreProgress) ? '✓ Fully explored'
    : `🧭 Explored ${exploresDone(area, trainer.exploreProgress)} / ${area.exploresToComplete}`

  return (
    <div className="full-map-overlay" onClick={onClose}>
      <div className="full-map" onClick={e => e.stopPropagation()}>
        <div className="full-map__header">
          <h2 className="full-map__title">🗺 Kanto</h2>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
        <canvas
          ref={canvasRef}
          className="full-map__canvas"
          onMouseMove={e => { const id = areaAt(e); if (id) setSelectedId(id) }}
          onClick={e => { const id = areaAt(e); if (id) setSelectedId(id) }}
        />
        <div className="full-map__info">
          <span className="full-map__name">{unknown ? '???' : area.name}</span>
          <span className="full-map__status">{status}</span>
        </div>
      </div>
    </div>
  )
}
