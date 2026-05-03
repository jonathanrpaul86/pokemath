import { useEffect, useRef } from 'react'
import type { Area } from '../types'
import { MapRenderer, type MapRenderState } from '../utils/mapRenderer'

interface Props {
  areas: Area[]
  currentAreaId: string
  unlockedAreaIds: string[]
  trainerLevel: number
  /** The area currently shown in the side panel (hover or click) */
  selectedAreaId: string
  onSelectArea: (areaId: string | null) => void
  /** Called when the user clicks a reachable adjacent area */
  onTravel: (areaId: string) => void
}

export function WorldMapCanvas({
  areas,
  currentAreaId,
  unlockedAreaIds,
  trainerLevel,
  selectedAreaId,
  onSelectArea,
  onTravel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<MapRenderer | null>(null)
  const rafRef = useRef<number | undefined>(undefined)

  // Keep a mutable ref so the RAF closure always reads the latest props
  const stateRef = useRef<MapRenderState>({
    areas,
    currentAreaId,
    unlockedAreaIds,
    selectedAreaId,
    pulse: 0,
  })
  stateRef.current.areas = areas
  stateRef.current.currentAreaId = currentAreaId
  stateRef.current.unlockedAreaIds = unlockedAreaIds
  stateRef.current.selectedAreaId = selectedAreaId

  // Also keep a mutable ref for values needed in event handlers
  const propsRef = useRef({ areas, currentAreaId, unlockedAreaIds, trainerLevel, onTravel, onSelectArea })
  propsRef.current = { areas, currentAreaId, unlockedAreaIds, trainerLevel, onTravel, onSelectArea }

  // Create renderer + ResizeObserver once on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const setSize = () => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.round(rect.width * dpr)
        canvas.height = Math.round(rect.height * dpr)
      }
    }

    setSize()
    rendererRef.current = new MapRenderer(canvas)

    const observer = new ResizeObserver(setSize)
    observer.observe(canvas)

    return () => {
      observer.disconnect()
      rendererRef.current = null
    }
  }, [])

  // Animation loop — runs for the lifetime of the component
  useEffect(() => {
    const loop = () => {
      stateRef.current.pulse += 1
      rendererRef.current?.render(stateRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ---- Event helpers -------------------------------------------------------

  function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    }
  }

  function isReachable(targetId: string): boolean {
    const { currentAreaId, areas, trainerLevel } = propsRef.current
    const currentArea = areas.find(a => a.id === currentAreaId)
    const targetArea = areas.find(a => a.id === targetId)
    if (!currentArea || !targetArea) return false
    return (
      currentArea.connectedAreaIds.includes(targetId) &&
      trainerLevel >= targetArea.requiredTrainerLevel
    )
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const renderer = rendererRef.current
    if (!renderer) return
    const { x, y } = getCanvasCoords(e)
    const hitId = renderer.hitTest(x, y, stateRef.current)
    if (!hitId) return

    // Always select in side panel
    propsRef.current.onSelectArea(hitId)

    // Travel if it's an adjacent reachable area
    if (hitId !== propsRef.current.currentAreaId && isReachable(hitId)) {
      propsRef.current.onTravel(hitId)
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const renderer = rendererRef.current
    if (!renderer) return
    const { x, y } = getCanvasCoords(e)
    const hitId = renderer.hitTest(x, y, stateRef.current)
    propsRef.current.onSelectArea(hitId)

    // Pointer cursor when hovering a reachable area
    const canvas = canvasRef.current
    if (canvas) {
      const reachable = hitId && hitId !== propsRef.current.currentAreaId && isReachable(hitId)
      canvas.style.cursor = reachable ? 'pointer' : hitId ? 'default' : 'default'
    }
  }

  function handleMouseLeave() {
    propsRef.current.onSelectArea(null)
    if (canvasRef.current) canvasRef.current.style.cursor = 'default'
  }

  return (
    <canvas
      ref={canvasRef}
      className="world-map-canvas"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  )
}
