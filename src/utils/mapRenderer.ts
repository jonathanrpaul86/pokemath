import type { Area } from '../types'

const INTERNAL_W = 600
const INTERNAL_H = 380
const NODE_RADIUS = 18

// ---- Terrain palette --------------------------------------------------------

interface TerrainStyle {
  blob: string   // soft background blob colour
  node: string   // node fill colour
}

const TERRAIN: Record<string, TerrainStyle> = {
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
  'pokemon-tower':    { blob: '#7840c0', node: '#4010a0' },
  'route-7':          { blob: '#d0e860', node: '#80a010' },
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
  selectedAreaId: string
  pulse: number
}

export class MapRenderer {
  private ctx: CanvasRenderingContext2D
  private cameraX = 0
  private cameraY = 0

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2d context unavailable')
    this.ctx = ctx
  }

  setCamera(x: number, y: number): void {
    this.cameraX = x
    this.cameraY = y
  }

  render(state: MapRenderState): void {
    const { ctx } = this
    const { width, height } = ctx.canvas
    if (width === 0 || height === 0) return

    const scaleX = width / INTERNAL_W
    const scaleY = height / INTERNAL_H
    const scale  = Math.min(scaleX, scaleY)
    const tx = (x: number) => (x - this.cameraX) * scaleX
    const ty = (y: number) => (y - this.cameraY) * scaleY
    const ts = (s: number) => s * scale

    ctx.clearRect(0, 0, width, height)

    drawOcean(ctx, width, height, state.pulse)
    drawLandmass(ctx, tx, ty)
    drawCinnabarIsland(ctx, tx, ty, ts)
    drawScatter(ctx, state.areas, tx, ty, ts)
    drawPaths(ctx, state, tx, ty, ts)
    drawTerrainBlobs(ctx, state, tx, ty, ts)
    drawNodes(ctx, state, tx, ty, ts)
  }

  hitTest(canvasX: number, canvasY: number, state: MapRenderState): string | null {
    const { width, height } = this.ctx.canvas
    if (width === 0 || height === 0) return null
    const scaleX = width / INTERNAL_W
    const scaleY = height / INTERNAL_H
    const ix = canvasX / scaleX + this.cameraX
    const iy = canvasY / scaleY + this.cameraY
    const hitR = NODE_RADIUS + 8
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
  pulse: number,
): void {
  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, '#38b8f8')
  grad.addColorStop(1, '#1070d0')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

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

function traceLandmass(
  ctx: CanvasRenderingContext2D,
  tx: (x: number) => number,
  ty: (y: number) => number,
  expand: number,
): void {
  const e = expand
  // Clockwise bezier outline of the Kanto mainland
  ctx.beginPath()
  ctx.moveTo(tx(88 - e), ty(118 - e))
  ctx.bezierCurveTo(tx(120), ty(72 - e), tx(165), ty(62 - e), tx(205), ty(66 - e))
  ctx.bezierCurveTo(tx(255), ty(56 - e), tx(300), ty(54 - e), tx(345), ty(60 - e))
  ctx.bezierCurveTo(tx(385), ty(60 - e), tx(425), ty(70 - e), tx(465), ty(86 - e))
  ctx.bezierCurveTo(tx(505 + e), ty(102), tx(522 + e), ty(138), tx(518 + e), ty(178))
  ctx.bezierCurveTo(tx(522 + e), ty(218), tx(516 + e), ty(258), tx(506 + e), ty(296))
  ctx.bezierCurveTo(tx(498 + e), ty(336), tx(474 + e), ty(364), tx(442), ty(374 + e))
  ctx.bezierCurveTo(tx(396), ty(384 + e), tx(346), ty(386 + e), tx(288), ty(378 + e))
  ctx.bezierCurveTo(tx(248), ty(372 + e), tx(218), ty(360 + e), tx(196), ty(346 + e))
  ctx.bezierCurveTo(tx(178), ty(334), tx(162), ty(318), tx(148), ty(304))
  ctx.bezierCurveTo(tx(128), ty(292), tx(60 - e), ty(278), tx(56 - e), ty(244))
  ctx.bezierCurveTo(tx(50 - e), ty(202), tx(56 - e), ty(162), tx(66 - e), ty(142))
  ctx.bezierCurveTo(tx(70 - e), ty(124), tx(82 - e), ty(118 - e), tx(88 - e), ty(118 - e))
  ctx.closePath()
}

function drawLandmass(
  ctx: CanvasRenderingContext2D,
  tx: (x: number) => number,
  ty: (y: number) => number,
): void {
  // Sandy beach border
  traceLandmass(ctx, tx, ty, 10)
  ctx.fillStyle = '#e8d478'
  ctx.fill()

  // Green interior with subtle gradient
  traceLandmass(ctx, tx, ty, 0)
  const g = ctx.createLinearGradient(tx(80), ty(70), tx(520), ty(380))
  g.addColorStop(0,   '#98d858')
  g.addColorStop(0.5, '#80c840')
  g.addColorStop(1,   '#60a828')
  ctx.fillStyle = g
  ctx.fill()

  // Soft inner border
  traceLandmass(ctx, tx, ty, 0)
  ctx.strokeStyle = 'rgba(0,80,0,0.18)'
  ctx.lineWidth = 3
  ctx.stroke()
}

// ---- Layer: Cinnabar Island --------------------------------------------------

function drawCinnabarIsland(
  ctx: CanvasRenderingContext2D,
  tx: (x: number) => number,
  ty: (y: number) => number,
  ts: (s: number) => number,
): void {
  const cx = tx(148)
  const cy = ty(358)
  const r  = ts(26)

  // Beach ring
  ctx.beginPath()
  ctx.arc(cx, cy, r + ts(7), 0, Math.PI * 2)
  ctx.fillStyle = '#e8d478'
  ctx.fill()

  // Volcanic rock island
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  const ig = ctx.createRadialGradient(cx - ts(6), cy - ts(6), ts(4), cx, cy, r)
  ig.addColorStop(0, '#f89050')
  ig.addColorStop(1, '#c02808')
  ctx.fillStyle = ig
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'
  ctx.lineWidth = 2
  ctx.stroke()
}

// ---- Layer: decorative scatter ----------------------------------------------

function drawScatter(
  ctx: CanvasRenderingContext2D,
  areas: Area[],
  tx: (x: number) => number,
  ty: (y: number) => number,
  ts: (s: number) => number,
): void {
  // Small trees scattered near forest / route areas
  const treePts: [number, number][] = [
    [168, 210], [178, 230], [160, 250],
    [220, 210], [230, 230],
    [168, 300], [180, 310], [175, 330],
    [360, 260], [375, 250], [385, 270],
  ]
  for (const [x, y] of treePts) {
    const ax = areas.find(a => a.id === 'viridian-forest' || a.id === 'route-1' || a.id === 'celadon-city')
    if (!ax) break
    drawMiniTree(ctx, tx(x), ty(y), ts(7))
  }

  // Small mountain bumps near pewter / mt-moon / victory-road
  const mtnPts: [number, number][] = [
    [170, 150], [140, 170], [132, 210],
    [280, 116], [330, 100],
    [440, 200], [460, 220],
  ]
  for (const [x, y] of mtnPts) {
    drawMiniMountain(ctx, tx(x), ty(y), ts(8))
  }

  // Small wave accents near cerulean
  const wavePts: [number, number][] = [
    [430, 140], [445, 155], [460, 145],
  ]
  for (const [x, y] of wavePts) {
    drawMiniWave(ctx, tx(x), ty(y), ts(6))
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

function drawMiniWave(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save()
  ctx.globalAlpha = 0.4
  ctx.strokeStyle = '#1868c8'
  ctx.lineWidth = r * 0.3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - r, cy)
  ctx.bezierCurveTo(cx - r * 0.5, cy - r * 0.6, cx + r * 0.5, cy + 0.6 * r, cx + r, cy)
  ctx.stroke()
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

      ctx.save()
      ctx.lineCap = 'round'

      if (bothUnlocked) {
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
    if (area.id === 'cinnabar-island') continue
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

  for (const area of state.areas) {
    const cx = tx(area.mapX)
    const cy = ty(area.mapY)
    const r = ts(NODE_RADIUS)
    const unlocked  = unlockedSet.has(area.id)
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
    ctx.globalAlpha = unlocked ? 1 : 0.6
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    if (unlocked) {
      const ng = ctx.createRadialGradient(cx - ts(5), cy - ts(5), ts(2), cx, cy, r)
      ng.addColorStop(0, lighten(style.node, 55))
      ng.addColorStop(1, style.node)
      ctx.fillStyle = ng
    } else {
      ctx.fillStyle = '#7878a0'
    }
    ctx.fill()
    ctx.restore()

    // Node border
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.globalAlpha = unlocked ? 1 : 0.6
    if (isCurrent) {
      ctx.strokeStyle = '#ffe030'
      ctx.lineWidth = ts(3.5)
    } else if (unlocked) {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'
      ctx.lineWidth = ts(2)
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = ts(1.5)
    }
    ctx.stroke()
    ctx.globalAlpha = 1

    // Icon or lock
    if (unlocked) {
      drawTerrainIcon(ctx, area.id, cx, cy, ts)
    } else {
      drawLock(ctx, cx, cy, ts(13))
    }

    // Label
    const label = area.name.length > 13 ? area.name.slice(0, 12) + '…' : area.name
    const fz = Math.round(ts(unlocked ? 10 : 8.5))
    ctx.font = `bold ${fz}px 'Segoe UI', system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillText(label, cx + 1, cy + r + ts(4) + 1)
    ctx.fillStyle = isCurrent ? '#ffe030' : (unlocked ? '#ffffff' : 'rgba(200,205,230,0.55)')
    ctx.fillText(label, cx, cy + r + ts(4))
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
    case 'celadon-city':
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

    case 'cerulean-city': {
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

    case 'rock-tunnel': {
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
