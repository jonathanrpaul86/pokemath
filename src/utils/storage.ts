/**
 * Save files and the PokéAPI cache share the browser's ~5 MB localStorage.
 * Saves must always win: the cache can be re-fetched, a lost save can't.
 */

/** Current cache version. Bump when the cached shape changes. */
export const API_CACHE_PREFIX = 'pokeapi_v2_'

/** Matches every cache version, including the old raw-response v1 cache */
const ANY_API_CACHE = /^pokeapi_v\d+_/

/** Remove cached PokéAPI entries. Pass `keepCurrent` to drop only outdated versions. */
export function clearApiCache({ keepCurrent = false }: { keepCurrent?: boolean } = {}): void {
  try {
    const stale = Object.keys(localStorage).filter(key =>
      ANY_API_CACHE.test(key) && !(keepCurrent && key.startsWith(API_CACHE_PREFIX))
    )
    for (const key of stale) localStorage.removeItem(key)
  } catch {
    // Storage unavailable (e.g. blocked by the browser) — nothing to clear
  }
}
