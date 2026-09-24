import type { Area } from '../types'
import { fitView, makeTransform, type MapView } from './mapCamera'
import { WORLD_BOUNDS, MAP_GRID_UNIT, gridToWorld } from '../data/mapGrid'

export { WORLD_BOUNDS }

/**
 * Node art (sizes, icons, line widths) is drawn in design units: a node is the
 * size it would be if a 600×380 map filled the canvas, whatever the zoom
 */
const NODE_DESIGN_SIZE = { width: 600, height: 380 }
const NODE_RADIUS = 18

/**
 * The Underground Paths beneath Saffron City: drawn as tunnels whose middle bows out by
 * (dx, dy) grid units, so they don't run straight through Saffron's node
 */
const UNDERGROUND_LINKS: Record<string, [number, number]> = {
  'route-5|route-6': [-5, 0],
  'route-7|route-8': [0, 5],
}

/** Areas out at sea: drawn as islands, and reached by sea lanes instead of roads */
const SEA_AREA_IDS = new Set(['seafoam-islands', 'cinnabar-island', 'route-19', 'route-20', 'route-21'])

// ---- Terrain palette --------------------------------------------------------

interface TerrainStyle {
  blob: string   // soft background blob colour
  node: string   // node fill colour
}

const TERRAIN: Record<string, TerrainStyle> = {
  'pallet-town':      { blob: '#f0f0f0', node: '#8898a8' },
  'route-2':          { blob: '#a8e060', node: '#48a828' },
  'route-22':         { blob: '#b8e070', node: '#62a830' },
  'route-23':         { blob: '#d8d070', node: '#8a8a20' },
  'route-5':          { blob: '#b8e070', node: '#58a830' },
  'route-6':          { blob: '#a8d868', node: '#4a9a28' },
  'route-8':          { blob: '#c8e068', node: '#6a9820' },
  'digletts-cave':    { blob: '#d8a878', node: '#9a6030' },
  'route-10':         { blob: '#b0e0a0', node: '#4a9a50' },
  'power-plant':      { blob: '#f8e060', node: '#b89010' },
  'route-11':         { blob: '#c0e070', node: '#6aa028' },
  'route-12':         { blob: '#90d8c8', node: '#2a9888' },
  'route-13':         { blob: '#a8d880', node: '#50a030' },
  'route-14':         { blob: '#b0d878', node: '#5a9828' },
  'route-15':         { blob: '#b8e080', node: '#62a030' },
  'route-24':         { blob: '#a8e080', node: '#48a030' },
  'route-25':         { blob: '#b0e8a0', node: '#40a060' },
  'cerulean-cave':    { blob: '#90a8f0', node: '#3048a8' },
  'route-16':         { blob: '#c0e078', node: '#68a028' },
  'route-18':         { blob: '#b8d880', node: '#5a9830' },
  'route-19':         { blob: '#80d0f8', node: '#1878c8' },
  'route-20':         { blob: '#80d0f8', node: '#1068b8' },
  'route-21':         { blob: '#80d0f8', node: '#2080c0' },
  'indigo-plateau':   { blob: '#a8a0f0', node: '#4838b0' },
  'route-1':          { blob: '#a8e060', node: '#5ab828' },
  'viridian-city':    { blob: '#60d8b8', node: '#1a9a78' },
  'viridian-forest':  { blob: '#38c050', node: '#1a7a28' },
  'pewter-city':      { blob: '#b0b8d8', node: '#6878a8' },
  'route-3':          { blob: '#b0e04a', node: '#5ab010' },
  'mt-moon':          { blob: '#d0b0f0', node: '#9060d0' },
  'route-4':          { blob: '#a0d870', node: '#4aa020' },
  'cerulean-city':    { blob: '#70d0ff', node: '#1880d8' },
  'route-9':          { blob: '#c8d860', node: '#7a9818' },
  'rock-tunnel':      { blob: '#d09060', node: '#8a5028' },
  'lavender-town':    { blob: '#e890e8', node: '#a030b8' },
  'vermilion-city':   { blob: '#ffa860', node: '#d85a18' },
  'pokemon-tower':    { blob: '#7840c0', node: '#4010a0' },
  'route-7':          { blob: '#d0e860', node: '#80a010' },
  'saffron-city':     { blob: '#f8d860', node: '#c09010' },
  'celadon-city':     { blob: '#80e0a8', node: '#208858' },
  'cycling-road':     { blob: '#b8c8e8', node: '#5878b8' },
  'fuchsia-city':     { blob: '#ff88cc', node: '#cc1878' },
  'safari-zone':      { blob: '#e0c870', node: '#a07820' },
  'seafoam-islands':  { blob: '#a0e8f8', node: '#2090c0' },
  'cinnabar-island':  { blob: '#ff8840', node: '#cc2808' },
  'victory-road':     { blob: '#d0b060', node: '#8a6018' },
}

// ---- Public interface -------------------------------------------------------

export interface MapRenderState {
  areas: Area[]
  currentAreaId: string
  unlockedAreaIds: string[]
  /** Unvisited areas the player can travel to right now: drawn as a greyed-out icon, not a padlock */
  openAreaIds?: string[]
  selectedAreaId: string
  pulse: number
}

export interface RenderOptions {
  /** Which part of the world to show; defaults to the whole world */
  view?: MapView
  /** Simplified mini-map: land, roads, and dots only */
  mini?: boolean
  /** World rectangle to outline (the main map's view, drawn on the mini-map) */
  viewportRect?: { x: number; y: number; width: number; height: number }
}

export class MapRenderer {
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2d context unavailable')
    this.ctx = ctx
  }

  private transform(view?: MapView) {
    const { width, height } = this.ctx.canvas
    return makeTransform(view ?? fitView(WORLD_BOUNDS, width, height), width, height, NODE_DESIGN_SIZE)
  }

  render(state: MapRenderState, options: RenderOptions = {}): void {
    const { ctx } = this
    const { width, height } = ctx.canvas
    if (width === 0 || height === 0) return

    const { tx, ty, ts, scale } = this.transform(options.view)
    // Terrain (land and islands) scales with zoom; node art keeps its size
    const worldSize = (s: number) => s * scale

    ctx.clearRect(0, 0, width, height)

    if (options.mini) {
      drawOcean(ctx, width, height, null)
      drawLandmass(ctx, tx, ty, worldSize)
      drawIslands(ctx, tx, ty, worldSize)
      drawPaths(ctx, state, tx, ty, ts)
      drawMiniNodes(ctx, state, tx, ty, Math.max(2.5, ts(NODE_RADIUS * 0.55)))
      if (options.viewportRect) drawViewportRect(ctx, options.viewportRect, tx, ty)
      return
    }

    drawOcean(ctx, width, height, state.pulse)
    drawLandmass(ctx, tx, ty, worldSize)
    drawIslands(ctx, tx, ty, worldSize)
    drawScatter(ctx, tx, ty, ts)
    drawPaths(ctx, state, tx, ty, ts)
    drawTerrainBlobs(ctx, state, tx, ty, ts)
    drawNodes(ctx, state, tx, ty, ts)
  }

  /** The area under a canvas pixel, if any, for the same view that was rendered */
  hitTest(canvasX: number, canvasY: number, state: MapRenderState, view?: MapView): string | null {
    const { width, height } = this.ctx.canvas
    if (width === 0 || height === 0) return null
    const { toWorld, sizeScale, scale } = this.transform(view)
    const [ix, iy] = toWorld(canvasX, canvasY)
    const hitR = (NODE_RADIUS + 8) * sizeScale / scale
    for (const area of state.areas) {
      const dx = ix - area.mapX
      const dy = iy - area.mapY
      if (dx * dx + dy * dy <= hitR * hitR) return area.id
    }
    return null
  }
}

// ---- Layer: ocean -----------------------------------------------------------

function drawOcean(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  /** Animation frame for the wave ripples; null draws calm water */
  pulse: number | null,
): void {
  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, '#38b8f8')
  grad.addColorStop(1, '#1070d0')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  if (pulse === null) return

  // Animated wave ripples
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 1.5
  const offset = (pulse * 0.35) % 36
  for (let wy = 18 + offset; wy < height + 36; wy += 36) {
    ctx.beginPath()
    for (let wx = -36; wx < width + 36; wx += 36) {
      ctx.moveTo(wx, wy)
      ctx.bezierCurveTo(wx + 9, wy - 5, wx + 21, wy + 5, wx + 32, wy)
    }
    ctx.stroke()
  }
  ctx.restore()
}

// ---- Layer: landmass --------------------------------------------------------

/**
 * The mainland coastline on the 0–100 grid, clockwise from the north-west
 * corner. The land runs well past the world's west and north edges, so a
 * letterboxed map shows land there, not sea.
 */
const COASTLINE: [number, number][] = [
  [-40, -40], [50, -40], [52, -6], [55, 1], [64, 0], [76, 1], [86, 4], [94, 9], [100, 17],
  [101, 30], [100, 42], [101, 53], [97, 62], [93, 70], [90, 78], [86, 85],
  [80, 90], [71, 92.5], [62, 94], [54, 93.5], [46, 92], [38, 91.5], [30, 92.5],
  [23, 93.5], [14, 93], [8, 90], [2, 85], [-6, 82], [-40, 82],
]

/** Offshore islands: grid position and radius in grid units */
const ISLANDS: { gx: number; gy: number; r: number; rock: [string, string] }[] = [
  { gx: 30, gy: 106, r: 4.2, rock: ['#e8f8ff', '#88c8e8'] }, // Seafoam Islands
  { gx: 18, gy: 106, r: 4.8, rock: ['#f89050', '#c02808'] }, // Cinnabar Island
]

/** A smooth closed curve through the midpoints of the coastline's segments */
function traceLandmass(
  ctx: CanvasRenderingContext2D,
  tx: (x: number) => number,
  ty: (y: number) => number,
): void {
  const pts = COASTLINE.map(([gx, gy]) => [tx(gridToWorld(gx)), ty(gridToWorld(gy))])
  const mid = (i: number) => {
    const [ax, ay] = pts[i % pts.length]
    const [bx, by] = pts[(i + 1) % pts.length]
    return [(ax + bx) / 2, (ay + by) / 2]
  }
  ctx.beginPath()
  const [sx, sy] = mid(0)
  ctx.moveTo(sx, sy)
  for (let i = 1; i <= pts.length; i++) {
    const [cx, cy] = pts[i % pts.length]
    const [mx, my] = mid(i)
    ctx.quadraticCurveTo(cx, cy, mx, my)
  }
  ctx.closePath()
}

function drawLandmass(
  ctx: CanvasRenderingContext2D,
  tx: (x: number) => number,
  ty: (y: number) => number,
  worldSize: (s: number) => number,
): void {
  ctx.save()
  ctx.lineJoin = 'round'

  // Sandy beach border
  traceLandmass(ctx, tx, ty)
  ctx.fillStyle = '#e8d478'
  ctx.fill()
  ctx.strokeStyle = '#e8d478'
  ctx.lineWidth = worldSize(MAP_GRID_UNIT * 1.6)
  ctx.stroke()

  // Green interior with subtle gradient
  traceLandmass(ctx, tx, ty)
  const g = ctx.createLinearGradient(tx(0), ty(0), tx(WORLD_BOUNDS.width), ty(WORLD_BOUNDS.height))
  g.addColorStop(0,   '#98d858')
  g.addColorStop(0.5, '#80c840')
  g.addColorStop(1,   '#60a828')
  ctx.fillStyle = g
  ctx.fill()

  // Soft inner border
  ctx.strokeStyle = 'rgba(0,80,0,0.18)'
  ctx.lineWidth = worldSize(3)
  ctx.stroke()
  ctx.restore()
}

// ---- Layer: islands ----------------------------------------------------------

function drawIslands(
  ctx: CanvasRenderingContext2D,
  tx: (x: number) => number,
  ty: (y: number) => number,
  worldSize: (s: number) => number,
): void {
  for (const island of ISLANDS) {
    const cx = tx(gridToWorld(island.gx))
    const cy = ty(gridToWorld(island.gy))
    const r = worldSize(island.r * MAP_GRID_UNIT)

    // Beach ring
    ctx.beginPath()
    ctx.arc(cx, cy, r + worldSize(MAP_GRID_UNIT * 0.8), 0, Math.PI * 2)
    ctx.fillStyle = '#e8d478'
    ctx.fill()

    // Rock
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    const ig = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.15, cx, cy, r)
    ig.addColorStop(0, island.rock[0])
    ig.addColorStop(1, island.rock[1])
    ctx.fillStyle = ig
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'
    ctx.lineWidth = worldSize(2)
    ctx.stroke()
  }
}

// ---- Layer: decorative scatter ----------------------------------------------

/** Decorative trees and peaks, on the 0–100 grid, kept clear of area nodes */
const SCATTER_TREES: [number, number][] = [
  [13, 40], [23, 42], [13, 48], [23, 48],   // Viridian Forest
  [12, 58], [24, 60], [12, 74], [24, 82],   // Routes 1 and 2
  [9, 60], [14, 71],                        // Route 22
  [35, 54], [46, 54], [36, 42],             // Celadon
  [48, 76], [60, 82],                       // Safari Zone
  [81, 64], [92, 67], [78, 73], [69, 80],   // Routes 11–14
  [68, 14], [79, 12],                       // Routes 24–25
  [25, 58], [35, 76],                       // Routes 16–18
]

const SCATTER_PEAKS: [number, number][] = [
  [12, 28], [24, 36],                       // Pewter
  [36, 18], [44, 17], [40, 29],             // Mt. Moon
  [80, 31], [89, 21],                       // Rock Tunnel
  [48, 9], [57, 6],                         // Cerulean Cave
  [9, 34], [0, 30], [9, 44], [0, 20],       // Victory Road and Indigo Plateau
]

function drawScatter(
  ctx: CanvasRenderingContext2D,
  tx: (x: number) => number,
  ty: (y: number) => number,
  ts: (s: number) => number,
): void {
  for (const [gx, gy] of SCATTER_TREES) {
    drawMiniTree(ctx, tx(gridToWorld(gx)), ty(gridToWorld(gy)), ts(7))
  }
  for (const [gx, gy] of SCATTER_PEAKS) {
    drawMiniMountain(ctx, tx(gridToWorld(gx)), ty(gridToWorld(gy)), ts(8))
  }
}

function drawMiniTree(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save()
  ctx.globalAlpha = 0.55
  // Canopy
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx + r * 0.7, cy + r * 0.3)
  ctx.lineTo(cx - r * 0.7, cy + r * 0.3)
  ctx.closePath()
  ctx.fillStyle = '#2a8a30'
  ctx.fill()
  // Trunk
  ctx.fillStyle = '#7a5020'
  ctx.fillRect(cx - r * 0.15, cy + r * 0.3, r * 0.3, r * 0.5)
  ctx.restore()
}

function drawMiniMountain(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save()
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx + r, cy + r * 0.6)
  ctx.lineTo(cx - r, cy + r * 0.6)
  ctx.closePath()
  ctx.fillStyle = '#888aaa'
  ctx.fill()
  // Snow cap
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx + r * 0.35, cy - r * 0.3)
  ctx.lineTo(cx - r * 0.35, cy - r * 0.3)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()
}

// ---- Layer: paths -----------------------------------------------------------

function drawPaths(
  ctx: CanvasRenderingContext2D,
  state: MapRenderState,
  tx: (x: number) => number,
  ty: (y: number) => number,
  ts: (s: number) => number,
): void {
  const unlockedSet = new Set(state.unlockedAreaIds)

  for (const area of state.areas) {
    for (const connId of area.connectedAreaIds) {
      if (area.id > connId) continue
      const other = state.areas.find(a => a.id === connId)
      if (!other) continue

      const x1 = tx(area.mapX), y1 = ty(area.mapY)
      const x2 = tx(other.mapX), y2 = ty(other.mapY)
      const bothUnlocked = unlockedSet.has(area.id) && unlockedSet.has(connId)
      const seaLane = SEA_AREA_IDS.has(area.id) || SEA_AREA_IDS.has(connId)
      const tunnel = UNDERGROUND_LINKS[`${area.id}|${connId}`]

      ctx.save()
      ctx.lineCap = 'round'

      if (tunnel) {
        // Underground Path: a dashed tunnel bowing around the city above it
        const cx = (x1 + x2) / 2 + (tx(tunnel[0] * MAP_GRID_UNIT) - tx(0)) * 2
        const cy = (y1 + y2) / 2 + (ty(tunnel[1] * MAP_GRID_UNIT) - ty(0)) * 2
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.quadraticCurveTo(cx, cy, x2, y2)
        ctx.strokeStyle = bothUnlocked ? 'rgba(110,70,30,0.75)' : 'rgba(255,255,255,0.22)'
        ctx.lineWidth = ts(bothUnlocked ? 4 : 2.5)
        ctx.setLineDash([ts(6), ts(5)])
        ctx.stroke()
        ctx.setLineDash([])
      } else if (seaLane) {
        // Dotted surf route across the water
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = bothUnlocked ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'
        ctx.lineWidth = ts(bothUnlocked ? 3 : 2.5)
        ctx.setLineDash([ts(1), ts(6)])
        ctx.stroke()
        ctx.setLineDash([])
      } else if (bothUnlocked) {
        // Shadow
        ctx.beginPath()
        ctx.moveTo(x1, y1 + ts(2))
        ctx.lineTo(x2, y2 + ts(2))
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'
        ctx.lineWidth = ts(8)
        ctx.stroke()
        // Dirt road
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = '#e8c84a'
        ctx.lineWidth = ts(5.5)
        ctx.stroke()
        // Center dashes
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'
        ctx.lineWidth = ts(1.5)
        ctx.setLineDash([ts(7), ts(6)])
        ctx.stroke()
        ctx.setLineDash([])
      } else {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'
        ctx.lineWidth = ts(2.5)
        ctx.setLineDash([ts(5), ts(5)])
        ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.restore()
    }
  }
}

// ---- Layer: terrain blobs ---------------------------------------------------

function drawTerrainBlobs(
  ctx: CanvasRenderingContext2D,
  state: MapRenderState,
  tx: (x: number) => number,
  ty: (y: number) => number,
  ts: (s: number) => number,
): void {
  const unlockedSet = new Set(state.unlockedAreaIds)

  for (const area of state.areas) {
    if (SEA_AREA_IDS.has(area.id)) continue
    const cx = tx(area.mapX)
    const cy = ty(area.mapY)
    const r = ts(44)
    const style = TERRAIN[area.id]
    if (!style) continue
    const unlocked = unlockedSet.has(area.id)
    const color = unlocked ? style.blob : '#aaaacc'

    const grad = ctx.createRadialGradient(cx, cy, ts(4), cx, cy, r)
    grad.addColorStop(0, color + 'cc')
    grad.addColorStop(0.55, color + '66')
    grad.addColorStop(1, color + '00')
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.globalAlpha = unlocked ? 1 : 0.45
    ctx.fillStyle = grad
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

// ---- Layer: nodes -----------------------------------------------------------

function drawNodes(
  ctx: CanvasRenderingContext2D,
  state: MapRenderState,
  tx: (x: number) => number,
  ty: (y: number) => number,
  ts: (s: number) => number,
): void {
  const unlockedSet = new Set(state.unlockedAreaIds)
  const openSet = new Set(state.openAreaIds ?? [])
  const currentArea = state.areas.find(a => a.id === state.currentAreaId)
  const adjacentIds = new Set(currentArea?.connectedAreaIds ?? [])

  for (const area of state.areas) {
    const cx = tx(area.mapX)
    const cy = ty(area.mapY)
    const r = ts(NODE_RADIUS)
    const unlocked  = unlockedSet.has(area.id)
    const open = !unlocked && openSet.has(area.id)
    const isCurrent = area.id === state.currentAreaId
    const isSelected = area.id === state.selectedAreaId
    const style = TERRAIN[area.id] ?? { blob: '#4a7aa8', node: '#1a4a7a' }

    // Pulse ring
    if (isCurrent) {
      const t = Math.sin(state.pulse * 0.05) * 0.5 + 0.5
      const pr = r + ts(6 + t * 10)
      ctx.beginPath()
      ctx.arc(cx, cy, pr, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255, 230, 40, ${0.3 + t * 0.5})`
      ctx.lineWidth = ts(3)
      ctx.stroke()
    }

    // Selection ring
    if (isSelected && !isCurrent) {
      ctx.beginPath()
      ctx.arc(cx, cy, r + ts(5), 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'
      ctx.lineWidth = ts(2.5)
      ctx.stroke()
    }

    // Drop shadow
    ctx.save()
    ctx.globalAlpha = unlocked ? 0.55 : 0.25
    ctx.beginPath()
    ctx.arc(cx, cy + ts(2.5), r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fill()
    ctx.restore()

    // Node fill
    ctx.save()
    ctx.globalAlpha = unlocked ? 1 : open ? 0.9 : 0.6
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    if (open) {
      ctx.fillStyle = '#9a9cb4'
    } else if (unlocked) {
      const ng = ctx.createRadialGradient(cx - ts(5), cy - ts(5), ts(2), cx, cy, r)
      ng.addColorStop(0, lighten(style.node, 55))
      ng.addColorStop(1, style.node)
      ctx.fillStyle = ng
    } else {
      ctx.fillStyle = '#7878a0'
    }
    ctx.fill()
    ctx.restore()

    // Node border (dashed for places you can go but haven't been yet)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.globalAlpha = unlocked || open ? 1 : 0.6
    if (isCurrent) {
      ctx.strokeStyle = '#ffe030'
      ctx.lineWidth = ts(3.5)
    } else if (open) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.lineWidth = ts(2)
      ctx.setLineDash([ts(4), ts(3)])
    } else if (unlocked) {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'
      ctx.lineWidth = ts(2)
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = ts(1.5)
    }
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    // Icon or lock
    if (unlocked) {
      drawTerrainIcon(ctx, area.id, cx, cy, ts)
    } else if (open) {
      // The area's own icon, faded and without colour until it's visited
      ctx.save()
      ctx.globalAlpha = 0.6
      ctx.filter = 'grayscale(1)'
      drawTerrainIcon(ctx, area.id, cx, cy, ts)
      ctx.restore()
    } else {
      drawLock(ctx, cx, cy, ts(13))
    }

    // Label — only shown when hovered/selected
    if (area.id === state.selectedAreaId) {
      const isUnknown = !unlocked && !adjacentIds.has(area.id)
      const rawLabel = isUnknown ? '???' : area.name
      const label = rawLabel.length > 13 ? rawLabel.slice(0, 12) + '…' : rawLabel
      const fz = Math.round(ts(unlocked || open ? 10 : 8.5))
      ctx.font = `bold ${fz}px 'Segoe UI', system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(0,0,0,0.65)'
      ctx.fillText(label, cx + 1, cy + r + ts(4) + 1)
      ctx.fillStyle = isCurrent ? '#ffe030' : (unlocked || open ? '#ffffff' : 'rgba(200,205,230,0.55)')
      ctx.fillText(label, cx, cy + r + ts(4))
    }
  }
}

// ---- Terrain icons ----------------------------------------------------------

function drawTerrainIcon(
  ctx: CanvasRenderingContext2D,
  id: string,
  cx: number,
  cy: number,
  ts: (s: number) => number,
): void {
  ctx.save()
  ctx.fillStyle   = 'rgba(255,255,255,0.92)'
  ctx.strokeStyle = 'rgba(255,255,255,0.92)'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const r = ts(NODE_RADIUS)

  switch (id) {
    case 'route-1':
    case 'route-2':
    case 'route-22':
    case 'route-23':
    case 'route-5':
    case 'route-6':
    case 'route-8':
    case 'route-10':
    case 'route-11':
    case 'route-12':
    case 'route-13':
    case 'route-14':
    case 'route-15':
    case 'route-24':
    case 'route-25':
    case 'route-16':
    case 'route-18':
    case 'route-3':
    case 'route-4':
    case 'route-7':
    case 'route-9':
      // Three grass blades
      for (let i = -1; i <= 1; i++) {
        const bx = cx + i * ts(5)
        ctx.beginPath()
        ctx.moveTo(bx, cy + ts(6))
        ctx.quadraticCurveTo(bx + ts(3) * Math.sign(i || 1), cy, bx + ts(2) * Math.sign(i || 1), cy - ts(7))
        ctx.lineWidth = ts(1.8)
        ctx.stroke()
      }
      break

    case 'cycling-road': {
      // Two horizontal road stripes
      ctx.lineWidth = ts(2.2)
      for (const offset of [-ts(4), ts(4)]) {
        ctx.beginPath()
        ctx.moveTo(cx - ts(8), cy + offset)
        ctx.lineTo(cx + ts(8), cy + offset)
        ctx.stroke()
      }
      // Speed chevron
      ctx.lineWidth = ts(1.8)
      ctx.beginPath()
      ctx.moveTo(cx - ts(3), cy - ts(1))
      ctx.lineTo(cx,         cy - ts(5))
      ctx.lineTo(cx + ts(3), cy - ts(1))
      ctx.stroke()
      break
    }

    case 'power-plant': {
      // Lightning bolt
      ctx.beginPath()
      ctx.moveTo(cx + ts(2),   cy - ts(11))
      ctx.lineTo(cx - ts(6),   cy + ts(1))
      ctx.lineTo(cx - ts(0.5), cy + ts(1))
      ctx.lineTo(cx - ts(2.5), cy + ts(11))
      ctx.lineTo(cx + ts(6),   cy - ts(2))
      ctx.lineTo(cx + ts(0.5), cy - ts(2))
      ctx.closePath()
      ctx.fill()
      break
    }

    case 'pokemon-tower': {
      // Tall narrow tower body
      ctx.fillRect(cx - ts(5.5), cy - ts(7), ts(11), ts(13))
      // Pointed roof
      ctx.beginPath()
      ctx.moveTo(cx - ts(6.5), cy - ts(7))
      ctx.lineTo(cx,           cy - ts(14))
      ctx.lineTo(cx + ts(6.5), cy - ts(7))
      ctx.closePath()
      ctx.fill()
      // Dark windows
      ctx.fillStyle = 'rgba(30,0,50,0.75)'
      ctx.fillRect(cx - ts(3.5), cy - ts(5), ts(2.5), ts(2.5))
      ctx.fillRect(cx + ts(1),   cy - ts(5), ts(2.5), ts(2.5))
      ctx.fillRect(cx - ts(1.5), cy,         ts(3),   ts(4))
      break
    }

    case 'safari-zone': {
      // Paw print — main pad
      ctx.beginPath()
      ctx.ellipse(cx, cy + ts(3), ts(5), ts(4), 0, 0, Math.PI * 2)
      ctx.fill()
      // Toe beans
      for (const [dx, dy] of [[-ts(5), -ts(1)], [-ts(2), -ts(5.5)], [ts(2), -ts(5.5)], [ts(5), -ts(1)]] as [number, number][]) {
        ctx.beginPath()
        ctx.arc(cx + dx, cy + dy, ts(2.2), 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'seafoam-islands': {
      // Snowflake — three crossing lines
      ctx.lineWidth = ts(2)
      for (let angle = 0; angle < Math.PI; angle += Math.PI / 3) {
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * ts(9), cy + Math.sin(angle) * ts(9))
        ctx.lineTo(cx - Math.cos(angle) * ts(9), cy - Math.sin(angle) * ts(9))
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(cx, cy, ts(2.5), 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'viridian-city':
    case 'pewter-city':
    case 'vermilion-city':
    case 'celadon-city':
    case 'saffron-city':
    case 'fuchsia-city': {
      // City skyline — 3 building rectangles
      const bldgs: [number, number, number, number][] = [
        [-ts(8), -ts(8), ts(5), ts(14)],
        [-ts(2), -ts(12), ts(6), ts(18)],
        [ts(5),  -ts(6),  ts(5), ts(12)],
      ]
      for (const [bx, by, bw, bh] of bldgs) {
        ctx.fillRect(cx + bx, cy + by, bw, bh)
      }
      break
    }

    case 'pallet-town': {
      // Little house with a door
      ctx.beginPath()
      ctx.moveTo(cx - ts(10), cy - ts(1))
      ctx.lineTo(cx,          cy - ts(10))
      ctx.lineTo(cx + ts(10), cy - ts(1))
      ctx.closePath()
      ctx.fill()
      ctx.fillRect(cx - ts(7), cy - ts(1), ts(14), ts(10))
      ctx.fillStyle = 'rgba(40,50,70,0.75)'
      ctx.fillRect(cx - ts(2), cy + ts(3), ts(4), ts(6))
      break
    }

    case 'indigo-plateau': {
      // Trophy cup
      ctx.beginPath()
      ctx.moveTo(cx - ts(8), cy - ts(9))
      ctx.lineTo(cx + ts(8), cy - ts(9))
      ctx.quadraticCurveTo(cx + ts(8), cy + ts(2), cx, cy + ts(3))
      ctx.quadraticCurveTo(cx - ts(8), cy + ts(2), cx - ts(8), cy - ts(9))
      ctx.fill()
      ctx.fillRect(cx - ts(1.5), cy + ts(2), ts(3), ts(5))
      ctx.fillRect(cx - ts(6), cy + ts(7), ts(12), ts(2.5))
      // Handles
      ctx.lineWidth = ts(1.8)
      ctx.beginPath()
      ctx.arc(cx - ts(8), cy - ts(5), ts(3), Math.PI * 0.5, Math.PI * 1.5)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx + ts(8), cy - ts(5), ts(3), -Math.PI * 0.5, Math.PI * 0.5)
      ctx.stroke()
      break
    }

    case 'viridian-forest': {
      // Pine tree
      ctx.beginPath()
      ctx.moveTo(cx, cy - r * 0.72)
      ctx.lineTo(cx + ts(9), cy + ts(4))
      ctx.lineTo(cx - ts(9), cy + ts(4))
      ctx.closePath()
      ctx.fill()
      // Lower wider canopy
      ctx.beginPath()
      ctx.moveTo(cx, cy - ts(4))
      ctx.lineTo(cx + ts(11), cy + ts(9))
      ctx.lineTo(cx - ts(11), cy + ts(9))
      ctx.closePath()
      ctx.fill()
      // Trunk
      ctx.fillStyle = 'rgba(255,220,160,0.85)'
      ctx.fillRect(cx - ts(2), cy + ts(9), ts(4), ts(4))
      break
    }

    case 'mt-moon': {
      // Moon crescent
      ctx.beginPath()
      ctx.arc(cx, cy, ts(9), Math.PI * 1.1, Math.PI * 2.1)
      ctx.lineWidth = ts(2.5)
      ctx.stroke()
      // Stars
      for (const [sx, sy] of [[-ts(8), -ts(4)], [ts(7), ts(3)], [ts(2), -ts(10)]]) {
        ctx.beginPath()
        ctx.arc(cx + sx, cy + sy, ts(1.5), 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'cerulean-city':
    case 'route-19':
    case 'route-20':
    case 'route-21': {
      // Water waves — 2 rows
      for (let row = 0; row < 2; row++) {
        const wy = cy - ts(4) + row * ts(8)
        ctx.beginPath()
        ctx.moveTo(cx - ts(9), wy)
        ctx.bezierCurveTo(cx - ts(4.5), wy - ts(4), cx + ts(1.5), wy + ts(4), cx + ts(7), wy)
        ctx.lineWidth = ts(2.2)
        ctx.stroke()
      }
      break
    }

    case 'rock-tunnel':
    case 'cerulean-cave': {
      // Cave arch opening
      ctx.beginPath()
      ctx.arc(cx, cy + ts(3), ts(9), Math.PI, 0)
      ctx.lineTo(cx + ts(9), cy + ts(9))
      ctx.lineTo(cx - ts(9), cy + ts(9))
      ctx.closePath()
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fill()
      // Arch outline
      ctx.beginPath()
      ctx.arc(cx, cy + ts(3), ts(9), Math.PI, 0)
      ctx.lineWidth = ts(2.2)
      ctx.stroke()
      break
    }

    case 'digletts-cave': {
      // Diglett popping out of the ground
      ctx.beginPath()
      ctx.moveTo(cx - ts(7), cy + ts(8))
      ctx.lineTo(cx - ts(7), cy - ts(2))
      ctx.arc(cx, cy - ts(2), ts(7), Math.PI, 0)
      ctx.lineTo(cx + ts(7), cy + ts(8))
      ctx.closePath()
      ctx.fill()
      // Eyes and nose
      ctx.fillStyle = 'rgba(60,30,10,0.9)'
      ctx.fillRect(cx - ts(3.5), cy - ts(4), ts(1.8), ts(3.5))
      ctx.fillRect(cx + ts(1.7), cy - ts(4), ts(1.8), ts(3.5))
      ctx.fillStyle = 'rgba(230,110,140,0.95)'
      ctx.beginPath()
      ctx.ellipse(cx, cy + ts(1.5), ts(3), ts(2), 0, 0, Math.PI * 2)
      ctx.fill()
      // Ground line
      ctx.lineWidth = ts(2)
      ctx.beginPath()
      ctx.moveTo(cx - ts(11), cy + ts(8.5))
      ctx.lineTo(cx + ts(11), cy + ts(8.5))
      ctx.stroke()
      break
    }

    case 'lavender-town': {
      // Ghost shape
      ctx.beginPath()
      ctx.arc(cx, cy - ts(3), ts(7), Math.PI, 0)
      ctx.lineTo(cx + ts(7), cy + ts(9))
      ctx.lineTo(cx + ts(3.5), cy + ts(5))
      ctx.lineTo(cx, cy + ts(9))
      ctx.lineTo(cx - ts(3.5), cy + ts(5))
      ctx.lineTo(cx - ts(7), cy + ts(9))
      ctx.closePath()
      ctx.fill()
      // Eyes
      ctx.fillStyle = 'rgba(60,0,80,0.9)'
      ctx.beginPath()
      ctx.arc(cx - ts(2.5), cy - ts(3), ts(1.8), 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + ts(2.5), cy - ts(3), ts(1.8), 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'cinnabar-island': {
      // Volcano — triangle with lava streams
      ctx.beginPath()
      ctx.moveTo(cx, cy - ts(10))
      ctx.lineTo(cx + ts(11), cy + ts(8))
      ctx.lineTo(cx - ts(11), cy + ts(8))
      ctx.closePath()
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fill()
      // Crater opening
      ctx.beginPath()
      ctx.ellipse(cx, cy - ts(9), ts(4), ts(2.5), 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,160,0,0.9)'
      ctx.fill()
      // Lava drip
      ctx.beginPath()
      ctx.moveTo(cx - ts(2), cy - ts(7))
      ctx.bezierCurveTo(cx - ts(4), cy - ts(2), cx - ts(3), cy + ts(3), cx - ts(5), cy + ts(8))
      ctx.strokeStyle = 'rgba(255,160,0,0.9)'
      ctx.lineWidth = ts(2)
      ctx.stroke()
      break
    }

    case 'victory-road': {
      // Mountain peak with a path line
      ctx.beginPath()
      ctx.moveTo(cx, cy - ts(10))
      ctx.lineTo(cx + ts(11), cy + ts(8))
      ctx.lineTo(cx - ts(11), cy + ts(8))
      ctx.closePath()
      ctx.fill()
      // Snow cap
      ctx.fillStyle = 'rgba(200,230,255,0.95)'
      ctx.beginPath()
      ctx.moveTo(cx, cy - ts(10))
      ctx.lineTo(cx + ts(4.5), cy - ts(3))
      ctx.lineTo(cx - ts(4.5), cy - ts(3))
      ctx.closePath()
      ctx.fill()
      break
    }

    default:
      // Generic dot
      ctx.beginPath()
      ctx.arc(cx, cy, ts(5), 0, Math.PI * 2)
      ctx.fill()
  }

  ctx.restore()
}

// ---- Helpers ----------------------------------------------------------------

// ---- Layer: mini-map ---------------------------------------------------------

function drawMiniNodes(
  ctx: CanvasRenderingContext2D,
  state: MapRenderState,
  tx: (x: number) => number,
  ty: (y: number) => number,
  r: number,
): void {
  const unlockedSet = new Set(state.unlockedAreaIds)
  const openSet = new Set(state.openAreaIds ?? [])
  for (const area of state.areas) {
    const isCurrent = area.id === state.currentAreaId
    const unlocked = unlockedSet.has(area.id)
    const style = TERRAIN[area.id] ?? { blob: '#4a7aa8', node: '#1a4a7a' }
    ctx.beginPath()
    ctx.arc(tx(area.mapX), ty(area.mapY), isCurrent ? r * 1.5 : r, 0, Math.PI * 2)
    ctx.fillStyle = isCurrent ? '#ffe030'
      : unlocked ? style.node
      : openSet.has(area.id) ? 'rgba(220,222,235,0.95)'
      : 'rgba(120,120,160,0.7)'
    ctx.fill()
    if (isCurrent) {
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = Math.max(1, r * 0.45)
      ctx.stroke()
    }
  }
}

function drawViewportRect(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  tx: (x: number) => number,
  ty: (y: number) => number,
): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.strokeRect(tx(rect.x), ty(rect.y), tx(rect.x + rect.width) - tx(rect.x), ty(rect.y + rect.height) - ty(rect.y))
  ctx.restore()
}

function drawLock(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const bw = size * 0.72
  const bh = size * 0.56
  const bx = cx - bw / 2
  const by = cy - size * 0.05
  ctx.fillStyle   = 'rgba(255,255,255,0.42)'
  ctx.strokeStyle = 'rgba(255,255,255,0.42)'
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, bh, size * 0.12)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, by, bw * 0.29, Math.PI, 0)
  ctx.lineWidth = size * 0.18
  ctx.stroke()
}

function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (n >> 16) + amount)
  const g = Math.min(255, ((n >> 8) & 0xff) + amount)
  const b = Math.min(255, (n & 0xff) + amount)
  return `rgb(${r},${g},${b})`
}
