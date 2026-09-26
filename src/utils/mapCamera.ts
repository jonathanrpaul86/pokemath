/**
 * Camera math for the world map: which slice of the world a canvas shows, and
 * how world coordinates map to canvas pixels. No canvas access here, so it's
 * unit-testable.
 */

export interface WorldBounds {
  width: number
  height: number
}

/** A window onto the world: its center and how many world units fit across the canvas */
export interface MapView {
  centerX: number
  centerY: number
  viewWidth: number
}

export interface ViewTransform {
  /** Canvas pixels per world unit */
  scale: number
  /**
   * Pixels per "design unit" for node sizes, icons, and line widths. It follows
   * the canvas size but not the zoom, so zooming in spreads places apart
   * instead of blowing them up.
   */
  sizeScale: number
  tx: (x: number) => number
  ty: (y: number) => number
  ts: (s: number) => number
  toWorld: (px: number, py: number) => [number, number]
}

/** The view that shows the whole world, centered */
export function fitView(world: WorldBounds, canvasW: number, canvasH: number): MapView {
  const scale = Math.min(canvasW / world.width, canvasH / world.height)
  return { centerX: world.width / 2, centerY: world.height / 2, viewWidth: canvasW / scale }
}

/**
 * A view of `viewWidth` world units centered on `target`, clamped so it never
 * shows past the world's edges (unless the view is bigger than the world).
 */
export function followView(
  world: WorldBounds,
  target: { x: number; y: number },
  viewWidth: number,
  canvasW: number,
  canvasH: number,
): MapView {
  const viewHeight = viewWidth * (canvasH / canvasW)
  const clamp = (value: number, span: number, size: number) =>
    span >= size ? size / 2 : Math.min(Math.max(value, span / 2), size - span / 2)
  return {
    centerX: clamp(target.x, viewWidth, world.width),
    centerY: clamp(target.y, viewHeight, world.height),
    viewWidth,
  }
}

/**
 * The narrowest view width, at least `minViewWidth`, that keeps every point at
 * the given offsets from the view's center at least `padding` inside the canvas
 * edges. Canvas size and padding share units (e.g. CSS pixels).
 */
export function viewWidthToShow(
  offsets: { dx: number; dy: number }[],
  minViewWidth: number,
  canvasW: number,
  canvasH: number,
  padding: number,
): number {
  // Room from the center to the padded edge, never less than a quarter of the canvas
  const roomX = Math.max(canvasW / 4, canvasW / 2 - padding)
  const roomY = Math.max(canvasH / 4, canvasH / 2 - padding)
  let width = minViewWidth
  for (const { dx, dy } of offsets) {
    // A world distance d lands d * canvasW / viewWidth pixels from the center
    width = Math.max(width, Math.abs(dx) * canvasW / roomX, Math.abs(dy) * canvasW / roomY)
  }
  return width
}

/** The world rectangle a view covers on a canvas of the given size */
export function viewRect(view: MapView, canvasW: number, canvasH: number) {
  const height = view.viewWidth * (canvasH / canvasW)
  return {
    x: view.centerX - view.viewWidth / 2,
    y: view.centerY - height / 2,
    width: view.viewWidth,
    height,
  }
}

/**
 * @param designSize the world size node art was drawn for; node sizes match
 *   what they'd be if the whole design fit this canvas
 */
export function makeTransform(
  view: MapView,
  canvasW: number,
  canvasH: number,
  designSize: WorldBounds,
): ViewTransform {
  const scale = canvasW / view.viewWidth
  const sizeScale = Math.min(canvasW / designSize.width, canvasH / designSize.height)
  const originX = view.centerX - canvasW / 2 / scale
  const originY = view.centerY - canvasH / 2 / scale
  return {
    scale,
    sizeScale,
    tx: x => (x - originX) * scale,
    ty: y => (y - originY) * scale,
    ts: s => s * sizeScale,
    toWorld: (px, py) => [px / scale + originX, py / scale + originY],
  }
}

/** Move `current` a fraction of the way to `target`; snaps once it's close */
export function easeToward(
  current: { x: number; y: number },
  target: { x: number; y: number },
  factor: number,
): { x: number; y: number } {
  const dx = target.x - current.x
  const dy = target.y - current.y
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return { ...target }
  return { x: current.x + dx * factor, y: current.y + dy * factor }
}
