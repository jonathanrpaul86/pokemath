/**
 * The world map's coordinate system. Areas are placed on a 0–100 grid that
 * follows the real Kanto layout (x to the right, y down), with a margin of
 * sea/land around it. The islands sit south of the mainland, below y = 100.
 * One grid unit is MAP_GRID_UNIT world units.
 */

export const MAP_GRID_UNIT = 12
/** Grid units of margin around the 0–100 layout */
const MAP_GRID_PAD = 3
/** Extra grid units of sea below the layout, for the southern islands */
const MAP_GRID_SOUTH_SEA = 9

/** The world's size in map coordinates (Area.mapX / mapY) */
export const WORLD_BOUNDS = {
  width: (100 + MAP_GRID_PAD * 2) * MAP_GRID_UNIT,
  height: (100 + MAP_GRID_PAD * 2 + MAP_GRID_SOUTH_SEA) * MAP_GRID_UNIT,
}

/** World coordinate for a grid coordinate (either axis) */
export function gridToWorld(g: number): number {
  return (g + MAP_GRID_PAD) * MAP_GRID_UNIT
}

/** An area's map position from its grid position */
export function mapAt(gx: number, gy: number): { mapX: number; mapY: number } {
  return { mapX: gridToWorld(gx), mapY: gridToWorld(gy) }
}
