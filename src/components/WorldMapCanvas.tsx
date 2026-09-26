import { useEffect, useRef } from 'react'
import type { Area, BadgeId, InventorySlot } from '../types'
import { MapRenderer, WORLD_BOUNDS, type MapRenderState } from '../utils/mapRenderer'
import { followView, viewRect, easeToward, viewWidthToShow, type MapView } from '../utils/mapCamera'
import { travelBlocker, openNewAreaIds } from '../data/areas'

/** How much of the world the local map shows across its width (see WORLD_BOUNDS) */
const LOCAL_VIEW_WIDTH = 760
/** On a narrow screen it zooms in, down to this, so the icons and names stay readable */
const MIN_LOCAL_VIEW_WIDTH = 380
/** World units per screen pixel before it starts zooming in */
const VIEW_UNITS_PER_PIXEL = 1.05

/** How much of the world to show on a map this many CSS pixels wide */
function localViewWidth(cssWidth: number): number {
  return Math.min(LOCAL_VIEW_WIDTH, Math.max(MIN_LOCAL_VIEW_WIDTH, cssWidth * VIEW_UNITS_PER_PIXEL))
}
/** CSS pixels to keep between a connected area and the map's edge, so its name fits */
const NEIGHBOR_PADDING = 56
/** Fraction of the remaining distance the camera covers each frame */
const CAMERA_EASE = 0.12

interface Props {
  areas: Area[]
  currentAreaId: string
  unlockedAreaIds: string[]
  badges: BadgeId[]
  keyItems: InventorySlot[]
  exploreProgress: Record<string, number>
  /** The area currently shown in the side panel (hover or click) */
  selectedAreaId: string
  onSelectArea: (areaId: string | null) => void
  /** Called when the user clicks a reachable adjacent area */
  onTravel: (areaId: string) => void
  onOpenFullMap: () => void
}

/** Keep a canvas's backing store matched to its on-screen size */
function syncCanvasSize(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  if (rect.width > 0 && rect.height > 0) {
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
  }
}

export function WorldMapCanvas(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const miniRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<MapRenderer | null>(null)
  // The animation loop and event handlers read the latest props through this
  const latest = useRef(props)
  useEffect(() => { latest.current = props })
  // The view last drawn, so clicks hit-test against what's on screen
  const viewRef = useRef<MapView | undefined>(undefined)

  function renderState(pulse: number): MapRenderState {
    const { areas, currentAreaId, unlockedAreaIds, selectedAreaId, badges, keyItems, exploreProgress } = latest.current
    const openAreaIds = openNewAreaIds(currentAreaId, { badges, keyItems, unlockedAreaIds, exploreProgress })
    return { areas, currentAreaId, unlockedAreaIds, openAreaIds, selectedAreaId, pulse }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const mini = miniRef.current
    if (!canvas || !mini) return

    syncCanvasSize(canvas)
    syncCanvasSize(mini)
    const main = new MapRenderer(canvas)
    const miniRenderer = new MapRenderer(mini)
    rendererRef.current = main

    const observer = new ResizeObserver(() => { syncCanvasSize(canvas); syncCanvasSize(mini) })
    observer.observe(canvas)
    observer.observe(mini)

    let camera: { x: number; y: number } | null = null
    let viewWidth: number | null = null
    let pulse = 0
    let raf = 0
    const loop = () => {
      pulse += 1
      const { areas, currentAreaId } = latest.current
      const here = areas.find(a => a.id === currentAreaId)
      const dpr = window.devicePixelRatio || 1
      if (here) {
        const target = { x: here.mapX, y: here.mapY }
        // Zoom out as far as needed to show every place you can go from here
        const neighbors = here.connectedAreaIds.flatMap(id => {
          const a = areas.find(n => n.id === id)
          return a ? [{ dx: a.mapX - here.mapX, dy: a.mapY - here.mapY }] : []
        })
        const cssW = canvas.width / dpr
        const targetWidth = viewWidthToShow(neighbors, localViewWidth(cssW), cssW, canvas.height / dpr, NEIGHBOR_PADDING)
        // Snap on the first frame, then glide when the player travels
        camera = camera ? easeToward(camera, target, CAMERA_EASE) : target
        viewWidth = viewWidth === null ? targetWidth : easeToward({ x: viewWidth, y: 0 }, { x: targetWidth, y: 0 }, CAMERA_EASE).x
      }
      const state = renderState(pulse)
      const view = camera && viewWidth !== null
        ? followView(WORLD_BOUNDS, camera, viewWidth, canvas.width, canvas.height)
        : undefined
      viewRef.current = view
      main.render(state, { view })
      miniRenderer.render(state, {
        mini: true,
        viewportRect: view ? viewRect(view, canvas.width, canvas.height) : undefined,
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      rendererRef.current = null
    }
  }, [])

  // ---- Event helpers -------------------------------------------------------

  function hitAt(e: React.MouseEvent<HTMLCanvasElement>): string | null {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    if (!canvas || !renderer) return null
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    return renderer.hitTest(
      (e.clientX - rect.left) * dpr,
      (e.clientY - rect.top) * dpr,
      renderState(0),
      viewRef.current,
    )
  }

  function isReachable(targetId: string): boolean {
    const { currentAreaId, areas, badges, keyItems, unlockedAreaIds, exploreProgress } = latest.current
    const currentArea = areas.find(a => a.id === currentAreaId)
    const targetArea = areas.find(a => a.id === targetId)
    if (!currentArea || !targetArea) return false
    return (
      currentArea.connectedAreaIds.includes(targetId) &&
      travelBlocker(currentArea, targetArea, { badges, keyItems, unlockedAreaIds, exploreProgress }) === null
    )
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const hitId = hitAt(e)
    if (!hitId) return
    latest.current.onSelectArea(hitId)
    if (hitId !== latest.current.currentAreaId && isReachable(hitId)) {
      latest.current.onTravel(hitId)
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const hitId = hitAt(e)
    latest.current.onSelectArea(hitId)
    const reachable = hitId && hitId !== latest.current.currentAreaId && isReachable(hitId)
    e.currentTarget.style.cursor = reachable ? 'pointer' : 'default'
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLCanvasElement>) {
    latest.current.onSelectArea(null)
    e.currentTarget.style.cursor = 'default'
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="world-map-canvas"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <button
        className="world-minimap"
        onClick={() => latest.current.onOpenFullMap()}
        title="Full map"
        aria-label="Open the full map of Kanto"
      >
        <canvas ref={miniRef} className="world-minimap__canvas" />
        <span className="world-minimap__label">⤢ Full map</span>
      </button>
    </>
  )
}
