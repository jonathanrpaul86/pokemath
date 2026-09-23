/**
 * In-memory Storage with a size limit, counted like browsers do (key + value
 * characters). Real browsers allow ~5M characters per site; the Claude
 * in-app browser allows far more, which is how the storage-full save bug hid.
 */
export class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>()
  private readonly quotaChars: number

  constructor(quotaChars = Number.POSITIVE_INFINITY) {
    this.quotaChars = quotaChars
  }

  get length(): number {
    return this.data.size
  }

  /** Characters currently stored */
  get usedChars(): number {
    let total = 0
    for (const [key, value] of this.data) total += key.length + value.length
    return total
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    const current = this.data.get(key)
    const delta = key.length + value.length - (current === undefined ? 0 : key.length + current.length)
    if (this.usedChars + delta > this.quotaChars) {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    }
    this.data.set(key, String(value))
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }
}

/** Replace the global localStorage for the current test */
export function installMemoryStorage(quotaChars?: number): MemoryStorage {
  const storage = new MemoryStorage(quotaChars)
  globalThis.localStorage = storage
  return storage
}
